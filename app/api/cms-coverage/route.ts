// app/api/cms-coverage/route.ts
// Server-side proxy to CMS Medicare Coverage Database API
// Docs: https://api.coverage.cms.gov/docs/swagger/index.html
// No API key required. Throttle limit: 10,000 req/sec.

import { NextRequest, NextResponse } from 'next/server';

// =============================================================================
// Types
// =============================================================================

interface CMSNCDItem {
  document_id: number;
  document_version: number;
  document_display_id: string;
  document_type: string;
  title: string;
  chapter: string;
  is_lab: number;
  last_updated: string;
  last_updated_sort: string;
  url: string;
}

interface CMSAPIResponse {
  meta: {
    status: {
      id: number;
      message: string;
    };
    notes: string;
    fields: string[];
    next_token: string;
  };
  data: CMSNCDItem[];
}

interface NCDSummary {
  id: number;
  version: number;
  displayId: string;
  title: string;
  chapter: string;
  lastUpdated: string;
  isRetired: boolean;
  url: string;
}

interface LCDSummary {
  id: number;
  title: string;
  contractorName: string;
  lastUpdated: string;
  url: string;
}

// =============================================================================
// Cache — 24-hour in-memory cache to avoid hammering the CMS API
// =============================================================================

const cache = new Map<string, { data: unknown; timestamp: number }>();
const CACHE_DURATION = 24 * 60 * 60 * 1000; // 24 hours

function getCached<T>(key: string): T | null {
  const entry = cache.get(key);
  if (entry && Date.now() - entry.timestamp < CACHE_DURATION) {
    return entry.data as T;
  }
  cache.delete(key);
  return null;
}

function setCache(key: string, data: unknown): void {
  cache.set(key, { data, timestamp: Date.now() });
}

// =============================================================================
// CMS API Base URL
// =============================================================================

const CMS_API_BASE = 'https://api.coverage.cms.gov/v1';

// =============================================================================
// Fetch helpers
// =============================================================================

/**
 * Fetch all NCDs from the CMS reports endpoint, then filter by keyword.
 * The NCD report endpoint returns ALL NCDs (no server-side keyword filter),
 * so we cache the full list and filter client-side by title.
 */
async function fetchNCDs(keyword: string): Promise<NCDSummary[]> {
  const cacheKey = 'cms-all-ncds';
  let allNCDs = getCached<CMSNCDItem[]>(cacheKey);

  if (!allNCDs) {
    const url = `${CMS_API_BASE}/reports/national-coverage-ncd/`;
    console.log(`[CMS Coverage] Fetching all NCDs from: ${url}`);

    const response = await fetch(url, {
      headers: { 'Accept': 'application/json' },
      signal: AbortSignal.timeout(15000), // 15s timeout (large payload)
    });

    if (!response.ok) {
      console.error(`[CMS Coverage] NCD API error: ${response.status} ${response.statusText}`);
      return [];
    }

    const json: CMSAPIResponse = await response.json();

    if (!json.data || !Array.isArray(json.data)) {
      console.error('[CMS Coverage] Unexpected NCD response format');
      return [];
    }

    allNCDs = json.data;
    setCache(cacheKey, allNCDs);
    console.log(`[CMS Coverage] Cached ${allNCDs.length} total NCDs`);
  }

  // Filter by keyword in title (case-insensitive)
  const searchTerms = keyword.toLowerCase().split(/\s+/);
  const filtered = allNCDs.filter((ncd) => {
    const title = ncd.title.toLowerCase();
    return searchTerms.some((term) => title.includes(term));
  });

  // Convert to our clean format, filter out RETIRED
  return filtered
    .map((ncd) => ({
      id: ncd.document_id,
      version: ncd.document_version,
      displayId: ncd.document_display_id,
      title: cleanTitle(ncd.title),
      chapter: ncd.chapter,
      lastUpdated: ncd.last_updated,
      isRetired: ncd.title.toUpperCase().includes('RETIRED'),
      url: `https://www.cms.gov/medicare-coverage-database${ncd.url}`,
    }))
    .filter((ncd) => !ncd.isRetired) // Hide retired NCDs by default
    .sort((a, b) => a.title.localeCompare(b.title));
}

/**
 * Fetch LCDs from the CMS reports endpoint.
 * Same pattern: fetch all, filter client-side.
 */
async function fetchLCDs(keyword: string): Promise<LCDSummary[]> {
  const cacheKey = 'cms-all-lcds';
  let allLCDs = getCached<CMSNCDItem[]>(cacheKey);

  if (!allLCDs) {
    const url = `${CMS_API_BASE}/reports/local-coverage-final-lcds/`;
    console.log(`[CMS Coverage] Fetching all LCDs from: ${url}`);

    const response = await fetch(url, {
      headers: { 'Accept': 'application/json' },
      signal: AbortSignal.timeout(15000),
    });

    if (!response.ok) {
      console.error(`[CMS Coverage] LCD API error: ${response.status} ${response.statusText}`);
      return [];
    }

    const json = await response.json();

    if (!json.data || !Array.isArray(json.data)) {
      console.error('[CMS Coverage] Unexpected LCD response format');
      return [];
    }

    allLCDs = json.data;
    setCache(cacheKey, allLCDs);
    console.log(`[CMS Coverage] Cached ${allLCDs!.length} total LCDs`);
  }

  // Filter by keyword in title (case-insensitive)
  const searchTerms = keyword.toLowerCase().split(/\s+/);
  const filtered = allLCDs!.filter((lcd) => {
    const title = (lcd.title || '').toLowerCase();
    return searchTerms.some((term) => title.includes(term));
  });

  // Convert to clean format
  return filtered
    .map((lcd) => ({
      id: lcd.document_id,
      title: cleanTitle(lcd.title || 'Untitled LCD'),
      contractorName: '', // LCD report doesn't include contractor in this endpoint
      lastUpdated: lcd.last_updated || '',
      url: lcd.url
  ? (lcd.url.startsWith('http') ? lcd.url : `https://www.cms.gov/medicare-coverage-database${lcd.url}`)
  : '',
    }))
    .sort((a, b) => a.title.localeCompare(b.title));
}

/**
 * Fetch NCD detail by document ID
 */
async function fetchNCDDetail(ncdId: number, version?: number): Promise<unknown> {
  const ver = version || 1;
  const cacheKey = `cms-ncd-detail-${ncdId}-${ver}`;
  const cached = getCached<unknown>(cacheKey);
  if (cached) return cached;

  const url = `${CMS_API_BASE}/data/ncd/?ncdid=${ncdId}&ncdver=${ver}`;
  console.log(`[CMS Coverage] Fetching NCD detail: ${url}`);

  const response = await fetch(url, {
    headers: { 'Accept': 'application/json' },
    signal: AbortSignal.timeout(10000),
  });

  if (!response.ok) {
    console.error(`[CMS Coverage] NCD detail error: ${response.status}`);
    return null;
  }

  const json = await response.json();
  setCache(cacheKey, json);
  return json;
}

// =============================================================================
// Helpers
// =============================================================================

/** Clean up HTML entities and extra whitespace in titles */
function cleanTitle(title: string): string {
  return title
    .replace(/&amp;/g, '&')
    .replace(/&lt;/g, '<')
    .replace(/&gt;/g, '>')
    .replace(/&quot;/g, '"')
    .replace(/&#039;/g, "'")
    .replace(/\\u0026/g, '&')
    .replace(/\\u0027/g, "'")
    .replace(/\s+/g, ' ')
    .trim();
}

// =============================================================================
// Route Handler
// =============================================================================

export async function GET(request: NextRequest) {
  const searchParams = request.nextUrl.searchParams;
  const condition = searchParams.get('condition');
  const type = searchParams.get('type'); // 'ncd' | 'lcd' | 'all'
  const ncdId = searchParams.get('ncdId');
  const ncdVersion = searchParams.get('version');

  try {
    // --- NCD Detail lookup ---
    if (ncdId) {
      const detail = await fetchNCDDetail(
        parseInt(ncdId, 10),
        ncdVersion ? parseInt(ncdVersion, 10) : undefined
      );
      return NextResponse.json({ detail });
    }

    // --- Search by condition ---
    if (!condition) {
      return NextResponse.json(
        { error: 'Missing required parameter: condition' },
        { status: 400 }
      );
    }

    const searchType = type || 'all';
    const results: {
      ncds: NCDSummary[];
      lcds: LCDSummary[];
      totalResults: number;
      searchTerm: string;
    } = {
      ncds: [],
      lcds: [],
      totalResults: 0,
      searchTerm: condition,
    };

    // Fetch NCDs and/or LCDs in parallel
    const promises: Promise<void>[] = [];

    if (searchType === 'ncd' || searchType === 'all') {
      promises.push(
        fetchNCDs(condition).then((ncds) => {
          results.ncds = ncds;
        })
      );
    }

    if (searchType === 'lcd' || searchType === 'all') {
      promises.push(
        fetchLCDs(condition).then((lcds) => {
          results.lcds = lcds;
        })
      );
    }

    await Promise.all(promises);
    results.totalResults = results.ncds.length + results.lcds.length;

    return NextResponse.json(results);
  } catch (error) {
    console.error('[CMS Coverage] Route error:', error);

    // Graceful degradation — return empty results, not a 500
    return NextResponse.json({
      ncds: [],
      lcds: [],
      totalResults: 0,
      searchTerm: condition || '',
      error: 'CMS Coverage API temporarily unavailable',
    });
  }
}

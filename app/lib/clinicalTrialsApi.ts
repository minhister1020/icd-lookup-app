/**
 * ClinicalTrials.gov API Helper Functions
 * =======================================
 * 
 * This file handles communication with the ClinicalTrials.gov API v2.
 * 
 * ClinicalTrials.gov is a database of clinical studies conducted around
 * the world, maintained by the National Library of Medicine (NLM).
 * 
 * API Documentation: https://clinicaltrials.gov/data-api/api
 * 
 * RATE LIMITS:
 * - Approximately 3 requests per second
 * - No daily limit specified
 * - No API key required
 * 
 * We search by condition name to find relevant clinical trials.
 */

import { ClinicalTrialResult, TrialLocation, TrialStatus, extractSearchTerms } from '../types/icd';

// =============================================================================
// Configuration
// =============================================================================

/**
 * ClinicalTrials.gov API v2 endpoint.
 * This endpoint returns study data in JSON format.
 */
const CLINICALTRIALS_BASE_URL = 'https://clinicaltrials.gov/api/v2/studies';

/**
 * Default number of trial results to fetch.
 */
const DEFAULT_PAGE_SIZE = 5;

// =============================================================================
// Main Search Function
// =============================================================================

/**
 * Searches ClinicalTrials.gov for trials related to a medical condition.
 * 
 * @param conditionName - The condition name (e.g., "Type 2 diabetes mellitus")
 * @param options - Optional search parameters
 * @returns Promise resolving to array of ClinicalTrialResult objects
 * @throws Error if API request fails
 * 
 * @example
 * const trials = await searchTrialsByCondition("diabetes");
 * console.log(trials);
 * // [
 * //   { nctId: "NCT05642013", title: "Study of...", status: "RECRUITING", ... },
 * //   ...
 * // ]
 */
export async function searchTrialsByCondition(
  conditionName: string,
  options: {
    pageSize?: number;
    recruitingOnly?: boolean;
  } = {}
): Promise<ClinicalTrialResult[]> {
  const { pageSize = DEFAULT_PAGE_SIZE, recruitingOnly = true } = options;
  
  // Step 1: Clean the condition name for better search results
  const searchTerms = extractSearchTerms(conditionName);
  
  if (!searchTerms) {
    return [];
  }
  
  // Step 2: Build the API URL
  // --------------------------
  // query.cond = condition/disease search
  // filter.overallStatus = filter by recruitment status
  // pageSize = number of results
  const params = new URLSearchParams({
    'query.cond': searchTerms,
    'pageSize': pageSize.toString(),
  });
  
  // Only show recruiting trials by default (most useful for users)
  if (recruitingOnly) {
    params.append('filter.overallStatus', 'RECRUITING');
  }
  
  const url = `${CLINICALTRIALS_BASE_URL}?${params.toString()}`;
  
  // Step 3: Make the API request
  try {
    const response = await fetch(url);
    
    if (!response.ok) {
      // ClinicalTrials.gov returns 400 for invalid queries
      if (response.status === 400) {
        return [];
      }
      throw new Error(`ClinicalTrials.gov API error: ${response.status} ${response.statusText}`);
    }
    
    // Step 4: Parse the response
    const data = await response.json();
    
    // Step 5: Transform to our ClinicalTrialResult format
    return parseClinicalTrialsResponse(data);
    
  } catch (error) {
    if (error instanceof Error) {
      if (error.message.includes('Failed to fetch')) {
        throw new Error('Unable to connect to clinical trials database. Check your internet connection.');
      }
      throw error;
    }
    throw new Error('Failed to search for clinical trials. Please try again.');
  }
}

// =============================================================================
// Response Parser
// =============================================================================

/**
 * ClinicalTrials.gov API response structure (simplified).
 * The actual response is deeply nested - we extract what we need.
 */
interface ClinicalTrialsApiResponse {
  totalCount?: number;
  studies?: ClinicalTrialsStudy[];
}

interface ClinicalTrialsStudy {
  protocolSection?: {
    identificationModule?: {
      nctId?: string;
      briefTitle?: string;
      organization?: {
        fullName?: string;
      };
    };
    statusModule?: {
      overallStatus?: string;
      startDateStruct?: {
        date?: string;
      };
    };
    descriptionModule?: {
      briefSummary?: string;
    };
    eligibilityModule?: {
      eligibilityCriteria?: string;
    };
    contactsLocationsModule?: {
      locations?: ClinicalTrialsLocation[];
    };
    sponsorCollaboratorsModule?: {
      leadSponsor?: {
        name?: string;
      };
    };
  };
}

interface ClinicalTrialsLocation {
  facility?: string;
  city?: string;
  state?: string;
  country?: string;
}

/**
 * Parses the raw ClinicalTrials.gov API response into our format.
 * 
 * The API returns deeply nested data with many optional fields.
 * This function safely extracts what we need.
 * 
 * @param response - Raw API response
 * @returns Array of ClinicalTrialResult objects
 */
function parseClinicalTrialsResponse(response: ClinicalTrialsApiResponse): ClinicalTrialResult[] {
  if (!response.studies || !Array.isArray(response.studies)) {
    return [];
  }
  
  return response.studies
    .map((study): ClinicalTrialResult | null => {
      const protocol = study.protocolSection;
      if (!protocol) return null;
      
      const identification = protocol.identificationModule;
      const status = protocol.statusModule;
      const description = protocol.descriptionModule;
      const eligibility = protocol.eligibilityModule;
      const contacts = protocol.contactsLocationsModule;
      const sponsor = protocol.sponsorCollaboratorsModule;
      
      // NCT ID is required - skip if missing
      const nctId = identification?.nctId;
      if (!nctId) return null;
      
      // Extract and transform data
      const title = identification?.briefTitle ?? 'Untitled Study';
      const overallStatus = normalizeStatus(status?.overallStatus);
      const summary = truncateText(description?.briefSummary ?? 'No summary available', 250);
      const sponsorName = sponsor?.leadSponsor?.name ?? identification?.organization?.fullName ?? 'Unknown Sponsor';
      const eligibilityCriteria = eligibility?.eligibilityCriteria 
        ? truncateText(eligibility.eligibilityCriteria, 200) 
        : undefined;
      const locations = parseLocations(contacts?.locations);
      const startDate = status?.startDateStruct?.date;
      
      return {
        nctId,
        title,
        status: overallStatus,
        summary,
        sponsor: sponsorName,
        eligibility: eligibilityCriteria,
        locations,
        startDate,
      };
    })
    .filter((trial): trial is ClinicalTrialResult => trial !== null);
}

/**
 * Parses location data from the API response.
 * 
 * @param locations - Raw location array from API
 * @returns Array of TrialLocation objects (max 3)
 */
function parseLocations(locations?: ClinicalTrialsLocation[]): TrialLocation[] | undefined {
  if (!locations || locations.length === 0) return undefined;
  
  // Limit to 3 locations for display
  return locations.slice(0, 3).map(loc => ({
    facility: loc.facility ?? 'Unknown Facility',
    city: loc.city ?? '',
    state: loc.state ?? '',
    country: loc.country ?? '',
  }));
}

/**
 * Normalizes the status string from the API to our TrialStatus type.
 * 
 * @param status - Raw status string from API
 * @returns Normalized TrialStatus
 */
function normalizeStatus(status?: string): TrialStatus {
  if (!status) return 'OTHER';
  
  const normalized = status.toUpperCase().replace(/\s+/g, '_');
  
  switch (normalized) {
    case 'RECRUITING':
      return 'RECRUITING';
    case 'ACTIVE_NOT_RECRUITING':
    case 'ACTIVE,_NOT_RECRUITING':
      return 'ACTIVE_NOT_RECRUITING';
    case 'COMPLETED':
      return 'COMPLETED';
    case 'TERMINATED':
      return 'TERMINATED';
    default:
      return 'OTHER';
  }
}

/**
 * Truncates text to a maximum length, adding ellipsis if needed.
 * 
 * @param text - The text to truncate
 * @param maxLength - Maximum characters
 * @returns Truncated text
 */
function truncateText(text: string, maxLength: number): string {
  // Remove newlines and extra whitespace
  const cleaned = text.replace(/\s+/g, ' ').trim();
  
  if (cleaned.length <= maxLength) {
    return cleaned;
  }
  
  const truncated = cleaned.substring(0, maxLength);
  const lastSpace = truncated.lastIndexOf(' ');
  const breakPoint = lastSpace > maxLength * 0.7 ? lastSpace : maxLength;
  
  return cleaned.substring(0, breakPoint).trim() + '...';
}

/**
 * Generates a URL to view the full trial on ClinicalTrials.gov.
 * 
 * @param nctId - The NCT ID of the trial
 * @returns URL string to the trial page
 */
export function getTrialUrl(nctId: string): string {
  return `https://clinicaltrials.gov/study/${nctId}`;
}

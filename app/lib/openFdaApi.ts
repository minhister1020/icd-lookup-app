/**
 * OpenFDA API Helper Functions
 * ============================
 * 
 * This file handles communication with the OpenFDA Drug Labels API.
 * 
 * OpenFDA is a free public API from the FDA that provides:
 * - Drug labeling information (what drugs treat)
 * - Adverse events (side effects)
 * - Drug interactions
 * 
 * API Documentation: https://open.fda.gov/apis/drug/label/
 * 
 * RATE LIMITS:
 * - Without API key: 240 requests/minute, 1,000 requests/day
 * - With API key (free): 240 requests/minute, 120,000 requests/day
 * 
 * We use the "indications_and_usage" field to find drugs that treat
 * specific medical conditions.
 */

import { DrugResult, extractSearchTerms } from '../types/icd';

// =============================================================================
// Configuration
// =============================================================================

/**
 * OpenFDA Drug Labels API endpoint.
 * 
 * This endpoint returns structured product labeling (SPL) data
 * submitted by drug manufacturers to the FDA.
 */
const OPENFDA_BASE_URL = 'https://api.fda.gov/drug/label.json';

/**
 * Default number of drug results to fetch from OpenFDA.
 * 
 * Fetch 15 candidates to provide the AI validation pipeline with enough
 * options to score, filter, and return only clinically relevant drugs.
 * The pipeline will filter to top 5 high-relevance drugs.
 */
const DEFAULT_LIMIT = 15;

/**
 * Condition-specific synonyms for better drug discovery.
 * 
 * FDA drug labels often use different terminology than ICD-10 condition names.
 * For example, obesity drugs are labeled for "weight management" not "obesity".
 * 
 * This dictionary maps common condition keywords to arrays of synonyms that
 * are used in FDA drug labeling, improving search results significantly.
 */
const CONDITION_SYNONYMS: Record<string, string[]> = {
  // Metabolic conditions
  'obesity': ['obesity', 'weight management', 'overweight', 'weight loss', 'weight reduction', 'BMI', 'body mass'],
  'diabetes': ['diabetes', 'glycemic control', 'blood sugar', 'hyperglycemia', 'glucose', 'insulin'],
  'cholesterol': ['cholesterol', 'lipid', 'hyperlipidemia', 'hypercholesterolemia', 'triglyceride'],
  
  // Cardiovascular
  'hypertension': ['hypertension', 'high blood pressure', 'blood pressure', 'hypertensive', 'antihypertensive'],
  'heart': ['heart', 'cardiac', 'cardiovascular', 'myocardial', 'coronary'],
  
  // Mental health
  'depression': ['depression', 'depressive', 'major depressive disorder', 'MDD', 'antidepressant'],
  'anxiety': ['anxiety', 'anxiolytic', 'generalized anxiety', 'GAD', 'panic'],
  'bipolar': ['bipolar', 'manic', 'mood stabilizer'],
  
  // Respiratory
  'asthma': ['asthma', 'bronchodilator', 'bronchospasm', 'airway'],
  'copd': ['COPD', 'chronic obstructive', 'bronchitis', 'emphysema'],
  
  // Pain and inflammation
  'pain': ['pain', 'analgesic', 'analgesia', 'painful'],
  'arthritis': ['arthritis', 'rheumatoid', 'inflammatory', 'joint'],
  'migraine': ['migraine', 'headache', 'cephalalgia'],
  
  // Infections
  'infection': ['infection', 'antibiotic', 'antimicrobial', 'bacterial'],
  
  // Other common conditions
  'epilepsy': ['epilepsy', 'seizure', 'anticonvulsant', 'convulsion'],
  'insomnia': ['insomnia', 'sleep', 'sedative', 'hypnotic'],
  'allergy': ['allergy', 'allergic', 'antihistamine', 'histamine'],
  'acid': ['acid reflux', 'GERD', 'heartburn', 'gastric', 'proton pump'],
};

// =============================================================================
// Synonym Expansion
// =============================================================================

/**
 * Expands a search term into an array of synonyms for better drug discovery.
 * 
 * FDA drug labels often use different terminology than ICD-10 condition names.
 * For example:
 * - "obesity" → also search "weight management", "overweight", etc.
 * - "diabetes" → also search "glycemic control", "blood sugar", etc.
 * 
 * @param searchTerm - The base search term extracted from condition name
 * @returns Array of synonyms to search (includes original term)
 * 
 * @example
 * expandSearchTerms("obesity")
 * // Returns: ["obesity", "weight management", "overweight", "weight loss", ...]
 */
function expandSearchTerms(searchTerm: string): string[] {
  const normalized = searchTerm.toLowerCase().trim();
  
  // Check if any synonym key is contained in the search term
  for (const [key, synonyms] of Object.entries(CONDITION_SYNONYMS)) {
    if (normalized.includes(key)) {
      console.log(`[OpenFDA] Synonym match: "${key}" found in "${normalized}"`);
      return synonyms;
    }
  }
  
  // No synonym match - return original term as single-item array
  return [searchTerm];
}

/**
 * Builds an OpenFDA boolean OR query from an array of terms.
 * 
 * @param terms - Array of search terms to combine with OR
 * @returns Encoded query string for OpenFDA API
 * 
 * @example
 * buildOrQuery(["obesity", "weight management", "overweight"])
 * // Returns: "(obesity+OR+weight+management+OR+overweight)"
 */
function buildOrQuery(terms: string[]): string {
  // Encode each term and join with +OR+
  const encodedTerms = terms.map(term => {
    // Replace spaces with + for multi-word terms
    return encodeURIComponent(term).replace(/%20/g, '+');
  });
  
  // Wrap in parentheses for proper grouping
  return `(${encodedTerms.join('+OR+')})`;
}

// =============================================================================
// Main Search Function
// =============================================================================

/**
 * Searches OpenFDA for drugs that treat a specific medical condition.
 * 
 * Uses synonym expansion to find drugs even when FDA labeling uses
 * different terminology than the ICD-10 condition name.
 * 
 * Returns up to 15 drug candidates by default for AI relevance scoring.
 * The validation pipeline filters these to the top 5 clinically relevant drugs.
 * 
 * @param conditionName - The condition name (e.g., "Type 2 diabetes mellitus")
 * @param limit - Maximum number of results to return (default: 15)
 * @returns Promise resolving to array of DrugResult objects
 * @throws Error if API request fails or rate limit is exceeded
 * 
 * @example
 * const drugs = await searchDrugsByCondition("Obesity, unspecified");
 * // Expands to search: obesity OR weight management OR overweight OR ...
 * // Returns: [{ brandName: "Wegovy", ... }, { brandName: "Saxenda", ... }]
 */
export async function searchDrugsByCondition(
  conditionName: string,
  limit: number = DEFAULT_LIMIT
): Promise<DrugResult[]> {
  // Step 1: Clean the condition name for better search results
  // ---------------------------------------------------------
  // Medical condition names often have qualifiers like "without complications"
  // that don't help find drugs. extractSearchTerms removes these.
  const baseTerms = extractSearchTerms(conditionName);
  
  if (!baseTerms) {
    return [];
  }
  
  // Step 2: Expand search terms with synonyms
  // -----------------------------------------
  // FDA labels often use different terminology than ICD codes.
  // E.g., obesity drugs are labeled for "weight management" not "obesity"
  const expandedTerms = expandSearchTerms(baseTerms);
  
  console.log(`[OpenFDA] Search expansion: "${baseTerms}" → [${expandedTerms.join(', ')}]`);
  
  // Step 3: Build the API URL with boolean OR query
  // -----------------------------------------------
  // We search the "indications_and_usage" field which contains
  // information about what conditions the drug is used to treat.
  const orQuery = buildOrQuery(expandedTerms);
  const url = `${OPENFDA_BASE_URL}?search=indications_and_usage:${orQuery}&limit=${limit}`;
  
  console.log(`[OpenFDA] Query URL: ${url.substring(0, 150)}...`);
  
  // Step 3: Make the API request
  // ----------------------------
  try {
    const response = await fetch(url);
    
    // Handle specific error cases
    if (response.status === 404) {
      // 404 means no results found - this is not an error
      return [];
    }
    
    if (response.status === 429) {
      // 429 means rate limit exceeded
      throw new Error('Rate limit exceeded. Please wait a moment and try again.');
    }
    
    if (!response.ok) {
      throw new Error(`OpenFDA API error: ${response.status} ${response.statusText}`);
    }
    
    // Step 4: Parse the response
    // --------------------------
    const data = await response.json();
    
    // Step 5: Transform to our DrugResult format
    // ------------------------------------------
    return parseOpenFdaResponse(data);
    
  } catch (error) {
    // Re-throw with user-friendly message
    if (error instanceof Error) {
      // Check for network errors
      if (error.message.includes('Failed to fetch')) {
        throw new Error('Unable to connect to drug database. Check your internet connection.');
      }
      throw error;
    }
    throw new Error('Failed to search for drugs. Please try again.');
  }
}

// =============================================================================
// Response Parser
// =============================================================================

/**
 * OpenFDA API response structure (simplified).
 * The actual response has many more fields - we only use what we need.
 */
interface OpenFdaApiResponse {
  meta?: {
    results?: {
      total: number;
    };
  };
  results?: OpenFdaResult[];
}

interface OpenFdaResult {
  openfda?: {
    brand_name?: string[];
    generic_name?: string[];
    manufacturer_name?: string[];
  };
  indications_and_usage?: string[];
  warnings?: string[];
}

/**
 * Parses the raw OpenFDA API response into our DrugResult format.
 * 
 * OpenFDA returns deeply nested data with many optional fields.
 * This function safely extracts what we need with fallbacks.
 * 
 * @param response - Raw API response from OpenFDA
 * @returns Array of DrugResult objects
 */
function parseOpenFdaResponse(response: OpenFdaApiResponse): DrugResult[] {
  // If no results array, return empty
  if (!response.results || !Array.isArray(response.results)) {
    return [];
  }
  
  // Transform each result
  return response.results.map((result): DrugResult => {
    // Safely extract each field with fallbacks
    // The ?. (optional chaining) prevents errors if fields are missing
    // The ?? (nullish coalescing) provides default values
    
    const brandName = result.openfda?.brand_name?.[0] ?? 'Unknown Brand';
    const genericName = result.openfda?.generic_name?.[0] ?? 'Unknown Generic';
    const manufacturer = result.openfda?.manufacturer_name?.[0] ?? 'Unknown Manufacturer';
    
    // Truncate indication to reasonable length for display
    const fullIndication = result.indications_and_usage?.[0] ?? 'No indication information available';
    const indication = truncateText(fullIndication, 200);
    
    // Truncate warnings (optional field)
    const fullWarnings = result.warnings?.[0];
    const warnings = fullWarnings ? truncateText(fullWarnings, 150) : undefined;
    
    return {
      brandName: formatDrugName(brandName),
      genericName: formatDrugName(genericName),
      manufacturer: formatManufacturer(manufacturer),
      indication,
      warnings,
    };
  });
}

// =============================================================================
// Helper Functions
// =============================================================================

/**
 * Truncates text to a maximum length, adding ellipsis if needed.
 * Tries to break at a word boundary for cleaner display.
 * 
 * @param text - The text to truncate
 * @param maxLength - Maximum characters to keep
 * @returns Truncated text with "..." if it was shortened
 */
function truncateText(text: string, maxLength: number): string {
  if (text.length <= maxLength) {
    return text;
  }
  
  // Find the last space within the limit
  const truncated = text.substring(0, maxLength);
  const lastSpace = truncated.lastIndexOf(' ');
  
  // If there's a space, break there; otherwise just cut at maxLength
  const breakPoint = lastSpace > maxLength * 0.7 ? lastSpace : maxLength;
  
  return text.substring(0, breakPoint).trim() + '...';
}

/**
 * Formats drug names for display.
 * OpenFDA often returns names in ALL CAPS - this converts to Title Case.
 * 
 * @param name - Raw drug name from API
 * @returns Formatted name in Title Case
 */
function formatDrugName(name: string): string {
  // If it's all uppercase, convert to title case
  if (name === name.toUpperCase()) {
    return name
      .toLowerCase()
      .split(' ')
      .map(word => word.charAt(0).toUpperCase() + word.slice(1))
      .join(' ');
  }
  return name;
}

/**
 * Formats manufacturer names for cleaner display.
 * Removes common suffixes like "Inc.", "LLC", etc.
 * 
 * @param name - Raw manufacturer name from API
 * @returns Cleaned manufacturer name
 */
function formatManufacturer(name: string): string {
  // Remove common corporate suffixes for cleaner display
  return name
    .replace(/,?\s*(Inc\.?|LLC|Ltd\.?|Corp\.?|Corporation|Company|Co\.?)$/i, '')
    .trim();
}

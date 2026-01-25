/**
 * API Helper Functions
 * ====================
 * 
 * This file contains functions that communicate with external APIs.
 * Keeping API logic separate from UI components makes code:
 * - Easier to test
 * - Easier to maintain
 * - Reusable across different components
 */

import { ICD10Result, SearchResponse } from '../types/icd';

// =============================================================================
// Configuration
// =============================================================================

/**
 * Base URL for the ClinicalTables ICD-10 API
 * 
 * ClinicalTables is a free, public API provided by the National Library of Medicine.
 * Documentation: https://clinicaltables.nlm.nih.gov/
 */
const API_BASE_URL = 'https://clinicaltables.nlm.nih.gov/api/icd10cm/v3/search';

// =============================================================================
// Main Search Function
// =============================================================================

/**
 * Searches the ClinicalTables API for ICD-10 codes matching the query.
 * 
 * @param query - The search term (e.g., "diabetes" or "E11.9")
 * @returns Promise that resolves to an array of ICD10Result objects
 * @throws Error if the network request fails or response is invalid
 * 
 * @example
 * // Search for diabetes-related codes
 * const results = await searchICD10('diabetes');
 * console.log(results);
 * // Output: [
 * //   { code: "E10", name: "Type 1 diabetes mellitus" },
 * //   { code: "E11", name: "Type 2 diabetes mellitus" },
 * //   ...
 * // ]
 */
export async function searchICD10(query: string): Promise<ICD10Result[]> {
  // Step 1: Validate the input
  // --------------------------
  // trim() removes whitespace from both ends of the string
  // This prevents searches with just spaces
  const trimmedQuery = query.trim();
  
  if (!trimmedQuery) {
    // Return empty array if query is empty (no point calling the API)
    return [];
  }

  // Step 2: Build the API URL
  // -------------------------
  // encodeURIComponent() converts special characters to URL-safe format
  // Example: "heart attack" becomes "heart%20attack"
  // This prevents URL breaking if user types special characters
  const params = new URLSearchParams({
    sf: 'code,name',    // sf = "search fields" - we want both code and name
    terms: trimmedQuery // terms = the search query
  });
  
  const url = `${API_BASE_URL}?${params.toString()}`;
  
  // Step 3: Make the API request
  // ----------------------------
  // fetch() is the modern way to make HTTP requests in JavaScript
  // It returns a Promise, so we use await to wait for the response
  try {
    const response = await fetch(url);
    
    // Check if the request was successful (status code 200-299)
    if (!response.ok) {
      // response.ok is false for 4xx and 5xx status codes
      throw new Error(`API request failed with status: ${response.status}`);
    }
    
    // Step 4: Parse the JSON response
    // -------------------------------
    // The API returns JSON data, which we need to parse
    const data: SearchResponse = await response.json();
    
    // Step 5: Transform the response into our format
    // ----------------------------------------------
    // The API returns: [count, codes[], null, names[][]]
    // We need to combine codes and names into ICD10Result objects
    return parseSearchResponse(data);
    
  } catch (error) {
    // Step 6: Handle errors gracefully
    // --------------------------------
    // This catches both network errors and parsing errors
    
    // Log the error for debugging (visible in browser console)
    console.error('Error searching ICD-10 codes:', error);
    
    // Re-throw with a user-friendly message
    // "instanceof Error" checks if error is an Error object
    if (error instanceof Error) {
      throw new Error(`Failed to search ICD-10 codes: ${error.message}`);
    }
    throw new Error('Failed to search ICD-10 codes: Unknown error');
  }
}

// =============================================================================
// Helper Functions
// =============================================================================

/**
 * Parses the raw API response into an array of ICD10Result objects.
 * 
 * The ClinicalTables API returns data in an unusual format:
 * [totalCount, codesArray, null, namesArray]
 * 
 * Where namesArray contains 2-element arrays: [[code, name], [code, name], ...]
 * Example: [["E23.2", "Diabetes insipidus"], ["N25.1", "Nephrogenic diabetes"]]
 * 
 * This function transforms that into a more usable format:
 * [{ code: "E11", name: "Type 2 diabetes" }, ...]
 * 
 * @param response - The raw response from the ClinicalTables API
 * @returns Array of ICD10Result objects
 */
function parseSearchResponse(response: SearchResponse): ICD10Result[] {
  // Destructure the array response
  // This assigns each array element to a named variable
  const [totalCount, codes, , names] = response;
  //                       ^ Note: we skip index 2 (null) with empty slot
  
  // Debug: Log the raw response structure
  console.log('=== DEBUG: parseSearchResponse ===');
  console.log('Raw response:', response);
  console.log('Total count:', totalCount);
  console.log('Codes array:', codes);
  console.log('Names array:', names);
  
  // If no results, return empty array
  if (totalCount === 0 || !codes || !names) {
    return [];
  }
  
  // Map each code to an ICD10Result object
  // map() creates a new array by transforming each element
  const results: ICD10Result[] = codes.map((code, index) => {
    // names[index] is a 2-element array like ["E23.2", "Diabetes insipidus"]
    // Index 0 = the code (duplicate), Index 1 = the actual condition name
    const nameArray = names[index];
    const name = nameArray && nameArray.length > 1 
      ? nameArray[1]  // Get the SECOND element (the actual name)
      : 'Unknown condition';  // Fallback if name is missing
    
    // Debug: Log each extraction (only first 3 to avoid spam)
    if (index < 3) {
      console.log(`--- Result ${index} ---`);
      console.log(`  code: "${code}"`);
      console.log(`  names[${index}]:`, nameArray);
      console.log(`  extracted name: "${name}"`);
    }
    
    return {
      code,  // Shorthand for code: code
      name   // Shorthand for name: name
    };
  });
  
  console.log('=== Final results (first 3) ===', results.slice(0, 3));
  
  return results;
}

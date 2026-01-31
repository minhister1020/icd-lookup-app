/**
 * AI-Powered Drug List Generator
 * ===============================
 * 
 * Generates drug lists for medical conditions using Claude Haiku API.
 * This is used as a fallback when curated mappings don't exist.
 * 
 * Design Principles:
 * - Use Haiku model (fast, cost-efficient for simple tasks)
 * - Request generic drug names (RxNorm compatible)
 * - Handle multiple response formats (JSON, markdown, numbered lists)
 * - Never throw errors - return empty array on failure
 * - 10-second timeout to prevent hanging
 * - Comprehensive logging for debugging
 */

import Anthropic from '@anthropic-ai/sdk';

// =============================================================================
// Configuration
// =============================================================================

/**
 * Claude model to use for drug list generation.
 * Haiku is fast and cost-efficient for this simple task.
 * Using same version date as claude-sonnet-4 for consistency.
 */
const MODEL = 'claude-haiku-4-20250514';

/**
 * Maximum number of drugs to request from AI.
 */
const MAX_DRUGS = 15;

/**
 * Timeout for AI API calls in milliseconds.
 */
const API_TIMEOUT_MS = 10000; // 10 seconds

/**
 * Maximum tokens for AI response.
 */
const MAX_TOKENS = 500;

// =============================================================================
// Types
// =============================================================================

/**
 * Result of AI drug list generation.
 */
export interface GenerationResult {
  /** Array of drug names (generic names) */
  drugs: string[];
  /** Whether generation succeeded */
  success: boolean;
  /** Error message if failed */
  error?: string;
}

// =============================================================================
// Helper Functions
// =============================================================================

/**
 * Creates the AI prompt for drug list generation.
 * 
 * @param conditionName - Medical condition name
 * @returns Formatted prompt string
 */
function createPrompt(conditionName: string): string {
  return `You are a clinical pharmacologist. List FDA-approved and common off-label prescription drugs for treating: ${conditionName}

REQUIREMENTS:
- Return ONLY generic drug names (e.g., "adalimumab" not "Humira")
- Include ${MAX_DRUGS} drugs maximum
- Prioritize FDA-approved drugs first, then common off-label uses
- Use names that exist in standard drug databases (RxNorm/OpenFDA)
- Format as a simple JSON array of strings
- No explanations, no numbering, no bullet points, no extra text

EXAMPLE RESPONSE FORMAT:
["metformin", "semaglutide", "empagliflozin", "sitagliptin"]

Now generate the drug list for: ${conditionName}`;
}

/**
 * Parses AI response into drug name array.
 * Handles multiple formats: JSON array, markdown list, numbered list.
 * 
 * @param response - Raw AI response text
 * @returns Array of drug names
 */
function parseDrugList(response: string): string[] {
  const logPrefix = '[DrugGenerator:Parse]';
  
  try {
    // Strategy 1: Try parsing as JSON array
    const jsonMatch = response.match(/\[[\s\S]*\]/);
    if (jsonMatch) {
      const parsed = JSON.parse(jsonMatch[0]);
      if (Array.isArray(parsed)) {
        console.log(`${logPrefix} Parsed JSON array with ${parsed.length} drugs`);
        return parsed.filter((item): item is string => typeof item === 'string');
      }
    }
  } catch {
    // JSON parsing failed, try other formats
  }

  // Strategy 2: Try parsing markdown/numbered list
  const lines = response.split('\n');
  const drugs: string[] = [];

  for (const line of lines) {
    // Match patterns like:
    // - drugname
    // * drugname
    // 1. drugname
    // • drugname
    const match = line.match(/^[\s\-\*•\d.]+(.+?)(?:\s*[-–—]\s*.+)?$/);
    if (match && match[1]) {
      const drugName = match[1].trim();
      // Remove any parenthetical brand names like "adalimumab (Humira)"
      const cleanName = drugName.replace(/\s*\([^)]*\)/g, '').trim();
      if (cleanName && cleanName.length > 2 && cleanName.length < 100) {
        drugs.push(cleanName.toLowerCase());
      }
    }
  }

  if (drugs.length > 0) {
    console.log(`${logPrefix} Parsed list format with ${drugs.length} drugs`);
    return drugs;
  }

  // Strategy 3: Split by commas (last resort)
  const commaSplit = response
    .replace(/[\[\]]/g, '')
    .split(',')
    .map(s => s.trim().replace(/^["']|["']$/g, ''))
    .filter(s => s.length > 2 && s.length < 100);

  if (commaSplit.length > 0) {
    console.log(`${logPrefix} Parsed comma-separated with ${commaSplit.length} drugs`);
    return commaSplit;
  }

  console.warn(`${logPrefix} Could not parse response format`);
  return [];
}

/**
 * Validates and cleans drug name array.
 * Removes duplicates, empty strings, and invalid entries.
 * 
 * @param drugs - Raw drug name array
 * @returns Cleaned and validated array
 */
function validateDrugList(drugs: string[]): string[] {
  const cleaned = drugs
    .map(d => d.toLowerCase().trim())
    .filter(d => {
      // Remove empty strings
      if (!d) return false;
      // Remove very short names (likely parsing errors)
      if (d.length < 3) return false;
      // Remove very long names (likely descriptions)
      if (d.length > 100) return false;
      // Remove entries with special characters (likely formatting artifacts)
      if (/[<>{}[\]\\]/.test(d)) return false;
      return true;
    });

  // Remove duplicates
  const unique = Array.from(new Set(cleaned));

  return unique;
}

// =============================================================================
// Main Function
// =============================================================================

/**
 * Generates a list of drugs for a medical condition using Claude Haiku AI.
 * 
 * This function:
 * 1. Validates API key exists
 * 2. Creates specialized prompt
 * 3. Calls Claude Haiku with timeout
 * 4. Parses response (handles multiple formats)
 * 5. Validates and cleans drug list
 * 6. Returns result (never throws)
 * 
 * @param conditionName - The medical condition name
 * @returns Promise resolving to GenerationResult
 * 
 * @example
 * const result = await generateDrugListWithAI("Psoriasis vulgaris");
 * if (result.success) {
 *   console.log(`Found ${result.drugs.length} drugs`);
 * }
 */
export async function generateDrugListWithAI(
  conditionName: string
): Promise<GenerationResult> {
  const logPrefix = `[DrugGenerator:${conditionName.slice(0, 30)}]`;

  try {
    // =========================================================================
    // Step 1: Validate API key
    // =========================================================================
    const apiKey = process.env.ANTHROPIC_API_KEY;
    
    if (!apiKey) {
      console.error(`${logPrefix} ANTHROPIC_API_KEY not configured`);
      return {
        drugs: [],
        success: false,
        error: 'API key not configured',
      };
    }

    // =========================================================================
    // Step 2: Initialize Anthropic client
    // =========================================================================
    const anthropic = new Anthropic({
      apiKey: apiKey,
    });

    // =========================================================================
    // Step 3: Create prompt
    // =========================================================================
    const prompt = createPrompt(conditionName);
    console.log(`${logPrefix} Generating drug list with AI...`);

    // =========================================================================
    // Step 4: Call Claude with timeout
    // =========================================================================
    const controller = new AbortController();
    const timeoutId = setTimeout(() => controller.abort(), API_TIMEOUT_MS);

    let response: string;
    try {
      const message = await anthropic.messages.create(
        {
          model: MODEL,
          max_tokens: MAX_TOKENS,
          messages: [
            {
              role: 'user',
              content: prompt,
            },
          ],
        },
        {
          signal: controller.signal as AbortSignal,
        }
      );

      clearTimeout(timeoutId);

      // Extract text from response
      const textContent = message.content.find(block => block.type === 'text');
      if (!textContent || textContent.type !== 'text') {
        console.error(`${logPrefix} No text content in AI response`);
        return {
          drugs: [],
          success: false,
          error: 'No text content in response',
        };
      }

      response = textContent.text;
      console.log(`${logPrefix} Received AI response (${response.length} chars)`);

    } catch (apiError) {
      clearTimeout(timeoutId);
      
      if ((apiError as Error).name === 'AbortError') {
        console.error(`${logPrefix} AI request timed out after ${API_TIMEOUT_MS}ms`);
        return {
          drugs: [],
          success: false,
          error: 'Request timeout',
        };
      }

      console.error(`${logPrefix} AI API call failed:`, apiError);
      return {
        drugs: [],
        success: false,
        error: 'API call failed',
      };
    }

    // =========================================================================
    // Step 5: Parse response
    // =========================================================================
    const parsedDrugs = parseDrugList(response);
    
    if (parsedDrugs.length === 0) {
      console.warn(`${logPrefix} AI returned no drugs (empty or unparseable)`);
      return {
        drugs: [],
        success: false,
        error: 'Empty or unparseable response',
      };
    }

    // =========================================================================
    // Step 6: Validate and clean
    // =========================================================================
    const validatedDrugs = validateDrugList(parsedDrugs);

    if (validatedDrugs.length === 0) {
      console.warn(`${logPrefix} No valid drugs after validation`);
      return {
        drugs: [],
        success: false,
        error: 'No valid drugs after validation',
      };
    }

    console.log(`${logPrefix} Successfully generated ${validatedDrugs.length} drugs`);
    
    return {
      drugs: validatedDrugs,
      success: true,
    };

  } catch (error) {
    // Catch-all for unexpected errors
    console.error(`${logPrefix} Unexpected error:`, error);
    return {
      drugs: [],
      success: false,
      error: 'Unexpected error',
    };
  }
}

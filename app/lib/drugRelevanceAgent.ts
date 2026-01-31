/**
 * Drug Relevance Agent
 * ====================
 * 
 * Uses Claude AI to score drug-condition relevance.
 * 
 * This agent evaluates whether drugs returned from OpenFDA actually TREAT
 * a condition vs. just mentioning it as a side effect/warning.
 * 
 * Example:
 * - Naproxen for "Obesity" → Score 0 (obesity is just a risk factor in warnings)
 * - Wegovy for "Obesity" → Score 10 (FDA-approved treatment for obesity)
 */

import Anthropic from '@anthropic-ai/sdk';

// =============================================================================
// TypeScript Interfaces
// =============================================================================

/**
 * Input drug format from OpenFDA results.
 */
export interface DrugInput {
  brandName: string;
  genericName: string;
}

/**
 * Scored drug result from Claude.
 */
export interface DrugScore {
  drugName: string;
  score: number;
  reasoning: string;
}

// =============================================================================
// System Prompt (Expert Role & Scoring Rubric)
// =============================================================================

const SYSTEM_PROMPT = `You are an expert clinical pharmacologist with 20+ years of experience in drug-disease relationships and FDA approval processes. Your role is to evaluate drug-condition matches based on evidence-based medicine.

Task: Score each drug's clinical relevance for treating the specified medical condition.

Scoring Rubric (0-10 scale):
Score 10: FDA-approved as PRIMARY indication for this exact condition. Drug label explicitly lists this condition as approved use.
Score 8-9: FDA-approved for this condition OR widely recognized as standard-of-care treatment in clinical guidelines (e.g., UpToDate, ACP, WHO).
Score 6-7: Commonly prescribed off-label for this condition with substantial clinical evidence. Mentioned in treatment protocols.
Score 4-5: Sometimes used for this condition but not standard practice. May treat related symptoms or complications.
Score 2-3: Rarely relevant. Only used in very specific subtypes or as adjunct therapy. Weak evidence.
Score 0-1: Not a treatment. Condition only appears in drug label as contraindication, warning, adverse event, or risk factor.

Critical Distinction: If the condition appears in the drug's "WARNINGS" or "ADVERSE REACTIONS" sections but NOT in "INDICATIONS AND USAGE", score 0-1.

Output Format Requirements:
- Return ONLY a valid JSON array
- No markdown code blocks, no backticks, no preamble, no explanation outside JSON
- Each object must have exactly three fields: drugName (string), score (integer 0-10), reasoning (string under 100 chars)
- Reasoning must cite specific evidence: "FDA-approved for X" or "Off-label use per clinical guidelines" or "Only mentioned as risk factor"`;

// =============================================================================
// Main Scoring Function
// =============================================================================

/**
 * Scores drug relevance for a medical condition using Claude AI.
 * 
 * @param conditionName - The medical condition (e.g., "Morbid obesity")
 * @param drugs - Array of drugs to evaluate
 * @returns Promise resolving to array of scored drugs
 * 
 * @example
 * const scores = await scoreDrugRelevance(
 *   "Morbid (severe) obesity",
 *   [
 *     { brandName: "Naproxen", genericName: "Naproxen Sodium" },
 *     { brandName: "Wegovy", genericName: "Semaglutide" }
 *   ]
 * );
 * // Returns:
 * // [
 * //   { drugName: "Naproxen (Naproxen Sodium)", score: 0, reasoning: "NSAID; obesity only mentioned as risk factor" },
 * //   { drugName: "Wegovy (Semaglutide)", score: 10, reasoning: "FDA-approved GLP-1 for chronic weight management" }
 * // ]
 */
export async function scoreDrugRelevance(
  conditionName: string,
  drugs: DrugInput[]
): Promise<DrugScore[]> {
  // Validate API key
  const apiKey = process.env.ANTHROPIC_API_KEY;
  if (!apiKey) {
    throw new Error(
      'ANTHROPIC_API_KEY not configured. Add it to .env.local file:\n' +
      'ANTHROPIC_API_KEY=sk-ant-...\n\n' +
      'Get your API key at: https://console.anthropic.com/settings/keys'
    );
  }

  // Skip if no drugs to score
  if (!drugs || drugs.length === 0) {
    return [];
  }

  try {
    // Initialize Anthropic client
    const anthropic = new Anthropic({
      apiKey: apiKey,
    });

    // Format drugs list for the prompt
    const drugsList = drugs
      .map((d, i) => `${i + 1}. ${d.brandName} (${d.genericName})`)
      .join('\n');

    // Build user prompt with chain-of-thought guidance
    const userPrompt = `Medical Condition: ${conditionName}

Drugs to Evaluate:
${drugsList}

Instructions:
1. For each drug, first determine: Does this drug TREAT the condition, or is the condition just mentioned as a side effect/warning/risk factor?
2. Check if the drug is FDA-approved for this specific condition
3. Consider clinical guidelines and standard-of-care practices
4. Assign score using the rubric above
5. Provide concise reasoning with evidence source

Return JSON array format:
[
  {
    "drugName": "Brand Name (Generic Name)",
    "score": 8,
    "reasoning": "FDA-approved for chronic weight management in adults with obesity"
  }
]

Example Scoring Logic:
- Wegovy (Semaglutide) for "Obesity" → Score 10 (FDA-approved indication)
- Metformin for "Type 2 Diabetes" → Score 10 (First-line treatment per ADA guidelines)
- Naproxen for "Obesity" → Score 0 (Obesity only mentioned as risk factor for NSAID complications)
- Aspirin for "Myocardial Infarction" → Score 9 (Standard of care for secondary prevention)
- Gabapentin for "Anxiety" → Score 4 (Off-label use, some evidence but not standard)

Now evaluate the drugs listed above for "${conditionName}":`;

    // Call Claude API
    const message = await anthropic.messages.create({
      model: 'claude-sonnet-4-20250514',
      max_tokens: 2000,
      temperature: 0, // Deterministic for reproducible scoring
      system: SYSTEM_PROMPT,
      messages: [
        {
          role: 'user',
          content: userPrompt,
        },
      ],
    });

    // Extract text content from response
    const responseContent = message.content[0];
    if (responseContent.type !== 'text') {
      console.error('[DrugRelevanceAgent] Unexpected response type:', responseContent.type);
      return [];
    }

    const rawResponse = responseContent.text;

    // Parse JSON response
    const scores = parseJsonResponse(rawResponse);

    if (scores.length > 0) {
      console.log(`[DrugRelevanceAgent] Scored ${scores.length} drugs for "${conditionName}"`);
    }

    return scores;

  } catch (error) {
    // Handle specific error types
    if (error instanceof Error) {
      if (error.message.includes('ANTHROPIC_API_KEY')) {
        throw error; // Re-throw API key errors
      }
      console.error('[DrugRelevanceAgent] API call failed:', error.message);
    } else {
      console.error('[DrugRelevanceAgent] Unknown error:', error);
    }
    
    return [];
  }
}

// =============================================================================
// JSON Response Parser
// =============================================================================

/**
 * Parses Claude's JSON response, handling markdown formatting.
 * 
 * Claude sometimes wraps JSON in markdown code blocks like:
 * ```json
 * [...]
 * ```
 * 
 * This function strips those and parses the raw JSON.
 * 
 * @param rawResponse - Raw text response from Claude
 * @returns Parsed array of DrugScore objects
 */
function parseJsonResponse(rawResponse: string): DrugScore[] {
  try {
    // Step 1: Strip markdown code blocks if present
    let cleaned = rawResponse.trim();
    
    // Remove ```json or ``` at start
    if (cleaned.startsWith('```json')) {
      cleaned = cleaned.slice(7);
    } else if (cleaned.startsWith('```')) {
      cleaned = cleaned.slice(3);
    }
    
    // Remove ``` at end
    if (cleaned.endsWith('```')) {
      cleaned = cleaned.slice(0, -3);
    }
    
    // Trim again after stripping
    cleaned = cleaned.trim();

    // Step 2: Parse JSON
    const parsed = JSON.parse(cleaned);

    // Step 3: Validate structure
    if (!Array.isArray(parsed)) {
      console.error('[DrugRelevanceAgent] Response is not an array');
      return [];
    }

    // Step 4: Validate and normalize each item
    const validated: DrugScore[] = [];
    
    for (const item of parsed) {
      if (
        typeof item === 'object' &&
        item !== null &&
        typeof item.drugName === 'string' &&
        typeof item.score === 'number' &&
        typeof item.reasoning === 'string'
      ) {
        validated.push({
          drugName: item.drugName,
          score: Math.max(0, Math.min(10, Math.round(item.score))), // Clamp to 0-10
          reasoning: item.reasoning.slice(0, 150), // Truncate if too long
        });
      } else {
        console.warn('[DrugRelevanceAgent] Invalid item in response:', item);
      }
    }

    return validated;

  } catch (parseError) {
    console.error('[DrugRelevanceAgent] JSON parsing failed');
    console.error('[DrugRelevanceAgent] Raw response:', rawResponse.slice(0, 500));
    return [];
  }
}

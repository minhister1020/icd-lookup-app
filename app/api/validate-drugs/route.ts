/**
 * API Route: /api/validate-drugs
 * 
 * Server-side endpoint for AI-powered drug validation.
 * This route runs on the server and has access to ANTHROPIC_API_KEY.
 * 
 * The client-side ResultCard component calls this endpoint instead of
 * importing validateDrugs directly, which wouldn't work because
 * environment variables without NEXT_PUBLIC_ prefix are only available server-side.
 */

import { NextRequest, NextResponse } from 'next/server';
import { validateDrugs } from '@/app/lib/drugValidationPipeline';

/**
 * POST /api/validate-drugs
 * 
 * Request body:
 * {
 *   conditionName: string,  // e.g., "Morbid (severe) obesity"
 *   icdCode: string         // e.g., "E66.2"
 * }
 * 
 * Response:
 * {
 *   drugs: ValidatedDrugResult[],
 *   cached: boolean  // Whether result was from cache
 * }
 */
export async function POST(request: NextRequest) {
  try {
    // Parse request body
    const body = await request.json();
    const { conditionName, icdCode } = body;

    // Validate required fields
    if (!conditionName || typeof conditionName !== 'string') {
      return NextResponse.json(
        { error: 'conditionName is required and must be a string' },
        { status: 400 }
      );
    }

    if (!icdCode || typeof icdCode !== 'string') {
      return NextResponse.json(
        { error: 'icdCode is required and must be a string' },
        { status: 400 }
      );
    }

    // Sanitize inputs (basic XSS prevention)
    const sanitizedCondition = conditionName.trim().slice(0, 500);
    const sanitizedCode = icdCode.trim().toUpperCase().slice(0, 20);

    console.log(`[API:validate-drugs] Request for ${sanitizedCode}: "${sanitizedCondition.slice(0, 50)}..."`);

    // Call validation pipeline (server-side, has access to ANTHROPIC_API_KEY)
    const validatedDrugs = await validateDrugs(sanitizedCondition, sanitizedCode);

    console.log(`[API:validate-drugs] Returning ${validatedDrugs.length} validated drugs for ${sanitizedCode}`);

    return NextResponse.json({
      drugs: validatedDrugs,
      icdCode: sanitizedCode,
      count: validatedDrugs.length,
    });

  } catch (error) {
    // Log the full error server-side
    console.error('[API:validate-drugs] Error:', error);

    // Check for specific error types
    if (error instanceof Error) {
      // API key configuration error
      if (error.message.includes('ANTHROPIC_API_KEY')) {
        console.error('[API:validate-drugs] ANTHROPIC_API_KEY not configured!');
        return NextResponse.json(
          { error: 'AI service not configured. Contact administrator.' },
          { status: 503 }
        );
      }

      // JSON parsing error from request
      if (error.message.includes('JSON')) {
        return NextResponse.json(
          { error: 'Invalid JSON in request body' },
          { status: 400 }
        );
      }
    }

    // Generic server error
    return NextResponse.json(
      { error: 'Drug validation failed. Please try again.' },
      { status: 500 }
    );
  }
}

/**
 * OPTIONS handler for CORS preflight requests
 * (Useful if calling from different origins during development)
 */
export async function OPTIONS() {
  return new NextResponse(null, {
    status: 204,
    headers: {
      'Access-Control-Allow-Origin': '*',
      'Access-Control-Allow-Methods': 'POST, OPTIONS',
      'Access-Control-Allow-Headers': 'Content-Type',
    },
  });
}

/**
 * SNOMED Procedure Lookup API Route
 *
 * Server-side endpoint that finds SNOMED CT procedures related to an ICD-10 diagnosis.
 * Keeps the UMLS_API_KEY secure on the server side.
 *
 * Usage: GET /api/snomed-procedures?icd10=E11.9
 *
 * Response: {
 *   procedures: ProcedureResult[],
 *   fromCache: boolean,
 *   processingTimeMs: number,
 *   error?: string
 * }
 *
 * @module api/snomed-procedures
 */

import { NextRequest, NextResponse } from 'next/server';
import { getSnomedProceduresForDiagnosis } from '../../lib/snomedProcedureApi';

export async function GET(request: NextRequest) {
  const startTime = Date.now();

  try {
    // Extract and validate the ICD-10 code from query params
    const searchParams = request.nextUrl.searchParams;
    const icd10Code = searchParams.get('icd10');

    if (!icd10Code || icd10Code.trim().length === 0) {
      return NextResponse.json(
        {
          error: 'Missing required parameter: icd10',
          procedures: [],
          processingTimeMs: Date.now() - startTime,
        },
        { status: 400 }
      );
    }

    // Basic ICD-10 format validation (letter followed by digits, optional dot)
    const icd10Pattern = /^[A-Za-z]\d{2}\.?\d{0,4}$/;
    if (!icd10Pattern.test(icd10Code.trim())) {
      return NextResponse.json(
        {
          error: `Invalid ICD-10 code format: ${icd10Code}`,
          procedures: [],
          processingTimeMs: Date.now() - startTime,
        },
        { status: 400 }
      );
    }

    // Check that UMLS API key is configured
    if (!process.env.UMLS_API_KEY) {
      return NextResponse.json(
        {
          error: 'UMLS API key not configured. SNOMED procedure lookup unavailable.',
          procedures: [],
          processingTimeMs: Date.now() - startTime,
        },
        { status: 503 }
      );
    }

    // Perform the lookup
    const procedures = await getSnomedProceduresForDiagnosis(icd10Code.trim());

    return NextResponse.json({
      procedures,
      icd10Code: icd10Code.trim().toUpperCase(),
      resultCount: procedures.length,
      processingTimeMs: Date.now() - startTime,
    });
  } catch (error) {
    console.error('[API/snomed-procedures] Unhandled error:', error);

    return NextResponse.json(
      {
        error: 'Internal server error during SNOMED procedure lookup',
        procedures: [],
        processingTimeMs: Date.now() - startTime,
      },
      { status: 500 }
    );
  }
}

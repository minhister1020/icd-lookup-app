# Drug Lookup Implementation Analysis

## Current Architecture
**3-Tier System:**
- Tier 1: Curated CONDITION_DRUG_MAPPINGS (50+ conditions)
- Tier 2: 24hr AI-generated cache
- Tier 3: Live Claude Haiku generation

**Already Using RxNorm REST API** at rxNormApi.ts:171

## Key Files
- app/lib/rxNormApi.ts (456 lines)
- app/lib/drugValidationPipeline.ts (664 lines)
- app/lib/conditionDrugMappings.ts (1932 lines)
- app/components/DrugCard.tsx (233 lines)

## Issues to Fix
- NASH Bug: Returns Ocaliva/Iqirvo instead of Rezdiffra
- Missing: Drug classes, ingredients, related drugs
- Static curated mappings get stale

## Enhancement Plan
Add with UMLS license:
1. Drug class/category (RxClass API)
2. Ingredients breakdown (RxNorm Relations)
3. Related drug suggestions
4. NDC codes
5. Fix NASH mappings + add freshness checks

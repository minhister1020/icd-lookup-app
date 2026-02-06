'use client';

import { useState, memo } from 'react';
import {
  Stethoscope,
  Activity,
  Heart,
  Package,
  ChevronDown,
  ChevronUp,
  BadgeCheck,
  Building2,
  Info,
} from 'lucide-react';
import { ProcedureResult } from '../types/icd';

// ============================================================
// Props
// ============================================================

interface ProcedureCardProps {
  procedure: ProcedureResult;
}

// ============================================================
// Helpers
// ============================================================

/** Color theme per category */
function getCategoryTheme(category: ProcedureResult['category']) {
  switch (category) {
    case 'diagnostic':
      return {
        bg: 'bg-sky-50 dark:bg-sky-950/30',
        border: 'border-sky-200 dark:border-sky-800',
        badge: 'bg-sky-100 text-sky-700 dark:bg-sky-900/50 dark:text-sky-300',
        icon: Activity,
        iconColor: 'text-sky-600 dark:text-sky-400',
        label: 'Diagnostic',
      };
    case 'therapeutic':
      return {
        bg: 'bg-emerald-50 dark:bg-emerald-950/30',
        border: 'border-emerald-200 dark:border-emerald-800',
        badge: 'bg-emerald-100 text-emerald-700 dark:bg-emerald-900/50 dark:text-emerald-300',
        icon: Heart,
        iconColor: 'text-emerald-600 dark:text-emerald-400',
        label: 'Therapeutic',
      };
    case 'monitoring':
      return {
        bg: 'bg-amber-50 dark:bg-amber-950/30',
        border: 'border-amber-200 dark:border-amber-800',
        badge: 'bg-amber-100 text-amber-700 dark:bg-amber-900/50 dark:text-amber-300',
        icon: Stethoscope,
        iconColor: 'text-amber-600 dark:text-amber-400',
        label: 'Monitoring',
      };
    case 'equipment':
      return {
        bg: 'bg-violet-50 dark:bg-violet-950/30',
        border: 'border-violet-200 dark:border-violet-800',
        badge: 'bg-violet-100 text-violet-700 dark:bg-violet-900/50 dark:text-violet-300',
        icon: Package,
        iconColor: 'text-violet-600 dark:text-violet-400',
        label: 'Equipment / DME',
      };
    default:
      return {
        bg: 'bg-gray-50 dark:bg-gray-900/30',
        border: 'border-gray-200 dark:border-gray-700',
        badge: 'bg-gray-100 text-gray-600 dark:bg-gray-800 dark:text-gray-400',
        icon: Info,
        iconColor: 'text-gray-500 dark:text-gray-400',
        label: 'Other',
      };
  }
}

/** Human-readable code system label */
function getCodeSystemLabel(codeSystem: ProcedureResult['codeSystem']) {
  switch (codeSystem) {
    case 'SNOMED': return 'SNOMED CT';
    case 'ICD10PCS': return 'ICD-10-PCS';
    case 'HCPCS': return 'HCPCS Level II';
    default: return codeSystem;
  }
}

/** Setting badge */
function getSettingLabel(setting?: string) {
  switch (setting) {
    case 'inpatient': return 'Inpatient';
    case 'outpatient': return 'Outpatient';
    case 'both': return 'Any Setting';
    default: return null;
  }
}

// ============================================================
// Component
// ============================================================

const ProcedureCard = memo(function ProcedureCard({ procedure }: ProcedureCardProps) {
  const [expanded, setExpanded] = useState(false);
  const theme = getCategoryTheme(procedure.category);
  const IconComponent = theme.icon;

  return (
    <div
      className={`group rounded-lg border ${theme.border} ${theme.bg} p-3 transition-all duration-200 hover:shadow-md cursor-pointer`}
      onClick={() => setExpanded(!expanded)}
    >
      {/* ---- Header Row ---- */}
      <div className="flex items-start gap-3">
        {/* Category Icon */}
        <div className={`mt-0.5 flex-shrink-0 ${theme.iconColor}`}>
          <IconComponent className="h-5 w-5" />
        </div>

        {/* Main Content */}
        <div className="flex-1 min-w-0">
          {/* Description */}
          <p className="text-sm font-medium text-gray-900 dark:text-gray-100 leading-tight">
            {procedure.description}
          </p>

          {/* Badges Row */}
          <div className="flex flex-wrap items-center gap-1.5 mt-1.5">
            {/* Category Badge */}
            <span className={`inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-xs font-medium ${theme.badge}`}>
              {theme.label}
            </span>

            {/* Code System Badge */}
            <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-xs font-medium bg-gray-100 text-gray-600 dark:bg-gray-800 dark:text-gray-400">
              {getCodeSystemLabel(procedure.codeSystem)}
            </span>

            {/* Curated Badge */}
            {procedure.source === 'curated' && (
              <span className="inline-flex items-center gap-0.5 px-2 py-0.5 rounded-full text-xs font-medium bg-green-100 text-green-700 dark:bg-green-900/50 dark:text-green-300">
                <BadgeCheck className="h-3 w-3" />
                Curated
              </span>
            )}

            {/* Setting Badge */}
            {getSettingLabel(procedure.setting) && (
              <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-xs font-medium bg-blue-50 text-blue-600 dark:bg-blue-900/40 dark:text-blue-300">
                <Building2 className="h-3 w-3" />
                {getSettingLabel(procedure.setting)}
              </span>
            )}
          </div>
        </div>

        {/* Expand/Collapse */}
        <div className="flex-shrink-0 text-gray-400 dark:text-gray-500 group-hover:text-gray-600 dark:group-hover:text-gray-300 transition-colors">
          {expanded ? <ChevronUp className="h-4 w-4" /> : <ChevronDown className="h-4 w-4" />}
        </div>
      </div>

      {/* ---- Expanded Details ---- */}
      {expanded && (
        <div className="mt-3 pt-3 border-t border-gray-200/60 dark:border-gray-700/60 space-y-2">
          {/* Code */}
          <div className="flex items-center gap-2 text-xs">
            <span className="text-gray-500 dark:text-gray-400 font-medium">Code:</span>
            <code className="px-1.5 py-0.5 rounded bg-white dark:bg-gray-800 border border-gray-200 dark:border-gray-700 text-gray-700 dark:text-gray-300 font-mono text-xs">
              {procedure.code}
            </code>
          </div>

          {/* Clinical Rationale */}
          {procedure.clinicalRationale && (
            <div className="text-xs">
              <span className="text-gray-500 dark:text-gray-400 font-medium">Clinical Rationale: </span>
              <span className="text-gray-700 dark:text-gray-300">{procedure.clinicalRationale}</span>
            </div>
          )}

          {/* Source */}
          <div className="flex items-center gap-2 text-xs">
            <span className="text-gray-500 dark:text-gray-400 font-medium">Source:</span>
            <span className="text-gray-600 dark:text-gray-400 capitalize">
              {procedure.source === 'umls_api' ? 'UMLS API' :
               procedure.source === 'clinicaltables' ? 'ClinicalTables (NLM)' :
               procedure.source === 'ai_generated' ? 'AI Generated' :
               'Curated (Clinical Guidelines)'}
            </span>
          </div>
        </div>
      )}
    </div>
  );
});

export default ProcedureCard;

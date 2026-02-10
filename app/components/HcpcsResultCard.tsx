'use client';

import { useState } from 'react';
import { ChevronDown, ChevronUp, Tag, Calendar, Activity, Info, Shield } from 'lucide-react';
import { HCPCSResult } from '../types/icd';
import { getMedicareCoverage } from '../lib/hcpcsLocalData';

// ============================================================
// Props
// ============================================================

interface HcpcsResultCardProps {
  /** The full HCPCS result object from searchHcpcsDetailed() */
  result: HCPCSResult;
  /** Optional: position in search results (1-based) */
  rank?: number;
}

// ============================================================
// Component
// ============================================================

export default function HcpcsResultCard({ result, rank }: HcpcsResultCardProps) {
  const [detailsExpanded, setDetailsExpanded] = useState(false);

  const {
    code,
    shortDescription,
    longDescription,
    category,
    addDate,
    termDate,
    isActive,
    typeOfService,
    coverageCode,
    coverageDescription,
    pricingIndicator,
    pricingDescription,
  } = result;

  // Format dates for display (from "YYYYMMDD" or "YYYY-MM-DD" to readable)
  const formatDate = (dateStr: string | null): string => {
    if (!dateStr) return '—';
    try {
      // Handle both YYYYMMDD and YYYY-MM-DD formats
      const cleaned = dateStr.replace(/\D/g, '');
      if (cleaned.length === 8) {
        const year = cleaned.slice(0, 4);
        const month = cleaned.slice(4, 6);
        const day = cleaned.slice(6, 8);
        return `${month}/${day}/${year}`;
      }
      return dateStr;
    } catch {
      return dateStr;
    }
  };

  return (
    <div
      className="
        group
        relative
        bg-white
        dark:bg-gray-800
        rounded-2xl
        border
        border-gray-200/60
        dark:border-gray-700/50
        shadow-sm
        hover:shadow-xl
        hover:shadow-emerald-600/10
        dark:hover:shadow-emerald-500/5
        hover:border-emerald-600/40
        dark:hover:border-emerald-500/50
        hover:-translate-y-1
        transition-[transform,box-shadow,border-color]
        duration-300
        ease-out
        overflow-visible
        will-change-transform
      "
    >
      {/* ── Header ── */}
      <div className="p-5">
        <div className="flex items-start justify-between gap-4">
          {/* Left: Code Badge + Description */}
          <div className="flex-1 min-w-0">
            {/* Code Badge + Category Tag */}
            <div className="flex items-center gap-2 mb-3 flex-wrap">
              {/* HCPCS Code Badge */}
              <div
                className="
                  inline-flex items-center px-3 py-1.5 rounded-lg
                  bg-gradient-to-r from-emerald-600/15 to-teal-700/10
                  border border-emerald-600/20
                  shadow-sm shadow-emerald-600/10
                "
              >
                <span
                  style={{ fontFamily: 'var(--font-mono)' }}
                  className="
                    text-emerald-700 dark:text-emerald-400
                    font-bold text-sm tracking-wider
                  "
                >
                  {code}
                </span>
              </div>

              {/* Category Tag */}
              <div
                className="
                  inline-flex items-center gap-1 px-2.5 py-1 rounded-md
                  bg-gray-100 dark:bg-gray-700
                  text-xs font-medium text-gray-600 dark:text-gray-300
                "
              >
                <Tag className="w-3 h-3" />
                {category.name}
              </div>

              {/* Active/Inactive Status */}
              <div
                className={`
                  inline-flex items-center gap-1 px-2 py-1 rounded-md text-xs font-medium
                  ${isActive
                    ? 'bg-green-50 text-green-700 dark:bg-green-900/20 dark:text-green-400'
                    : 'bg-red-50 text-red-700 dark:bg-red-900/20 dark:text-red-400'
                  }
                `}
              >
                <Activity className="w-3 h-3" />
                {isActive ? 'Active' : 'Terminated'}
              </div>

              {/* HCPCS Label */}
              <span className="text-xs text-gray-400 dark:text-gray-500">HCPCS Level II</span>
            </div>

            {/* Short Description */}
            <h3
              className="
                text-base font-semibold leading-snug
                text-gray-800 dark:text-gray-200
                group-hover:text-emerald-700 dark:group-hover:text-emerald-400
                transition-colors duration-200
              "
            >
              {shortDescription || 'No description available'}
            </h3>

            {/* Long Description (if different from short) */}
            {longDescription && longDescription !== shortDescription && (
              <p className="mt-1.5 text-sm text-gray-500 dark:text-gray-400 line-clamp-2">
                {longDescription}
              </p>
            )}
          </div>

          {/* Right: Rank badge (if provided) */}
          {rank && rank <= 5 && (
            <div className="flex-shrink-0">
              <div
                className="
                  flex items-center gap-1 px-2.5 py-1 rounded-full
                  bg-gradient-to-r from-emerald-50 to-teal-50
                  dark:from-emerald-900/20 dark:to-teal-900/20
                  border border-emerald-200/50 dark:border-emerald-700/30
                "
              >
                <span className="text-xs font-semibold text-emerald-700 dark:text-emerald-400">
                  #{rank}
                </span>
              </div>
            </div>
          )}
        </div>
      </div>

      {/* ── Action Buttons ── */}
      <div className="px-5 pb-4 flex flex-wrap items-center gap-2 border-t border-gray-50 dark:border-gray-700/30 pt-3">
        {/* Details Toggle */}
        <button
          onClick={() => setDetailsExpanded(prev => !prev)}
          className={`
            inline-flex items-center gap-1.5 px-4 py-2 rounded-xl
            text-sm font-medium transition-all duration-200 border
            ${detailsExpanded
              ? 'bg-emerald-500 text-white border-emerald-500 shadow-md shadow-emerald-500/20'
              : 'bg-emerald-50 text-emerald-700 border-emerald-200 hover:bg-emerald-100 dark:bg-emerald-900/20 dark:text-emerald-400 dark:border-emerald-700/30'
            }
          `}
        >
          <Info className="w-4 h-4" />
          {detailsExpanded ? 'Hide Details' : 'View Details'}
          {detailsExpanded ? <ChevronUp className="w-4 h-4" /> : <ChevronDown className="w-4 h-4" />}
        </button>

        {/* Medicare Coverage Badge */}
        {(() => {
          const covInfo = getMedicareCoverage(result.coverageCode);
          if (!covInfo) return null;

          const colorMap: Record<string, string> = {
            amber: 'bg-amber-50 text-amber-700 border-amber-200 dark:bg-amber-900/20 dark:text-amber-400 dark:border-amber-800/30',
            blue: 'bg-blue-50 text-blue-700 border-blue-200 dark:bg-blue-900/20 dark:text-blue-400 dark:border-blue-800/30',
            red: 'bg-red-50 text-red-700 border-red-200 dark:bg-red-900/20 dark:text-red-400 dark:border-red-800/30',
          };

          const groupBadge: Record<string, { label: string; style: string }> = {
            'payable': { label: 'Payable', style: 'bg-green-100 text-green-700 dark:bg-green-900/30 dark:text-green-400' },
            'conditional': { label: 'Conditional', style: 'bg-amber-100 text-amber-700 dark:bg-amber-900/30 dark:text-amber-400' },
            'not-payable': { label: 'Not Payable', style: 'bg-red-100 text-red-700 dark:bg-red-900/30 dark:text-red-400' },
          };

          const badge = groupBadge[covInfo.group];
          const colors = colorMap[covInfo.color] || colorMap.amber;

          return (
            <div className={`w-full px-3 py-2.5 rounded-lg text-xs border ${colors}`}>
              <div className="flex items-center justify-between mb-1">
                <div className="flex items-center gap-1.5">
                  <Shield className="w-3.5 h-3.5" />
                  <span className="font-semibold">Medicare: {covInfo.label}</span>
                </div>
                <span className={`px-1.5 py-0.5 rounded-full text-[10px] font-medium ${badge.style}`}>
                  {badge.label}
                </span>
              </div>
              <p className="text-[11px] opacity-80 leading-snug">{covInfo.description}</p>
            </div>
          );
        })()}
      </div>

      {/* ── Expandable Details Section ── */}
      {detailsExpanded && (
        <div className="px-5 pb-5 border-t border-emerald-100 dark:border-emerald-800/30">
          <div className="mt-4 rounded-xl bg-emerald-50/30 dark:bg-emerald-900/10 border border-emerald-100 dark:border-emerald-800/20 overflow-hidden">
            <table className="w-full text-sm">
              <tbody className="divide-y divide-emerald-100 dark:divide-emerald-800/20">
                <tr>
                  <td className="px-4 py-2.5 font-medium text-gray-500 dark:text-gray-400 w-40">Category</td>
                  <td className="px-4 py-2.5 text-gray-800 dark:text-gray-200">
                    {category.prefix}-codes: {category.description}
                  </td>
                </tr>
                {addDate && (
                  <tr>
                    <td className="px-4 py-2.5 font-medium text-gray-500 dark:text-gray-400">
                      <span className="flex items-center gap-1.5"><Calendar className="w-3.5 h-3.5" /> Added</span>
                    </td>
                    <td className="px-4 py-2.5 text-gray-800 dark:text-gray-200">{formatDate(addDate)}</td>
                  </tr>
                )}
                {termDate && (
                  <tr>
                    <td className="px-4 py-2.5 font-medium text-gray-500 dark:text-gray-400">
                      <span className="flex items-center gap-1.5"><Calendar className="w-3.5 h-3.5" /> Terminated</span>
                    </td>
                    <td className="px-4 py-2.5 text-red-600 dark:text-red-400">{formatDate(termDate)}</td>
                  </tr>
                )}
                {typeOfService && (
                  <tr>
                    <td className="px-4 py-2.5 font-medium text-gray-500 dark:text-gray-400">Type of Service</td>
                    <td className="px-4 py-2.5 text-gray-800 dark:text-gray-200">{typeOfService}</td>
                  </tr>
                )}
                {coverageCode && (
                  <tr>
                    <td className="px-4 py-2.5 font-medium text-gray-500 dark:text-gray-400">Coverage Code</td>
                    <td className="px-4 py-2.5 text-gray-800 dark:text-gray-200">
                      <span className="font-mono font-bold text-amber-600">{coverageCode}</span>
                      {coverageDescription && (
                        <span className="text-gray-500 ml-2">— {coverageDescription}</span>
                      )}
                    </td>
                  </tr>
                )}
                {pricingIndicator && (
                  <tr>
                    <td className="px-4 py-2.5 font-medium text-gray-500 dark:text-gray-400">Pricing Indicator</td>
                    <td className="px-4 py-2.5 text-gray-800 dark:text-gray-200">
                      <span className="font-mono font-bold">{pricingIndicator}</span>
                      {pricingDescription && (
                        <span className="text-gray-500 ml-2">— {pricingDescription}</span>
                      )}
                    </td>
                  </tr>
                )}
              </tbody>
            </table>
          </div>
        </div>
      )}

      {/* ── Bottom Accent Line (hover) ── */}
      <div
        className="
          absolute bottom-0 left-0 right-0 h-0.5
          bg-gradient-to-r from-transparent via-emerald-600 to-transparent
          opacity-0 group-hover:opacity-100
          scale-x-0 group-hover:scale-x-100
          transition-all duration-500
          rounded-b-2xl
        "
      />
    </div>
  );
}

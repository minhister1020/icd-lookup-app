/**
 * TrialCard Component
 * ===================
 * 
 * Displays clinical trial information from ClinicalTrials.gov.
 * Uses a PURPLE color theme to distinguish from ICD (green) and drugs (blue).
 * 
 * COLOR SCHEME:
 * - ICD-10 Codes: Blue (#1976D2)
 * - Drugs: Blue (#3B82F6)
 * - Clinical Trials: Purple (#9333EA)
 * 
 * DISPLAYS:
 * - NCT ID (clickable link to ClinicalTrials.gov)
 * - Trial title
 * - Recruitment status with color badge
 * - Brief summary
 * - Sponsor organization
 * - Locations (expandable)
 */

'use client';

import { useState, memo } from 'react';
import { 
  FlaskConical, 
  Building2, 
  MapPin, 
  ChevronDown, 
  ChevronUp, 
  ExternalLink,
  Calendar,
  Users
} from 'lucide-react';
import { ClinicalTrialResult, getTrialStatusColor } from '../types/icd';
import { getTrialUrl } from '../lib/clinicalTrialsApi';

// =============================================================================
// Props Interface
// =============================================================================

interface TrialCardProps {
  /** The clinical trial data to display */
  trial: ClinicalTrialResult;
}

// =============================================================================
// Component
// =============================================================================

const TrialCard = memo(function TrialCard({ trial }: TrialCardProps) {
  // Track whether details are expanded
  const [isExpanded, setIsExpanded] = useState(false);
  
  const statusColors = getTrialStatusColor(trial.status);
  const trialUrl = getTrialUrl(trial.nctId);
  
  // Format status for display
  const statusDisplay = trial.status.replace(/_/g, ' ');
  
  return (
    <div 
      className="
        group
        p-4
        bg-white
        dark:bg-gray-800
        rounded-xl
        border
        border-purple-100
        dark:border-purple-900/50
        shadow-sm
        hover:shadow-md
        hover:shadow-purple-100/50
        dark:hover:shadow-none
        hover:border-purple-200
        dark:hover:border-purple-700
        transition-all
        duration-200
      "
    >
      {/* Header: NCT ID + Status Badge */}
      <div className="flex items-start justify-between gap-3 mb-2">
        {/* Left: Icon + NCT ID */}
        <div className="flex items-center gap-2">
          <div 
            className="
              flex-shrink-0
              w-8
              h-8
              rounded-lg
              bg-purple-500/10
              dark:bg-purple-500/20
              flex
              items-center
              justify-center
            "
          >
            <FlaskConical className="w-4 h-4 text-purple-500" />
          </div>
          
          {/* NCT ID - Clickable Link */}
          <a
            href={trialUrl}
            target="_blank"
            rel="noopener noreferrer"
            className="
              flex
              items-center
              gap-1
              font-mono
              text-sm
              font-bold
              text-purple-600
              dark:text-purple-400
              hover:text-purple-700
              dark:hover:text-purple-300
              hover:underline
              transition-colors
            "
            title="View on ClinicalTrials.gov"
          >
            {trial.nctId}
            <ExternalLink className="w-3 h-3" />
          </a>
        </div>
        
        {/* Right: Status Badge */}
        <span 
          className={`
            px-2
            py-0.5
            rounded-full
            text-[10px]
            font-bold
            uppercase
            tracking-wide
            ${statusColors.bg}
            ${statusColors.text}
          `}
        >
          {statusDisplay}
        </span>
      </div>
      
      {/* Title */}
      <h4 
        className="
          font-medium
          text-gray-800
          dark:text-gray-200
          text-sm
          leading-snug
          mb-2
          group-hover:text-purple-600
          dark:group-hover:text-purple-400
          transition-colors
          line-clamp-2
        "
      >
        {trial.title}
      </h4>
      
      {/* Sponsor */}
      <div className="flex items-center gap-1.5 mb-2">
        <Building2 className="w-3 h-3 text-gray-400 flex-shrink-0" />
        <span className="text-xs text-gray-500 dark:text-gray-400 truncate">
          {trial.sponsor}
        </span>
      </div>
      
      {/* Start Date (if available) */}
      {trial.startDate && (
        <div className="flex items-center gap-1.5 mb-2">
          <Calendar className="w-3 h-3 text-gray-400 flex-shrink-0" />
          <span className="text-xs text-gray-500 dark:text-gray-400">
            Started: {trial.startDate}
          </span>
        </div>
      )}
      
      {/* Location Count */}
      {trial.locations && trial.locations.length > 0 && (
        <div className="flex items-center gap-1.5 mb-3">
          <MapPin className="w-3 h-3 text-gray-400 flex-shrink-0" />
          <span className="text-xs text-gray-500 dark:text-gray-400">
            {trial.locations.length} location{trial.locations.length !== 1 ? 's' : ''}
          </span>
        </div>
      )}
      
      {/* Summary */}
      <div className="mb-2">
        <p 
          className={`
            text-xs
            text-gray-600
            dark:text-gray-400
            leading-relaxed
            ${isExpanded ? '' : 'line-clamp-2'}
          `}
        >
          {trial.summary}
        </p>
      </div>
      
      {/* Expand/Collapse Button */}
      <button
        type="button"
        onClick={() => setIsExpanded(!isExpanded)}
        className="
          flex
          items-center
          gap-1
          mt-1
          text-xs
          text-purple-500
          hover:text-purple-600
          dark:hover:text-purple-400
          font-medium
          transition-colors
        "
      >
        {isExpanded ? (
          <>
            <ChevronUp className="w-3 h-3" />
            Show less
          </>
        ) : (
          <>
            <ChevronDown className="w-3 h-3" />
            Show more
          </>
        )}
      </button>
      
      {/* Expanded Details */}
      {isExpanded && (
        <div 
          className="
            mt-3
            pt-3
            border-t
            border-gray-100
            dark:border-gray-700
            space-y-3
          "
        >
          {/* Eligibility */}
          {trial.eligibility && (
            <div>
              <div className="flex items-center gap-1.5 mb-1">
                <Users className="w-3 h-3 text-purple-500" />
                <span className="text-xs font-medium text-gray-600 dark:text-gray-300">
                  Eligibility
                </span>
              </div>
              <p className="text-xs text-gray-500 dark:text-gray-400 leading-relaxed">
                {trial.eligibility}
              </p>
            </div>
          )}
          
          {/* Locations */}
          {trial.locations && trial.locations.length > 0 && (
            <div>
              <div className="flex items-center gap-1.5 mb-1">
                <MapPin className="w-3 h-3 text-purple-500" />
                <span className="text-xs font-medium text-gray-600 dark:text-gray-300">
                  Locations
                </span>
              </div>
              <ul className="space-y-1">
                {trial.locations.map((loc) => (
                  <li
                    key={`${loc.facility}-${loc.city}-${loc.state}`}
                    className="text-xs text-gray-500 dark:text-gray-400"
                  >
                    <span className="font-medium">{loc.facility}</span>
                    {(loc.city || loc.state) && (
                      <span> — {[loc.city, loc.state].filter(Boolean).join(', ')}</span>
                    )}
                    {loc.country && loc.country !== 'United States' && (
                      <span>, {loc.country}</span>
                    )}
                  </li>
                ))}
              </ul>
            </div>
          )}
          
          {/* View Full Trial Link */}
          <a
            href={trialUrl}
            target="_blank"
            rel="noopener noreferrer"
            className="
              inline-flex
              items-center
              gap-1.5
              px-3
              py-1.5
              rounded-lg
              bg-purple-50
              dark:bg-purple-900/30
              text-purple-600
              dark:text-purple-400
              text-xs
              font-medium
              hover:bg-purple-100
              dark:hover:bg-purple-900/50
              transition-colors
            "
          >
            <ExternalLink className="w-3 h-3" />
            View Full Trial on ClinicalTrials.gov
          </a>
        </div>
      )}
    </div>
  );
});

export default TrialCard;

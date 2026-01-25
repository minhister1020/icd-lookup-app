/**
 * ResultCard Component
 * ====================
 * 
 * A professional, polished card component for displaying ICD-10 results.
 * 
 * DESIGN FEATURES:
 * - Soft shadows with hover elevation
 * - Smooth micro-interactions (scale, translate)
 * - ICD code badge with branded colors
 * - Chevron icon that appears on hover
 * - Clean typography and spacing
 */

import { ChevronRight } from 'lucide-react';

// =============================================================================
// Props Interface
// =============================================================================

interface ResultCardProps {
  /** The ICD-10 code (e.g., "E11.9") */
  code: string;
  
  /** The condition name (e.g., "Type 2 diabetes mellitus without complications") */
  name: string;
}

// =============================================================================
// Component
// =============================================================================

export default function ResultCard({ code, name }: ResultCardProps) {
  return (
    <div 
      className="
        group
        relative
        p-5
        bg-white
        dark:bg-gray-800
        rounded-2xl
        border
        border-gray-100
        dark:border-gray-700
        shadow-sm
        hover:shadow-xl
        hover:shadow-gray-200/50
        dark:hover:shadow-none
        hover:border-[#00D084]/30
        dark:hover:border-[#00D084]/40
        hover:-translate-y-1
        active:scale-[0.98]
        transition-all
        duration-300
        ease-out
        cursor-pointer
      "
    >
      {/* Card Content */}
      <div className="flex items-start justify-between gap-4">
        {/* Left Side: Code Badge + Name */}
        <div className="flex-1 min-w-0">
          {/* ICD-10 Code Badge */}
          <div 
            className="
              inline-flex
              items-center
              px-3
              py-1.5
              rounded-lg
              bg-[#00D084]/10
              dark:bg-[#00D084]/20
              mb-3
            "
          >
            <span 
              className="
                text-[#00A66C]
                dark:text-[#00D084]
                font-bold
                text-sm
                font-mono
                tracking-wide
              "
            >
              {code}
            </span>
          </div>
          
          {/* Condition Name */}
          <h3 
            className="
              text-gray-800
              dark:text-gray-200
              font-medium
              text-base
              leading-snug
              group-hover:text-[#00A66C]
              dark:group-hover:text-[#00D084]
              transition-colors
              duration-200
            "
          >
            {name}
          </h3>
        </div>
        
        {/* Right Side: Chevron Icon (appears on hover) */}
        <div 
          className="
            flex-shrink-0
            w-8
            h-8
            rounded-full
            bg-gray-100
            dark:bg-gray-700
            flex
            items-center
            justify-center
            opacity-0
            group-hover:opacity-100
            translate-x-2
            group-hover:translate-x-0
            transition-all
            duration-300
          "
        >
          <ChevronRight 
            className="
              w-4
              h-4
              text-[#00D084]
            " 
          />
        </div>
      </div>
      
      {/* Subtle Bottom Accent Line (appears on hover) */}
      <div 
        className="
          absolute
          bottom-0
          left-4
          right-4
          h-0.5
          bg-gradient-to-r
          from-[#00D084]
          to-[#00A66C]
          rounded-full
          opacity-0
          group-hover:opacity-100
          transition-opacity
          duration-300
        "
      />
    </div>
  );
}

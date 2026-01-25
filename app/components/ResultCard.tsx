/**
 * ResultCard Component
 * ====================
 * 
 * Displays a single ICD-10 code result as a styled card.
 * This is the smallest "building block" of our search results.
 * 
 * Think of it like a business card for each medical condition:
 * - Shows the ICD-10 code prominently (like a name)
 * - Shows the condition description below (like a job title)
 * 
 * REACT CONCEPTS USED:
 * - Props: Data passed from parent component
 * - TypeScript interface: Defines what props this component expects
 */

// =============================================================================
// Props Interface
// =============================================================================

/**
 * Defines the props (properties) that ResultCard expects to receive.
 * 
 * When you use <ResultCard code="E11.9" name="Type 2 diabetes" />,
 * these values become available inside the component.
 */
interface ResultCardProps {
  /** The ICD-10 code (e.g., "E11.9") */
  code: string;
  
  /** The condition name (e.g., "Type 2 diabetes mellitus without complications") */
  name: string;
}

// =============================================================================
// Component
// =============================================================================

/**
 * ResultCard - Displays a single ICD-10 result
 * 
 * @param props - The component props (code and name)
 * @returns A styled card showing the ICD-10 code and condition name
 * 
 * @example
 * <ResultCard 
 *   code="E11.9" 
 *   name="Type 2 diabetes mellitus without complications" 
 * />
 */
export default function ResultCard({ code, name }: ResultCardProps) {
  // The { code, name } syntax is called "destructuring"
  // It extracts code and name from the props object
  
  return (
    <div 
      className="
        /* Layout & Spacing */
        p-4                    /* padding: 1rem (16px) on all sides */
        
        /* Border & Shape */
        border                 /* adds a border */
        border-gray-200        /* light gray border color */
        rounded-lg             /* rounded corners (large) */
        
        /* Background */
        bg-white               /* white background */
        dark:bg-gray-800       /* dark gray in dark mode */
        dark:border-gray-700   /* darker border in dark mode */
        
        /* Hover Effects */
        hover:border-hv-primary    /* green border on hover */
        hover:shadow-md            /* subtle shadow on hover */
        
        /* Animation */
        transition-all             /* smooth transition for all changes */
        duration-200               /* transition takes 200ms */
        
        /* Cursor */
        cursor-pointer             /* shows pointer cursor on hover */
      "
    >
      {/* ICD-10 Code - displayed prominently */}
      <div 
        className="
          text-hv-primary        /* HealthVerity green color */
          font-bold              /* bold text */
          text-lg                /* large text size */
          font-mono              /* monospace font (good for codes) */
        "
      >
        {code}
      </div>
      
      {/* Condition Name - displayed below the code */}
      <div 
        className="
          text-gray-700          /* dark gray text */
          dark:text-gray-300     /* lighter in dark mode */
          mt-1                   /* margin-top: 0.25rem (4px) */
          text-sm                /* small text size */
          leading-relaxed        /* comfortable line height */
        "
      >
        {name}
      </div>
    </div>
  );
}

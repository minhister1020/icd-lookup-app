/**
 * DrugNode Component - Mind Map Drug Bubble
 * ==========================================
 * 
 * Blue pill-shaped node for displaying drugs in the mind map.
 * Matches the futuristic holographic style of IcdNode.
 * 
 * COLOR: Blue (#3B82F6) - matches DrugCard theme
 */

'use client';

import { memo } from 'react';
import { Handle, Position, NodeProps } from '@xyflow/react';
import { Pill } from 'lucide-react';

// =============================================================================
// Types
// =============================================================================

import { HighlightState } from '../types/icd';

export interface DrugNodeData {
  brandName: string;
  genericName: string;
  sourceIcdCode: string;
  /** Phase 7B: Highlight state for hover interactions */
  highlightState?: HighlightState;
}

// =============================================================================
// Colors
// =============================================================================

const colors = {
  from: '#3B82F6',
  to: '#60A5FA', 
  glow: 'rgba(59, 130, 246, 0.5)',
};

// =============================================================================
// Component
// =============================================================================

function DrugNode({ data, selected }: NodeProps<DrugNodeData>) {
  // Phase 7B/7C: Compute highlight CSS classes
  const highlightClass = {
    'normal': '',
    'highlighted': 'scale-105 z-10',
    'dimmed': 'opacity-30',
    'focused': 'scale-105 z-10 ring-2 ring-white/60 ring-offset-2 ring-offset-transparent',
    'focus-dimmed': 'opacity-[0.15]',
  }[data.highlightState ?? 'normal'];
  
  return (
    <div 
      className={`
        group
        relative
        animate-in
        fade-in
        zoom-in-50
        duration-500
        
        /* Phase 7B: Hover highlighting */
        transition-all
        duration-200
        ${highlightClass}
      `}
      title={`${data.brandName}\n${data.genericName}`}
    >
      {/* Glow Effect Behind */}
      <div 
        className={`
          absolute
          inset-0
          rounded-full
          blur-xl
          transition-all
          duration-300
          ${selected ? 'opacity-80 scale-125' : 'opacity-0 group-hover:opacity-60'}
        `}
        style={{ backgroundColor: colors.glow }}
      />
      
      {/* Main Bubble */}
      <div 
        className={`
          relative
          flex
          items-center
          gap-2
          px-4
          py-2
          rounded-full
          backdrop-blur-md
          border
          max-w-[150px]
          ${selected 
            ? 'border-white/50 scale-110' 
            : 'border-white/20 group-hover:border-white/40'
          }
          group-hover:scale-105
          transition-all
          duration-300
          ease-out
          cursor-grab
          active:cursor-grabbing
        `}
        style={{
          background: `linear-gradient(135deg, ${colors.from}CC, ${colors.to}AA)`,
          boxShadow: selected 
            ? `0 0 30px ${colors.glow}, 0 0 60px ${colors.glow}`
            : `0 4px 20px ${colors.glow}`,
        }}
      >
        {/* Pill Icon */}
        <Pill className="w-3 h-3 text-white/80 flex-shrink-0" />
        
        {/* Brand Name */}
        <span 
          className="
            text-white
            font-semibold
            text-xs
            drop-shadow-lg
            truncate
          "
        >
          {data.brandName}
        </span>
        
        {/* Pulse Ring */}
        <div 
          className={`
            absolute
            inset-0
            rounded-full
            border-2
            border-white/30
            ${selected ? 'animate-ping' : 'opacity-0 group-hover:opacity-100 group-hover:animate-pulse'}
          `}
        />
      </div>
      
      {/* Tooltip on Hover */}
      <div 
        className="
          absolute
          left-1/2
          -translate-x-1/2
          top-full
          mt-2
          px-3
          py-2
          rounded-lg
          bg-gray-900/95
          backdrop-blur-sm
          text-white
          text-xs
          max-w-[180px]
          text-center
          leading-tight
          opacity-0
          group-hover:opacity-100
          transition-opacity
          duration-200
          pointer-events-none
          z-50
          shadow-xl
          whitespace-normal
        "
      >
        <p className="font-semibold">{data.brandName}</p>
        <p className="text-gray-400 text-[10px] mt-0.5">{data.genericName}</p>
      </div>
      
      {/* Handles */}
      <Handle
        type="target"
        position={Position.Top}
        className="!w-3 !h-3 !bg-transparent !border-0"
      />
      <Handle
        type="source"
        position={Position.Bottom}
        className="!w-3 !h-3 !bg-transparent !border-0"
      />
      <Handle
        type="target"
        position={Position.Left}
        id="left"
        className="!w-3 !h-3 !bg-transparent !border-0"
      />
      <Handle
        type="source"
        position={Position.Right}
        id="right"
        className="!w-3 !h-3 !bg-transparent !border-0"
      />
    </div>
  );
}

export default memo(DrugNode);

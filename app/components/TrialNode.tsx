/**
 * TrialNode Component - Mind Map Trial Bubble
 * ============================================
 * 
 * Purple pill-shaped node for displaying clinical trials in the mind map.
 * Matches the futuristic holographic style of IcdNode.
 * 
 * COLOR: Purple (#9333EA) - matches TrialCard theme
 */

'use client';

import { memo } from 'react';
import { Handle, Position, NodeProps } from '@xyflow/react';
import { FlaskConical } from 'lucide-react';
import { TrialStatus } from '../types/icd';

// =============================================================================
// Types
// =============================================================================

import { HighlightState } from '../types/icd';

export interface TrialNodeData {
  nctId: string;
  title: string;
  status: TrialStatus;
  sourceIcdCode: string;
  /** Phase 7B: Highlight state for hover interactions */
  highlightState?: HighlightState;
}

// =============================================================================
// Colors
// =============================================================================

const colors = {
  from: '#9333EA',
  to: '#A855F7',
  glow: 'rgba(147, 51, 234, 0.5)',
};

const statusColors: Record<TrialStatus, string> = {
  RECRUITING: '#22C55E',
  ACTIVE_NOT_RECRUITING: '#3B82F6',
  COMPLETED: '#6B7280',
  TERMINATED: '#EF4444',
  OTHER: '#6B7280',
};

// =============================================================================
// Component
// =============================================================================

function TrialNode({ data, selected }: NodeProps<TrialNodeData>) {
  const statusColor = statusColors[data.status] || statusColors.OTHER;
  
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
      title={`${data.nctId}: ${data.title}`}
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
        {/* Flask Icon */}
        <FlaskConical className="w-3 h-3 text-white/80 flex-shrink-0" />
        
        {/* NCT ID */}
        <span 
          className="
            text-white
            font-mono
            font-bold
            text-[10px]
            drop-shadow-lg
            truncate
          "
        >
          {data.nctId}
        </span>
        
        {/* Status Dot */}
        <div 
          className="w-2 h-2 rounded-full flex-shrink-0"
          style={{ backgroundColor: statusColor }}
          title={data.status.replace(/_/g, ' ')}
        />
        
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
          max-w-[200px]
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
        <p className="font-mono text-[10px] text-purple-300">{data.nctId}</p>
        <p className="font-medium mt-0.5 line-clamp-2">{data.title}</p>
        <p 
          className="text-[10px] mt-1 px-1.5 py-0.5 rounded-full inline-block"
          style={{ backgroundColor: `${statusColor}30`, color: statusColor }}
        >
          {data.status.replace(/_/g, ' ')}
        </p>
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

export default memo(TrialNode);

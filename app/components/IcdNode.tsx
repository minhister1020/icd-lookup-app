/**
 * IcdNode Component - Futuristic Bubble Design
 * =============================================
 * 
 * Holographic-style mind map node with:
 * - Pill/bubble shape
 * - Glass morphism effect
 * - Category-based gradient colors
 * - Code-only display (name in tooltip)
 * - Pulse animation on hover
 */

'use client';

import { memo } from 'react';
import { Handle, Position, NodeProps } from '@xyflow/react';
import { IcdNodeData } from '../types/icd';

// =============================================================================
// Color Palette - Category-based gradients
// =============================================================================

const categoryColors: Record<string, { from: string; to: string; glow: string }> = {
  'A': { from: '#FF6B6B', to: '#FF8E8E', glow: 'rgba(255, 107, 107, 0.4)' },
  'B': { from: '#FF9F43', to: '#FFBE76', glow: 'rgba(255, 159, 67, 0.4)' },
  'C': { from: '#FF6B9D', to: '#FF8FB1', glow: 'rgba(255, 107, 157, 0.4)' },
  'D': { from: '#A55EEA', to: '#B983FF', glow: 'rgba(165, 94, 234, 0.4)' },
  'E': { from: '#00D084', to: '#00E89E', glow: 'rgba(0, 208, 132, 0.5)' },  // HealthVerity green
  'F': { from: '#45AAF2', to: '#70C4FF', glow: 'rgba(69, 170, 242, 0.4)' },
  'G': { from: '#26DE81', to: '#4CD964', glow: 'rgba(38, 222, 129, 0.4)' },
  'H': { from: '#FD79A8', to: '#FDAAAA', glow: 'rgba(253, 121, 168, 0.4)' },
  'I': { from: '#E056FD', to: '#E88AFF', glow: 'rgba(224, 86, 253, 0.4)' },
  'J': { from: '#00D084', to: '#00A66C', glow: 'rgba(0, 208, 132, 0.5)' },  // Green
  'K': { from: '#F7B731', to: '#FFD166', glow: 'rgba(247, 183, 49, 0.4)' },
  'L': { from: '#20BF6B', to: '#5DD695', glow: 'rgba(32, 191, 107, 0.4)' },
  'M': { from: '#2D98DA', to: '#5DB8FF', glow: 'rgba(45, 152, 218, 0.4)' },
  'N': { from: '#EB3B5A', to: '#FF6680', glow: 'rgba(235, 59, 90, 0.4)' },
  'O': { from: '#8854D0', to: '#A77BFF', glow: 'rgba(136, 84, 208, 0.4)' },
  'P': { from: '#3867D6', to: '#5E8AFF', glow: 'rgba(56, 103, 214, 0.4)' },
  'Q': { from: '#FA8231', to: '#FFB266', glow: 'rgba(250, 130, 49, 0.4)' },
  'R': { from: '#4B7BEC', to: '#7B9FFF', glow: 'rgba(75, 123, 236, 0.4)' },
  'S': { from: '#FC5C65', to: '#FF8288', glow: 'rgba(252, 92, 101, 0.4)' },
  'T': { from: '#0FB9B1', to: '#3DD1C9', glow: 'rgba(15, 185, 177, 0.4)' },
  'U': { from: '#778CA3', to: '#9FAFC1', glow: 'rgba(119, 140, 163, 0.4)' },
  'V': { from: '#F19066', to: '#FFB088', glow: 'rgba(241, 144, 102, 0.4)' },
  'W': { from: '#786FA6', to: '#9B8FC2', glow: 'rgba(120, 111, 166, 0.4)' },
  'X': { from: '#63CDDA', to: '#8DE4EE', glow: 'rgba(99, 205, 218, 0.4)' },
  'Y': { from: '#CF6A87', to: '#E88DA5', glow: 'rgba(207, 106, 135, 0.4)' },
  'Z': { from: '#574B90', to: '#786FA6', glow: 'rgba(87, 75, 144, 0.4)' },
};

const defaultColors = { from: '#00D084', to: '#00A66C', glow: 'rgba(0, 208, 132, 0.5)' };

function getColors(category: string | undefined) {
  const letter = category?.[0]?.toUpperCase() || 'E';
  return categoryColors[letter] || defaultColors;
}

// =============================================================================
// Component
// =============================================================================

function IcdNode({ data, selected }: NodeProps<IcdNodeData>) {
  const colors = getColors(data.category);
  
  return (
    <div 
      className={`
        group
        relative
        
        /* Animation on mount */
        animate-in
        fade-in
        zoom-in-50
        duration-500
      `}
      title={`${data.code}: ${data.name}`}
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
          px-5
          py-3
          rounded-full
          
          /* Glass morphism */
          backdrop-blur-md
          border
          ${selected 
            ? 'border-white/50 scale-110' 
            : 'border-white/20 group-hover:border-white/40'
          }
          
          /* Hover Effects */
          group-hover:scale-105
          
          /* Animation */
          transition-all
          duration-300
          ease-out
          
          /* Cursor */
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
        {/* Code Text */}
        <span 
          className="
            text-white
            font-bold
            text-sm
            font-mono
            tracking-wider
            drop-shadow-lg
            whitespace-nowrap
          "
        >
          {data.code}
        </span>
        
        {/* Pulse Ring Animation */}
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
        {data.name}
      </div>
      
      {/* Handles - Invisible but functional */}
      <Handle
        type="target"
        position={Position.Top}
        className="!w-4 !h-4 !bg-transparent !border-0"
      />
      <Handle
        type="source"
        position={Position.Bottom}
        className="!w-4 !h-4 !bg-transparent !border-0"
      />
      <Handle
        type="target"
        position={Position.Left}
        id="left"
        className="!w-4 !h-4 !bg-transparent !border-0"
      />
      <Handle
        type="source"
        position={Position.Right}
        id="right"
        className="!w-4 !h-4 !bg-transparent !border-0"
      />
    </div>
  );
}

export default memo(IcdNode);

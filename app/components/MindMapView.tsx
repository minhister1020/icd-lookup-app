/**
 * MindMapView Component - Futuristic Holographic Design
 * ======================================================
 * 
 * Tony Stark-inspired medical visualization with:
 * - Radial gradient background with green glow
 * - Animated flowing edges between ALL nodes
 * - Category-clustered layout
 * - Organic, non-grid positioning
 * - Smooth entrance animations
 */

'use client';

import { useMemo, useCallback, useEffect, useState } from 'react';
import {
  ReactFlow,
  Node,
  Edge,
  Controls,
  MiniMap,
  useNodesState,
  useEdgesState,
  NodeTypes,
  ReactFlowProvider,
  Panel,
  useReactFlow,
  ConnectionLineType,
} from '@xyflow/react';

import '@xyflow/react/dist/style.css';

import { ICD10Result, IcdNodeData } from '../types/icd';
import IcdNode from './IcdNode';

// =============================================================================
// Configuration
// =============================================================================

const nodeTypes: NodeTypes = {
  icdNode: IcdNode,
};

const CENTER_X = 500;
const CENTER_Y = 350;
const CATEGORY_RADIUS = 280;
const NODE_RADIUS = 100;

// =============================================================================
// Helper Functions
// =============================================================================

function groupByCategory(results: ICD10Result[]): Map<string, ICD10Result[]> {
  const groups = new Map<string, ICD10Result[]>();
  results.forEach(result => {
    const category = result.code.split('.')[0];
    const existing = groups.get(category) || [];
    groups.set(category, [...existing, result]);
  });
  return groups;
}

/**
 * Creates a beautiful radial layout with edges connecting nodes
 */
function convertToNodesAndEdges(results: ICD10Result[]): {
  nodes: Node<IcdNodeData>[];
  edges: Edge[];
} {
  const groups = groupByCategory(results);
  const categories = Array.from(groups.keys());
  const nodes: Node<IcdNodeData>[] = [];
  const edges: Edge[] = [];
  const allNodeIds: string[] = [];
  
  // Position each category cluster
  categories.forEach((category, categoryIndex) => {
    const categoryResults = groups.get(category) || [];
    const categoryAngle = (2 * Math.PI * categoryIndex) / categories.length - Math.PI / 2;
    
    const clusterCenterX = CENTER_X + Math.cos(categoryAngle) * CATEGORY_RADIUS;
    const clusterCenterY = CENTER_Y + Math.sin(categoryAngle) * CATEGORY_RADIUS;
    
    categoryResults.forEach((result, nodeIndex) => {
      let x: number, y: number;
      
      if (categoryResults.length === 1) {
        x = clusterCenterX;
        y = clusterCenterY;
      } else {
        // Spiral-like arrangement within cluster
        const nodeAngle = (2 * Math.PI * nodeIndex) / categoryResults.length + categoryAngle;
        const radius = 50 + nodeIndex * 25;
        x = clusterCenterX + Math.cos(nodeAngle) * Math.min(radius, NODE_RADIUS);
        y = clusterCenterY + Math.sin(nodeAngle) * Math.min(radius, NODE_RADIUS);
      }
      
      nodes.push({
        id: result.code,
        type: 'icdNode',
        position: { x, y },
        data: {
          code: result.code,
          name: result.name,
          category,
        },
      });
      
      allNodeIds.push(result.code);
    });
  });
  
  // Create edges - connect nodes within same category
  categories.forEach((category) => {
    const categoryResults = groups.get(category) || [];
    
    // Connect consecutive nodes in category
    for (let i = 0; i < categoryResults.length - 1; i++) {
      edges.push({
        id: `e-${categoryResults[i].code}-${categoryResults[i + 1].code}`,
        source: categoryResults[i].code,
        target: categoryResults[i + 1].code,
        type: 'default',
        animated: true,
        style: { 
          stroke: '#00D084',
          strokeWidth: 2,
          opacity: 0.4,
        },
      });
    }
    
    // Connect first and last to make a loop
    if (categoryResults.length > 2) {
      edges.push({
        id: `e-loop-${category}`,
        source: categoryResults[categoryResults.length - 1].code,
        target: categoryResults[0].code,
        type: 'default',
        animated: true,
        style: { 
          stroke: '#00D084',
          strokeWidth: 1.5,
          opacity: 0.3,
        },
      });
    }
  });
  
  // Connect category clusters to each other (hub connections)
  if (categories.length > 1) {
    for (let i = 0; i < categories.length; i++) {
      const nextIndex = (i + 1) % categories.length;
      const currentCategory = groups.get(categories[i]) || [];
      const nextCategory = groups.get(categories[nextIndex]) || [];
      
      if (currentCategory.length > 0 && nextCategory.length > 0) {
        edges.push({
          id: `e-hub-${categories[i]}-${categories[nextIndex]}`,
          source: currentCategory[0].code,
          target: nextCategory[0].code,
          type: 'default',
          animated: true,
          style: { 
            stroke: '#00D084',
            strokeWidth: 2.5,
            opacity: 0.5,
            strokeDasharray: '5,5',
          },
        });
      }
    }
  }
  
  // Add some cross-connections for visual interest
  if (allNodeIds.length > 4) {
    for (let i = 0; i < Math.min(allNodeIds.length / 2, 5); i++) {
      const sourceIndex = i * 2;
      const targetIndex = Math.min(sourceIndex + 3, allNodeIds.length - 1);
      if (sourceIndex !== targetIndex) {
        edges.push({
          id: `e-cross-${i}`,
          source: allNodeIds[sourceIndex],
          target: allNodeIds[targetIndex],
          type: 'default',
          animated: true,
          style: { 
            stroke: '#00D084',
            strokeWidth: 1,
            opacity: 0.2,
          },
        });
      }
    }
  }
  
  return { nodes, edges };
}

// =============================================================================
// Custom Background Component
// =============================================================================

function HolographicBackground() {
  return (
    <div className="absolute inset-0 pointer-events-none overflow-hidden">
      {/* Radial gradient base */}
      <div 
        className="absolute inset-0"
        style={{
          background: 'radial-gradient(ellipse at center, rgba(0, 208, 132, 0.15) 0%, rgba(0, 166, 108, 0.08) 30%, transparent 70%)',
        }}
      />
      
      {/* Animated glow rings */}
      <div 
        className="absolute left-1/2 top-1/2 -translate-x-1/2 -translate-y-1/2 w-[600px] h-[600px] rounded-full border border-[#00D084]/20 animate-pulse"
        style={{ animationDuration: '3s' }}
      />
      <div 
        className="absolute left-1/2 top-1/2 -translate-x-1/2 -translate-y-1/2 w-[800px] h-[800px] rounded-full border border-[#00D084]/10 animate-pulse"
        style={{ animationDuration: '4s', animationDelay: '1s' }}
      />
      <div 
        className="absolute left-1/2 top-1/2 -translate-x-1/2 -translate-y-1/2 w-[1000px] h-[1000px] rounded-full border border-[#00D084]/5 animate-pulse"
        style={{ animationDuration: '5s', animationDelay: '2s' }}
      />
      
      {/* Center glow */}
      <div 
        className="absolute left-1/2 top-1/2 -translate-x-1/2 -translate-y-1/2 w-[200px] h-[200px] rounded-full"
        style={{
          background: 'radial-gradient(circle, rgba(0, 208, 132, 0.3) 0%, transparent 70%)',
          filter: 'blur(40px)',
        }}
      />
      
      {/* Subtle grid lines */}
      <svg className="absolute inset-0 w-full h-full opacity-[0.03]">
        <defs>
          <pattern id="grid" width="50" height="50" patternUnits="userSpaceOnUse">
            <path d="M 50 0 L 0 0 0 50" fill="none" stroke="#00D084" strokeWidth="1"/>
          </pattern>
        </defs>
        <rect width="100%" height="100%" fill="url(#grid)" />
      </svg>
    </div>
  );
}

// =============================================================================
// Inner Component
// =============================================================================

function MindMapInner({ results }: { results: ICD10Result[] }) {
  const { fitView } = useReactFlow();
  const [zoomLevel, setZoomLevel] = useState(1);
  
  const { nodes: initialNodes, edges: initialEdges } = useMemo(
    () => convertToNodesAndEdges(results),
    [results]
  );
  
  const [nodes, setNodes, onNodesChange] = useNodesState(initialNodes);
  const [edges, setEdges, onEdgesChange] = useEdgesState(initialEdges);
  
  useEffect(() => {
    const { nodes: newNodes, edges: newEdges } = convertToNodesAndEdges(results);
    setNodes(newNodes);
    setEdges(newEdges);
    setTimeout(() => fitView({ padding: 0.3, duration: 800 }), 100);
  }, [results, setNodes, setEdges, fitView]);
  
  const onMoveEnd = useCallback((_: unknown, viewport: { zoom: number }) => {
    setZoomLevel(viewport.zoom);
  }, []);
  
  const onConnect = useCallback(() => {}, []);
  
  const categories = useMemo(() => {
    const cats = new Map<string, number>();
    results.forEach(r => {
      const cat = r.code.split('.')[0];
      cats.set(cat, (cats.get(cat) || 0) + 1);
    });
    return Array.from(cats.entries());
  }, [results]);
  
  return (
    <>
      {/* Custom holographic background */}
      <HolographicBackground />
      
      <ReactFlow
        nodes={nodes}
        edges={edges}
        onNodesChange={onNodesChange}
        onEdgesChange={onEdgesChange}
        onConnect={onConnect}
        onMoveEnd={onMoveEnd}
        nodeTypes={nodeTypes}
        connectionLineType={ConnectionLineType.SmoothStep}
        fitView
        fitViewOptions={{ padding: 0.3, maxZoom: 1.5 }}
        minZoom={0.2}
        maxZoom={2.5}
        defaultEdgeOptions={{
          type: 'default',
          animated: true,
          style: { stroke: '#00D084', strokeWidth: 2, opacity: 0.4 },
        }}
        proOptions={{ hideAttribution: true }}
        className="!bg-transparent"
      >
        {/* Controls */}
        <Controls 
          showInteractive={false}
          className="
            !bg-gray-900/80 
            !border-[#00D084]/30
            !rounded-xl
            !shadow-xl
            !shadow-[#00D084]/20
            backdrop-blur-md
            [&>button]:!bg-transparent
            [&>button]:!border-[#00D084]/20
            [&>button]:!text-[#00D084]
            [&>button:hover]:!bg-[#00D084]/20
          "
        />
        
        {/* Mini Map */}
        <MiniMap 
          nodeColor={(node) => {
            const category = (node.data as IcdNodeData)?.category?.[0] || 'E';
            const colors: Record<string, string> = {
              'E': '#00D084', 'F': '#45AAF2', 'I': '#E056FD', 'J': '#00D084',
              'A': '#FF6B6B', 'B': '#FF9F43', 'C': '#FF6B9D', 'D': '#A55EEA',
            };
            return colors[category] || '#00D084';
          }}
          maskColor="rgba(0, 0, 0, 0.8)"
          className="
            !bg-gray-900/80 
            !border-[#00D084]/30
            !rounded-xl
            !shadow-xl
            backdrop-blur-md
          "
          pannable
          zoomable
        />
        
        {/* Stats Panel */}
        <Panel position="top-right" className="flex flex-col gap-2">
          {/* Zoom */}
          <div className="bg-gray-900/80 backdrop-blur-md rounded-xl px-4 py-2 shadow-xl border border-[#00D084]/30">
            <div className="flex items-center gap-3">
              <div className="w-2 h-2 rounded-full bg-[#00D084] animate-pulse" />
              <span className="text-xs text-gray-400">ZOOM</span>
              <span className="text-lg font-mono font-bold text-[#00D084]">
                {Math.round(zoomLevel * 100)}%
              </span>
            </div>
          </div>
          
          {/* Node Count */}
          <div className="bg-gray-900/80 backdrop-blur-md rounded-xl px-4 py-2 shadow-xl border border-[#00D084]/30">
            <div className="flex items-center gap-3">
              <div className="w-2 h-2 rounded-full bg-[#00D084]" />
              <span className="text-xs text-gray-400">NODES</span>
              <span className="text-lg font-mono font-bold text-white">
                {results.length}
              </span>
            </div>
          </div>
          
          {/* Categories */}
          <div className="bg-gray-900/80 backdrop-blur-md rounded-xl px-4 py-3 shadow-xl border border-[#00D084]/30">
            <p className="text-xs text-gray-400 mb-2">CATEGORIES</p>
            <div className="flex flex-wrap gap-1.5 max-w-[180px]">
              {categories.slice(0, 8).map(([cat, count]) => (
                <span 
                  key={cat}
                  className="px-2 py-0.5 rounded-full text-xs font-mono font-bold bg-[#00D084]/20 text-[#00D084] border border-[#00D084]/30"
                >
                  {cat} <span className="text-gray-400">({count})</span>
                </span>
              ))}
            </div>
          </div>
        </Panel>
        
        {/* Help Panel */}
        <Panel position="bottom-center">
          <div className="bg-gray-900/60 backdrop-blur-md rounded-full px-6 py-2 shadow-xl border border-[#00D084]/20">
            <p className="text-xs text-gray-400">
              <span className="text-[#00D084]">⟨</span> Drag <span className="text-gray-600">•</span> Scroll to zoom <span className="text-gray-600">•</span> Hover for details <span className="text-[#00D084]">⟩</span>
            </p>
          </div>
        </Panel>
      </ReactFlow>
    </>
  );
}

// =============================================================================
// Main Component
// =============================================================================

interface MindMapViewProps {
  results: ICD10Result[];
}

export default function MindMapView({ results }: MindMapViewProps) {
  if (results.length === 0) {
    return (
      <div className="h-[600px] relative flex flex-col items-center justify-center rounded-2xl overflow-hidden border border-[#00D084]/20">
        {/* Background */}
        <div 
          className="absolute inset-0"
          style={{
            background: 'radial-gradient(ellipse at center, rgba(0, 208, 132, 0.1) 0%, rgba(10, 10, 10, 1) 70%)',
          }}
        />
        
        {/* Animated rings */}
        <div className="absolute left-1/2 top-1/2 -translate-x-1/2 -translate-y-1/2 w-[300px] h-[300px] rounded-full border border-[#00D084]/20 animate-pulse" />
        <div className="absolute left-1/2 top-1/2 -translate-x-1/2 -translate-y-1/2 w-[200px] h-[200px] rounded-full border border-[#00D084]/30 animate-pulse" style={{ animationDelay: '0.5s' }} />
        <div className="absolute left-1/2 top-1/2 -translate-x-1/2 -translate-y-1/2 w-[100px] h-[100px] rounded-full border border-[#00D084]/40 animate-pulse" style={{ animationDelay: '1s' }} />
        
        {/* Content */}
        <div className="relative z-10 text-center">
          <div className="w-20 h-20 rounded-full bg-[#00D084]/10 border border-[#00D084]/30 flex items-center justify-center mx-auto mb-4">
            <svg className="w-10 h-10 text-[#00D084]" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1} d="M13 10V3L4 14h7v7l9-11h-7z" />
            </svg>
          </div>
          <p className="text-[#00D084] font-semibold text-lg mb-1">
            Mind Map Visualization
          </p>
          <p className="text-gray-500 text-sm">
            Search for ICD codes to generate visualization
          </p>
        </div>
      </div>
    );
  }
  
  return (
    <div 
      className="
        h-[600px]
        w-full
        rounded-2xl
        overflow-hidden
        border
        border-[#00D084]/30
        shadow-2xl
        shadow-[#00D084]/10
        animate-in
        fade-in
        duration-500
      "
      style={{
        background: 'linear-gradient(180deg, #0a0a0a 0%, #0d1f18 50%, #0a0a0a 100%)',
      }}
    >
      <ReactFlowProvider>
        <MindMapInner results={results} />
      </ReactFlowProvider>
    </div>
  );
}

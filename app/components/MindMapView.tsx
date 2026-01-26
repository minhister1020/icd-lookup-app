/**
 * MindMapView Component - Multi-Node Futuristic Visualization
 * ============================================================
 * 
 * Phase 3C: Now supports THREE node types:
 * - ICD Codes (green) - center/top
 * - Drugs (blue) - left side
 * - Clinical Trials (purple) - right side
 * 
 * Features:
 * - Hierarchical layout with ICD codes as primary nodes
 * - Edges connecting ICD → Drugs and ICD → Trials
 * - Animated holographic background
 * - Dynamic node addition when drugs/trials are loaded
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

import { ICD10Result, IcdNodeData, DrugResult, ClinicalTrialResult } from '../types/icd';
import IcdNode from './IcdNode';
import DrugNode, { DrugNodeData } from './DrugNode';
import TrialNode, { TrialNodeData } from './TrialNode';

// =============================================================================
// Configuration
// =============================================================================

const nodeTypes: NodeTypes = {
  icdNode: IcdNode,
  drugNode: DrugNode,
  trialNode: TrialNode,
};

// Layout constants
const CENTER_X = 500;
const ICD_ROW_Y = 100;
const DRUG_ROW_Y = 350;
const TRIAL_ROW_Y = 350;
const HORIZONTAL_SPACING = 180;
const DRUG_OFFSET_X = -200;
const TRIAL_OFFSET_X = 200;

// =============================================================================
// Types
// =============================================================================

interface MindMapViewProps {
  results: ICD10Result[];
  drugsMap?: Map<string, DrugResult[]>;
  trialsMap?: Map<string, ClinicalTrialResult[]>;
}

type AllNodeData = IcdNodeData | DrugNodeData | TrialNodeData;

/** Phase 7D: Available layout types */
type LayoutType = 'hierarchical' | 'radial' | 'circular';

/** Phase 7D: Layout configuration */
const LAYOUT_CENTER_X = 500;
const LAYOUT_CENTER_Y = 400;
const RADIAL_ICD_RADIUS = 200;
const RADIAL_CHILD_RADIUS = 380;
const CIRCULAR_RADIUS = 300;

// =============================================================================
// Helper Functions
// =============================================================================

/**
 * Creates a hierarchical layout with ICD codes at top, drugs left, trials right.
 * Phase 7A: Only shows drug/trial nodes for expanded ICD codes.
 */
function convertToNodesAndEdges(
  results: ICD10Result[],
  drugsMap: Map<string, DrugResult[]>,
  trialsMap: Map<string, ClinicalTrialResult[]>,
  expandedNodes: Set<string>,
  toggleExpand: (code: string) => void
): {
  nodes: Node<AllNodeData>[];
  edges: Edge[];
  stats: { 
    icdCount: number; 
    drugCount: number; 
    trialCount: number;
    visibleDrugCount: number;
    visibleTrialCount: number;
    expandedCount: number;
  };
} {
  const nodes: Node<AllNodeData>[] = [];
  const edges: Edge[] = [];
  let drugCount = 0;
  let trialCount = 0;
  let visibleDrugCount = 0;
  let visibleTrialCount = 0;
  
  // Position ICD codes in a row at the top
  const icdStartX = CENTER_X - ((results.length - 1) * HORIZONTAL_SPACING) / 2;
  
  results.forEach((result, index) => {
    const category = result.code.split('.')[0];
    const x = icdStartX + index * HORIZONTAL_SPACING;
    const y = ICD_ROW_Y;
    
    // Get drugs and trials for this ICD code
    const drugs = drugsMap.get(result.code) || [];
    const trials = trialsMap.get(result.code) || [];
    const isExpanded = expandedNodes.has(result.code);
    const hasLoaded = drugsMap.has(result.code) || trialsMap.has(result.code);
    
    // Track total counts
    drugCount += drugs.length;
    trialCount += trials.length;
    
    // Add ICD node with expansion data
    nodes.push({
      id: result.code,
      type: 'icdNode',
      position: { x, y },
      data: {
        code: result.code,
        name: result.name,
        category,
        // Phase 7A: Expansion state
        isExpanded,
        childrenCount: {
          drugs: drugs.length,
          trials: trials.length,
          loaded: hasLoaded,
        },
        onToggleExpand: toggleExpand,
      },
    });
    
    // Add edges between consecutive ICD codes
    if (index > 0) {
      edges.push({
        id: `e-icd-${results[index - 1].code}-${result.code}`,
        source: results[index - 1].code,
        target: result.code,
        type: 'default',
        animated: true,
        style: { stroke: '#00D084', strokeWidth: 2, opacity: 0.4 },
      });
    }
    
    // Phase 7A: Only add children if this node is EXPANDED
    if (isExpanded) {
      // Add Drug nodes for this ICD code
      const drugStartX = x + DRUG_OFFSET_X;
      
      drugs.forEach((drug, drugIndex) => {
        const drugId = `drug-${result.code}-${drugIndex}`;
        const drugX = drugStartX + (drugIndex % 2) * 80 - 40;
        const drugY = DRUG_ROW_Y + Math.floor(drugIndex / 2) * 60;
        
        nodes.push({
          id: drugId,
          type: 'drugNode',
          position: { x: drugX, y: drugY },
          data: {
            brandName: drug.brandName,
            genericName: drug.genericName,
            sourceIcdCode: result.code,
          },
        });
        
        // Edge from ICD to Drug
        edges.push({
          id: `e-drug-${result.code}-${drugIndex}`,
          source: result.code,
          target: drugId,
          type: 'default',
          animated: true,
          style: { 
            stroke: '#3B82F6', 
            strokeWidth: 1.5, 
            opacity: 0.5,
            strokeDasharray: '5,5',
          },
        });
        
        visibleDrugCount++;
      });
      
      // Add Trial nodes for this ICD code
      const trialStartX = x + TRIAL_OFFSET_X;
      
      trials.forEach((trial, trialIndex) => {
        const trialId = `trial-${result.code}-${trialIndex}`;
        const trialX = trialStartX + (trialIndex % 2) * 80 - 40;
        const trialY = TRIAL_ROW_Y + Math.floor(trialIndex / 2) * 60;
        
        nodes.push({
          id: trialId,
          type: 'trialNode',
          position: { x: trialX, y: trialY },
          data: {
            nctId: trial.nctId,
            title: trial.title,
            status: trial.status,
            sourceIcdCode: result.code,
          },
        });
        
        // Edge from ICD to Trial
        edges.push({
          id: `e-trial-${result.code}-${trialIndex}`,
          source: result.code,
          target: trialId,
          type: 'default',
          animated: true,
          style: { 
            stroke: '#9333EA', 
            strokeWidth: 1.5, 
            opacity: 0.5,
            strokeDasharray: '5,5',
          },
        });
        
        visibleTrialCount++;
      });
    }
  });
  
  return { 
    nodes, 
    edges, 
    stats: { 
      icdCount: results.length, 
      drugCount, 
      trialCount,
      visibleDrugCount,
      visibleTrialCount,
      expandedCount: expandedNodes.size,
    } 
  };
}

// =============================================================================
// Phase 7D: Radial Layout
// =============================================================================

/**
 * Radial/Sunburst layout: ICD codes in inner circle, children in outer circle
 */
function radialLayout(
  results: ICD10Result[],
  drugsMap: Map<string, DrugResult[]>,
  trialsMap: Map<string, ClinicalTrialResult[]>,
  expandedNodes: Set<string>,
  toggleExpand: (code: string) => void
): {
  nodes: Node<AllNodeData>[];
  edges: Edge[];
  stats: { icdCount: number; drugCount: number; trialCount: number; visibleDrugCount: number; visibleTrialCount: number; expandedCount: number };
} {
  const nodes: Node<AllNodeData>[] = [];
  const edges: Edge[] = [];
  let drugCount = 0, trialCount = 0, visibleDrugCount = 0, visibleTrialCount = 0;
  
  // Position ICD codes in inner circle
  const icdAngleStep = (2 * Math.PI) / Math.max(results.length, 1);
  
  results.forEach((result, index) => {
    const angle = icdAngleStep * index - Math.PI / 2; // Start from top
    const x = LAYOUT_CENTER_X + RADIAL_ICD_RADIUS * Math.cos(angle);
    const y = LAYOUT_CENTER_Y + RADIAL_ICD_RADIUS * Math.sin(angle);
    
    const category = result.code.split('.')[0];
    const drugs = drugsMap.get(result.code) || [];
    const trials = trialsMap.get(result.code) || [];
    const isExpanded = expandedNodes.has(result.code);
    const hasLoaded = drugsMap.has(result.code) || trialsMap.has(result.code);
    
    drugCount += drugs.length;
    trialCount += trials.length;
    
    nodes.push({
      id: result.code,
      type: 'icdNode',
      position: { x, y },
      data: { code: result.code, name: result.name, category, isExpanded, childrenCount: { drugs: drugs.length, trials: trials.length, loaded: hasLoaded }, onToggleExpand: toggleExpand },
    });
    
    // Add edge to previous ICD
    if (index > 0) {
      edges.push({
        id: `e-icd-${results[index - 1].code}-${result.code}`,
        source: results[index - 1].code,
        target: result.code,
        type: 'default',
        animated: true,
        style: { stroke: '#00D084', strokeWidth: 2, opacity: 0.4 },
      });
    }
    
    // Position children radially outward from parent ICD
    if (isExpanded) {
      const children = [...drugs.map((d, i) => ({ type: 'drug' as const, data: d, idx: i })), ...trials.map((t, i) => ({ type: 'trial' as const, data: t, idx: i }))];
      const childAngleSpread = Math.PI / 6; // 30 degrees spread
      const childAngleStart = angle - (childAngleSpread * (children.length - 1)) / 2;
      
      children.forEach((child, childIdx) => {
        const childAngle = childAngleStart + childAngleSpread * childIdx;
        const childX = LAYOUT_CENTER_X + RADIAL_CHILD_RADIUS * Math.cos(childAngle);
        const childY = LAYOUT_CENTER_Y + RADIAL_CHILD_RADIUS * Math.sin(childAngle);
        
        if (child.type === 'drug') {
          const drugId = `drug-${result.code}-${child.idx}`;
          nodes.push({ id: drugId, type: 'drugNode', position: { x: childX, y: childY }, data: { brandName: child.data.brandName, genericName: child.data.genericName, sourceIcdCode: result.code } });
          edges.push({ id: `e-drug-${result.code}-${child.idx}`, source: result.code, target: drugId, type: 'default', animated: true, style: { stroke: '#3B82F6', strokeWidth: 1.5, opacity: 0.5, strokeDasharray: '5,5' } });
          visibleDrugCount++;
        } else {
          const trialId = `trial-${result.code}-${child.idx}`;
          nodes.push({ id: trialId, type: 'trialNode', position: { x: childX, y: childY }, data: { nctId: child.data.nctId, title: child.data.title, status: child.data.status, sourceIcdCode: result.code } });
          edges.push({ id: `e-trial-${result.code}-${child.idx}`, source: result.code, target: trialId, type: 'default', animated: true, style: { stroke: '#9333EA', strokeWidth: 1.5, opacity: 0.5, strokeDasharray: '5,5' } });
          visibleTrialCount++;
        }
      });
    }
  });
  
  return { nodes, edges, stats: { icdCount: results.length, drugCount, trialCount, visibleDrugCount, visibleTrialCount, expandedCount: expandedNodes.size } };
}

// =============================================================================
// Phase 7D: Circular Layout
// =============================================================================

/**
 * Circular layout: All nodes in a single circle with equal spacing
 */
function circularLayout(
  results: ICD10Result[],
  drugsMap: Map<string, DrugResult[]>,
  trialsMap: Map<string, ClinicalTrialResult[]>,
  expandedNodes: Set<string>,
  toggleExpand: (code: string) => void
): {
  nodes: Node<AllNodeData>[];
  edges: Edge[];
  stats: { icdCount: number; drugCount: number; trialCount: number; visibleDrugCount: number; visibleTrialCount: number; expandedCount: number };
} {
  const nodes: Node<AllNodeData>[] = [];
  const edges: Edge[] = [];
  let drugCount = 0, trialCount = 0, visibleDrugCount = 0, visibleTrialCount = 0;
  
  // First, collect all visible nodes
  const allNodeData: { id: string; type: 'icd' | 'drug' | 'trial'; data: ICD10Result | DrugResult | ClinicalTrialResult; parentCode?: string; idx?: number }[] = [];
  
  results.forEach((result) => {
    allNodeData.push({ id: result.code, type: 'icd', data: result });
    
    const drugs = drugsMap.get(result.code) || [];
    const trials = trialsMap.get(result.code) || [];
    drugCount += drugs.length;
    trialCount += trials.length;
    
    if (expandedNodes.has(result.code)) {
      drugs.forEach((drug, i) => {
        allNodeData.push({ id: `drug-${result.code}-${i}`, type: 'drug', data: drug, parentCode: result.code, idx: i });
        visibleDrugCount++;
      });
      trials.forEach((trial, i) => {
        allNodeData.push({ id: `trial-${result.code}-${i}`, type: 'trial', data: trial, parentCode: result.code, idx: i });
        visibleTrialCount++;
      });
    }
  });
  
  // Position all nodes in a circle
  const angleStep = (2 * Math.PI) / Math.max(allNodeData.length, 1);
  const radius = Math.max(CIRCULAR_RADIUS, allNodeData.length * 15); // Scale radius with node count
  
  allNodeData.forEach((nodeData, index) => {
    const angle = angleStep * index - Math.PI / 2;
    const x = LAYOUT_CENTER_X + radius * Math.cos(angle);
    const y = LAYOUT_CENTER_Y + radius * Math.sin(angle);
    
    if (nodeData.type === 'icd') {
      const result = nodeData.data as ICD10Result;
      const category = result.code.split('.')[0];
      const drugs = drugsMap.get(result.code) || [];
      const trials = trialsMap.get(result.code) || [];
      const isExpanded = expandedNodes.has(result.code);
      const hasLoaded = drugsMap.has(result.code) || trialsMap.has(result.code);
      
      nodes.push({
        id: result.code,
        type: 'icdNode',
        position: { x, y },
        data: { code: result.code, name: result.name, category, isExpanded, childrenCount: { drugs: drugs.length, trials: trials.length, loaded: hasLoaded }, onToggleExpand: toggleExpand },
      });
    } else if (nodeData.type === 'drug') {
      const drug = nodeData.data as DrugResult;
      nodes.push({ id: nodeData.id, type: 'drugNode', position: { x, y }, data: { brandName: drug.brandName, genericName: drug.genericName, sourceIcdCode: nodeData.parentCode! } });
      edges.push({ id: `e-drug-${nodeData.parentCode}-${nodeData.idx}`, source: nodeData.parentCode!, target: nodeData.id, type: 'default', animated: true, style: { stroke: '#3B82F6', strokeWidth: 1.5, opacity: 0.5, strokeDasharray: '5,5' } });
    } else {
      const trial = nodeData.data as ClinicalTrialResult;
      nodes.push({ id: nodeData.id, type: 'trialNode', position: { x, y }, data: { nctId: trial.nctId, title: trial.title, status: trial.status, sourceIcdCode: nodeData.parentCode! } });
      edges.push({ id: `e-trial-${nodeData.parentCode}-${nodeData.idx}`, source: nodeData.parentCode!, target: nodeData.id, type: 'default', animated: true, style: { stroke: '#9333EA', strokeWidth: 1.5, opacity: 0.5, strokeDasharray: '5,5' } });
    }
  });
  
  // Add edges between consecutive ICD codes
  const icdNodes = results.map(r => r.code);
  for (let i = 1; i < icdNodes.length; i++) {
    edges.push({
      id: `e-icd-${icdNodes[i-1]}-${icdNodes[i]}`,
      source: icdNodes[i-1],
      target: icdNodes[i],
      type: 'default',
      animated: true,
      style: { stroke: '#00D084', strokeWidth: 2, opacity: 0.4 },
    });
  }
  
  return { nodes, edges, stats: { icdCount: results.length, drugCount, trialCount, visibleDrugCount, visibleTrialCount, expandedCount: expandedNodes.size } };
}

// =============================================================================
// Phase 7D: Layout Router
// =============================================================================

/**
 * Routes to the appropriate layout function based on layoutType
 */
function calculateLayout(
  layoutType: LayoutType,
  results: ICD10Result[],
  drugsMap: Map<string, DrugResult[]>,
  trialsMap: Map<string, ClinicalTrialResult[]>,
  expandedNodes: Set<string>,
  toggleExpand: (code: string) => void
) {
  switch (layoutType) {
    case 'radial':
      return radialLayout(results, drugsMap, trialsMap, expandedNodes, toggleExpand);
    case 'circular':
      return circularLayout(results, drugsMap, trialsMap, expandedNodes, toggleExpand);
    case 'hierarchical':
    default:
      return convertToNodesAndEdges(results, drugsMap, trialsMap, expandedNodes, toggleExpand);
  }
}

// =============================================================================
// Custom Background Component
// =============================================================================

function HolographicBackground() {
  return (
    <div className="absolute inset-0 pointer-events-none overflow-hidden">
      <div 
        className="absolute inset-0"
        style={{
          background: 'radial-gradient(ellipse at center, rgba(0, 208, 132, 0.15) 0%, rgba(0, 166, 108, 0.08) 30%, transparent 70%)',
        }}
      />
      <div 
        className="absolute left-1/2 top-1/2 -translate-x-1/2 -translate-y-1/2 w-[600px] h-[600px] rounded-full border border-[#00D084]/20 animate-pulse"
        style={{ animationDuration: '3s' }}
      />
      <div 
        className="absolute left-1/2 top-1/2 -translate-x-1/2 -translate-y-1/2 w-[800px] h-[800px] rounded-full border border-[#00D084]/10 animate-pulse"
        style={{ animationDuration: '4s', animationDelay: '1s' }}
      />
      <div 
        className="absolute left-1/2 top-1/2 -translate-x-1/2 -translate-y-1/2 w-[200px] h-[200px] rounded-full"
        style={{
          background: 'radial-gradient(circle, rgba(0, 208, 132, 0.3) 0%, transparent 70%)',
          filter: 'blur(40px)',
        }}
      />
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

interface MindMapInnerProps {
  results: ICD10Result[];
  drugsMap: Map<string, DrugResult[]>;
  trialsMap: Map<string, ClinicalTrialResult[]>;
}

function MindMapInner({ results, drugsMap, trialsMap }: MindMapInnerProps) {
  const { fitView } = useReactFlow();
  const [zoomLevel, setZoomLevel] = useState(1);
  
  // Phase 7A: Track which ICD nodes are expanded
  const [expandedNodes, setExpandedNodes] = useState<Set<string>>(new Set());
  
  // Phase 7A: Toggle expansion for a single node
  const toggleExpand = useCallback((code: string) => {
    setExpandedNodes(prev => {
      const next = new Set(prev);
      if (next.has(code)) {
        next.delete(code);
      } else {
        next.add(code);
      }
      return next;
    });
  }, []);
  
  // Phase 7A: Expand all ICD nodes
  const expandAll = useCallback(() => {
    // Only expand nodes that have children loaded
    const expandableCodes = results
      .filter(r => (drugsMap.get(r.code)?.length || 0) > 0 || (trialsMap.get(r.code)?.length || 0) > 0)
      .map(r => r.code);
    setExpandedNodes(new Set(expandableCodes));
  }, [results, drugsMap, trialsMap]);
  
  // Phase 7A: Collapse all ICD nodes
  const collapseAll = useCallback(() => {
    setExpandedNodes(new Set());
  }, []);
  
  // Phase 7A: Reset expansion when results change (new search)
  useEffect(() => {
    setExpandedNodes(new Set());
  }, [results]);
  
  // ==========================================================================
  // Phase 7D: Layout Type State
  // ==========================================================================
  
  const [layoutType, setLayoutType] = useState<LayoutType>(() => {
    if (typeof window !== 'undefined') {
      const saved = localStorage.getItem('mindmap-layout');
      if (saved === 'hierarchical' || saved === 'radial' || saved === 'circular') {
        return saved;
      }
    }
    return 'hierarchical';
  });
  
  // Persist layout choice to localStorage
  useEffect(() => {
    localStorage.setItem('mindmap-layout', layoutType);
  }, [layoutType]);
  
  // ==========================================================================
  // Phase 7B: Hover Highlighting State
  // ==========================================================================
  
  const [hoveredNodeId, setHoveredNodeId] = useState<string | null>(null);
  
  // Compute connected nodes for highlighting (O(1) lookup with Set)
  const { highlightedNodes, highlightedEdges } = useMemo(() => {
    if (!hoveredNodeId) {
      return { highlightedNodes: new Set<string>(), highlightedEdges: new Set<string>() };
    }
    
    const connected = new Set<string>([hoveredNodeId]);
    const connectedEdgeIds = new Set<string>();
    
    // Find the hovered node to determine its type
    const isIcdNode = results.some(r => r.code === hoveredNodeId);
    
    if (isIcdNode) {
      // Hovering ICD → highlight all its drug/trial children
      // Drug IDs: drug-{icdCode}-{index}, Trial IDs: trial-{icdCode}-{index}
      const drugs = drugsMap.get(hoveredNodeId) || [];
      const trials = trialsMap.get(hoveredNodeId) || [];
      
      drugs.forEach((_, idx) => {
        connected.add(`drug-${hoveredNodeId}-${idx}`);
        connectedEdgeIds.add(`e-drug-${hoveredNodeId}-${idx}`);
      });
      
      trials.forEach((_, idx) => {
        connected.add(`trial-${hoveredNodeId}-${idx}`);
        connectedEdgeIds.add(`e-trial-${hoveredNodeId}-${idx}`);
      });
    } else {
      // Hovering Drug or Trial → highlight parent ICD
      // Extract parent ICD code from node ID pattern: drug-{icdCode}-{index} or trial-{icdCode}-{index}
      const match = hoveredNodeId.match(/^(drug|trial)-(.+)-\d+$/);
      if (match) {
        const parentIcdCode = match[2];
        connected.add(parentIcdCode);
        // Also highlight the edge connecting this node to parent
        connectedEdgeIds.add(`e-${match[1]}-${parentIcdCode}-${hoveredNodeId.split('-').pop()}`);
      }
    }
    
    return { highlightedNodes: connected, highlightedEdges: connectedEdgeIds };
  }, [hoveredNodeId, results, drugsMap, trialsMap]);
  
  // Mouse event handlers (disabled during focus mode)
  const onNodeMouseEnter = useCallback((_: React.MouseEvent, node: Node<AllNodeData>) => {
    setHoveredNodeId(node.id);
  }, []);
  
  const onNodeMouseLeave = useCallback(() => {
    setHoveredNodeId(null);
  }, []);
  
  // ==========================================================================
  // Phase 7C: Focus Mode State (Persistent Highlight)
  // ==========================================================================
  
  const [focusedNodeId, setFocusedNodeId] = useState<string | null>(null);
  
  // Compute focused nodes (same logic as hover)
  const { focusedNodes, focusedEdges } = useMemo(() => {
    if (!focusedNodeId) {
      return { focusedNodes: new Set<string>(), focusedEdges: new Set<string>() };
    }
    
    const connected = new Set<string>([focusedNodeId]);
    const connectedEdgeIds = new Set<string>();
    
    const isIcdNode = results.some(r => r.code === focusedNodeId);
    
    if (isIcdNode) {
      const drugs = drugsMap.get(focusedNodeId) || [];
      const trials = trialsMap.get(focusedNodeId) || [];
      
      drugs.forEach((_, idx) => {
        connected.add(`drug-${focusedNodeId}-${idx}`);
        connectedEdgeIds.add(`e-drug-${focusedNodeId}-${idx}`);
      });
      
      trials.forEach((_, idx) => {
        connected.add(`trial-${focusedNodeId}-${idx}`);
        connectedEdgeIds.add(`e-trial-${focusedNodeId}-${idx}`);
      });
    } else {
      const match = focusedNodeId.match(/^(drug|trial)-(.+)-\d+$/);
      if (match) {
        const parentIcdCode = match[2];
        connected.add(parentIcdCode);
        connectedEdgeIds.add(`e-${match[1]}-${parentIcdCode}-${focusedNodeId.split('-').pop()}`);
      }
    }
    
    return { focusedNodes: connected, focusedEdges: connectedEdgeIds };
  }, [focusedNodeId, results, drugsMap, trialsMap]);
  
  // Click node → toggle focus
  const onNodeClick = useCallback((_: React.MouseEvent, node: Node<AllNodeData>) => {
    setFocusedNodeId(prev => prev === node.id ? null : node.id);
  }, []);
  
  // Click background → exit focus
  const onPaneClick = useCallback(() => {
    if (focusedNodeId) {
      setFocusedNodeId(null);
    }
  }, [focusedNodeId]);
  
  // Reset focus when results change (new search)
  useEffect(() => {
    setFocusedNodeId(null);
  }, [results]);
  
  // ==========================================================================
  // Node and Edge Generation
  // ==========================================================================
  
  const { nodes: initialNodes, edges: initialEdges, stats } = useMemo(
    () => calculateLayout(layoutType, results, drugsMap, trialsMap, expandedNodes, toggleExpand),
    [layoutType, results, drugsMap, trialsMap, expandedNodes, toggleExpand]
  );
  
  const [nodes, setNodes, onNodesChange] = useNodesState(initialNodes);
  const [edges, setEdges, onEdgesChange] = useEdgesState(initialEdges);
  
  // Update nodes when data or layout changes
  useEffect(() => {
    const { nodes: newNodes, edges: newEdges } = calculateLayout(
      layoutType, results, drugsMap, trialsMap, expandedNodes, toggleExpand
    );
    setNodes(newNodes);
    setEdges(newEdges);
    setTimeout(() => fitView({ padding: 0.2, duration: 500 }), 100);
  }, [layoutType, results, drugsMap, trialsMap, expandedNodes, toggleExpand, setNodes, setEdges, fitView]);
  
  // Phase 7B/7C: Apply highlight state to nodes (Focus > Hover > Normal)
  const highlightedNodesArray = useMemo(() => {
    // Focus mode takes precedence
    if (focusedNodeId) {
      return nodes.map(node => ({
        ...node,
        data: {
          ...node.data,
          highlightState: focusedNodes.has(node.id) ? 'focused' : 'focus-dimmed',
        },
      }));
    }
    
    // Hover mode (only when not focused)
    if (hoveredNodeId) {
      return nodes.map(node => ({
        ...node,
        data: {
          ...node.data,
          highlightState: highlightedNodes.has(node.id) ? 'highlighted' : 'dimmed',
        },
      }));
    }
    
    // No interaction - return as-is
    return nodes;
  }, [nodes, focusedNodeId, focusedNodes, hoveredNodeId, highlightedNodes]);
  
  // Phase 7B/7C: Apply highlight state to edges (Focus > Hover > Normal)
  const highlightedEdgesArray = useMemo(() => {
    // Focus mode takes precedence
    if (focusedNodeId) {
      return edges.map(edge => ({
        ...edge,
        style: {
          ...edge.style,
          opacity: focusedEdges.has(edge.id) ? 0.9 : 0.05,
          strokeWidth: focusedEdges.has(edge.id) ? 3 : 1,
        },
      }));
    }
    
    // Hover mode
    if (hoveredNodeId) {
      return edges.map(edge => ({
        ...edge,
        style: {
          ...edge.style,
          opacity: highlightedEdges.has(edge.id) ? 0.8 : 0.1,
          strokeWidth: highlightedEdges.has(edge.id) ? 3 : 1.5,
        },
      }));
    }
    
    // No interaction - return as-is
    return edges;
  }, [edges, focusedNodeId, focusedEdges, hoveredNodeId, highlightedEdges]);
  
  const onMoveEnd = useCallback((_: unknown, viewport: { zoom: number }) => {
    setZoomLevel(viewport.zoom);
  }, []);
  
  const onConnect = useCallback(() => {}, []);
  
  // Phase 7A: Calculate visible nodes (ICD + visible drugs + visible trials)
  const visibleNodes = stats.icdCount + stats.visibleDrugCount + stats.visibleTrialCount;
  const totalLoadedNodes = stats.icdCount + stats.drugCount + stats.trialCount;
  
  return (
    <>
      <HolographicBackground />
      
      <ReactFlow
        nodes={highlightedNodesArray}
        edges={highlightedEdgesArray}
        onNodesChange={onNodesChange}
        onEdgesChange={onEdgesChange}
        onConnect={onConnect}
        onMoveEnd={onMoveEnd}
        onNodeMouseEnter={onNodeMouseEnter}
        onNodeMouseLeave={onNodeMouseLeave}
        onNodeClick={onNodeClick}
        onPaneClick={onPaneClick}
        nodeTypes={nodeTypes}
        connectionLineType={ConnectionLineType.SmoothStep}
        fitView
        fitViewOptions={{ padding: 0.2, maxZoom: 1.5 }}
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
        
        <MiniMap 
          nodeColor={(node) => {
            if (node.type === 'drugNode') return '#3B82F6';
            if (node.type === 'trialNode') return '#9333EA';
            return '#00D084';
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
        
        {/* Phase 7A: Expand/Collapse Controls + Phase 7D: Layout Selector */}
        <Panel position="top-left">
          <div className="bg-gray-900/80 backdrop-blur-md rounded-xl px-4 py-3 shadow-xl border border-[#00D084]/30 space-y-3">
            {/* Phase 7D: Layout Selector */}
            <div className="flex items-center gap-2">
              <span className="text-xs text-gray-500 mr-1">Layout:</span>
              <div className="flex rounded-lg border border-gray-700 overflow-hidden">
                <button
                  onClick={() => setLayoutType('hierarchical')}
                  className={`
                    flex items-center gap-1.5 px-3 py-1.5
                    text-xs font-medium
                    transition-colors duration-200
                    ${layoutType === 'hierarchical'
                      ? 'bg-[#00D084]/30 text-[#00D084] border-r border-[#00D084]/30'
                      : 'bg-gray-800/50 text-gray-400 hover:bg-gray-700/50 border-r border-gray-700'
                    }
                  `}
                  title="Hierarchical layout - ICD codes at top, children below"
                >
                  <span>📊</span>
                  <span>Tree</span>
                </button>
                <button
                  onClick={() => setLayoutType('radial')}
                  className={`
                    flex items-center gap-1.5 px-3 py-1.5
                    text-xs font-medium
                    transition-colors duration-200
                    ${layoutType === 'radial'
                      ? 'bg-[#00D084]/30 text-[#00D084] border-r border-[#00D084]/30'
                      : 'bg-gray-800/50 text-gray-400 hover:bg-gray-700/50 border-r border-gray-700'
                    }
                  `}
                  title="Radial layout - ICD codes in center circle, children radiating outward"
                >
                  <span>☀️</span>
                  <span>Radial</span>
                </button>
                <button
                  onClick={() => setLayoutType('circular')}
                  className={`
                    flex items-center gap-1.5 px-3 py-1.5
                    text-xs font-medium
                    transition-colors duration-200
                    ${layoutType === 'circular'
                      ? 'bg-[#00D084]/30 text-[#00D084]'
                      : 'bg-gray-800/50 text-gray-400 hover:bg-gray-700/50'
                    }
                  `}
                  title="Circular layout - All nodes arranged in a circle"
                >
                  <span>🔵</span>
                  <span>Circle</span>
                </button>
              </div>
            </div>
            
            {/* Expand/Collapse Row */}
            <div className="flex items-center gap-3">
              {/* Expand All Button */}
              <button
                onClick={expandAll}
                disabled={stats.expandedCount === results.filter(r => 
                  (drugsMap.get(r.code)?.length || 0) > 0 || (trialsMap.get(r.code)?.length || 0) > 0
                ).length}
                className="
                  flex items-center gap-1.5 px-3 py-1.5
                  rounded-lg text-xs font-medium
                  bg-blue-500/20 hover:bg-blue-500/30
                  text-blue-400
                  border border-blue-500/30
                  disabled:opacity-40 disabled:cursor-not-allowed
                  transition-colors duration-200
                "
                title="Expand all ICD nodes to show their drugs and trials"
              >
                <span className="text-sm">⊕</span>
                <span>Expand All</span>
              </button>
              
              {/* Collapse All Button */}
              <button
                onClick={collapseAll}
                disabled={stats.expandedCount === 0}
                className="
                  flex items-center gap-1.5 px-3 py-1.5
                  rounded-lg text-xs font-medium
                  bg-gray-500/20 hover:bg-gray-500/30
                  text-gray-400
                  border border-gray-500/30
                  disabled:opacity-40 disabled:cursor-not-allowed
                  transition-colors duration-200
                "
                title="Collapse all ICD nodes"
              >
                <span className="text-sm">⊖</span>
                <span>Collapse All</span>
              </button>
              
              {/* Expansion Status */}
              <div className="text-xs text-gray-500 border-l border-gray-700 pl-3 ml-1">
                <span className="text-[#00D084] font-bold">{stats.expandedCount}</span>
                <span className="text-gray-600">/</span>
                <span>{results.length}</span>
                <span className="ml-1">expanded</span>
              </div>
              
              {/* Help Tooltip */}
              <div className="relative group border-l border-gray-700 pl-3 ml-1">
                <button
                  className="
                    flex items-center justify-center
                    w-6 h-6 rounded-full
                    bg-blue-500/10 hover:bg-blue-500/20
                    text-blue-400 hover:text-blue-300
                    border border-blue-500/20 hover:border-blue-500/40
                    transition-all duration-200
                    text-xs
                  "
                  aria-label="Help"
                >
                  ?
                </button>
                
                {/* Tooltip Content */}
                <div 
                  className="
                    absolute left-0 top-full mt-2
                    w-72 p-3
                    bg-gray-900/95 backdrop-blur-md
                    rounded-lg shadow-xl
                    border border-[#00D084]/30
                    opacity-0 invisible
                    group-hover:opacity-100 group-hover:visible
                    transition-all duration-200
                    z-50
                  "
                >
                  <div className="flex items-start gap-2">
                    <span className="text-lg">💡</span>
                    <div>
                      <p className="text-xs text-gray-300 leading-relaxed">
                        <span className="font-semibold text-[#00D084]">Tip:</span> Click{' '}
                        <span className="text-blue-400">&apos;View Drugs&apos;</span> or{' '}
                        <span className="text-purple-400">&apos;View Trials&apos;</span> in List view to load data, 
                        then use <span className="text-blue-400">⊕ expand buttons</span> here to visualize connections!
                      </p>
                      <div className="flex items-center gap-2 mt-2 pt-2 border-t border-gray-700">
                        <span className="text-[10px] text-gray-500">Workflow:</span>
                        <div className="flex items-center gap-1 text-[10px]">
                          <span className="px-1.5 py-0.5 bg-gray-800 rounded text-gray-400">📋 List</span>
                          <span className="text-gray-600">→</span>
                          <span className="px-1.5 py-0.5 bg-gray-800 rounded text-blue-400">Load</span>
                          <span className="text-gray-600">→</span>
                          <span className="px-1.5 py-0.5 bg-gray-800 rounded text-[#00D084]">🗺️ Map</span>
                          <span className="text-gray-600">→</span>
                          <span className="px-1.5 py-0.5 bg-gray-800 rounded text-blue-400">⊕</span>
                        </div>
                      </div>
                    </div>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </Panel>
        
        {/* Phase 7C: Focus Mode Badge */}
        {focusedNodeId && (
          <Panel position="bottom-left">
            <div className="bg-gray-900/90 backdrop-blur-md rounded-xl px-4 py-2.5 shadow-xl border border-yellow-500/40 animate-in fade-in slide-in-from-bottom-2 duration-300">
              <div className="flex items-center gap-3">
                {/* Focus icon */}
                <div className="flex items-center gap-2">
                  <span className="text-yellow-400 text-sm">🎯</span>
                  <span className="text-xs text-gray-400">FOCUS MODE</span>
                </div>
                
                {/* Focused node code */}
                <div className="px-2 py-1 bg-yellow-500/20 rounded-md border border-yellow-500/30">
                  <span className="text-sm font-mono font-bold text-yellow-400">
                    {focusedNodeId.startsWith('drug-') 
                      ? focusedNodeId.replace(/^drug-(.+)-\d+$/, '$1') + ' 💊'
                      : focusedNodeId.startsWith('trial-')
                        ? focusedNodeId.replace(/^trial-(.+)-\d+$/, '$1') + ' 🧪'
                        : focusedNodeId
                    }
                  </span>
                </div>
                
                {/* Connected count */}
                <span className="text-xs text-gray-500">
                  {focusedNodes.size} node{focusedNodes.size !== 1 ? 's' : ''}
                </span>
                
                {/* Exit button */}
                <button
                  onClick={() => setFocusedNodeId(null)}
                  className="
                    flex items-center justify-center
                    w-6 h-6 rounded-full
                    bg-gray-700/50 hover:bg-red-500/30
                    text-gray-400 hover:text-red-400
                    border border-gray-600 hover:border-red-500/50
                    transition-all duration-200
                    text-xs
                  "
                  title="Exit focus mode (or click background)"
                >
                  ✕
                </button>
              </div>
              
              {/* Hint */}
              <p className="text-[10px] text-gray-500 mt-1.5 border-t border-gray-700 pt-1.5">
                Click background or another node to change focus
              </p>
            </div>
          </Panel>
        )}
        
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
          
          {/* Node Counts */}
          <div className="bg-gray-900/80 backdrop-blur-md rounded-xl px-4 py-3 shadow-xl border border-[#00D084]/30">
            <p className="text-xs text-gray-400 mb-2">NODES</p>
            <div className="space-y-1.5">
              {/* ICD */}
              <div className="flex items-center justify-between gap-4">
                <div className="flex items-center gap-2">
                  <div className="w-2 h-2 rounded-full bg-[#00D084]" />
                  <span className="text-xs text-gray-300">ICD Codes</span>
                </div>
                <span className="text-sm font-mono font-bold text-[#00D084]">
                  {stats.icdCount}
                </span>
              </div>
              {/* Drugs - show visible/total */}
              <div className="flex items-center justify-between gap-4">
                <div className="flex items-center gap-2">
                  <div className="w-2 h-2 rounded-full bg-[#3B82F6]" />
                  <span className="text-xs text-gray-300">Drugs</span>
                </div>
                <span className="text-sm font-mono font-bold text-[#3B82F6]">
                  {stats.visibleDrugCount}
                  {stats.drugCount > stats.visibleDrugCount && (
                    <span className="text-gray-500 text-xs font-normal">/{stats.drugCount}</span>
                  )}
                </span>
              </div>
              {/* Trials - show visible/total */}
              <div className="flex items-center justify-between gap-4">
                <div className="flex items-center gap-2">
                  <div className="w-2 h-2 rounded-full bg-[#9333EA]" />
                  <span className="text-xs text-gray-300">Trials</span>
                </div>
                <span className="text-sm font-mono font-bold text-[#9333EA]">
                  {stats.visibleTrialCount}
                  {stats.trialCount > stats.visibleTrialCount && (
                    <span className="text-gray-500 text-xs font-normal">/{stats.trialCount}</span>
                  )}
                </span>
              </div>
              {/* Total - visible / loaded */}
              <div className="flex items-center justify-between gap-4 pt-1.5 border-t border-gray-700">
                <span className="text-xs text-gray-400">Visible</span>
                <span className="text-sm font-mono font-bold text-white">
                  {visibleNodes}
                  {totalLoadedNodes > visibleNodes && (
                    <span className="text-gray-500 text-xs font-normal">/{totalLoadedNodes}</span>
                  )}
                </span>
              </div>
            </div>
          </div>
          
          {/* Legend */}
          <div className="bg-gray-900/80 backdrop-blur-md rounded-xl px-4 py-3 shadow-xl border border-[#00D084]/30">
            <p className="text-xs text-gray-400 mb-2">LEGEND</p>
            <div className="space-y-1">
              <div className="flex items-center gap-2">
                <div className="w-3 h-3 rounded-full bg-gradient-to-r from-[#00D084] to-[#00E89E]" />
                <span className="text-xs text-gray-300">ICD Code</span>
              </div>
              <div className="flex items-center gap-2">
                <div className="w-3 h-3 rounded-full bg-gradient-to-r from-[#3B82F6] to-[#60A5FA]" />
                <span className="text-xs text-gray-300">Drug</span>
              </div>
              <div className="flex items-center gap-2">
                <div className="w-3 h-3 rounded-full bg-gradient-to-r from-[#9333EA] to-[#A855F7]" />
                <span className="text-xs text-gray-300">Trial</span>
              </div>
            </div>
          </div>
        </Panel>
        
        {/* Help Panel */}
        <Panel position="bottom-center">
          <div className="bg-gray-900/60 backdrop-blur-md rounded-full px-6 py-2 shadow-xl border border-[#00D084]/20">
            <p className="text-xs text-gray-400">
              <span className="text-[#00D084]">⟨</span> Click <span className="text-blue-400">⊕</span> to expand <span className="text-gray-600">•</span> Drag nodes <span className="text-gray-600">•</span> Scroll to zoom <span className="text-gray-600">•</span> Load drugs/trials in List view <span className="text-[#00D084]">⟩</span>
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

export default function MindMapView({ results, drugsMap = new Map(), trialsMap = new Map() }: MindMapViewProps) {
  if (results.length === 0) {
    return (
      <div className="h-[600px] relative flex flex-col items-center justify-center rounded-2xl overflow-hidden border border-[#00D084]/20">
        <div 
          className="absolute inset-0"
          style={{
            background: 'radial-gradient(ellipse at center, rgba(0, 208, 132, 0.1) 0%, rgba(10, 10, 10, 1) 70%)',
          }}
        />
        <div className="absolute left-1/2 top-1/2 -translate-x-1/2 -translate-y-1/2 w-[300px] h-[300px] rounded-full border border-[#00D084]/20 animate-pulse" />
        <div className="absolute left-1/2 top-1/2 -translate-x-1/2 -translate-y-1/2 w-[200px] h-[200px] rounded-full border border-[#00D084]/30 animate-pulse" style={{ animationDelay: '0.5s' }} />
        <div className="absolute left-1/2 top-1/2 -translate-x-1/2 -translate-y-1/2 w-[100px] h-[100px] rounded-full border border-[#00D084]/40 animate-pulse" style={{ animationDelay: '1s' }} />
        
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
        <MindMapInner 
          results={results} 
          drugsMap={drugsMap}
          trialsMap={trialsMap}
        />
      </ReactFlowProvider>
    </div>
  );
}

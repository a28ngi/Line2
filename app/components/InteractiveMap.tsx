'use client';

import { useCallback, useEffect } from 'react';
import ReactFlow, {
    Background,
    Controls,
    Node,
    Edge,
    Connection,
    addEdge,
    useNodesState,
    useEdgesState,
    MarkerType,
    Handle,
    Position
} from 'reactflow';
import 'reactflow/dist/style.css';
import { ChatNode } from '../types';
import dagre from 'dagre';

interface InteractiveMapProps {
    structure: ChatNode[];
    activeNodeId: string | null;
    onNodeClick: (nodeId: string) => void;
    onStructureChange: (newStructure: ChatNode[]) => void;
}

// Custom Node to match design
const CustomNode = ({ data }: { data: { label: string, isCollapsed: boolean, hasChildren: boolean } }) => {
    return (
        <div className="px-4 py-2 shadow-md rounded-lg bg-white border-2 border-indigo-200 hover:border-indigo-400 transition-all font-sans min-w-[150px] text-center cursor-pointer">
            <Handle type="target" position={Position.Top} className="w-2 h-2 !bg-indigo-300" />
            <div className="text-sm font-medium text-slate-800">{data.label}</div>
            {data.hasChildren && (
                <div className="text-[10px] text-slate-400 mt-0.5">{data.isCollapsed ? '...' : '▼'}</div>
            )}
            <Handle type="source" position={Position.Bottom} className="w-2 h-2 !bg-indigo-300" />
        </div>
    );
};

const formatChildrenCount = (data: any) => {
    return '...';
};

const nodeTypes = {
    custom: CustomNode,
};

// Layout helper (DAGRE) - only used for initial layout if no positions exist
const getLayoutedElements = (nodes: Node[], edges: Edge[], direction = 'TB') => {
    const dagreGraph = new dagre.graphlib.Graph();
    dagreGraph.setDefaultEdgeLabel(() => ({}));
    dagreGraph.setGraph({ rankdir: direction });

    nodes.forEach((node) => {
        dagreGraph.setNode(node.id, { width: 150, height: 50 });
    });

    edges.forEach((edge) => {
        dagreGraph.setEdge(edge.source, edge.target);
    });

    dagre.layout(dagreGraph);

    nodes.forEach((node) => {
        const nodeWithPosition = dagreGraph.node(node.id);
        // Only apply layout if position is 0,0 (default) or invalid
        if (node.position.x === 0 && node.position.y === 0) {
            node.position = {
                x: nodeWithPosition.x - 75,
                y: nodeWithPosition.y - 25,
            };
        }
    });

    return { nodes, edges };
};

export function InteractiveMap({ structure, activeNodeId, onNodeClick, onStructureChange }: InteractiveMapProps) {
    const [nodes, setNodes, onNodesChange] = useNodesState([]);
    const [edges, setEdges, onEdgesChange] = useEdgesState([]);

    // Sync structure to ReactFlow nodes/edges
    useEffect(() => {
        if (!structure || structure.length === 0) return;

        const newNodes: Node[] = structure.map(node => ({
            id: node.id,
            type: 'custom',
            data: {
                label: node.label,
                isCollapsed: node.isCollapsed,
                hasChildren: (node.children || []).length > 0
            },
            // Use stored position or default to 0,0 for layouting
            position: node.position || { x: 0, y: 0 },
            // Hide hidden nodes (children of collapsed parents)
            hidden: isNodeHidden(node.id, structure)
        }));

        const newEdges: Edge[] = [];
        structure.forEach(node => {
            if (node.parentId) {
                newEdges.push({
                    id: `e-${node.parentId}-${node.id}`,
                    source: node.parentId,
                    target: node.id,
                    type: 'smoothstep',
                    markerEnd: { type: MarkerType.ArrowClosed, color: '#94a3b8' },
                    style: { stroke: '#94a3b8', strokeWidth: 1.5 },
                    hidden: isNodeHidden(node.id, structure)
                });
            }
        });

        // Only layout if we detect nodes without valid positions (e.g. initial generation)
        // We'll trust that if positions exist in structure, they are correct.
        const layouted = getLayoutedElements(newNodes, newEdges);
        setNodes(layouted.nodes);
        setEdges(layouted.edges);

    }, [structure]);

    const isNodeHidden = (nodeId: string, fullStructure: ChatNode[]): boolean => {
        const node = fullStructure.find(n => n.id === nodeId);
        if (!node || !node.parentId) return false;

        const parent = fullStructure.find(n => n.id === node.parentId);
        if (parent && parent.isCollapsed) return true;

        return isNodeHidden(parent!.id, fullStructure);
    };

    const onNodeDragStop = useCallback((event: any, node: Node) => {
        // Update persistence
        const updatedStructure = structure.map(n => {
            if (n.id === node.id) {
                return { ...n, position: node.position };
            }
            return n;
        });
        onStructureChange(updatedStructure);
    }, [structure, onStructureChange]);

    const handleNodeDoubleClick = (_: React.MouseEvent, node: Node) => {
        onNodeClick(node.id);
    };

    return (
        <div className="w-full h-full bg-slate-50">
            <ReactFlow
                nodes={nodes}
                edges={edges}
                onNodesChange={onNodesChange}
                onEdgesChange={onEdgesChange}
                onNodeDragStop={onNodeDragStop}
                onNodeDoubleClick={handleNodeDoubleClick}
                nodeTypes={nodeTypes}
                fitView
                className="bg-slate-50"
            >
                <Background color="#cbd5e1" gap={16} size={1} />
                <Controls />
            </ReactFlow>
        </div>
    );
}

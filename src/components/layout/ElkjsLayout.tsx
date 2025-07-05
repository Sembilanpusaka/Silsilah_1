// src/components/layout/ElkjsLayout.tsx
import React, { useLayoutEffect } from 'react';
import ReactFlow, {
  Controls,
  Background,
  useNodesState,
  useEdgesState,
  useReactFlow,
  Node,
  Edge,
  NodeTypes,
} from 'reactflow';
import ELK from 'elkjs/lib/elk.bundled.js';

const elk = new ELK();

const elkOptions = {
  'elk.algorithm': 'layered',
  'elk.layered.spacing.nodeNodeBetweenLayers': '100',
  'elk.spacing.nodeNode': '80',
};

interface ElkjsLayoutProps {
    nodes: Node[];
    edges: Edge[];
    nodeTypes: NodeTypes;
    viewType: 'descendants' | 'ancestors';
}

export const ElkjsLayout: React.FC<ElkjsLayoutProps> = ({ nodes: initialNodes, edges: initialEdges, nodeTypes, viewType }) => {
  const [nodes, setNodes, onNodesChange] = useNodesState(initialNodes);
  const [edges, setEdges, onEdgesChange] = useEdgesState(initialEdges);
  const { fitView } = useReactFlow();

  useLayoutEffect(() => {
    const graph = {
      id: 'root',
      layoutOptions: { ...elkOptions, 'elk.direction': viewType === 'descendants' ? 'DOWN' : 'UP' },
      children: initialNodes.map((node) => ({ ...node, width: 208, height: 72 })), // w-52, h-18 in px
      edges: initialEdges,
    };

    elk.layout(graph)
      .then((layoutedGraph) => {
        setNodes(
          layoutedGraph.children!.map((node: any) => ({
            ...node,
            position: { x: node.x, y: node.y },
          }))
        );
        setEdges(layoutedGraph.edges as Edge[]);
        window.requestAnimationFrame(() => fitView());
      })
      .catch(console.error);
  }, [initialNodes, initialEdges, viewType, setNodes, setEdges, fitView]);

  return (
    <ReactFlow
      nodes={nodes}
      edges={edges}
      onNodesChange={onNodesChange}
      onEdgesChange={onEdgesChange}
      nodeTypes={nodeTypes}
      fitView
    >
      <Controls />
      <Background />
    </ReactFlow>
  );
};
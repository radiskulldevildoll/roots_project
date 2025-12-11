"use client";
import React, { useEffect, useCallback, useState } from 'react';
import ReactFlow, {
  useNodesState,
  useEdgesState,
  addEdge,
  Controls,
  Background
} from 'reactflow';
import 'reactflow/dist/style.css';
import dagre from 'dagre';
import axios from 'axios';
import AddRelativeModal from './AddRelativeModal';

// 1. The Layout Engine Setup
const getLayoutedElements = (nodes, edges) => {
  const dagreGraph = new dagre.graphlib.Graph();
  dagreGraph.setDefaultEdgeLabel(() => ({}));

  // Direction: 'TB' = Top to Bottom, 'LR' = Left to Right
  dagreGraph.setGraph({ rankdir: 'TB' });

  nodes.forEach((node) => {
    dagreGraph.setNode(node.id, { width: 150, height: 50 });
  });

  edges.forEach((edge) => {
    dagreGraph.setEdge(edge.source, edge.target);
  });

  dagre.layout(dagreGraph);

  const layoutedNodes = nodes.map((node) => {
    const nodeWithPosition = dagreGraph.node(node.id);
    // Slight shift to center the node
    node.position = {
      x: nodeWithPosition.x - 75,
      y: nodeWithPosition.y - 25,
    };
    return node;
  });

  return { nodes: layoutedNodes, edges };
};

export default function FamilyTreeCanvas() {
  const [nodes, setNodes, onNodesChange] = useNodesState([]);
  const [edges, setEdges, onEdgesChange] = useEdgesState([]);
  const [modalOpen, setModalOpen] = useState(false);
  const [selectedNode, setSelectedNode] = useState(null);

  // 1. The Event Handler
  const onNodeClick = useCallback((event, node) => {
    setSelectedNode(node);
    setModalOpen(true);
  }, []);

  // 2. Fetch Data from our Django API
  useEffect(() => {
    const fetchData = async () => {
      const token = localStorage.getItem('access_token');
      const res = await axios.get('http://localhost:8000/api/genealogy/visual_tree/', {
        headers: { Authorization: `Bearer ${token}` }
      });

      // API returns { nodes: [...], edges: [...] }
      // We need to format them for ReactFlow
      const rawNodes = res.data.nodes.map(n => ({
        id: n.id,
        data: { label: n.label }, // We can make custom Node components later for images!
        position: { x: 0, y: 0 } // Placeholder, Dagre will fix this
      }));

      const rawEdges = res.data.edges.map(e => ({
        id: e.id,
        source: e.source,
        target: e.target,
        animated: e.animated, // Now using API-provided animated
        style: e.style // Now using API-provided style
      }));

      const { nodes: layoutedNodes, edges: layoutedEdges } = getLayoutedElements(rawNodes, rawEdges);

      setNodes(layoutedNodes);
      setEdges(layoutedEdges);
    };

    fetchData();
  }, []);

  // 2. The Refresher
  const refreshTree = async () => {
    // This just re-runs the fetch logic we wrote earlier
    // In a production app, we'd refactor fetch logic into a reusable function
    const token = localStorage.getItem('access_token');
    const res = await axios.get('http://localhost:8000/api/genealogy/visual_tree/', {
      headers: { Authorization: `Bearer ${token}` }
    });

    const rawNodes = res.data.nodes.map(n => ({
      id: n.id,
      data: { label: n.label },
      position: { x: 0, y: 0 }
    }));

    const rawEdges = res.data.edges.map(e => ({
      id: e.id,
      source: e.source,
      target: e.target,
      animated: e.animated,
      style: e.style
    }));

    const { nodes: layoutedNodes, edges: layoutedEdges } = getLayoutedElements(rawNodes, rawEdges);

    setNodes(layoutedNodes);
    setEdges(layoutedEdges);
  };

  return (
    <div className="h-screen w-full bg-gray-900">
      <ReactFlow
        nodes={nodes}
        edges={edges}
        onNodesChange={onNodesChange}
        onEdgesChange={onEdgesChange}
        onNodeClick={onNodeClick} // <--- Added this!
        fitView
      >
        <Background color="#374151" gap={16} />
        <Controls />
      </ReactFlow>

      {/* The Modal */}
      <AddRelativeModal
        isOpen={modalOpen}
        onClose={() => setModalOpen(false)}
        sourceNode={selectedNode}
        onSuccess={refreshTree}
      />
    </div>
  );
}

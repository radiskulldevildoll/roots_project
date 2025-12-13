"use client";
import React, { useEffect, useCallback, useState, memo } from 'react';
import ReactFlow, {
  useNodesState,
  useEdgesState,
  Controls,
  Background,
  MiniMap,
  Handle,
  Position
} from 'reactflow';
import 'reactflow/dist/style.css';
import dagre from 'dagre';
import axios from 'axios';
import { Search, X, MapPin, Grid3x3, Maximize2, User, UserPlus, Settings, Edit, Trash2, Heart } from 'lucide-react';
import { motion, AnimatePresence } from 'framer-motion';
import toast from 'react-hot-toast';
import { endpoints } from '../../../utils/config';
import AddRelativeModal from '../../../components/AddRelativeModal';
import PersonEditModal from '../../../components/PersonEditModal';
import PersonRelationshipsModal from '../../../components/PersonRelationshipsModal';
import UserEditModal from '../../../components/UserEditModal';

// Enhanced Portrait Node with animations
const PortraitNode = memo(({ data }) => {
  const confidenceLevel = data.confidence_level || 100;
  const color = confidenceLevel >= 80 ? '#22c55e' : 
                confidenceLevel >= 50 ? '#eab308' : '#f97316';
  
  return (
    <motion.div
      initial={{ scale: 0.8, opacity: 0 }}
      animate={{ scale: 1, opacity: 1 }}
      transition={{ duration: 0.3 }}
      whileHover={{ scale: 1.05 }}
      style={{
        display: 'flex',
        flexDirection: 'column',
        alignItems: 'center',
        background: 'linear-gradient(to bottom right, #1f2937, #111827)',
        padding: '12px',
        borderRadius: '12px',
        border: `2px solid ${color}`,
        width: '128px',
        minHeight: '120px',
        boxShadow: '0 20px 25px -5px rgba(0, 0, 0, 0.1), 0 10px 10px -5px rgba(0, 0, 0, 0.04)',
        cursor: 'pointer',
        position: 'relative'
      }}
    >
      <Handle type="target" position={Position.Top} style={{ background: color, width: '10px', height: '10px' }} id="top" />
      <Handle type="target" position={Position.Left} style={{ background: color, width: '10px', height: '10px' }} id="left" />
      {data.profile_picture ? (
        <div style={{
          width: '56px',
          height: '56px',
          borderRadius: '50%',
          overflow: 'hidden',
          marginBottom: '8px',
          border: '2px solid #374151'
        }}>
          <img 
            src={data.profile_picture} 
            alt="Profile" 
            style={{ width: '100%', height: '100%', objectFit: 'cover' }}
          />
        </div>
      ) : (
        <div style={{
          width: '56px',
          height: '56px',
          borderRadius: '50%',
          background: 'linear-gradient(to bottom right, #374151, #4b5563)',
          marginBottom: '8px',
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center',
          border: '2px solid #374151'
        }}>
          <User size={24} color="#9ca3af" />
        </div>
      )}
      <div style={{ color: 'white', fontSize: '12px', fontWeight: 'bold', textAlign: 'center', marginBottom: '4px', lineHeight: '1.2' }}>
        {data.label}
      </div>
      {data.birth_year && (
        <div style={{ color: '#9ca3af', fontSize: '10px' }}>
          b. {data.birth_year}
        </div>
      )}
      {data.is_living === false && data.death_year && (
        <div style={{ color: '#9ca3af', fontSize: '10px' }}>
          d. {data.death_year}
        </div>
      )}
      <Handle type="source" position={Position.Bottom} style={{ background: color, width: '10px', height: '10px' }} id="bottom" />
      <Handle type="source" position={Position.Right} style={{ background: color, width: '10px', height: '10px' }} id="right" />
    </motion.div>
  );
});

PortraitNode.displayName = 'PortraitNode';

// Define nodeTypes outside component to prevent recreation on each render
const nodeTypes = { portrait: PortraitNode };

// Layout Engine Setup with spouse grouping for same-level alignment
const getLayoutedElements = (nodes, spouseEdges, layoutEdges, direction = 'TB') => {
  const dagreGraph = new dagre.graphlib.Graph();
  dagreGraph.setDefaultEdgeLabel(() => ({}));

  // Find connected components of spouses (married pairs)
  const spouseMap = new Map();
  spouseEdges.forEach(edge => {
    if (!spouseMap.has(edge.source)) spouseMap.set(edge.source, new Set());
    if (!spouseMap.has(edge.target)) spouseMap.set(edge.target, new Set());
    spouseMap.get(edge.source).add(edge.target);
    spouseMap.get(edge.target).add(edge.source);
  });

  const visited = new Set();
  const spouseGroups = [];
  spouseMap.forEach((neighbors, personId) => {
    if (!visited.has(personId)) {
      const group = new Set();
      group.add(personId);
      visited.add(personId);
      const stack = [personId];
      while (stack.length > 0) {
        const current = stack.pop();
        (spouseMap.get(current) || []).forEach(neighbor => {
          if (!visited.has(neighbor)) {
            visited.add(neighbor);
            group.add(neighbor);
            stack.push(neighbor);
          }
        });
      }
      spouseGroups.push(Array.from(group));
    }
  });

  // Create composite nodes for spouse groups
  const groupNodes = spouseGroups.map((group, groupIndex) => ({
    id: `group-${groupIndex}`,
    personIds: group,
    width: direction === 'TB' ? group.length * 150 + (group.length - 1) * 20 : 150,
    height: direction === 'TB' ? 120 : group.length * 120 + (group.length - 1) * 20,
  }));

  const singleNodes = nodes.filter(node => !spouseGroups.some(group => group.includes(node.id)));

  dagreGraph.setGraph({
    rankdir: direction,
    nodesep: direction === 'TB' ? 60 : 100,
    ranksep: direction === 'TB' ? 100 : 120,
    marginx: 20,
    marginy: 20
  });

  groupNodes.forEach((groupNode) => {
    dagreGraph.setNode(groupNode.id, { width: groupNode.width, height: groupNode.height });
  });

  singleNodes.forEach((node) => {
    dagreGraph.setNode(node.id, { width: 150, height: 120 });
  });

  layoutEdges.forEach((edge) => {
    let sourceId = edge.source;
    let targetId = edge.target;
    // Map to group if person is in a group
    const sourceGroup = groupNodes.find(g => g.personIds.includes(edge.source));
    if (sourceGroup) sourceId = sourceGroup.id;
    const targetGroup = groupNodes.find(g => g.personIds.includes(edge.target));
    if (targetGroup) targetId = targetGroup.id;
    dagreGraph.setEdge(sourceId, targetId);
  });

  dagre.layout(dagreGraph);

  const layoutedNodes = [];
  // Position single nodes
  singleNodes.forEach((node) => {
    const nodeWithPosition = dagreGraph.node(node.id);
    layoutedNodes.push({
      ...node,
      position: {
        x: nodeWithPosition.x - 75,
        y: nodeWithPosition.y - 60,
      },
    });
  });

  // Position spouse groups
  groupNodes.forEach((groupNode) => {
    const groupWithPosition = dagreGraph.node(groupNode.id);
    const spouses = nodes.filter(node => groupNode.personIds.includes(node.id));
    spouses.forEach((spouse, spouseIndex) => {
      let x = groupWithPosition.x - groupNode.width / 2;
      let y = groupWithPosition.y - groupNode.height / 2;
      if (direction === 'TB') {
        // Horizontal arrangement
        x += spouseIndex * (150 + 20) + 75;
        y += 60;
      } else {
        // Vertical arrangement
        x += 75;
        y += spouseIndex * (120 + 20) + 60;
      }
      layoutedNodes.push({
        ...spouse,
        position: { x, y },
      });
    });
  });

  return { nodes: layoutedNodes, edges: layoutEdges };
};

export default function FamilyTreeCanvas() {
  const [nodes, setNodes, onNodesChange] = useNodesState([]);
  const [edges, setEdges, onEdgesChange] = useEdgesState([]);
  const [addModalOpen, setAddModalOpen] = useState(false);
  const [editModalOpen, setEditModalOpen] = useState(false);
  const [relationshipsModalOpen, setRelationshipsModalOpen] = useState(false);
  const [userModalOpen, setUserModalOpen] = useState(false);
  const [selectedNode, setSelectedNode] = useState(null);
  const [searchQuery, setSearchQuery] = useState('');
  const [allData, setAllData] = useState({ nodes: [], edges: [] });
  const [layoutDirection, setLayoutDirection] = useState('TB');
  const [isSearchFocused, setIsSearchFocused] = useState(false);
  const [contextMenu, setContextMenu] = useState({ visible: false, x: 0, y: 0, node: null });

  const onNodeClick = useCallback((event, node) => {
    setSelectedNode(node);
    setAddModalOpen(true);
  }, []);

  const onNodeDoubleClick = useCallback((event, node) => {
    setSelectedNode(node);
    setEditModalOpen(true);
  }, []);

  const onNodeContextMenu = useCallback((event, node) => {
    event.preventDefault();
    event.stopPropagation();

    // Calculate position relative to viewport
    let x = event.clientX;
    let y = event.clientY;

    // Adjust if menu would go off screen
    const menuWidth = 200;
    const menuHeight = 150;
    if (x + menuWidth > window.innerWidth) x = window.innerWidth - menuWidth - 10;
    if (y + menuHeight > window.innerHeight) y = window.innerHeight - menuHeight - 10;
    if (x < 10) x = 10;
    if (y < 10) y = 10;

    setContextMenu({
      visible: true,
      x,
      y,
      node
    });
  }, []);

  const onPaneContextMenu = useCallback((event) => {
    event.preventDefault();
    setContextMenu({ visible: false, x: 0, y: 0, node: null });
  }, []);

  const handleDeletePerson = async () => {
    if (!contextMenu.node) return;

    if (!window.confirm(`Are you sure you want to delete ${contextMenu.node.data.label}? This will also remove all their relationships and cannot be undone.`)) {
      setContextMenu({ visible: false, x: 0, y: 0, node: null });
      return;
    }

    const token = localStorage.getItem('access_token');
    try {
      await axios.delete(`${endpoints.genealogy.people}${contextMenu.node.id}/`, {
        headers: { Authorization: `Bearer ${token}` }
      });
      toast.success('🗑️ Person deleted successfully');
      setContextMenu({ visible: false, x: 0, y: 0, node: null });
      refreshTree();
    } catch (error) {
      console.error('Failed to delete person:', error);
      toast.error('Failed to delete person. Please try again.');
    }
  };

  const handleEditPerson = () => {
    if (!contextMenu.node) return;
    setSelectedNode(contextMenu.node);
    setEditModalOpen(true);
    setContextMenu({ visible: false, x: 0, y: 0, node: null });
  };

  const handleEditRelationships = () => {
    if (!contextMenu.node) return;
    setSelectedNode(contextMenu.node);
    setRelationshipsModalOpen(true);
    setContextMenu({ visible: false, x: 0, y: 0, node: null });
  };

  const fetchData = async (focusId = null) => {
    const token = localStorage.getItem('access_token');

    let url = endpoints.genealogy.visualTree;
    if (focusId) {
      url += `?focus_id=${focusId}`;
    }

    try {
      const res = await axios.get(url, {
        headers: { Authorization: `Bearer ${token}` }
      });

      const rawNodes = res.data.nodes.map(n => ({
        id: n.id,
        type: 'portrait',
        data: {
          label: n.label,
          profile_picture: n.profile_picture,
          confidence_level: n.confidence_level,
          birth_year: n.birth_year,
          death_year: n.death_year,
          is_living: n.is_living
        },
        position: { x: 0, y: 0 }
      }));

      const rawEdges = res.data.edges.map(e => ({
        id: e.id,
        source: e.source,
        target: e.target,
        animated: e.animated,
        relationship_type: e.relationship_type,
        ...((e.relationship_type === 'MAR') ? {
          sourceHandle: 'right',
          targetHandle: 'left',
          style: {
            stroke: '#ff4444',
            strokeWidth: 3,
          }
        } : {
          style: {
            stroke: '#22c55e',
            strokeWidth: 3,
          }
        }),
        type: 'default'
      }));

      const fullData = { nodes: rawNodes, edges: rawEdges };
      setAllData(fullData);
      applyFilter(searchQuery, fullData);
    } catch (error) {
        console.error("Failed to fetch tree:", error);
        toast.error('Failed to load family tree');
    }
  };

  const applyFilter = (query, data) => {
    let filteredNodes = data.nodes;
    let filteredEdges = data.edges;

    if (query) {
      const lowerQuery = query.toLowerCase();
      const nodeIds = new Set(
        data.nodes
          .filter(node => node.data.label.toLowerCase().includes(lowerQuery))
          .map(node => node.id)
      );

      filteredNodes = data.nodes.filter(node => nodeIds.has(node.id));
      filteredEdges = data.edges.filter(edge =>
        nodeIds.has(edge.source) && nodeIds.has(edge.target)
      );
    }

    const layoutEdges = filteredEdges.filter(e => e.relationship_type !== 'MAR');
    const spouseEdges = filteredEdges.filter(e => e.relationship_type === 'MAR').map(e => ({
      id: e.id,
      source: e.source,
      target: e.target,
      animated: e.animated,
      sourceHandle: 'right',
      targetHandle: 'left',
      style: { stroke: '#ff4444', strokeWidth: 3 },
      type: 'default'
    }));

    const { nodes: layoutedNodes, edges: layoutedEdges } = getLayoutedElements(
      filteredNodes,
      spouseEdges,
      layoutEdges,
      layoutDirection
    );
    setNodes(layoutedNodes);
    setEdges([...layoutedEdges, ...spouseEdges]);
  };

  useEffect(() => {
    fetchData();
  }, []);

  useEffect(() => {
    applyFilter(searchQuery, allData);
  }, [searchQuery, layoutDirection]);

  const refreshTree = async () => {
    await fetchData();
  };

  const onConnect = useCallback(async (connection) => {
    const { source, target, sourceHandle, targetHandle } = connection;
    const token = localStorage.getItem('access_token');

    if (source === target) {
      toast.error('Cannot connect a person to themselves');
      return;
    }

    if (sourceHandle === 'right' && targetHandle === 'left') {
      // Create spouse relationship
      try {
        await axios.post(endpoints.genealogy.relationships, {
          person_a: source,
          person_b: target,
          relationship_type: 'MAR'
        }, { headers: { Authorization: `Bearer ${token}` } });
        toast.success('💍 Spouse relationship created');
        await refreshTree();
      } catch (error) {
        console.error('Failed to create spouse relationship:', error);
        toast.error('Failed to create spouse relationship');
      }
    } else if (sourceHandle === 'bottom' && targetHandle === 'top') {
      // Create parent-child relationship (source is child, target is parent)
      try {
        await axios.post(endpoints.genealogy.parentLinks, {
          child: source,
          single_parent: target,
          link_type: 'BIO'
        }, { headers: { Authorization: `Bearer ${token}` } });
        toast.success('👶 Parent-child relationship created');
        await refreshTree();
      } catch (error) {
        console.error('Failed to create parent-child relationship:', error);
        toast.error('Failed to create parent-child relationship');
      }
    } else {
      toast.error('Invalid connection: drag from right 📦 (for spouses) or bottom 🔽 (for children)');
    }
  }, [refreshTree]);

  const clearSearch = () => {
    setSearchQuery('');
  };

  const toggleLayout = () => {
    setLayoutDirection(prev => prev === 'TB' ? 'LR' : 'TB');
    toast.success(`Layout changed to ${layoutDirection === 'TB' ? 'Horizontal' : 'Vertical'}`);
  };

  return nodes.length === 0 ? (
    // First Person Welcome Screen with animation
    <div style={{ width: '100%', height: '100%' }} className="bg-gradient-to-br from-gray-900 via-gray-800 to-gray-900 flex items-center justify-center relative overflow-hidden p-4">
      {/* Animated background elements */}
      <div className="absolute inset-0 overflow-hidden opacity-10">
        <div className="absolute w-96 h-96 bg-emerald-500 rounded-full blur-3xl -top-48 -left-48 animate-pulse"></div>
        <div className="absolute w-96 h-96 bg-teal-500 rounded-full blur-3xl -bottom-48 -right-48 animate-pulse delay-1000"></div>
      </div>

      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.5 }}
        className="bg-gray-800 p-8 md:p-12 rounded-2xl shadow-2xl border border-gray-700 text-center max-w-md relative z-10"
      >
        <div className="bg-gradient-to-br from-emerald-500 to-teal-500 w-20 h-20 rounded-full flex items-center justify-center mx-auto mb-6">
          <User size={40} className="text-white" />
        </div>
        <h2 className="text-2xl md:text-3xl font-bold text-emerald-400 mb-4">Welcome to Your Family Tree</h2>
        <p className="text-gray-400 mb-8 text-sm md:text-base">
          Begin your genealogy journey by adding the first person in your family.
        </p>
        <button
          onClick={() => {setSelectedNode(null); setAddModalOpen(true);}}
          className="bg-gradient-to-r from-emerald-600 to-teal-600 hover:from-emerald-500 hover:to-teal-500 py-3 px-8 rounded-lg font-bold text-lg transition-all shadow-lg shadow-emerald-900/50 transform hover:scale-105"
        >
          Add First Person
        </button>
      </motion.div>

      <AddRelativeModal
        isOpen={addModalOpen}
        onClose={() => setAddModalOpen(false)}
        sourceNode={selectedNode}
        existingPeople={nodes}
        onSuccess={refreshTree}
        onEditPersonClick={(personId) => {
          setAddModalOpen(false); // Close AddRelativeModal
          setSelectedNode(nodes.find(n => n.id === personId)); // Ensure selectedNode is correct
          setEditModalOpen(true); // Open PersonEditModal
        }}
      />

      <PersonEditModal
        isOpen={editModalOpen}
        onClose={() => setEditModalOpen(false)}
        personId={selectedNode?.id}
        onSuccess={refreshTree}
      />
    </div>
  ) : (
    // Tree View with enhanced mobile support
    <div style={{ width: '100%', height: '100%', background: 'linear-gradient(to bottom right, #111827, #1f2937, #111827)', position: 'relative' }} className="bg-gradient-to-br from-gray-900 via-gray-800 to-gray-900 relative">
      {/* Top Control Bar */}
      <div className="absolute top-2 sm:top-4 left-2 sm:left-4 right-2 sm:right-4 z-10 flex flex-col sm:flex-row gap-2 sm:gap-3">
        {/* Search Bar */}
        <motion.div 
          className={`bg-gray-800 rounded-xl shadow-lg border border-gray-700 transition-all ${
            isSearchFocused ? 'ring-2 ring-emerald-500' : ''
          } flex-1 sm:max-w-md`}
          whileTap={{ scale: 0.98 }}
        >
          <div className="relative p-2 sm:p-3">
            <Search size={18} className="absolute left-4 sm:left-5 top-1/2 transform -translate-y-1/2 text-gray-400" />
            <input
              type="text"
              placeholder="Search family members..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              onFocus={() => setIsSearchFocused(true)}
              onBlur={() => setIsSearchFocused(false)}
              className="pl-9 sm:pl-10 pr-9 sm:pr-10 py-2 w-full bg-transparent text-white text-sm sm:text-base rounded-lg focus:outline-none placeholder-gray-500"
            />
            {searchQuery && (
              <button
                onClick={clearSearch}
                className="absolute right-4 sm:right-5 top-1/2 transform -translate-y-1/2 text-gray-400 hover:text-white transition-colors"
              >
                <X size={18} />
              </button>
            )}
          </div>
        </motion.div>

        {/* Control Buttons */}
        <div className="flex gap-2">
          <motion.button
            whileHover={{ scale: 1.05 }}
            whileTap={{ scale: 0.95 }}
            onClick={() => { setSelectedNode(null); setAddModalOpen(true); }}
            className="bg-emerald-600 hover:bg-emerald-500 p-2 sm:p-3 rounded-xl shadow-lg border border-emerald-500 transition-all"
            title="Add New Person"
          >
            <UserPlus size={20} className="text-white" />
          </motion.button>
          <motion.button
            whileHover={{ scale: 1.05 }}
            whileTap={{ scale: 0.95 }}
            onClick={() => setUserModalOpen(true)}
            className="bg-gray-800 hover:bg-gray-700 p-2 sm:p-3 rounded-xl shadow-lg border border-gray-700 transition-all"
            title="Edit User Profile"
          >
            <Settings size={20} className="text-blue-400" />
          </motion.button>
          <motion.button
            whileHover={{ scale: 1.05 }}
            whileTap={{ scale: 0.95 }}
            onClick={toggleLayout}
            className="bg-gray-800 hover:bg-gray-700 p-2 sm:p-3 rounded-xl shadow-lg border border-gray-700 transition-all flex items-center gap-2"
            title="Toggle Layout"
          >
            <Grid3x3 size={20} className="text-emerald-400" />
            <span className="hidden sm:inline text-white text-sm">
              {layoutDirection === 'TB' ? 'Vertical' : 'Horizontal'}
            </span>
          </motion.button>
        </div>
      </div>

      {/* Stats Bar - Mobile optimized */}
      <div className="absolute bottom-2 sm:bottom-4 left-2 sm:left-4 z-10">
        <div className="bg-gray-800 bg-opacity-90 backdrop-blur-sm px-3 sm:px-4 py-2 rounded-xl shadow-lg border border-gray-700">
          <div className="flex items-center gap-2 text-xs sm:text-sm">
            <MapPin size={14} className="text-emerald-400" />
            <span className="text-gray-400">
              <span className="text-white font-bold">{nodes.length}</span> family member{nodes.length !== 1 ? 's' : ''}
            </span>
          </div>
        </div>
      </div>

      {/* Hint overlay for mobile */}
      <div className="absolute top-20 left-1/2 transform -translate-x-1/2 z-10 sm:hidden">
        <motion.div
          initial={{ opacity: 0, y: -10 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 1, duration: 0.5 }}
          className="bg-gray-800 bg-opacity-90 backdrop-blur-sm px-4 py-2 rounded-lg text-xs text-gray-300 text-center border border-gray-700"
        >
          Drag to link • Tap to add • Right-click/long-press for menu
        </motion.div>
      </div>

      <ReactFlow
        style={{ width: '100%', height: '100%' }}
        nodes={nodes}
        edges={edges}
        nodeTypes={nodeTypes}
        onNodesChange={onNodesChange}
        onEdgesChange={onEdgesChange}
        onConnect={onConnect}
        onNodeClick={onNodeClick}
        onNodeDoubleClick={onNodeDoubleClick}
        onNodeContextMenu={onNodeContextMenu}
        onPaneContextMenu={onPaneContextMenu}
        fitView
        minZoom={0.1}
        maxZoom={2}
        defaultViewport={{ x: 0, y: 0, zoom: 0.8 }}
        attributionPosition="bottom-right"
      >
        <Background
          color="#374151"
          gap={16}
          size={1}
          variant="dots"
        />
        <Controls
          className="bg-gray-800 border border-gray-700 rounded-lg shadow-lg"
          showInteractive={false}
        />
        <MiniMap
          nodeColor={(node) => {
            const level = node.data.confidence_level || 100;
            return level >= 80 ? '#10b981' : level >= 50 ? '#eab308' : '#f97316';
          }}
          nodeStrokeWidth={3}
          className="bg-gray-800 border border-gray-700 rounded-lg shadow-lg"
          maskColor="rgba(0, 0, 0, 0.6)"
        />
      </ReactFlow>

      {/* Context Menu */}
      {contextMenu.visible && (
        <div
          className="fixed z-50 bg-gray-800 border border-gray-700 rounded-lg shadow-2xl py-2"
          style={{
            left: contextMenu.x,
            top: contextMenu.y,
            minWidth: '200px'
          }}
        >
          <div className="px-3 py-1 border-b border-gray-700">
            <h3 className="text-white font-medium text-sm">{contextMenu.node?.data?.label}</h3>
          </div>
          <div className="py-1">
            <button
              onClick={() => handleEditPerson()}
              className="w-full flex items-center gap-3 px-3 py-2 text-left text-sm text-white hover:bg-gray-700 transition-colors"
            >
              <Edit size={16} className="text-gray-400" />
              <span>Edit Profile</span>
            </button>
            <button
              onClick={() => handleEditRelationships()}
              className="w-full flex items-center gap-3 px-3 py-2 text-left text-sm text-white hover:bg-gray-700 transition-colors"
            >
              <Heart size={16} className="text-pink-400" />
              <span>Manage Relationships</span>
            </button>
            <button
              onClick={() => handleDeletePerson()}
              className="w-full flex items-center gap-3 px-3 py-2 text-left text-sm text-red-400 hover:bg-red-900/20 transition-colors"
            >
              <Trash2 size={16} />
              <span>Delete Person</span>
            </button>
          </div>
        </div>
      )}

      <AddRelativeModal
          isOpen={addModalOpen}
          onClose={() => setAddModalOpen(false)}
          sourceNode={selectedNode}
          existingPeople={nodes}
          onSuccess={refreshTree}
          onEditPersonClick={(personId) => {
            setAddModalOpen(false);
            const personNode = nodes.find(n => n.id === personId);
            if (personNode) setSelectedNode(personNode);
            setEditModalOpen(true);
          }}
        />

      <PersonEditModal
        isOpen={editModalOpen}
        onClose={() => setEditModalOpen(false)}
        personId={selectedNode?.id}
        onSuccess={refreshTree}
      />

      <PersonRelationshipsModal
        isOpen={relationshipsModalOpen}
        onClose={() => setRelationshipsModalOpen(false)}
        personId={selectedNode?.id}
        personName={selectedNode?.data?.label}
        existingPeople={nodes}
        onSuccess={refreshTree}
        onEditProfileRequest={() => {
          setRelationshipsModalOpen(false);
          setEditModalOpen(true);
        }}
      />

      <UserEditModal
        isOpen={userModalOpen}
        onClose={() => setUserModalOpen(false)}
        onSuccess={() => toast.success('User profile updated')}
      />
    </div>
  );
}

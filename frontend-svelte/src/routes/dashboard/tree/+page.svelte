<script>
    import { onMount } from 'svelte';
    import { writable, get } from 'svelte/store';
    import { 
        SvelteFlow, 
        Controls, 
        Background, 
        MiniMap, 
        useSvelteFlow 
    } from '@xyflow/svelte';
    import '@xyflow/svelte/dist/style.css';
    import dagre from 'dagre';
    import api from '$lib/api';
    import { endpoints } from '$lib/config';
    import toast from 'svelte-french-toast';
    import { 
        Search, X, MapPin, Grid3x3, UserPlus, Settings, 
        Edit, Trash2, Heart, User 
    } from 'lucide-svelte';
    
    import PortraitNode from '$lib/components/PortraitNode.svelte';
    import AddRelativeModal from '$lib/components/AddRelativeModal.svelte';
    import PersonEditModal from '$lib/components/PersonEditModal.svelte';
    
    // Node types definition
    const nodeTypes = {
        portrait: PortraitNode
    };

    // State
    const nodes = writable([]);
    const edges = writable([]);
    const allData = writable({ nodes: [], edges: [] });
    
    let searchQuery = '';
    let layoutDirection = 'TB';
    let isSearchFocused = false;
    let contextMenu = { visible: false, x: 0, y: 0, node: null };
    
    let addModalOpen = false;
    let editModalOpen = false;
    let selectedNode = null;
    
    // Layout Logic (ported from React)
    const getLayoutedElements = (inputNodes, spouseEdges, layoutEdges, direction = 'TB') => {
        const dagreGraph = new dagre.graphlib.Graph();
        dagreGraph.setDefaultEdgeLabel(() => ({}));

        // Spouse grouping logic
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

        const groupNodes = spouseGroups.map((group, groupIndex) => ({
            id: `group-${groupIndex}`,
            personIds: group,
            width: direction === 'TB' ? group.length * 150 + (group.length - 1) * 20 : 150,
            height: direction === 'TB' ? 120 : group.length * 120 + (group.length - 1) * 20,
        }));

        const singleNodes = inputNodes.filter(node => !spouseGroups.some(group => group.includes(node.id)));

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
            const sourceGroup = groupNodes.find(g => g.personIds.includes(edge.source));
            if (sourceGroup) sourceId = sourceGroup.id;
            const targetGroup = groupNodes.find(g => g.personIds.includes(edge.target));
            if (targetGroup) targetId = targetGroup.id;
            dagreGraph.setEdge(sourceId, targetId);
        });

        dagre.layout(dagreGraph);

        const layoutedNodes = [];
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

        groupNodes.forEach((groupNode) => {
            const groupWithPosition = dagreGraph.node(groupNode.id);
            const spouses = inputNodes.filter(node => groupNode.personIds.includes(node.id));
            spouses.forEach((spouse, spouseIndex) => {
                let x = groupWithPosition.x - groupNode.width / 2;
                let y = groupWithPosition.y - groupNode.height / 2;
                if (direction === 'TB') {
                    x += spouseIndex * (150 + 20) + 75;
                    y += 60;
                } else {
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

    // Data Fetching
    const fetchData = async (focusId = null) => {
        let url = endpoints.genealogy.visualTree;
        if (focusId) url += `?focus_id=${focusId}`;

        try {
            const res = await api.get(url);
            
            const rawNodes = res.data.nodes.map(n => ({
                id: n.id,
                type: 'portrait',
                data: { ...n },
                position: { x: 0, y: 0 }
            }));

            const rawEdges = res.data.edges.map(e => ({
                id: e.id,
                source: e.source,
                target: e.target,
                animated: e.animated,
                style: e.relationship_type === 'MAR' ? 
                    'stroke: #ff4444; stroke-width: 3;' : 
                    'stroke: #22c55e; stroke-width: 3;',
                type: 'default',
                data: { relationship_type: e.relationship_type } // Store type in data for easy access
            }));

            allData.set({ nodes: rawNodes, edges: rawEdges });
            applyFilter(searchQuery, { nodes: rawNodes, edges: rawEdges });
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

        const layoutEdges = filteredEdges.filter(e => e.data?.relationship_type !== 'MAR');
        const spouseEdges = filteredEdges.filter(e => e.data?.relationship_type === 'MAR').map(e => ({
            ...e,
            sourceHandle: 'right',
            targetHandle: 'left'
        }));

        const { nodes: layoutedNodes, edges: layoutedEdges } = getLayoutedElements(
            filteredNodes,
            spouseEdges,
            layoutEdges,
            layoutDirection
        );
        
        nodes.set(layoutedNodes);
        edges.set([...layoutedEdges, ...spouseEdges]);
    };

    // Handlers
    const onConnect = async (connection) => {
        const { source, target, sourceHandle, targetHandle } = connection;
        
        if (source === target) {
            toast.error('Cannot connect a person to themselves');
            return;
        }

        try {
            if (sourceHandle === 'right' && targetHandle === 'left') {
                 await api.post(endpoints.genealogy.relationships, {
                    person_a: source,
                    person_b: target,
                    relationship_type: 'MAR'
                });
                toast.success('💍 Spouse relationship created');
            } else if (sourceHandle === 'bottom' && targetHandle === 'top') {
                 await api.post(endpoints.genealogy.parentLinks, {
                    child: source,
                    single_parent: target,
                    link_type: 'BIO'
                });
                toast.success('👶 Parent-child relationship created');
            } else {
                toast.error('Invalid connection direction');
                return;
            }
            await fetchData();
        } catch (error) {
            console.error('Connection failed:', error);
            toast.error('Failed to create relationship');
        }
    };

    const onNodeClick = (event, node) => {
        selectedNode = node;
        addModalOpen = true;
    };

    const onNodeDoubleClick = (event, node) => {
        selectedNode = node;
        editModalOpen = true;
    };

    const onNodeContextMenu = (event, node) => {
        event.preventDefault();
        
        let x = event.clientX;
        let y = event.clientY;

        // Boundary checks
        if (x + 200 > window.innerWidth) x = window.innerWidth - 210;
        if (y + 150 > window.innerHeight) y = window.innerHeight - 160;

        contextMenu = { visible: true, x, y, node };
    };

    const closeContextMenu = () => {
        contextMenu = { ...contextMenu, visible: false };
    };

    const handleEditPerson = () => {
        if (!contextMenu.node) return;
        selectedNode = contextMenu.node;
        editModalOpen = true;
        closeContextMenu();
    };

    const handleDeletePerson = async () => {
        if (!contextMenu.node) return;
        if (!confirm(`Delete ${contextMenu.node.data.label}?`)) {
            closeContextMenu();
            return;
        }

        try {
            await api.delete(`${endpoints.genealogy.people}${contextMenu.node.id}/`);
            toast.success('🗑️ Person deleted');
            closeContextMenu();
            await fetchData();
        } catch (error) {
            toast.error('Failed to delete person');
        }
    };

    // Reactive statements
    $: if ($allData.nodes.length > 0) applyFilter(searchQuery, $allData);

    onMount(() => {
        fetchData();
    });
</script>

<div class="w-full h-full bg-gradient-to-br from-gray-900 via-gray-800 to-gray-900 relative" on:contextmenu|preventDefault={closeContextMenu}>
    
    <!-- Top Bar -->
    <div class="absolute top-4 left-4 right-4 z-10 flex flex-col sm:flex-row gap-3 pointer-events-none">
        <!-- Search -->
        <div class="bg-gray-800 rounded-xl shadow-lg border border-gray-700 flex-1 sm:max-w-md pointer-events-auto transition-all {isSearchFocused ? 'ring-2 ring-emerald-500' : ''}">
            <div class="relative p-3">
                <Search size={18} class="absolute left-5 top-1/2 transform -translate-y-1/2 text-gray-400" />
                <input
                    type="text"
                    placeholder="Search family members..."
                    bind:value={searchQuery}
                    on:focus={() => isSearchFocused = true}
                    on:blur={() => isSearchFocused = false}
                    class="pl-10 pr-10 py-1 w-full bg-transparent text-white rounded-lg focus:outline-none placeholder-gray-500"
                />
                {#if searchQuery}
                    <button
                        on:click={() => searchQuery = ''}
                        class="absolute right-5 top-1/2 transform -translate-y-1/2 text-gray-400 hover:text-white"
                    >
                        <X size={18} />
                    </button>
                {/if}
            </div>
        </div>

        <!-- Actions -->
        <div class="flex gap-2 pointer-events-auto">
            <button 
                on:click={() => { selectedNode = null; addModalOpen = true; }}
                class="bg-emerald-600 hover:bg-emerald-500 p-3 rounded-xl shadow-lg border border-emerald-500 text-white transition-transform hover:scale-105" 
                title="Add New Person"
            >
                <UserPlus size={20} />
            </button>
            <button 
                on:click={() => { layoutDirection = layoutDirection === 'TB' ? 'LR' : 'TB'; applyFilter(searchQuery, $allData); }}
                class="bg-gray-800 hover:bg-gray-700 p-3 rounded-xl shadow-lg border border-gray-700 flex items-center gap-2 text-emerald-400 transition-transform hover:scale-105"
            >
                <Grid3x3 size={20} />
                <span class="hidden sm:inline text-white text-sm">
                    {layoutDirection === 'TB' ? 'Vertical' : 'Horizontal'}
                </span>
            </button>
        </div>
    </div>

    <!-- Stats -->
    <div class="absolute bottom-4 left-4 z-10 pointer-events-none">
        <div class="bg-gray-800 bg-opacity-90 backdrop-blur-sm px-4 py-2 rounded-xl shadow-lg border border-gray-700 pointer-events-auto">
            <div class="flex items-center gap-2 text-sm">
                <MapPin size={14} class="text-emerald-400" />
                <span class="text-gray-400">
                    <span class="text-white font-bold">{$nodes.length}</span> members
                </span>
            </div>
        </div>
    </div>

    <!-- Svelte Flow -->
    <SvelteFlow
        {nodes}
        {edges}
        {nodeTypes}
        fitView
        minZoom={0.1}
        maxZoom={2}
        defaultViewport={{ x: 0, y: 0, zoom: 0.8 }}
        attributionPosition="bottom-right"
        on:connect={(e) => onConnect(e.detail)}
        on:nodeclick={(e) => onNodeClick(e.detail.event, e.detail.node)}
        on:nodedoubleclick={(e) => onNodeDoubleClick(e.detail.event, e.detail.node)}
        on:nodecontextmenu={(e) => onNodeContextMenu(e.detail.event, e.detail.node)}
        on:panecontextmenu={closeContextMenu}
    >
        <Background color="#374151" gap={16} size={1} variant="dots" />
        <Controls class="bg-gray-800 border border-gray-700 rounded-lg shadow-lg !text-white" showInteractive={false} />
        <MiniMap 
            nodeColor={(n) => {
                const level = n.data.confidence_level || 100;
                return level >= 80 ? '#10b981' : level >= 50 ? '#eab308' : '#f97316';
            }}
            nodeStrokeWidth={3}
            class="bg-gray-800 border border-gray-700 rounded-lg shadow-lg" 
            maskColor="rgba(0, 0, 0, 0.6)"
        />
    </SvelteFlow>

    <!-- Context Menu -->
    {#if contextMenu.visible}
        <div
            class="fixed z-50 bg-gray-800 border border-gray-700 rounded-lg shadow-2xl py-2 min-w-[200px]"
            style="left: {contextMenu.x}px; top: {contextMenu.y}px;"
        >
            <div class="px-3 py-1 border-b border-gray-700">
                <h3 class="text-white font-medium text-sm">{contextMenu.node?.data?.label}</h3>
            </div>
            <div class="py-1">
                <button 
                    on:click={handleEditPerson}
                    class="w-full flex items-center gap-3 px-3 py-2 text-left text-sm text-white hover:bg-gray-700 transition-colors"
                >
                    <Edit size={16} class="text-gray-400" />
                    <span>Edit Profile</span>
                </button>
                <button 
                    on:click={handleDeletePerson}
                    class="w-full flex items-center gap-3 px-3 py-2 text-left text-sm text-red-400 hover:bg-red-900/20 transition-colors"
                >
                    <Trash2 size={16} />
                    <span>Delete Person</span>
                </button>
            </div>
        </div>
    {/if}

    <AddRelativeModal
        isOpen={addModalOpen}
        sourceNode={selectedNode}
        existingPeople={$nodes}
        on:close={() => addModalOpen = false}
        on:success={fetchData}
        on:editPerson={(e) => {
            addModalOpen = false;
            // Find node by ID
            const node = $nodes.find(n => n.id === e.detail);
            if(node) {
                selectedNode = node;
                editModalOpen = true;
            }
        }}
    />

    <PersonEditModal
        isOpen={editModalOpen}
        personId={selectedNode?.id}
        on:close={() => editModalOpen = false}
        on:success={fetchData}
    />
</div>

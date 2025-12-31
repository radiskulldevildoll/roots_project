/**
 * Blood Relations Calculator
 * 
 * Calculates blood relations from a selected person in a family tree.
 * Returns a map of personId → { label, type, generation, isBloodRelation }
 */

// Relationship type constants
export const RELATION_TYPES = {
  SELF: 'self',
  PARENT: 'parent',
  CHILD: 'child',
  SIBLING: 'sibling',
  HALF_SIBLING: 'halfSibling',
  GRANDPARENT: 'grandparent',
  GRANDCHILD: 'grandchild',
  GREAT_GRANDPARENT: 'greatGrandparent',
  GREAT_GRANDCHILD: 'greatGrandchild',
  AUNT_UNCLE: 'auntUncle',
  NIECE_NEPHEW: 'nieceNephew',
  COUSIN: 'cousin',
  SPOUSE: 'spouse',
  IN_LAW: 'inLaw',
  STEP: 'step',
  ANCESTOR: 'ancestor',
  DESCENDANT: 'descendant',
  EXTENDED: 'extended'
};

// Link types that count as blood relations (configurable)
export const BLOOD_LINK_TYPES = {
  BIO: true,  // Biological - always blood
  ADO: false, // Adopted - configurable
  FOS: false, // Foster - configurable
  STP: false  // Step - never blood (by definition)
};

/**
 * Parse edges to build parent-child relationship maps
 */
function buildRelationshipMaps(edges) {
  const parentToChildren = new Map(); // parentId -> [{childId, linkType}]
  const childToParents = new Map();   // childId -> [{parentId, linkType}]
  const spouses = new Map();          // personId -> [spouseId]
  
  edges.forEach(edge => {
    if (edge.relationship_type === 'MAR' || edge.relationship_type === 'PAR' || edge.relationship_type === 'DIV') {
      // Spouse/partner relationship
      if (!spouses.has(edge.source)) spouses.set(edge.source, []);
      if (!spouses.has(edge.target)) spouses.set(edge.target, []);
      spouses.get(edge.source).push(edge.target);
      spouses.get(edge.target).push(edge.source);
    } else {
      // Parent-child relationship (source is parent, target is child)
      const linkType = edge.linkType || edge.link_type || 'BIO';
      
      if (!parentToChildren.has(edge.source)) parentToChildren.set(edge.source, []);
      parentToChildren.get(edge.source).push({ childId: edge.target, linkType });
      
      if (!childToParents.has(edge.target)) childToParents.set(edge.target, []);
      childToParents.get(edge.target).push({ parentId: edge.source, linkType });
    }
  });
  
  return { parentToChildren, childToParents, spouses };
}

/**
 * Check if a link type counts as blood relation based on configuration
 */
function isBloodLink(linkType, includeAdopted, includeFoster) {
  if (linkType === 'BIO') return true;
  if (linkType === 'ADO') return includeAdopted;
  if (linkType === 'FOS') return includeFoster;
  return false; // STP (step) is never blood
}

/**
 * Get ordinal suffix for numbers (1st, 2nd, 3rd, etc.)
 */
function getOrdinal(n) {
  const s = ['th', 'st', 'nd', 'rd'];
  const v = n % 100;
  return n + (s[(v - 20) % 10] || s[v] || s[0]);
}

/**
 * Generate the relationship label based on type and generation
 */
function getRelationshipLabel(type, generation, isMaternal, personData) {
  // Get gender hint from person data if available
  const gender = personData?.gender || 'unknown';
  
  switch (type) {
    case RELATION_TYPES.SELF:
      return 'Selected';
    
    case RELATION_TYPES.PARENT:
      return gender === 'F' ? 'Mother' : gender === 'M' ? 'Father' : 'Parent';
    
    case RELATION_TYPES.CHILD:
      return gender === 'F' ? 'Daughter' : gender === 'M' ? 'Son' : 'Child';
    
    case RELATION_TYPES.SIBLING:
      return gender === 'F' ? 'Sister' : gender === 'M' ? 'Brother' : 'Sibling';
    
    case RELATION_TYPES.HALF_SIBLING:
      return gender === 'F' ? 'Half-Sister' : gender === 'M' ? 'Half-Brother' : 'Half-Sibling';
    
    case RELATION_TYPES.GRANDPARENT:
      const gpBase = gender === 'F' ? 'Grandmother' : gender === 'M' ? 'Grandfather' : 'Grandparent';
      return isMaternal !== undefined ? `${gpBase} (${isMaternal ? 'maternal' : 'paternal'})` : gpBase;
    
    case RELATION_TYPES.GRANDCHILD:
      return gender === 'F' ? 'Granddaughter' : gender === 'M' ? 'Grandson' : 'Grandchild';
    
    case RELATION_TYPES.GREAT_GRANDPARENT:
      const greatPrefix = generation > 3 ? `${getOrdinal(generation - 2)} Great-` : 'Great-';
      const ggpBase = gender === 'F' ? 'Grandmother' : gender === 'M' ? 'Grandfather' : 'Grandparent';
      return greatPrefix + ggpBase;
    
    case RELATION_TYPES.GREAT_GRANDCHILD:
      const gcGreatPrefix = generation > 3 ? `${getOrdinal(generation - 2)} Great-` : 'Great-';
      const ggcBase = gender === 'F' ? 'Granddaughter' : gender === 'M' ? 'Grandson' : 'Grandchild';
      return gcGreatPrefix + ggcBase;
    
    case RELATION_TYPES.AUNT_UNCLE:
      if (generation > 1) {
        const auPrefix = `${getOrdinal(generation)} Great-`;
        return auPrefix + (gender === 'F' ? 'Aunt' : gender === 'M' ? 'Uncle' : 'Aunt/Uncle');
      }
      return gender === 'F' ? 'Aunt' : gender === 'M' ? 'Uncle' : 'Aunt/Uncle';
    
    case RELATION_TYPES.NIECE_NEPHEW:
      if (generation > 1) {
        const nnPrefix = `${getOrdinal(generation)} Great-`;
        return nnPrefix + (gender === 'F' ? 'Niece' : gender === 'M' ? 'Nephew' : 'Niece/Nephew');
      }
      return gender === 'F' ? 'Niece' : gender === 'M' ? 'Nephew' : 'Niece/Nephew';
    
    case RELATION_TYPES.COUSIN:
      if (generation === 1) return 'First Cousin';
      if (generation === 2) return 'Second Cousin';
      if (generation === 3) return 'Third Cousin';
      return `${getOrdinal(generation)} Cousin`;
    
    case RELATION_TYPES.SPOUSE:
      return 'Spouse';
    
    case RELATION_TYPES.IN_LAW:
      return 'In-Law';
    
    case RELATION_TYPES.STEP:
      return 'Step-Relative';
    
    case RELATION_TYPES.ANCESTOR:
      return `Ancestor (${generation} gen)`;
    
    case RELATION_TYPES.DESCENDANT:
      return `Descendant (${generation} gen)`;
    
    case RELATION_TYPES.EXTENDED:
      return 'Extended Family';
    
    default:
      return 'Related';
  }
}

/**
 * Calculate all blood relations from a selected person
 * 
 * @param {string} selectedPersonId - The ID of the selected person
 * @param {Array} nodes - Array of node objects with id and data
 * @param {Array} edges - Array of edge objects with source, target, relationship_type
 * @param {Object} options - Configuration options
 * @param {number} options.maxDepth - Maximum generations to traverse (default: 10)
 * @param {boolean} options.includeAdopted - Include adopted relations as blood (default: false)
 * @param {boolean} options.includeFoster - Include foster relations as blood (default: false)
 * @param {boolean} options.includeSpouses - Include spouses in results (default: true)
 * @returns {Map} Map of personId -> { label, type, generation, isBloodRelation, side }
 */
export function calculateBloodRelations(selectedPersonId, nodes, edges, options = {}) {
  const {
    maxDepth = 10,
    includeAdopted = false,
    includeFoster = false,
    includeSpouses = true
  } = options;
  
  const relations = new Map();
  const { parentToChildren, childToParents, spouses } = buildRelationshipMaps(edges);
  
  // Create a node lookup map
  const nodeMap = new Map();
  nodes.forEach(node => nodeMap.set(node.id, node.data));
  
  // Track visited nodes to avoid cycles
  const visited = new Set();
  
  // Mark the selected person
  relations.set(selectedPersonId, {
    label: 'Selected',
    type: RELATION_TYPES.SELF,
    generation: 0,
    isBloodRelation: true,
    side: 'self'
  });
  visited.add(selectedPersonId);
  
  // BFS queues for different traversal directions
  // Queue format: { personId, generation, pathType, side, commonAncestorGen }
  const ancestorQueue = [];
  const descendantQueue = [];
  
  // Start by finding parents (ancestors)
  const parents = childToParents.get(selectedPersonId) || [];
  parents.forEach(({ parentId, linkType }, index) => {
    if (isBloodLink(linkType, includeAdopted, includeFoster)) {
      const side = index === 0 ? 'paternal' : 'maternal';
      ancestorQueue.push({ personId: parentId, generation: 1, pathType: 'direct', side });
    }
  });
  
  // Start by finding children (descendants)
  const children = parentToChildren.get(selectedPersonId) || [];
  children.forEach(({ childId, linkType }) => {
    if (isBloodLink(linkType, includeAdopted, includeFoster)) {
      descendantQueue.push({ personId: childId, generation: 1, pathType: 'direct', side: 'descendant' });
    }
  });
  
  // Find siblings (share at least one parent)
  const siblings = findSiblings(selectedPersonId, childToParents, parentToChildren, includeAdopted, includeFoster);
  siblings.forEach(({ siblingId, isFullSibling, linkType }) => {
    if (!visited.has(siblingId)) {
      visited.add(siblingId);
      const type = isFullSibling ? RELATION_TYPES.SIBLING : RELATION_TYPES.HALF_SIBLING;
      relations.set(siblingId, {
        label: getRelationshipLabel(type, 1, undefined, nodeMap.get(siblingId)),
        type,
        generation: 0,
        isBloodRelation: true,
        side: 'sibling'
      });
      
      // Add sibling's descendants to queue
      if (maxDepth > 1) {
        const siblingChildren = parentToChildren.get(siblingId) || [];
        siblingChildren.forEach(({ childId, linkType: childLinkType }) => {
          if (isBloodLink(childLinkType, includeAdopted, includeFoster)) {
            descendantQueue.push({ 
              personId: childId, 
              generation: 1, 
              pathType: 'niece_nephew', 
              side: 'sibling',
              throughSibling: siblingId 
            });
          }
        });
      }
    }
  });
  
  // Process ancestors (parents, grandparents, etc.)
  while (ancestorQueue.length > 0) {
    const { personId, generation, pathType, side } = ancestorQueue.shift();
    
    if (visited.has(personId) || generation > maxDepth) continue;
    visited.add(personId);
    
    // Determine relationship type
    let type;
    if (generation === 1) {
      type = RELATION_TYPES.PARENT;
    } else if (generation === 2) {
      type = RELATION_TYPES.GRANDPARENT;
    } else {
      type = RELATION_TYPES.GREAT_GRANDPARENT;
    }
    
    relations.set(personId, {
      label: getRelationshipLabel(type, generation, side === 'maternal', nodeMap.get(personId)),
      type,
      generation,
      isBloodRelation: true,
      side
    });
    
    // Find this ancestor's siblings (aunts/uncles to selected person)
    if (maxDepth >= generation) {
      const ancestorSiblings = findSiblings(personId, childToParents, parentToChildren, includeAdopted, includeFoster);
      ancestorSiblings.forEach(({ siblingId, isFullSibling }) => {
        if (!visited.has(siblingId)) {
          visited.add(siblingId);
          const auType = RELATION_TYPES.AUNT_UNCLE;
          relations.set(siblingId, {
            label: getRelationshipLabel(auType, generation - 1, undefined, nodeMap.get(siblingId)),
            type: auType,
            generation: generation,
            isBloodRelation: true,
            side: side
          });
          
          // Add aunt/uncle's descendants (cousins)
          addCousinDescendants(siblingId, generation, side, parentToChildren, visited, relations, nodeMap, maxDepth, includeAdopted, includeFoster);
        }
      });
    }
    
    // Continue to ancestors' parents
    const ancestorParents = childToParents.get(personId) || [];
    ancestorParents.forEach(({ parentId, linkType }) => {
      if (isBloodLink(linkType, includeAdopted, includeFoster) && !visited.has(parentId)) {
        ancestorQueue.push({ personId: parentId, generation: generation + 1, pathType: 'direct', side });
      }
    });
  }
  
  // Process descendants (children, grandchildren, etc.)
  while (descendantQueue.length > 0) {
    const { personId, generation, pathType, side, throughSibling } = descendantQueue.shift();
    
    if (visited.has(personId) || generation > maxDepth) continue;
    visited.add(personId);
    
    // Determine relationship type
    let type;
    if (pathType === 'niece_nephew') {
      type = RELATION_TYPES.NIECE_NEPHEW;
    } else if (generation === 1) {
      type = RELATION_TYPES.CHILD;
    } else if (generation === 2) {
      type = RELATION_TYPES.GRANDCHILD;
    } else {
      type = RELATION_TYPES.GREAT_GRANDCHILD;
    }
    
    relations.set(personId, {
      label: getRelationshipLabel(type, generation, undefined, nodeMap.get(personId)),
      type,
      generation,
      isBloodRelation: true,
      side
    });
    
    // Continue to descendants' children
    const personChildren = parentToChildren.get(personId) || [];
    personChildren.forEach(({ childId, linkType }) => {
      if (isBloodLink(linkType, includeAdopted, includeFoster) && !visited.has(childId)) {
        descendantQueue.push({ 
          personId: childId, 
          generation: generation + 1, 
          pathType: pathType === 'niece_nephew' ? 'niece_nephew' : 'direct', 
          side 
        });
      }
    });
  }
  
  // Add spouses if requested
  if (includeSpouses) {
    const selectedSpouses = spouses.get(selectedPersonId) || [];
    selectedSpouses.forEach(spouseId => {
      if (!relations.has(spouseId)) {
        relations.set(spouseId, {
          label: 'Spouse',
          type: RELATION_TYPES.SPOUSE,
          generation: 0,
          isBloodRelation: false,
          side: 'spouse'
        });
      }
    });
    
    // Also mark spouses of blood relations
    relations.forEach((relation, personId) => {
      if (relation.isBloodRelation && personId !== selectedPersonId) {
        const personSpouses = spouses.get(personId) || [];
        personSpouses.forEach(spouseId => {
          if (!relations.has(spouseId)) {
            relations.set(spouseId, {
              label: `Spouse of ${relation.label}`,
              type: RELATION_TYPES.IN_LAW,
              generation: relation.generation,
              isBloodRelation: false,
              side: 'in-law'
            });
          }
        });
      }
    });
  }
  
  return relations;
}

/**
 * Find siblings of a person
 */
function findSiblings(personId, childToParents, parentToChildren, includeAdopted, includeFoster) {
  const siblings = [];
  const parents = childToParents.get(personId) || [];
  const parentSet = new Set(parents.map(p => p.parentId));
  
  parents.forEach(({ parentId, linkType }) => {
    if (!isBloodLink(linkType, includeAdopted, includeFoster)) return;
    
    const parentChildren = parentToChildren.get(parentId) || [];
    parentChildren.forEach(({ childId, linkType: childLinkType }) => {
      if (childId !== personId && isBloodLink(childLinkType, includeAdopted, includeFoster)) {
        // Check if this is a full sibling (shares both parents)
        const siblingParents = childToParents.get(childId) || [];
        const siblingParentSet = new Set(siblingParents.map(p => p.parentId));
        
        const sharedParents = [...parentSet].filter(id => siblingParentSet.has(id));
        const isFullSibling = sharedParents.length >= 2;
        
        // Check if we already added this sibling
        if (!siblings.some(s => s.siblingId === childId)) {
          siblings.push({ siblingId: childId, isFullSibling, linkType: childLinkType });
        }
      }
    });
  });
  
  return siblings;
}

/**
 * Add cousin descendants recursively
 */
function addCousinDescendants(ancestorSiblingId, ancestorGeneration, side, parentToChildren, visited, relations, nodeMap, maxDepth, includeAdopted, includeFoster) {
  const queue = [{ personId: ancestorSiblingId, cousinLevel: ancestorGeneration - 1, currentGen: 0 }];
  
  while (queue.length > 0) {
    const { personId, cousinLevel, currentGen } = queue.shift();
    
    const children = parentToChildren.get(personId) || [];
    children.forEach(({ childId, linkType }) => {
      if (!isBloodLink(linkType, includeAdopted, includeFoster)) return;
      if (visited.has(childId)) return;
      if (currentGen + ancestorGeneration > maxDepth) return;
      
      visited.add(childId);
      
      // First generation children of aunt/uncle are cousins
      // Their children are first cousins once removed, etc.
      const type = RELATION_TYPES.COUSIN;
      const actualCousinLevel = cousinLevel;
      const removed = currentGen > 0 ? currentGen : 0;
      
      let label;
      if (removed === 0) {
        label = getRelationshipLabel(type, actualCousinLevel, undefined, nodeMap.get(childId));
      } else {
        label = `${getRelationshipLabel(type, actualCousinLevel, undefined, nodeMap.get(childId))} ${removed}x Removed`;
      }
      
      relations.set(childId, {
        label,
        type,
        generation: actualCousinLevel,
        removed,
        isBloodRelation: true,
        side
      });
      
      // Continue to their children
      queue.push({ personId: childId, cousinLevel: actualCousinLevel, currentGen: currentGen + 1 });
    });
  }
}

/**
 * Get highlight color based on relation type
 */
export function getRelationColor(relationType, isBloodRelation) {
  if (!isBloodRelation) {
    return {
      border: '#f472b6', // Pink for non-blood (spouses, in-laws)
      background: 'rgba(244, 114, 182, 0.1)',
      glow: 'rgba(244, 114, 182, 0.3)'
    };
  }
  
  switch (relationType) {
    case RELATION_TYPES.SELF:
      return {
        border: '#fbbf24', // Gold for selected
        background: 'rgba(251, 191, 36, 0.2)',
        glow: 'rgba(251, 191, 36, 0.5)'
      };
    
    case RELATION_TYPES.PARENT:
    case RELATION_TYPES.GRANDPARENT:
    case RELATION_TYPES.GREAT_GRANDPARENT:
    case RELATION_TYPES.ANCESTOR:
      return {
        border: '#60a5fa', // Blue for ancestors
        background: 'rgba(96, 165, 250, 0.1)',
        glow: 'rgba(96, 165, 250, 0.3)'
      };
    
    case RELATION_TYPES.CHILD:
    case RELATION_TYPES.GRANDCHILD:
    case RELATION_TYPES.GREAT_GRANDCHILD:
    case RELATION_TYPES.DESCENDANT:
      return {
        border: '#34d399', // Green for descendants
        background: 'rgba(52, 211, 153, 0.1)',
        glow: 'rgba(52, 211, 153, 0.3)'
      };
    
    case RELATION_TYPES.SIBLING:
    case RELATION_TYPES.HALF_SIBLING:
      return {
        border: '#a78bfa', // Purple for siblings
        background: 'rgba(167, 139, 250, 0.1)',
        glow: 'rgba(167, 139, 250, 0.3)'
      };
    
    case RELATION_TYPES.AUNT_UNCLE:
    case RELATION_TYPES.NIECE_NEPHEW:
    case RELATION_TYPES.COUSIN:
      return {
        border: '#fb923c', // Orange for extended blood family
        background: 'rgba(251, 146, 60, 0.1)',
        glow: 'rgba(251, 146, 60, 0.3)'
      };
    
    default:
      return {
        border: '#22c55e', // Default green
        background: 'rgba(34, 197, 94, 0.1)',
        glow: 'rgba(34, 197, 94, 0.3)'
      };
  }
}

/**
 * Get the legend items for the blood relations feature
 */
export function getRelationLegend() {
  return [
    { label: 'Selected', color: '#fbbf24', type: 'self' },
    { label: 'Parents/Ancestors', color: '#60a5fa', type: 'ancestor' },
    { label: 'Children/Descendants', color: '#34d399', type: 'descendant' },
    { label: 'Siblings', color: '#a78bfa', type: 'sibling' },
    { label: 'Aunts/Uncles/Cousins', color: '#fb923c', type: 'extended' },
    { label: 'Spouse/In-Laws', color: '#f472b6', type: 'spouse' },
    { label: 'Not Related', color: '#6b7280', type: 'none' }
  ];
}

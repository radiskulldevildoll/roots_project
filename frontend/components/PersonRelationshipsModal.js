"use client";
import { useState, useEffect } from 'react';
import axios from 'axios';
import { X, Heart, Users, Baby, Edit, Trash2, Calendar, Plus } from 'lucide-react';
import { motion, AnimatePresence } from 'framer-motion';
import toast from 'react-hot-toast';
import { endpoints } from '../utils/config';
import AddRelativeModal from './AddRelativeModal';

const RELATIONSHIP_TYPES = {
  MAR: 'Married',
  PAR: 'Partners',
  DIV: 'Divorced',
  UNK: 'Unknown'
};

const LINK_TYPES = {
  BIO: 'Biological',
  ADO: 'Adopted',
  FOS: 'Foster',
  STP: 'Step-Child'
};

export default function PersonRelationshipsModal({ isOpen, onClose, personId, personName, existingPeople, onSuccess, onEditProfileRequest }) {
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [activeTab, setActiveTab] = useState('spouses');
  const [spouses, setSpouses] = useState([]);
  const [parents, setParents] = useState([]);
  const [children, setChildren] = useState([]);
  const [editMode, setEditMode] = useState({ type: null, id: null });
  const [addModalOpen, setAddModalOpen] = useState(false);
  const [initialRelationType, setInitialRelationType] = useState('child');

  useEffect(() => {
    if (isOpen && personId) {
      fetchRelationships();
    }
  }, [isOpen, personId]);

  const fetchRelationships = async () => {
    setLoading(true);
    const token = localStorage.getItem('access_token');
    try {
        // Fetch all relationships for this person
      const [relationshipRes, parentLinkRes, childLinkRes] = await Promise.all([
        axios.get(`${endpoints.genealogy.relationships}`, {
          headers: { Authorization: `Bearer ${token}` }
        }),
        axios.get(endpoints.genealogy.parentLinks, {
          headers: { Authorization: `Bearer ${token}` }
        }),
        axios.get(endpoints.genealogy.parentLinks, {
          headers: { Authorization: `Bearer ${token}` }
        })
      ]);

      const relationships = relationshipRes.data;
      const parentLinks = parentLinkRes.data;
      const childLinks = childLinkRes.data;

      // Filter for this person's relationships
      const personSpouses = relationships.filter(rel =>
        rel.person_a === personId || rel.person_b === personId
      ).map(rel => ({
        ...rel,
        otherPerson: rel.person_a === personId ? rel.person_b_obj : rel.person_a_obj,
        type: 'spouse'
      }));

      const personParents = parentLinks.filter(link =>
        link.child === personId
      ).map(link => ({
        ...link,
        type: 'parent',
        person: link.single_parent_obj || (link.relationship_obj ? {
            first_name: `${link.relationship_obj.person_a_obj?.first_name || ''} & ${link.relationship_obj.person_b_obj?.first_name || ''}`,
            last_name: link.relationship_obj.person_a_obj?.last_name || link.relationship_obj.person_b_obj?.last_name || ''
        } : null),
        link_type_display: LINK_TYPES[link.link_type] || link.link_type
      }));

      const personChildren = childLinks.filter(link =>
        link.single_parent === personId ||
        (link.relationship_obj && (link.relationship_obj.person_a === personId || link.relationship_obj.person_b === personId))
      ).map(link => ({
        ...link,
        type: 'child',
        person: link.child_obj,
        link_type_display: LINK_TYPES[link.link_type] || link.link_type
      }));

      setSpouses(personSpouses);
      setParents(personParents);
      setChildren(personChildren);
    } catch (error) {
      console.error('Failed to fetch relationships:', error);
      toast.error('Failed to load relationships');
    } finally {
      setLoading(false);
    }
  };

  const handleDeleteRelationship = async (id, type, confirmationText) => {
    if (!window.confirm(confirmationText)) return;

    setSaving(true);
    const token = localStorage.getItem('access_token');

    try {
      let url;
      if (type === 'spouse') {
        url = `${endpoints.genealogy.relationships}${id}/`;
      } else {
        url = `${endpoints.genealogy.parentLinks}${id}/`;
      }

      await axios.delete(url, {
        headers: { Authorization: `Bearer ${token}` }
      });

      toast.success(`${type === 'spouse' ? 'Relationship' : 'Family link'} deleted`);
      fetchRelationships();
      onSuccess();
    } catch (error) {
      console.error('Failed to delete relationship:', error);
      toast.error('Failed to delete relationship');
    } finally {
      setSaving(false);
    }
  };

  const handleAddNew = (type) => {
    setInitialRelationType(type);
    setAddModalOpen(true);
  };

  const RelationshipList = ({ items, emptyMessage, relType, onAddNew }) => (
    <div className="space-y-3">
      <button
        onClick={onAddNew}
        className="w-full bg-gradient-to-r from-emerald-600 to-teal-600 hover:from-emerald-500 hover:to-teal-500 p-4 rounded-lg font-semibold text-white flex items-center gap-3 justify-center transition-all shadow-lg"
      >
        <Plus size={20} />
        Add New {relType.charAt(0).toUpperCase() + relType.slice(1)}
      </button>
      {items.length === 0 ? (
        <div className="text-center text-gray-400 py-8">
          <Heart className="w-12 h-12 mx-auto mb-3 opacity-50" />
          <p>{emptyMessage}</p>
        </div>
      ) : (
        items.map(item => (
          <motion.div
            key={item.id}
            initial={{ opacity: 0, x: -20 }}
            animate={{ opacity: 1, x: 0 }}
            className="bg-gray-700 p-4 rounded-lg border border-gray-600"
          >
            <div className="flex justify-between items-center mb-2">
              <div className="flex items-center gap-3">
                <div className="w-10 h-10 bg-gray-600 rounded-full flex items-center justify-center">
                  <Users size={20} className="text-gray-300" />
                </div>
                <div>
                  <h4 className="font-medium text-white">
                    {item.otherPerson ? `${item.otherPerson.first_name} ${item.otherPerson.last_name}` :
                     item.person ? (typeof item.person === 'string' ? item.person : `${item.person.first_name} ${item.person.last_name}`) :
                     `${item.child_obj?.first_name} ${item.child_obj?.last_name}`}
                  </h4>
                  <p className="text-sm text-gray-400">
                    {item.type === 'spouse' ? RELATIONSHIP_TYPES[item.relationship_type] || item.relationship_type :
                     item.link_type_display}
                  </p>
                </div>
              </div>
              <div className="flex gap-2">
                <button
                  onClick={() => {/* TODO: Edit functionality */}}
                  className="text-gray-400 hover:text-blue-400 p-2 rounded transition-colors"
                  title="Edit"
                >
                  <Edit size={16} />
                </button>
                <button
                  onClick={() => handleDeleteRelationship(item.id, item.type, `Are you sure you want to delete this ${item.type} relationship?`)}
                  className="text-gray-400 hover:text-red-400 p-2 rounded transition-colors"
                  title="Delete"
                  disabled={saving}
                >
                  <Trash2 size={16} />
                </button>
              </div>
            </div>
            {(item.start_date || item.end_date) && (
              <div className="flex items-center gap-2 text-sm text-gray-500">
                <Calendar size={14} />
                {item.start_date && `Started: ${new Date(item.start_date).getFullYear()}`}
                {item.start_date && item.end_date && ' - '}
                {item.end_date && `Ended: ${new Date(item.end_date).getFullYear()}`}
              </div>
            )}
          </motion.div>
        ))
      )}
    </div>
  );

  const tabs = [
    { id: 'spouses', label: 'Spouses', icon: Heart, count: spouses.length },
    { id: 'parents', label: 'Parents', icon: Users, count: parents.length },
    { id: 'children', label: 'Children', icon: Baby, count: children.length }
  ];

  if (!isOpen) return null;

  return (
    <AnimatePresence>
      <div
        className="fixed inset-0 bg-black bg-opacity-70 backdrop-blur-sm flex items-start justify-center z-50 p-4 overflow-y-auto pt-10"
        style={{ position: 'fixed', top: 0, left: 0, width: '100vw', height: '100vh', zIndex: 9999, backgroundColor: 'rgba(0,0,0,0.8)' }}
      >
        <motion.div
          initial={{ opacity: 0, scale: 0.95, y: 20 }}
          animate={{ opacity: 1, scale: 1, y: 0 }}
          exit={{ opacity: 0, scale: 0.95, y: 20 }}
          transition={{ duration: 0.2 }}
          className="bg-gray-800 rounded-2xl shadow-2xl w-full max-w-2xl border border-gray-700 my-8 overflow-hidden"
        >
          {/* Header */}
          <div className="bg-gradient-to-r from-blue-600 to-purple-600 p-6">
            <div className="flex justify-between items-center">
              <div className="flex items-center gap-3">
                <div className="bg-white bg-opacity-20 p-2 rounded-lg">
                  <Heart className="text-white" size={24} />
                </div>
                <div className="flex-1">
                  <h2 className="text-2xl font-bold text-white">Relationships</h2>
                  <p className="text-blue-100 mt-1">Managing connections for <span className="font-semibold">{personName}</span></p>
                </div>
              </div>
              <button onClick={onClose} className="text-white hover:bg-white hover:bg-opacity-20 p-2 rounded-lg transition-colors">
                <X size={24} />
              </button>
            </div>

            {/* Tabs */}
            <div className="flex bg-white bg-opacity-20 p-1 rounded-lg mt-4">
              {tabs.map(tab => (
                <button
                  key={tab.id}
                  onClick={() => setActiveTab(tab.id)}
                  className={`flex-1 flex items-center justify-center gap-2 py-2 px-4 rounded-md text-sm font-medium transition-colors ${
                    activeTab === tab.id ? 'bg-white bg-opacity-20 text-white' : 'text-white hover:bg-white hover:bg-opacity-20'
                  }`}
                >
                  <tab.icon size={16} />
                  <span>{tab.label}</span>
                  <span className="bg-gray-600 text-xs px-2 py-1 rounded-full">{tab.count}</span>
                </button>
              ))}
            </div>
          </div>

          {/* Content */}
          <div className="p-6">
            {loading ? (
              <div className="flex flex-col items-center justify-center py-12">
                <div className="w-12 h-12 border-4 border-blue-500 border-t-transparent rounded-full animate-spin mb-4"></div>
                <p className="text-gray-400">Loading relationships...</p>
              </div>
            ) : (
              <>
                {activeTab === 'spouses' && <RelationshipList items={spouses} emptyMessage="No spouses or partners found" relType="spouse" onAddNew={() => handleAddNew('spouse')} />}
                {activeTab === 'parents' && <RelationshipList items={parents} emptyMessage="No parents found" relType="parent" onAddNew={() => handleAddNew('parent')} />}
                {activeTab === 'children' && <RelationshipList items={children} emptyMessage="No children found" relType="child" onAddNew={() => handleAddNew('child')} />}
              </>
            )}
          </div>
        </motion.div>
      </div>
      <AddRelativeModal
        isOpen={addModalOpen}
        onClose={() => setAddModalOpen(false)}
        sourceNode={{ id: personId, data: { label: personName } }}
        existingPeople={existingPeople}
        initialRelationType={initialRelationType}
        onSuccess={() => {
          fetchRelationships();
          onSuccess();
        }}
        onEditPersonClick={(id) => {
           setAddModalOpen(false);
           if (onEditProfileRequest) onEditProfileRequest(id);
        }}
      />
    </AnimatePresence>
  );
}

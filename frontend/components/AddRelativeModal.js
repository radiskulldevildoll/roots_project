"use client";
import { useState, useEffect } from 'react';
import axios from 'axios';
import { X, UserPlus, Users, Heart, Baby, Search, UserCheck } from 'lucide-react';
import { motion, AnimatePresence } from 'framer-motion';
import toast from 'react-hot-toast';
import { endpoints } from '../utils/config';
import { tokenStorage } from '../utils/storage';

export default function AddRelativeModal({ isOpen, onClose, sourceNode, existingPeople = [], onSuccess, initialRelationType = 'child', onEditPersonClick }) {
  const [modalMode, setModalMode] = useState('add');
  const [formData, setFormData] = useState({
    first_name: '',
    middle_name: '',
    last_name: '',
    relationType: initialRelationType
  });
  const [personFormData, setPersonFormData] = useState({
    first_name: '',
    middle_name: '',
    last_name: '',
    maiden_name: '',
    birth_date: '',
    birth_date_fuzzy: '',
    death_date: '',
    is_living: true,
    confidence_level: 100,
    bio: ''
  });
  const [addMode, setAddMode] = useState('new'); // 'new' or 'existing'
  const [searchQuery, setSearchQuery] = useState('');
  const [existingPersonId, setExistingPersonId] = useState(null);
  const [loading, setLoading] = useState(false);
  const [uploading, setUploading] = useState(false);

  const isRootPerson = !sourceNode;

  // Reset state when modal opens
  useEffect(() => {
    if (isOpen) {
      setModalMode('add');
      setAddMode('new');
      setSearchQuery('');
      setExistingPersonId(null);
      setFormData({ first_name: '', middle_name: '', last_name: '', relationType: initialRelationType });
      setPersonFormData({
        first_name: '',
        middle_name: '',
        last_name: '',
        maiden_name: '',
        birth_date: '',
        birth_date_fuzzy: '',
        death_date: '',
        is_living: true,
        confidence_level: 100,
        bio: ''
      });
    }
  }, [isOpen]);

  // Load person data when editing
  useEffect(() => {
    if (modalMode === 'edit' && sourceNode) {
      const fetchPerson = async () => {
        const token = tokenStorage.getAccessToken();
        try {
          const response = await axios.get(`${endpoints.genealogy.people}${sourceNode.id}/`, {
            headers: { Authorization: `Bearer ${token}` }
          });
          const person = response.data;
          setPersonFormData({
            first_name: person.first_name || '',
            middle_name: person.middle_name || '',
            last_name: person.last_name || '',
            maiden_name: person.maiden_name || '',
            birth_date: person.birth_date || '',
            birth_date_fuzzy: person.birth_date_fuzzy || '',
            death_date: person.death_date || '',
            is_living: person.is_living ?? true,
            confidence_level: person.confidence_level ?? 100,
            bio: person.bio || ''
          });
        } catch (error) {
          console.error('Failed to fetch person:', error);
          toast.error('Failed to load person details');
        }
      };
      fetchPerson();
    }
  }, [modalMode, sourceNode]);

  const filteredPeople = existingPeople.filter(p =>
    sourceNode && p.id !== sourceNode.id &&
    p.data.label.toLowerCase().includes(searchQuery.toLowerCase())
  );

  const relationshipOptions = [
    { value: 'sibling', label: 'Brother/Sister', icon: UserCheck, color: 'text-cyan-400' },
    { value: 'child', label: 'Son/Daughter', icon: Baby, color: 'text-blue-400' },
    { value: 'spouse', label: 'Spouse/Partner', icon: Heart, color: 'text-pink-400' },
    { value: 'parent', label: 'Mother/Father', icon: Users, color: 'text-purple-400' },
  ];

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (modalMode === 'edit') {
      return await handleEditSubmit();
    }
    setLoading(true);
    const token = tokenStorage.getAccessToken();

    try {
      let newPersonId;

      if (addMode === 'existing' && existingPersonId) {
        newPersonId = existingPersonId;
        const person = existingPeople.find(p => p.id === existingPersonId);
        toast.success(`🔗 Linking ${person.data.label}...`);
      } else if (isRootPerson) {
        await axios.post(endpoints.genealogy.people, {
          first_name: formData.first_name,
          middle_name: formData.middle_name,
          last_name: formData.last_name,
        }, { headers: { Authorization: `Bearer ${token}` } });
        toast.success('🎉 First person added to your family tree!');
        onSuccess();
        onClose();
        return;
      } else {
        const personRes = await axios.post(endpoints.genealogy.people, {
          first_name: formData.first_name,
          middle_name: formData.middle_name,
          last_name: formData.last_name,
        }, { headers: { Authorization: `Bearer ${token}` } });
        newPersonId = personRes.data.id;
      }

      // Link logic (when not root)
      if (!isRootPerson) {
        if (formData.relationType === 'spouse') {
          await axios.post(endpoints.genealogy.relationships, {
            person_a: sourceNode.id,
            person_b: newPersonId,
            relationship_type: 'MAR'
          }, { headers: { Authorization: `Bearer ${token}` } });
          toast.success(addMode === 'new' ? `💍 ${formData.first_name} added as spouse` : '💍 Spouse linked successfully');
        } else if (formData.relationType === 'child') {
          await axios.post(endpoints.genealogy.parentLinks, {
            child: newPersonId,
            single_parent: sourceNode.id,
            link_type: 'BIO'
          }, { headers: { Authorization: `Bearer ${token}` } });
          toast.success(addMode === 'new' ? `👶 ${formData.first_name} added as child` : '👶 Child linked successfully');
        } else if (formData.relationType === 'parent') {
          await axios.post(endpoints.genealogy.parentLinks, {
            child: sourceNode.id,
            single_parent: newPersonId,
            link_type: 'BIO'
          }, { headers: { Authorization: `Bearer ${token}` } });
          toast.success(addMode === 'new' ? `👨‍👩‍👦 ${formData.first_name} added as parent` : '👨‍👩‍👦 Parent linked successfully');
        } else if (formData.relationType === 'sibling') {
          // Fetch parent links from the source person and duplicate them for the new sibling
          const parentLinksResponse = await axios.get(`${endpoints.genealogy.parent_links}?child=${sourceNode.id}`, {
            headers: { Authorization: `Bearer ${token}` }
          });
          for (const link of parentLinksResponse.data) {
            if (link.relationship) {
              await axios.post(endpoints.genealogy.parentLinks, {
                child: newPersonId,
                relationship: link.relationship,
                link_type: 'BIO'
              }, { headers: { Authorization: `Bearer ${token}` } });
            } else if (link.single_parent) {
              await axios.post(endpoints.genealogy.parentLinks, {
                child: newPersonId,
                single_parent: link.single_parent,
                link_type: 'BIO'
              }, { headers: { Authorization: `Bearer ${token}` } });
            }
          }
          toast.success(addMode === 'new' ? `👫 ${formData.first_name} added as sibling` : '👫 Sibling linked successfully');
        }
      }

      onSuccess();
      onClose();
    } catch (err) {
      console.error('Failed to add/link relative:', err);
      toast.error('Failed to process. Please try again.');
    } finally {
      setLoading(false);
    }
  };

  const handleEditSubmit = async () => {
    setLoading(true);
    const token = tokenStorage.getAccessToken();

    try {
      await axios.patch(`${endpoints.genealogy.people}${sourceNode.id}/`, {
        first_name: personFormData.first_name,
        middle_name: personFormData.middle_name,
        last_name: personFormData.last_name,
        maiden_name: personFormData.maiden_name,
        birth_date: personFormData.birth_date || null,
        birth_date_fuzzy: personFormData.birth_date_fuzzy,
        death_date: personFormData.death_date || null,
        is_living: personFormData.is_living,
        confidence_level: parseInt(personFormData.confidence_level),
        bio: personFormData.bio
      }, { headers: { Authorization: `Bearer ${token}` } });

      toast.success('✅ Profile updated successfully!');
      onSuccess();
      onClose();
    } catch (error) {
      console.error('Failed to update person:', error);
      toast.error('Failed to update profile. Please try again.');
    } finally {
      setLoading(false);
    }
  };

  return (
    <AnimatePresence>
      {isOpen && (
        <div className="fixed inset-0 bg-black bg-opacity-70 backdrop-blur-sm flex items-start justify-center z-50 p-4 overflow-y-auto pt-10"
          style={{ position: 'fixed', top: 0, left: 0, width: '100vw', height: '100vh', zIndex: 9999, backgroundColor: 'rgba(0,0,0,0.8)' }}>
          <motion.div
            initial={{ opacity: 0, scale: 0.95, y: 20 }}
            animate={{ opacity: 1, scale: 1, y: 0 }}
            exit={{ opacity: 0, scale: 0.95, y: 20 }}
            transition={{ duration: 0.2 }}
            className="bg-gray-800 rounded-2xl shadow-2xl w-full max-w-md border border-gray-700 overflow-hidden">
            {/* Header */}
            <div className="bg-gradient-to-r from-emerald-600 to-teal-600 p-6">
              <div className="flex justify-between items-center">
                <div className="flex items-center gap-3">
                  <div className="bg-white bg-opacity-20 p-2 rounded-lg"><UserPlus className="text-white" size={24} /></div>
                  <h2 className="text-2xl font-bold text-white">{isRootPerson ? 'Start Your Family Tree' : 'Add Family Member'}</h2>
                </div>
                <button onClick={onClose} className="text-white hover:bg-white hover:bg-opacity-20 p-2 rounded-lg transition-colors"><X size={24} /></button>
              </div>
              {!isRootPerson && (
                <p className="text-emerald-100 mt-2 text-sm">Person: <span className="font-bold">{sourceNode?.data?.label}</span></p>
              )}
              {!isRootPerson && (
                <div className="flex mt-4 bg-white bg-opacity-20 p-1 rounded-lg">
                  <button onClick={() => setModalMode('add')} className={`flex-1 py-2 px-4 rounded-md text-sm font-medium transition-colors ${modalMode === 'add' ? 'bg-white bg-opacity-20 text-white' : 'text-white hover:bg-white hover:bg-opacity-20'}`}>Add Relative</button>
                  <button type="button" onClick={() => { onClose(); if (onEditPersonClick) onEditPersonClick(sourceNode.id); }} className={`flex-1 py-2 px-4 rounded-md text-sm font-medium transition-colors text-white hover:bg-white hover:bg-opacity-20`}>Edit Person</button>
                </div>
              )}
            </div>

            <form onSubmit={handleSubmit} className="p-6 space-y-5">
                  {/* Relationship selector */}
                  {!isRootPerson && (
                    <>
                      <div>
                        <label className="block text-gray-300 text-sm font-medium mb-3">Relationship</label>
                        <div className="grid grid-cols-1 sm:grid-cols-4 gap-3">
                          {relationshipOptions.map(option => {
                            const Icon = option.icon;
                            const selected = formData.relationType === option.value;
                            return (
                              <button key={option.value} type="button" onClick={() => setFormData({ ...formData, relationType: option.value })}
                                className={`p-4 rounded-xl border-2 flex flex-col items-center gap-2 ${selected ? 'border-emerald-500 bg-emerald-500 bg-opacity-10' : 'border-gray-600 hover:border-gray-500 bg-gray-900'}`}>
                                <Icon className={selected ? option.color : 'text-gray-400'} size={24} />
                                <span className={`text-sm font-medium ${selected ? 'text-white' : 'text-gray-400'}`}>{option.label}</span>
                              </button>
                            );
                          })}
                        </div>
                      </div>

                      {/* Mode toggle */}
                      <div className="flex bg-gray-900 p-1 rounded-lg border border-gray-700">
                        <button type="button" onClick={() => setAddMode('new')}
                          className={`flex-1 py-2 px-4 rounded-md text-sm font-medium ${addMode === 'new' ? 'bg-gray-700 text-white shadow' : 'text-gray-400 hover:text-white'}`}>New Person</button>
                        <button type="button" onClick={() => setAddMode('existing')}
                          className={`flex-1 py-2 px-4 rounded-md text-sm font-medium ${addMode === 'existing' ? 'bg-gray-700 text-white shadow' : 'text-gray-400 hover:text-white'}`}>Existing Person</button>
                      </div>
                    </>
                  )}

                  {addMode === 'new' ? (
                    <>
                      <div>
                        <label className="block text-gray-300 text-sm font-medium mb-2">First Name *</label>
                        <input type="text" placeholder="Enter first name" value={formData.first_name}
                          className="w-full bg-gray-900 text-white p-3 rounded-lg border border-gray-600 focus:border-emerald-500 focus:ring-2 focus:ring-emerald-500 outline-none"
                          onChange={e => setFormData({ ...formData, first_name: e.target.value })} required autoFocus />
                      </div>
                      <div>
                        <label className="block text-gray-300 text-sm font-medium mb-2">Middle Name</label>
                        <input type="text" placeholder="Enter middle name (optional)" value={formData.middle_name}
                          className="w-full bg-gray-900 text-white p-3 rounded-lg border border-gray-600 focus:border-emerald-500 focus:ring-2 focus:ring-emerald-500 outline-none"
                          onChange={e => setFormData({ ...formData, middle_name: e.target.value })} />
                      </div>
                      <div>
                        <label className="block text-gray-300 text-sm font-medium mb-2">Last Name *</label>
                        <input type="text" placeholder="Enter last name" value={formData.last_name}
                          className="w-full bg-gray-900 text-white p-3 rounded-lg border border-gray-600 focus:border-emerald-500 focus:ring-2 focus:ring-emerald-500 outline-none"
                          onChange={e => setFormData({ ...formData, last_name: e.target.value })} required />
                      </div>
                    </>
                  ) : (
                    <div className="space-y-4">
                      <div>
                        <label className="block text-gray-300 text-sm font-medium mb-2">Search Person</label>
                        <div className="relative">
                          <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400" size={18} />
                          <input type="text" placeholder="Search..." value={searchQuery} onChange={e => setSearchQuery(e.target.value)}
                            className="w-full bg-gray-900 text-white pl-10 p-3 rounded-lg border border-gray-600 focus:border-emerald-500 outline-none" autoFocus />
                        </div>
                      </div>
                      <div className="max-h-48 overflow-y-auto space-y-2">
                        {filteredPeople.length > 0 ? (
                          filteredPeople.map(person => (
                            <button key={person.id} type="button" onClick={() => setExistingPersonId(person.id)}
                              className={`w-full p-3 rounded-lg flex items-center gap-3 ${existingPersonId === person.id ? 'bg-emerald-500 bg-opacity-20 border border-emerald-500' : 'bg-gray-900 border border-gray-700 hover:border-gray-500'}`}>
                              {person.data.profile_picture ? (
                                <img src={person.data.profile_picture} alt="" className="w-8 h-8 rounded-full object-cover" />
                              ) : (
                                <div className="w-8 h-8 rounded-full bg-gray-700 flex items-center justify-center"><Users size={14} className="text-gray-400" /></div>
                              )}
                              <span className="text-white text-sm font-medium">{person.data.label}</span>
                            </button>
                          ))
                        ) : (
                          <div className="text-center text-gray-500 text-sm py-4">{searchQuery ? 'No people found' : 'Type to search...'}</div>
                        )}
                      </div>
                    </div>
                  )}

                  <div className="flex gap-3 pt-4">
                    <button type="button" onClick={onClose} className="flex-1 bg-gray-700 hover:bg-gray-600 py-3 px-4 rounded-lg font-semibold" disabled={loading}>Cancel</button>
                    <button type="submit" disabled={loading}
                      className="flex-1 bg-gradient-to-r from-emerald-600 to-teal-600 hover:from-emerald-500 hover:to-teal-500 py-3 px-4 rounded-lg font-semibold shadow-lg shadow-emerald-900/50 disabled:opacity-50 disabled:cursor-not-allowed flex items-center justify-center gap-2">
                      {loading ? (
                        <> <div className="w-5 h-5 border-2 border-white border-t-transparent rounded-full animate-spin"></div>Adding...</>
                      ) : (
                        <> <UserPlus size={18} />Add to Tree</>
                      )}
                    </button>
                  </div>
            </form>
          </motion.div>
        </div>
      )}
    </AnimatePresence>
  );
}

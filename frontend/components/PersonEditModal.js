"use client";
import { useState, useEffect } from 'react';
import axios from 'axios';
import { X, Upload, Save, Camera, Calendar, Heart, Award, Trash, BookOpen, Image as ImageIcon, Video, FileText, Music } from 'lucide-react';
import { motion, AnimatePresence } from 'framer-motion';
import toast from 'react-hot-toast';
import { endpoints } from '../utils/config';
import { tokenStorage } from '../utils/storage';
import StoryModal from './StoryModal';
import MediaViewerModal from './MediaViewerModal';

export default function PersonEditModal({ isOpen, onClose, personId, onSuccess }) {
  const [activeTab, setActiveTab] = useState('info'); // 'info', 'stories', 'media'
  const [formData, setFormData] = useState({
    first_name: '',
    middle_name: '',
    last_name: '',
    maiden_name: '',
    birth_date: '',
    birth_date_fuzzy: '',
    death_date: '',
    is_living: true,
    confidence_level: 100,
    bio: '',
    profile_picture: null
  });
  
  // Data for other tabs
  const [personStories, setPersonStories] = useState([]);
  const [personMedia, setPersonMedia] = useState([]);
  
  const [loading, setLoading] = useState(true);
  const [uploading, setUploading] = useState(false);
  
  // Modal states for child items
  const [selectedStory, setSelectedStory] = useState(null);
  const [isStoryModalOpen, setIsStoryModalOpen] = useState(false);
  const [selectedMedia, setSelectedMedia] = useState(null);

  useEffect(() => {
    if (isOpen && personId) {
      setLoading(true);
      fetchPerson();
      fetchLinkedData();
    }
  }, [personId, isOpen]);

  const fetchPerson = async () => {
    const token = tokenStorage.getAccessToken();
    try {
      const response = await axios.get(`${endpoints.genealogy.people}${personId}/`, {
        headers: { Authorization: `Bearer ${token}` }
      });
      const person = response.data;
      setFormData({
        first_name: person.first_name || '',
        middle_name: person.middle_name || '',
        last_name: person.last_name || '',
        maiden_name: person.maiden_name || '',
        birth_date: person.birth_date || '',
        birth_date_fuzzy: person.birth_date_fuzzy || '',
        death_date: person.death_date || '',
        is_living: person.is_living ?? true,
        confidence_level: person.confidence_level ?? 100,
        bio: person.bio || '',
        profile_picture: person.profile_picture
      });
    } catch (error) {
      console.error('Failed to fetch person:', error);
      toast.error('Failed to load person details');
      onClose();
    } finally {
      setLoading(false);
    }
  };

  const fetchLinkedData = async () => {
    const token = tokenStorage.getAccessToken();
    try {
        const [storiesRes, mediaRes] = await Promise.all([
            axios.get(endpoints.stories.byPerson(personId), { headers: { Authorization: `Bearer ${token}` } }),
            axios.get(endpoints.media.byPerson(personId), { headers: { Authorization: `Bearer ${token}` } })
        ]);
        setPersonStories(storiesRes.data);
        setPersonMedia(mediaRes.data);
    } catch (err) {
        console.error("Failed to fetch linked data", err);
    }
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    const token = tokenStorage.getAccessToken();

    try {
      const updateData = {
        first_name: formData.first_name,
        middle_name: formData.middle_name,
        last_name: formData.last_name,
        maiden_name: formData.maiden_name,
        birth_date: formData.birth_date || null,
        birth_date_fuzzy: formData.birth_date_fuzzy,
        death_date: formData.death_date || null,
        is_living: formData.is_living,
        confidence_level: parseInt(formData.confidence_level),
        bio: formData.bio
      };

      await axios.patch(`${endpoints.genealogy.people}${personId}/`, updateData, {
        headers: { Authorization: `Bearer ${token}` }
      });

      toast.success('✅ Profile updated successfully!');
      onSuccess();
      onClose();
    } catch (error) {
      console.error('Failed to update person:', error);
      toast.error('Failed to update profile. Please try again.');
    }
  };

  const handleDelete = async () => {
    const token = tokenStorage.getAccessToken();
    try {
      await axios.delete(`${endpoints.genealogy.people}${personId}/`, {
        headers: { Authorization: `Bearer ${token}` }
      });
      toast.success('🗑️ Person deleted successfully');
      onSuccess();
      onClose();
    } catch (error) {
      console.error('Failed to delete person:', error);
      toast.error('Failed to delete person. Please try again.');
    }
  };

  const handleImageUpload = async (e) => {
    const file = e.target.files[0];
    if (!file) return;

    const token = tokenStorage.getAccessToken();
    const formDataUpload = new FormData();
    formDataUpload.append('profile_picture', file);

    setUploading(true);
    try {
      await axios.patch(endpoints.genealogy.uploadPhoto(personId), formDataUpload, {
        headers: {
          Authorization: `Bearer ${token}`,
          'Content-Type': 'multipart/form-data'
        }
      });

      const response = await axios.get(`${endpoints.genealogy.people}${personId}/`, {
        headers: { Authorization: `Bearer ${token}` }
      });
      setFormData(prev => ({ ...prev, profile_picture: response.data.profile_picture }));

      toast.success('📸 Photo uploaded successfully!');
      onSuccess();
    } catch (error) {
      console.error('Failed to upload image:', error);
      toast.error('Failed to upload photo. Please try again.');
    } finally {
      setUploading(false);
    }
  };

  if (!isOpen || !personId) return null;

  if (loading) {
    return (
      <div className="fixed inset-0 bg-black bg-opacity-70 backdrop-blur-sm flex justify-center items-center z-50">
        <div className="bg-gray-800 p-8 rounded-2xl shadow-xl border border-gray-700">
          <div className="flex flex-col items-center gap-3">
            <div className="w-12 h-12 border-4 border-emerald-500 border-t-transparent rounded-full animate-spin"></div>
            <div className="text-white font-medium">Loading profile...</div>
          </div>
        </div>
      </div>
    );
  }

  const confidenceColor = formData.confidence_level >= 80 ? 'text-green-400' : 
                          formData.confidence_level >= 50 ? 'text-yellow-400' : 'text-orange-400';

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
          className="bg-gray-800 rounded-2xl shadow-2xl w-full max-w-2xl border border-gray-700 my-8 overflow-hidden flex flex-col max-h-[90vh]"
        >
          {/* Header */}
          <div className="bg-gradient-to-r from-purple-600 to-indigo-600 p-6 flex-shrink-0">
            <div className="flex justify-between items-center mb-4">
                <div className="flex items-center gap-3">
                    <h2 className="text-2xl font-bold text-white">
                        {formData.first_name} {formData.last_name}
                    </h2>
                </div>
                <div className="flex space-x-2">
                    <button 
                        onClick={onClose}
                        className="text-white hover:bg-white hover:bg-opacity-20 p-2 rounded-lg transition-colors"
                    >
                        <X size={24} />
                    </button>
                </div>
            </div>

            {/* Tabs */}
            <div className="flex gap-4 border-b border-white/20">
                <button
                    onClick={() => setActiveTab('info')}
                    className={`pb-2 px-2 text-sm font-medium transition-colors ${activeTab === 'info' ? 'text-white border-b-2 border-white' : 'text-white/60 hover:text-white'}`}
                >
                    Info & Bio
                </button>
                <button
                    onClick={() => setActiveTab('stories')}
                    className={`pb-2 px-2 text-sm font-medium transition-colors ${activeTab === 'stories' ? 'text-white border-b-2 border-white' : 'text-white/60 hover:text-white'}`}
                >
                    Stories ({personStories.length})
                </button>
                <button
                    onClick={() => setActiveTab('media')}
                    className={`pb-2 px-2 text-sm font-medium transition-colors ${activeTab === 'media' ? 'text-white border-b-2 border-white' : 'text-white/60 hover:text-white'}`}
                >
                    Media ({personMedia.length})
                </button>
            </div>
          </div>

          {/* Content Area */}
          <div className="p-6 overflow-y-auto custom-scrollbar flex-1">
            
            {activeTab === 'info' && (
                <form onSubmit={handleSubmit} className="space-y-6">
                    {/* Profile Picture Section */}
                    <div className="flex flex-col items-center">
                    <div className="relative group">
                        <div className="w-32 h-32 rounded-full bg-gray-700 overflow-hidden shadow-lg border-4 border-gray-600">
                        {formData.profile_picture ? (
                            <img src={formData.profile_picture} alt="Profile" className="w-full h-full object-cover" />
                        ) : (
                            <div className="w-full h-full flex items-center justify-center text-gray-400">
                            <Camera size={40} />
                            </div>
                        )}
                        </div>
                        <label className="absolute bottom-0 right-0 bg-emerald-600 hover:bg-emerald-500 p-3 rounded-full cursor-pointer shadow-lg transition-colors">
                        <input
                            type="file"
                            accept="image/*"
                            onChange={handleImageUpload}
                            className="hidden"
                            disabled={uploading}
                        />
                        {uploading ? (
                            <div className="w-5 h-5 border-2 border-white border-t-transparent rounded-full animate-spin"></div>
                        ) : (
                            <Upload size={20} className="text-white" />
                        )}
                        </label>
                    </div>
                    </div>

                    {/* Name Fields */}
                    <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                    <div>
                        <label className="block text-gray-300 text-sm font-medium mb-2">First Name *</label>
                        <input
                        className="w-full bg-gray-900 text-white p-3 rounded-lg border border-gray-600 outline-none"
                        value={formData.first_name}
                        onChange={e => setFormData({...formData, first_name: e.target.value})}
                        required
                        />
                    </div>
                    <div>
                        <label className="block text-gray-300 text-sm font-medium mb-2">Middle Name</label>
                        <input
                        className="w-full bg-gray-900 text-white p-3 rounded-lg border border-gray-600 outline-none"
                        value={formData.middle_name}
                        onChange={e => setFormData({...formData, middle_name: e.target.value})}
                        />
                    </div>
                    <div>
                        <label className="block text-gray-300 text-sm font-medium mb-2">Last Name *</label>
                        <input
                        className="w-full bg-gray-900 text-white p-3 rounded-lg border border-gray-600 outline-none"
                        value={formData.last_name}
                        onChange={e => setFormData({...formData, last_name: e.target.value})}
                        required
                        />
                    </div>
                    <div>
                        <label className="block text-gray-300 text-sm font-medium mb-2">Maiden Name</label>
                        <input
                        className="w-full bg-gray-900 text-white p-3 rounded-lg border border-gray-600 outline-none"
                        value={formData.maiden_name}
                        onChange={e => setFormData({...formData, maiden_name: e.target.value})}
                        />
                    </div>
                    </div>

                    {/* Birth Information */}
                    <div className="bg-gray-900 p-4 rounded-lg border border-gray-700">
                    <h3 className="text-white font-semibold mb-3 flex items-center gap-2">
                        <Calendar size={18} className="text-blue-400" />
                        Birth Information
                    </h3>
                    <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                        <div>
                        <label className="block text-gray-400 text-sm mb-1">Birth Date</label>
                        <input
                            type="date"
                            className="w-full bg-gray-800 text-white p-2 rounded-lg border border-gray-600 outline-none"
                            value={formData.birth_date}
                            onChange={e => setFormData({...formData, birth_date: e.target.value})}
                        />
                        </div>
                        <div>
                        <label className="block text-gray-400 text-sm mb-1">Or Fuzzy Date</label>
                        <input
                            placeholder="e.g., 'About 1900'"
                            className="w-full bg-gray-800 text-white p-2 rounded-lg border border-gray-600 outline-none"
                            value={formData.birth_date_fuzzy}
                            onChange={e => setFormData({...formData, birth_date_fuzzy: e.target.value})}
                        />
                        </div>
                    </div>
                    </div>

                    {/* Status & Confidence */}
                    <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                        <div className="bg-gray-900 p-4 rounded-lg border border-gray-700">
                            <h3 className="text-white font-semibold mb-3 flex items-center gap-2">
                                <Heart size={18} className="text-pink-400" /> Status
                            </h3>
                            <label className="flex items-center gap-3 cursor-pointer">
                                <input
                                    type="checkbox"
                                    checked={formData.is_living}
                                    onChange={e => setFormData({...formData, is_living: e.target.checked, death_date: e.target.checked ? '' : formData.death_date})}
                                    className="w-4 h-4 rounded border-gray-600 text-emerald-500"
                                />
                                <span className="text-gray-300">Living Person</span>
                            </label>
                            {!formData.is_living && (
                                <div className="mt-3">
                                    <label className="block text-gray-400 text-sm mb-1">Death Date</label>
                                    <input
                                        type="date"
                                        className="w-full bg-gray-800 text-white p-2 rounded-lg border border-gray-600 outline-none"
                                        value={formData.death_date}
                                        onChange={e => setFormData({...formData, death_date: e.target.value})}
                                    />
                                </div>
                            )}
                        </div>

                        <div className="bg-gray-900 p-4 rounded-lg border border-gray-700">
                            <h3 className="text-white font-semibold mb-3 flex items-center gap-2">
                                <Award size={18} className="text-yellow-400" /> Confidence
                            </h3>
                            <div className="flex justify-between items-center mb-2">
                                <span className="text-gray-400 text-sm">Level</span>
                                <span className={`font-bold ${confidenceColor}`}>{formData.confidence_level}%</span>
                            </div>
                            <input
                                type="range"
                                min="0" max="100" step="10"
                                className="w-full h-2 bg-gray-700 rounded-lg appearance-none cursor-pointer accent-purple-500"
                                value={formData.confidence_level}
                                onChange={e => setFormData({...formData, confidence_level: e.target.value})}
                            />
                        </div>
                    </div>

                    {/* Bio */}
                    <div>
                    <label className="block text-gray-300 text-sm font-medium mb-2">Biography</label>
                    <textarea
                        className="w-full bg-gray-900 text-white p-3 rounded-lg border border-gray-600 outline-none resize-none"
                        value={formData.bio}
                        onChange={e => setFormData({...formData, bio: e.target.value})}
                        rows="4"
                    />
                    </div>

                    <div className="flex gap-3 pt-4">
                        <button
                            type="button"
                            onClick={() => {
                                if (window.confirm('Delete this person?')) handleDelete();
                            }}
                            className="bg-red-900/30 hover:bg-red-900/50 text-red-400 py-3 px-4 rounded-lg transition-colors"
                        >
                            <Trash size={20} />
                        </button>
                        <button
                            type="submit"
                            className="flex-1 bg-gradient-to-r from-purple-600 to-indigo-600 hover:from-purple-500 hover:to-indigo-500 py-3 px-4 rounded-lg font-semibold shadow-lg flex items-center justify-center gap-2"
                        >
                            <Save size={18} /> Save Changes
                        </button>
                    </div>
                </form>
            )}

            {activeTab === 'stories' && (
                <div className="space-y-4">
                    {personStories.length === 0 ? (
                        <div className="text-center text-gray-500 py-8">
                            <BookOpen size={48} className="mx-auto mb-2 opacity-50" />
                            <p>No stories linked to this person yet.</p>
                        </div>
                    ) : (
                        personStories.map(story => (
                            <div 
                                key={story.id} 
                                onClick={() => { setSelectedStory(story); setIsStoryModalOpen(true); }}
                                className="bg-gray-700/50 p-4 rounded-xl cursor-pointer hover:bg-gray-700 transition-colors border border-gray-600 hover:border-emerald-500"
                            >
                                <h4 className="font-bold text-lg text-white mb-1">{story.title}</h4>
                                <p className="text-sm text-gray-300 line-clamp-2">{story.content}</p>
                                {story.event_date_fuzzy && <span className="text-xs text-emerald-400 mt-2 block">{story.event_date_fuzzy}</span>}
                            </div>
                        ))
                    )}
                </div>
            )}

            {activeTab === 'media' && (
                <div className="grid grid-cols-2 sm:grid-cols-3 gap-3">
                    {personMedia.length === 0 ? (
                         <div className="col-span-full text-center text-gray-500 py-8">
                            <ImageIcon size={48} className="mx-auto mb-2 opacity-50" />
                            <p>No photos or media linked yet.</p>
                        </div>
                    ) : (
                        personMedia.map(item => (
                            <div 
                                key={item.id} 
                                onClick={() => setSelectedMedia(item)}
                                className="aspect-square bg-gray-700 rounded-lg overflow-hidden relative group cursor-pointer border border-gray-600"
                            >
                                {item.media_type === 'PHO' ? (
                                    <img src={item.file} alt={item.title} className="w-full h-full object-cover group-hover:scale-110 transition-transform" />
                                ) : (
                                    <div className="w-full h-full flex flex-col items-center justify-center text-gray-400">
                                        {item.media_type === 'VID' ? <Video /> : item.media_type === 'AUD' ? <Music /> : <FileText />}
                                    </div>
                                )}
                                <div className="absolute inset-0 bg-black/60 opacity-0 group-hover:opacity-100 transition-opacity flex items-end p-2">
                                    <span className="text-xs text-white truncate w-full">{item.title}</span>
                                </div>
                            </div>
                        ))
                    )}
                </div>
            )}

          </div>
        </motion.div>
      </div>

      <StoryModal
        isOpen={isStoryModalOpen}
        onClose={() => setIsStoryModalOpen(false)}
        story={selectedStory}
        onSuccess={() => { fetchLinkedData(); }} 
      />

      <MediaViewerModal
        isOpen={!!selectedMedia}
        onClose={() => setSelectedMedia(null)}
        media={selectedMedia}
      />
    </AnimatePresence>
  );
}

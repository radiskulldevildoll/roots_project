import React, { useState, useEffect } from 'react';
import axios from 'axios';
import { X, Save, Trash2, Calendar, Users, FileText } from 'lucide-react';
import { endpoints } from '../utils/config';
import toast from 'react-hot-toast';

export default function StoryModal({ isOpen, onClose, story = null, onSuccess }) {
  const [formData, setFormData] = useState({
    title: '',
    content: '',
    event_date_fuzzy: '',
    tagged_people: [] // List of IDs
  });
  const [people, setPeople] = useState([]); // All available people for tagging
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    if (isOpen) {
      fetchPeople();
      if (story) {
        setFormData({
          title: story.title,
          content: story.content,
          event_date_fuzzy: story.event_date_fuzzy || '',
          tagged_people: story.tagged_people || [] // Assuming API returns IDs or objects
        });
      } else {
        setFormData({
          title: '',
          content: '',
          event_date_fuzzy: '',
          tagged_people: []
        });
      }
    }
  }, [isOpen, story]);

  const fetchPeople = async () => {
    try {
      const token = localStorage.getItem('access_token');
      const res = await axios.get(endpoints.genealogy.people, {
        headers: { Authorization: `Bearer ${token}` }
      });
      setPeople(res.data);
    } catch (err) {
      console.error("Failed to fetch people", err);
    }
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setLoading(true);
    const token = localStorage.getItem('access_token');
    
    try {
      if (story) {
        await axios.patch(endpoints.stories.detail(story.id), formData, {
          headers: { Authorization: `Bearer ${token}` }
        });
        toast.success('Story updated');
      } else {
        await axios.post(endpoints.stories.list, formData, {
          headers: { Authorization: `Bearer ${token}` }
        });
        toast.success('Story created');
      }
      onSuccess();
      onClose();
    } catch (err) {
      console.error("Failed to save story", err);
      toast.error('Failed to save story');
    } finally {
      setLoading(false);
    }
  };

  const handleDelete = async () => {
    if (!window.confirm("Are you sure you want to delete this story?")) return;
    const token = localStorage.getItem('access_token');
    try {
      await axios.delete(endpoints.stories.detail(story.id), {
        headers: { Authorization: `Bearer ${token}` }
      });
      toast.success('Story deleted');
      onSuccess();
      onClose();
    } catch (err) {
      toast.error('Failed to delete');
    }
  };

  const togglePersonTag = (personId) => {
    setFormData(prev => {
      const current = prev.tagged_people;
      if (current.includes(personId)) {
        return { ...prev, tagged_people: current.filter(id => id !== personId) };
      } else {
        return { ...prev, tagged_people: [...current, personId] };
      }
    });
  };

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 bg-black/80 flex justify-center items-center z-50 backdrop-blur-sm p-4">
      <div className="bg-gray-900 rounded-2xl shadow-2xl w-full max-w-2xl border border-gray-700 flex flex-col max-h-[90vh]">
        
        {/* Header */}
        <div className="p-6 border-b border-gray-700 flex justify-between items-center bg-gray-850 rounded-t-2xl">
          <h2 className="text-2xl font-bold text-emerald-400 flex items-center gap-2">
            <BookOpen size={24} />
            {story ? 'Edit Story' : 'Write New Story'}
          </h2>
          <button onClick={onClose} className="text-gray-400 hover:text-white transition-colors">
            <X size={24} />
          </button>
        </div>

        {/* Content - Scrollable */}
        <div className="p-6 overflow-y-auto custom-scrollbar flex-1 space-y-6">
          
          {/* Title */}
          <div>
            <label className="block text-sm font-medium text-gray-400 mb-1">Title</label>
            <input
              type="text"
              value={formData.title}
              onChange={e => setFormData({...formData, title: e.target.value})}
              className="w-full bg-gray-800 border border-gray-700 rounded-xl px-4 py-3 text-white focus:ring-2 focus:ring-emerald-500 focus:outline-none"
              placeholder="e.g., The Great Migration of 1920"
              required
            />
          </div>

          {/* Date */}
          <div>
            <label className="block text-sm font-medium text-gray-400 mb-1">When did this happen? (Approximate)</label>
            <div className="relative">
              <Calendar className="absolute left-4 top-1/2 -translate-y-1/2 text-gray-500" size={18} />
              <input
                type="text"
                value={formData.event_date_fuzzy}
                onChange={e => setFormData({...formData, event_date_fuzzy: e.target.value})}
                className="w-full bg-gray-800 border border-gray-700 rounded-xl pl-12 pr-4 py-3 text-white focus:ring-2 focus:ring-emerald-500 focus:outline-none"
                placeholder="e.g., Summer 1969, or Dec 25, 2000"
              />
            </div>
          </div>

          {/* Tag People */}
          <div>
            <label className="block text-sm font-medium text-gray-400 mb-2">Tag Family Members</label>
            <div className="flex flex-wrap gap-2 max-h-40 overflow-y-auto p-2 bg-gray-800 rounded-xl border border-gray-700">
              {people.map(person => (
                <button
                  key={person.id}
                  type="button"
                  onClick={() => togglePersonTag(person.id)}
                  className={`px-3 py-1 rounded-full text-sm border transition-all ${
                    formData.tagged_people.includes(person.id)
                      ? 'bg-emerald-600/20 border-emerald-500 text-emerald-300'
                      : 'bg-gray-700/50 border-gray-600 text-gray-400 hover:bg-gray-700'
                  }`}
                >
                  {person.first_name} {person.last_name}
                </button>
              ))}
              {people.length === 0 && <span className="text-gray-500 text-sm p-2">No people added to tree yet.</span>}
            </div>
          </div>

          {/* Content Body */}
          <div>
            <label className="block text-sm font-medium text-gray-400 mb-1">Story Content</label>
            <textarea
              value={formData.content}
              onChange={e => setFormData({...formData, content: e.target.value})}
              rows={8}
              className="w-full bg-gray-800 border border-gray-700 rounded-xl px-4 py-3 text-white focus:ring-2 focus:ring-emerald-500 focus:outline-none resize-none font-serif leading-relaxed text-lg"
              placeholder="Once upon a time..."
            />
          </div>

        </div>

        {/* Footer */}
        <div className="p-6 border-t border-gray-700 bg-gray-850 rounded-b-2xl flex justify-between">
          {story ? (
            <button 
              onClick={handleDelete}
              className="px-6 py-2 rounded-xl border border-red-500/30 text-red-400 hover:bg-red-900/20 flex items-center gap-2 transition-colors"
            >
              <Trash2 size={18} /> Delete
            </button>
          ) : <div></div>}
          
          <button 
            onClick={handleSubmit}
            disabled={loading || !formData.title}
            className={`px-8 py-3 rounded-xl font-bold text-white shadow-lg flex items-center gap-2 transition-all ${
              loading || !formData.title
                ? 'bg-gray-700 text-gray-500 cursor-not-allowed'
                : 'bg-emerald-600 hover:bg-emerald-500 shadow-emerald-900/20'
            }`}
          >
            {loading ? 'Saving...' : <><Save size={18} /> Save Story</>}
          </button>
        </div>

      </div>
    </div>
  );
}



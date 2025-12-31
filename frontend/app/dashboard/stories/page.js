"use client";
import React, { useState, useEffect } from 'react';
import axios from 'axios';
import { Plus, Search, BookOpen, Calendar, Users, Edit2, ArrowRight } from 'lucide-react';
import { endpoints } from '../../../utils/config';
import { tokenStorage } from '../../../utils/storage';
import StoryModal from '../../../components/StoryModal';
import { motion } from 'framer-motion';

export default function StoriesPage() {
  const [stories, setStories] = useState([]);
  const [loading, setLoading] = useState(true);
  const [searchQuery, setSearchQuery] = useState('');
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [selectedStory, setSelectedStory] = useState(null);

  useEffect(() => {
    fetchStories();
  }, []);

  const fetchStories = async () => {
    setLoading(true);
    try {
      const token = tokenStorage.getAccessToken();
      const res = await axios.get(endpoints.stories.list, {
        headers: { Authorization: `Bearer ${token}` }
      });
      setStories(res.data);
    } catch (err) {
      console.error("Failed to fetch stories", err);
    } finally {
      setLoading(false);
    }
  };

  const handleCreate = () => {
    setSelectedStory(null);
    setIsModalOpen(true);
  };

  const handleEdit = (story) => {
    setSelectedStory(story);
    setIsModalOpen(true);
  };

  const filteredStories = stories.filter(s => 
    s.title.toLowerCase().includes(searchQuery.toLowerCase()) || 
    s.content.toLowerCase().includes(searchQuery.toLowerCase())
  );

  return (
    <div className="h-full flex flex-col bg-gray-900 overflow-hidden">
      {/* Header */}
      <div className="p-6 border-b border-gray-800 flex flex-col md:flex-row justify-between items-start md:items-center gap-4 bg-gray-900/50 backdrop-blur-md sticky top-0 z-10">
        <div>
          <h1 className="text-3xl font-bold text-white flex items-center gap-3">
            <BookOpen className="text-emerald-500" />
            Family Stories
          </h1>
          <p className="text-gray-400 mt-1">Preserve memories and oral histories for generations.</p>
        </div>
        
        <div className="flex gap-3 w-full md:w-auto">
          <div className="relative flex-1 md:w-64">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-500" size={18} />
            <input 
              type="text" 
              placeholder="Search stories..." 
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="w-full bg-gray-800 border border-gray-700 rounded-xl pl-10 pr-4 py-2.5 text-white focus:outline-none focus:ring-2 focus:ring-emerald-500 transition-all"
            />
          </div>
          <button 
            onClick={handleCreate}
            className="bg-emerald-600 hover:bg-emerald-500 text-white px-5 py-2.5 rounded-xl font-medium shadow-lg shadow-emerald-900/20 flex items-center gap-2 transition-all hover:scale-105"
          >
            <Plus size={20} />
            <span className="hidden sm:inline">Write Story</span>
          </button>
        </div>
      </div>

      {/* Content */}
      <div className="flex-1 overflow-y-auto p-6 custom-scrollbar">
        {loading ? (
          <div className="flex justify-center items-center h-64">
            <div className="animate-spin rounded-full h-12 w-12 border-t-2 border-b-2 border-emerald-500"></div>
          </div>
        ) : filteredStories.length === 0 ? (
          <div className="flex flex-col items-center justify-center h-full text-center text-gray-500 opacity-60">
            <BookOpen size={64} className="mb-4 text-gray-700" />
            <p className="text-xl font-medium">No stories yet</p>
            <p className="max-w-md mt-2">Start writing the first chapter of your family's history.</p>
          </div>
        ) : (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6 pb-20">
            {filteredStories.map((story) => (
              <motion.div
                key={story.id}
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                layout
                onClick={() => handleEdit(story)}
                className="group bg-gray-800 border border-gray-700 rounded-2xl p-6 cursor-pointer hover:border-emerald-500/50 hover:shadow-xl hover:shadow-emerald-900/10 transition-all flex flex-col h-72"
              >
                <div className="flex justify-between items-start mb-4">
                  <div className="flex items-center gap-2 text-xs text-emerald-400 font-medium bg-emerald-900/30 px-2 py-1 rounded-lg">
                    <Calendar size={12} />
                    {story.event_date_fuzzy || 'Unknown Date'}
                  </div>
                  {story.tagged_people_details?.length > 0 && (
                    <div className="flex items-center gap-1 text-xs text-gray-400 bg-gray-700/50 px-2 py-1 rounded-lg">
                      <Users size={12} />
                      {story.tagged_people_details.length}
                    </div>
                  )}
                </div>

                <h3 className="text-xl font-bold text-white mb-2 line-clamp-2 group-hover:text-emerald-400 transition-colors">
                  {story.title}
                </h3>
                
                <p className="text-gray-400 text-sm line-clamp-4 leading-relaxed mb-auto">
                  {story.content}
                </p>

                <div className="mt-4 pt-4 border-t border-gray-700 flex justify-between items-center text-xs text-gray-500">
                  <span>By {story.author_name}</span>
                  <span className="group-hover:translate-x-1 transition-transform flex items-center gap-1 text-emerald-500/0 group-hover:text-emerald-400">
                    Read more <ArrowRight size={12} />
                  </span>
                </div>
              </motion.div>
            ))}
          </div>
        )}
      </div>

      <StoryModal 
        isOpen={isModalOpen} 
        onClose={() => setIsModalOpen(false)}
        story={selectedStory}
        onSuccess={fetchStories}
      />
    </div>
  );
}

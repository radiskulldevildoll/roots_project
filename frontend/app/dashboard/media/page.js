"use client";
import React, { useState, useEffect } from 'react';
import axios from 'axios';
import { Plus, Image as ImageIcon, Film, FileText, Music, Search, Filter } from 'lucide-react';
import { endpoints } from '../../../utils/config';
import { tokenStorage } from '../../../utils/storage';
import MediaUploadModal from '../../../components/MediaUploadModal';
import MediaViewerModal from '../../../components/MediaViewerModal';
import { motion } from 'framer-motion';

export default function MediaPage() {
  const [mediaItems, setMediaItems] = useState([]);
  const [loading, setLoading] = useState(true);
  const [filterType, setFilterType] = useState('ALL');
  const [uploadModalOpen, setUploadModalOpen] = useState(false);
  const [selectedMedia, setSelectedMedia] = useState(null);

  useEffect(() => {
    fetchMedia();
  }, []);

  const fetchMedia = async () => {
    setLoading(true);
    try {
      const token = tokenStorage.getAccessToken();
      const res = await axios.get(endpoints.media.list, {
        headers: { Authorization: `Bearer ${token}` }
      });
      setMediaItems(res.data);
    } catch (err) {
      console.error("Failed to fetch media", err);
    } finally {
      setLoading(false);
    }
  };

  const filteredItems = mediaItems.filter(item => {
    if (filterType === 'ALL') return true;
    return item.media_type === filterType;
  });

  const getIconForType = (type) => {
    switch (type) {
      case 'PHO': return <ImageIcon size={20} />;
      case 'VID': return <Film size={20} />;
      case 'DOC': return <FileText size={20} />;
      case 'AUD': return <Music size={20} />;
      default: return <ImageIcon size={20} />;
    }
  };

  return (
    <div className="h-full flex flex-col bg-gray-900 overflow-hidden">
      {/* Header */}
      <div className="p-6 border-b border-gray-800 bg-gray-900/50 backdrop-blur-md sticky top-0 z-10 flex flex-col md:flex-row justify-between items-start md:items-center gap-4">
        <div>
          <h1 className="text-3xl font-bold text-white flex items-center gap-3">
            <ImageIcon className="text-emerald-500" />
            Media Gallery
          </h1>
          <p className="text-gray-400 mt-1">Photos, documents, and artifacts.</p>
        </div>

        <div className="flex gap-3 w-full md:w-auto items-center">
            {/* Filter Tabs (Simple) */}
            <div className="flex bg-gray-800 p-1 rounded-xl">
                {['ALL', 'PHO', 'VID', 'DOC', 'AUD'].map((type) => (
                    <button
                        key={type}
                        onClick={() => setFilterType(type)}
                        className={`px-3 py-1.5 rounded-lg text-sm font-medium transition-all ${
                            filterType === type 
                            ? 'bg-gray-700 text-white shadow-sm' 
                            : 'text-gray-400 hover:text-white'
                        }`}
                    >
                        {type === 'ALL' ? 'All' : type}
                    </button>
                ))}
            </div>

            <button 
                onClick={() => setUploadModalOpen(true)}
                className="bg-emerald-600 hover:bg-emerald-500 text-white px-5 py-2.5 rounded-xl font-medium shadow-lg shadow-emerald-900/20 flex items-center gap-2 transition-all hover:scale-105"
            >
                <Plus size={20} />
                <span className="hidden sm:inline">Upload</span>
            </button>
        </div>
      </div>

      {/* Grid */}
      <div className="flex-1 overflow-y-auto p-6 custom-scrollbar">
        {loading ? (
           <div className="flex justify-center items-center h-64">
             <div className="animate-spin rounded-full h-12 w-12 border-t-2 border-b-2 border-emerald-500"></div>
           </div>
        ) : filteredItems.length === 0 ? (
           <div className="flex flex-col items-center justify-center h-full text-center text-gray-500 opacity-60">
             <ImageIcon size={64} className="mb-4 text-gray-700" />
             <p className="text-xl font-medium">Gallery is empty</p>
             <p className="max-w-md mt-2">Upload photos and documents to preserve them.</p>
           </div>
        ) : (
          <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 xl:grid-cols-5 gap-4 pb-20">
            {filteredItems.map((item) => (
              <motion.div
                key={item.id}
                layout
                initial={{ opacity: 0, scale: 0.9 }}
                animate={{ opacity: 1, scale: 1 }}
                onClick={() => setSelectedMedia(item)}
                className="aspect-square bg-gray-800 rounded-xl overflow-hidden cursor-pointer relative group border border-gray-700 hover:border-emerald-500/50 transition-all"
              >
                {item.media_type === 'PHO' ? (
                  <img src={item.file} alt={item.title} className="w-full h-full object-cover group-hover:scale-110 transition-transform duration-500" />
                ) : (
                  <div className="w-full h-full flex flex-col items-center justify-center text-gray-500 bg-gray-800 group-hover:bg-gray-750 transition-colors">
                     {getIconForType(item.media_type)}
                     <span className="text-xs mt-2 font-medium">{item.media_type}</span>
                  </div>
                )}
                
                {/* Overlay Info */}
                <div className="absolute inset-0 bg-gradient-to-t from-black/80 via-transparent to-transparent opacity-0 group-hover:opacity-100 transition-opacity flex flex-col justify-end p-3">
                  <p className="text-white font-bold text-sm truncate">{item.title}</p>
                  <p className="text-gray-300 text-xs">{item.media_date_fuzzy}</p>
                </div>
              </motion.div>
            ))}
          </div>
        )}
      </div>

      <MediaUploadModal 
        isOpen={uploadModalOpen} 
        onClose={() => setUploadModalOpen(false)}
        onSuccess={fetchMedia}
      />

      <MediaViewerModal
        isOpen={!!selectedMedia}
        onClose={() => setSelectedMedia(null)}
        media={selectedMedia}
      />
    </div>
  );
}

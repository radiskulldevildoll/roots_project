"use client";
import React from 'react';
import { X, Calendar, Download, Tag } from 'lucide-react';
import { motion } from 'framer-motion';

export default function MediaViewerModal({ isOpen, onClose, media }) {
  if (!isOpen || !media) return null;

  return (
    <div className="fixed inset-0 bg-black/95 flex flex-col z-50 backdrop-blur-md">
      
      {/* Header */}
      <div className="flex justify-between items-center p-4 text-white bg-gradient-to-b from-black/50 to-transparent absolute top-0 left-0 right-0 z-10">
        <h2 className="text-lg font-medium drop-shadow-md truncate max-w-md">{media.title}</h2>
        <button onClick={onClose} className="p-2 bg-black/40 rounded-full hover:bg-white/20 transition-colors">
          <X size={24} />
        </button>
      </div>

      {/* Main Content Area */}
      <div className="flex-1 flex items-center justify-center p-4 overflow-hidden relative">
        {media.media_type === 'PHO' && (
          <img 
            src={media.file} 
            alt={media.title} 
            className="max-h-full max-w-full object-contain shadow-2xl rounded-sm"
          />
        )}
        {media.media_type === 'VID' && (
          <video 
            src={media.file} 
            controls 
            className="max-h-full max-w-full shadow-2xl rounded-sm"
          />
        )}
        {media.media_type === 'AUD' && (
          <div className="bg-gray-800 p-8 rounded-2xl shadow-2xl flex flex-col items-center gap-4">
             <div className="w-16 h-16 bg-emerald-500 rounded-full flex items-center justify-center animate-pulse">
                <svg xmlns="http://www.w3.org/2000/svg" width="32" height="32" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M9 18V5l12-2v13"></path><circle cx="6" cy="18" r="3"></circle><circle cx="18" cy="16" r="3"></circle></svg>
             </div>
             <audio src={media.file} controls className="w-80" />
          </div>
        )}
        {media.media_type === 'DOC' && (
           <div className="bg-white p-8 rounded-lg shadow-2xl text-gray-900 text-center">
             <h3 className="text-xl font-bold mb-4">Document Preview</h3>
             <a 
               href={media.file} 
               target="_blank" 
               rel="noopener noreferrer"
               className="inline-flex items-center gap-2 bg-blue-600 text-white px-6 py-3 rounded-lg hover:bg-blue-700 transition-colors"
             >
               <Download size={20} /> Download / View PDF
             </a>
           </div>
        )}
      </div>

      {/* Footer Info */}
      <div className="p-6 bg-gray-900/80 border-t border-gray-800 backdrop-blur-md">
        <div className="max-w-4xl mx-auto">
          <div className="flex justify-between items-start mb-2">
            <div>
              <h3 className="text-xl font-bold text-white mb-1">{media.title}</h3>
              <p className="text-gray-400 text-sm mb-3">{media.description}</p>
            </div>
            {media.media_date_fuzzy && (
              <div className="flex items-center gap-2 text-emerald-400 text-sm bg-emerald-900/20 px-3 py-1 rounded-full border border-emerald-500/30">
                <Calendar size={14} />
                {media.media_date_fuzzy}
              </div>
            )}
          </div>

          <div className="flex flex-wrap gap-2 mt-4">
            {media.tagged_people_details?.map(person => (
              <span key={person.id} className="flex items-center gap-1 text-xs text-gray-300 bg-gray-800 px-2 py-1 rounded border border-gray-700">
                <Tag size={12} />
                {person.name}
              </span>
            ))}
          </div>
          
          <div className="mt-4 text-xs text-gray-500">
            Uploaded by {media.uploaded_by_name} • {new Date(media.created_at).toLocaleDateString()}
          </div>
        </div>
      </div>

    </div>
  );
}
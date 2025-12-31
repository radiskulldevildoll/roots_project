"use client";
import React, { useState, useEffect } from 'react';
import axios from 'axios';
import { X, Upload, Check, FileText, Image as ImageIcon, Film, Music } from 'lucide-react';
import { endpoints } from '../utils/config';
import toast from 'react-hot-toast';
import { tokenStorage } from '../utils/storage';

export default function MediaUploadModal({ isOpen, onClose, onSuccess }) {
  const [file, setFile] = useState(null);
  const [preview, setPreview] = useState(null);
  const [formData, setFormData] = useState({
    title: '',
    description: '',
    media_date_fuzzy: '',
    media_type: 'PHO',
    tagged_people: []
  });
  const [people, setPeople] = useState([]);
  const [uploading, setUploading] = useState(false);

  useEffect(() => {
    if (isOpen) {
      fetchPeople();
    }
  }, [isOpen]);

  const fetchPeople = async () => {
    try {
      const token = tokenStorage.getAccessToken();
      const res = await axios.get(endpoints.genealogy.people, {
        headers: { Authorization: `Bearer ${token}` }
      });
      setPeople(res.data);
    } catch (err) {
      console.error("Failed to fetch people", err);
    }
  };

  const handleFileSelect = (e) => {
    const selected = e.target.files[0];
    if (selected) {
      setFile(selected);
      // Guess type
      if (selected.type.startsWith('image/')) setFormData({...formData, media_type: 'PHO'});
      else if (selected.type.startsWith('video/')) setFormData({...formData, media_type: 'VID'});
      else if (selected.type.startsWith('audio/')) setFormData({...formData, media_type: 'AUD'});
      else setFormData({...formData, media_type: 'DOC'});

      if (selected.type.startsWith('image/')) {
        setPreview(URL.createObjectURL(selected));
      } else {
        setPreview(null);
      }
    }
  };

  const handleUpload = async () => {
    if (!file || !formData.title) return;
    setUploading(true);

    const data = new FormData();
    data.append('file', file);
    data.append('title', formData.title);
    data.append('description', formData.description);
    data.append('media_date_fuzzy', formData.media_date_fuzzy);
    data.append('media_type', formData.media_type);
    formData.tagged_people.forEach(id => data.append('tagged_people', id));

    try {
      const token = tokenStorage.getAccessToken();
      await axios.post(endpoints.media.list, data, {
        headers: {
          'Authorization': `Bearer ${token}`,
          'Content-Type': 'multipart/form-data',
        },
      });
      toast.success('Media uploaded successfully');
      onSuccess();
      handleClose();
    } catch (err) {
      console.error("Upload failed", err);
      toast.error('Upload failed');
    } finally {
      setUploading(false);
    }
  };

  const handleClose = () => {
    setFile(null);
    setPreview(null);
    setFormData({
      title: '',
      description: '',
      media_date_fuzzy: '',
      media_type: 'PHO',
      tagged_people: []
    });
    onClose();
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
      <div className="bg-gray-900 rounded-2xl shadow-2xl w-full max-w-lg border border-gray-700 flex flex-col max-h-[90vh]">
        
        <div className="p-6 border-b border-gray-700 flex justify-between items-center">
          <h2 className="text-xl font-bold text-emerald-400 flex items-center gap-2">
            <Upload size={20} /> Upload Media
          </h2>
          <button onClick={handleClose}><X className="text-gray-400 hover:text-white" /></button>
        </div>

        <div className="p-6 overflow-y-auto custom-scrollbar space-y-4">
          
          {/* File Drop / Preview */}
          <div className="w-full">
            <label className="flex flex-col items-center justify-center w-full h-40 border-2 border-gray-600 border-dashed rounded-xl cursor-pointer bg-gray-800 hover:bg-gray-750 transition-colors overflow-hidden relative">
              {preview ? (
                <img src={preview} alt="Preview" className="h-full w-full object-cover opacity-60" />
              ) : (
                <div className="flex flex-col items-center justify-center pt-5 pb-6">
                  {file ? (
                    <div className="text-emerald-400 font-medium flex flex-col items-center">
                      <FileText size={32} className="mb-2"/>
                      {file.name}
                    </div>
                  ) : (
                    <>
                      <Upload className="w-8 h-8 mb-2 text-gray-400" />
                      <p className="text-sm text-gray-400">Click or drag file here</p>
                    </>
                  )}
                </div>
              )}
              <input type="file" className="hidden" onChange={handleFileSelect} />
            </label>
          </div>

          <div>
            <label className="block text-xs font-bold text-gray-400 uppercase tracking-wider mb-1">Title</label>
            <input
              type="text"
              value={formData.title}
              onChange={e => setFormData({...formData, title: e.target.value})}
              className="w-full bg-gray-800 border border-gray-700 rounded-lg px-3 py-2 text-white focus:outline-none focus:border-emerald-500"
              placeholder="e.g., Grandpa's 80th Birthday"
            />
          </div>

          <div className="grid grid-cols-2 gap-4">
            <div>
              <label className="block text-xs font-bold text-gray-400 uppercase tracking-wider mb-1">Date (Approx)</label>
              <input
                type="text"
                value={formData.media_date_fuzzy}
                onChange={e => setFormData({...formData, media_date_fuzzy: e.target.value})}
                className="w-full bg-gray-800 border border-gray-700 rounded-lg px-3 py-2 text-white focus:outline-none focus:border-emerald-500"
                placeholder="e.g. 1985"
              />
            </div>
            <div>
              <label className="block text-xs font-bold text-gray-400 uppercase tracking-wider mb-1">Type</label>
              <select
                value={formData.media_type}
                onChange={e => setFormData({...formData, media_type: e.target.value})}
                className="w-full bg-gray-800 border border-gray-700 rounded-lg px-3 py-2 text-white focus:outline-none focus:border-emerald-500"
              >
                <option value="PHO">Photo</option>
                <option value="VID">Video</option>
                <option value="DOC">Document</option>
                <option value="AUD">Audio</option>
              </select>
            </div>
          </div>

          <div>
            <label className="block text-xs font-bold text-gray-400 uppercase tracking-wider mb-1">Description</label>
            <textarea
              value={formData.description}
              onChange={e => setFormData({...formData, description: e.target.value})}
              rows={2}
              className="w-full bg-gray-800 border border-gray-700 rounded-lg px-3 py-2 text-white focus:outline-none focus:border-emerald-500 resize-none"
            />
          </div>

          <div>
            <label className="block text-xs font-bold text-gray-400 uppercase tracking-wider mb-2">Tag People</label>
            <div className="flex flex-wrap gap-2 max-h-32 overflow-y-auto p-2 bg-gray-800 rounded-lg border border-gray-700">
              {people.map(person => (
                <button
                  key={person.id}
                  onClick={() => togglePersonTag(person.id)}
                  className={`px-2 py-1 rounded text-xs border transition-all ${
                    formData.tagged_people.includes(person.id)
                      ? 'bg-emerald-600/20 border-emerald-500 text-emerald-300'
                      : 'bg-gray-700/50 border-gray-600 text-gray-400 hover:bg-gray-700'
                  }`}
                >
                  {person.first_name} {person.last_name}
                </button>
              ))}
            </div>
          </div>

        </div>

        <div className="p-6 border-t border-gray-700">
          <button
            onClick={handleUpload}
            disabled={!file || !formData.title || uploading}
            className={`w-full py-3 rounded-lg font-bold flex justify-center items-center gap-2 transition-all
              ${!file || !formData.title || uploading ? 'bg-gray-700 text-gray-500 cursor-not-allowed' : 'bg-emerald-600 hover:bg-emerald-500 text-white shadow-lg shadow-emerald-900/50'}
            `}
          >
            {uploading ? 'Uploading...' : <><Check size={18} /> Upload Media</>}
          </button>
        </div>

      </div>
    </div>
  );
}

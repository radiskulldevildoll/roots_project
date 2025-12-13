import React, { useState } from 'react';
import axios from 'axios';
import { Upload, X, Check } from 'lucide-react';
import { endpoints } from '../utils/config';

export default function UploadMediaModal({ isOpen, onClose, personId, onSuccess }) {
  const [file, setFile] = useState(null);
  const [preview, setPreview] = useState(null);
  const [uploading, setUploading] = useState(false);

  if (!isOpen || !personId) return null;

  const handleFileSelect = (e) => {
    const selected = e.target.files[0];
    if (selected) {
      setFile(selected);
      // Create a local preview URL so the user sees what they picked immediately
      setPreview(URL.createObjectURL(selected));
    }
  };

  const handleUpload = async () => {
    if (!file) return;
    setUploading(true);

    const formData = new FormData();
    // 'profile_picture' must match the Django model field name
    formData.append('profile_picture', file);

    try {
      const token = localStorage.getItem('access_token');
      await axios.patch(endpoints.genealogy.uploadPhoto(personId), formData, {
        headers: {
          'Authorization': `Bearer ${token}`,
          'Content-Type': 'multipart/form-data', // Crucial for files!
        },
      });

      onSuccess(); // Refresh the graph to show the new face
      handleClose();
    } catch (err) {
      console.error("Upload failed", err);
      alert("Upload failed. Is the file too big?");
    } finally {
      setUploading(false);
    }
  };

  const handleClose = () => {
    setFile(null);
    setPreview(null);
    onClose();
  };

  return (
    <div className="fixed inset-0 bg-black/80 flex justify-center items-center z-50 backdrop-blur-sm">
      <div className="bg-gray-900 p-6 rounded-2xl shadow-2xl w-96 border border-gray-700">

        <div className="flex justify-between items-center mb-6">
          <h2 className="text-xl font-bold text-emerald-400">Upload Portrait</h2>
          <button onClick={handleClose}><X className="text-gray-400 hover:text-white" /></button>
        </div>

        {/* Drop Zone Visual */}
        <div className="mb-6">
          <label className="flex flex-col items-center justify-center w-full h-48 border-2 border-gray-600 border-dashed rounded-lg cursor-pointer bg-gray-800 hover:bg-gray-700 transition-colors">

            {preview ? (
              <img src={preview} alt="Preview" className="h-full w-full object-cover rounded-lg opacity-80" />
            ) : (
              <div className="flex flex-col items-center justify-center pt-5 pb-6">
                <Upload className="w-10 h-10 mb-3 text-gray-400" />
                <p className="mb-2 text-sm text-gray-400"><span className="font-semibold">Click to upload</span> or drag and drop</p>
                <p className="text-xs text-gray-500">SVG, PNG, JPG (MAX. 5MB)</p>
              </div>
            )}

            <input type="file" className="hidden" onChange={handleFileSelect} accept="image/*" />
          </label>
        </div>

        <button
          onClick={handleUpload}
          disabled={!file || uploading}
          className={`w-full py-3 rounded-lg font-bold flex justify-center items-center gap-2 transition-all
            ${!file ? 'bg-gray-700 text-gray-500 cursor-not-allowed' : 'bg-emerald-600 hover:bg-emerald-500 text-white shadow-lg shadow-emerald-900/50'}
          `}
        >
          {uploading ? 'Uploading...' : <><Check size={18} /> Save Photo</>}
        </button>

      </div>
    </div>
  );
}

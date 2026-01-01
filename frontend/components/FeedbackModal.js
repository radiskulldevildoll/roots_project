import React, { useState } from 'react';
import axios from 'axios';
import { X, Send, Bug, Lightbulb, MessageSquare } from 'lucide-react';
import { endpoints } from '../utils/config';
import toast from 'react-hot-toast';
import { tokenStorage } from '../utils/storage';

export default function FeedbackModal({ isOpen, onClose }) {
  const [formData, setFormData] = useState({
    feedback_type: 'BUG',
    title: '',
    description: ''
  });
  const [loading, setLoading] = useState(false);

  const handleSubmit = async (e) => {
    e.preventDefault();
    setLoading(true);
    const token = tokenStorage.getAccessToken();

    try {
      await axios.post(endpoints.feedback.list, formData, {
        headers: { Authorization: `Bearer ${token}` }
      });
      toast.success('Feedback sent! Thank you.');
      setFormData({ feedback_type: 'BUG', title: '', description: '' });
      onClose();
    } catch (err) {
      console.error("Failed to send feedback", err);
      toast.error('Failed to send feedback');
    } finally {
      setLoading(false);
    }
  };

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 bg-black/80 flex justify-center items-center z-50 backdrop-blur-sm p-4">
      <div className="bg-gray-900 rounded-2xl shadow-2xl w-full max-w-lg border border-gray-700 flex flex-col">
        
        {/* Header */}
        <div className="p-6 border-b border-gray-700 flex justify-between items-center bg-gray-850 rounded-t-2xl">
          <h2 className="text-xl font-bold text-emerald-400 flex items-center gap-2">
            <MessageSquare size={24} />
            Send Feedback
          </h2>
          <button onClick={onClose} className="text-gray-400 hover:text-white transition-colors">
            <X size={24} />
          </button>
        </div>

        {/* Content */}
        <div className="p-6 space-y-4">
          
          {/* Type Selection */}
          <div className="flex gap-4 mb-4">
            <button
              type="button"
              onClick={() => setFormData({...formData, feedback_type: 'BUG'})}
              className={`flex-1 p-3 rounded-xl border flex flex-col items-center gap-2 transition-all ${
                formData.feedback_type === 'BUG'
                  ? 'bg-red-900/20 border-red-500 text-red-400'
                  : 'bg-gray-800 border-gray-700 text-gray-400 hover:bg-gray-750'
              }`}
            >
              <Bug size={24} />
              <span className="font-medium">Bug Report</span>
            </button>
            <button
              type="button"
              onClick={() => setFormData({...formData, feedback_type: 'FEAT'})}
              className={`flex-1 p-3 rounded-xl border flex flex-col items-center gap-2 transition-all ${
                formData.feedback_type === 'FEAT'
                  ? 'bg-emerald-900/20 border-emerald-500 text-emerald-400'
                  : 'bg-gray-800 border-gray-700 text-gray-400 hover:bg-gray-750'
              }`}
            >
              <Lightbulb size={24} />
              <span className="font-medium">Feature Request</span>
            </button>
          </div>

          {/* Title */}
          <div>
            <label className="block text-sm font-medium text-gray-400 mb-1">Title</label>
            <input
              type="text"
              value={formData.title}
              onChange={e => setFormData({...formData, title: e.target.value})}
              className="w-full bg-gray-800 border border-gray-700 rounded-xl px-4 py-3 text-white focus:ring-2 focus:ring-emerald-500 focus:outline-none"
              placeholder={formData.feedback_type === 'BUG' ? "e.g., Error when uploading photo" : "e.g., Add dark mode"}
              required
            />
          </div>

          {/* Description */}
          <div>
            <label className="block text-sm font-medium text-gray-400 mb-1">Description</label>
            <textarea
              value={formData.description}
              onChange={e => setFormData({...formData, description: e.target.value})}
              rows={4}
              className="w-full bg-gray-800 border border-gray-700 rounded-xl px-4 py-3 text-white focus:ring-2 focus:ring-emerald-500 focus:outline-none resize-none"
              placeholder="Please provide details..."
              required
            />
          </div>

        </div>

        {/* Footer */}
        <div className="p-6 border-t border-gray-700 bg-gray-850 rounded-b-2xl flex justify-end">
          <button 
            onClick={handleSubmit}
            disabled={loading || !formData.title || !formData.description}
            className={`px-6 py-2 rounded-xl font-bold text-white shadow-lg flex items-center gap-2 transition-all ${
              loading || !formData.title || !formData.description
                ? 'bg-gray-700 text-gray-500 cursor-not-allowed'
                : 'bg-emerald-600 hover:bg-emerald-500 shadow-emerald-900/20'
            }`}
          >
            {loading ? 'Sending...' : <><Send size={18} /> Send</>}
          </button>
        </div>

      </div>
    </div>
  );
}

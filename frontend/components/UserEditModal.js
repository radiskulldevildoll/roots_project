"use client";
import { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import axios from 'axios';
import { X, User, Save, Mail, Tag, LogOut } from 'lucide-react';
import { motion, AnimatePresence } from 'framer-motion';
import toast from 'react-hot-toast';
import { endpoints } from '../utils/config';
import { tokenStorage } from '../utils/storage';

export default function UserEditModal({ isOpen, onClose, onSuccess }) {
  const router = useRouter();
  const [formData, setFormData] = useState({
    username: '',
    email: '',
    first_name: '',
    last_name: ''
  });
  const [loading, setLoading] = useState(true);

  const handleLogout = () => {
    tokenStorage.clearTokens();
    toast.success('👋 Logged out successfully');
    router.push('/login');
  };

  useEffect(() => {
    const fetchUser = async () => {
      const token = tokenStorage.getAccessToken();
      try {
        const response = await axios.get(endpoints.auth.user, {
          headers: { Authorization: `Bearer ${token}` }
        });
        const user = response.data;
        setFormData({
          username: user.username || '',
          email: user.email || '',
          first_name: user.first_name || '',
          last_name: user.last_name || ''
        });
      } catch (error) {
        console.error('Failed to fetch user:', error);
        toast.error('Failed to load user details');
        onClose();
      } finally {
        setLoading(false);
      }
    };

    if (isOpen) {
      setLoading(true);
      fetchUser();
    }
  }, [isOpen]);

  const handleSubmit = async (e) => {
    e.preventDefault();
    const token = tokenStorage.getAccessToken();

    try {
      await axios.patch(endpoints.auth.user, formData, {
        headers: { Authorization: `Bearer ${token}` }
      });

      toast.success('✅ Profile updated successfully!');
      onSuccess();
      onClose();
    } catch (error) {
      console.error('Failed to update user:', error);
      toast.error('Failed to update profile. Please try again.');
    }
  };

  if (!isOpen) return null;

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
          className="bg-gray-800 rounded-2xl shadow-2xl w-full max-w-lg border border-gray-700 my-8 overflow-hidden"
        >
          {/* Header */}
          <div className="bg-gradient-to-r from-blue-600 to-teal-600 p-6">
            <div className="flex justify-between items-center">
              <div className="flex items-center gap-3">
                <div className="bg-white bg-opacity-20 p-2 rounded-lg">
                  <User className="text-white" size={24} />
                </div>
                <h2 className="text-2xl font-bold text-white">Edit User Profile</h2>
              </div>
              <button
                onClick={onClose}
                className="text-white hover:bg-white hover:bg-opacity-20 p-2 rounded-lg transition-colors"
              >
                <X size={24} />
              </button>
            </div>
          </div>

          <form onSubmit={handleSubmit} className="p-6 space-y-6">
            {/* User Fields */}
            <div className="space-y-4">
              <div>
                <label className="block text-gray-300 text-sm font-medium mb-2 flex items-center gap-2">
                  <Tag size={16} />
                  Username *
                </label>
                <input
                  placeholder="Username"
                  className="w-full bg-gray-900 text-white p-3 rounded-lg border border-gray-600 focus:border-blue-500 focus:ring-2 focus:ring-blue-500 focus:ring-opacity-50 outline-none transition-all"
                  value={formData.username}
                  onChange={e => setFormData({...formData, username: e.target.value})}
                  required
                />
              </div>
              <div>
                <label className="block text-gray-300 text-sm font-medium mb-2 flex items-center gap-2">
                  <Mail size={16} />
                  Email *
                </label>
                <input
                  type="email"
                  placeholder="Email"
                  className="w-full bg-gray-900 text-white p-3 rounded-lg border border-gray-600 focus:border-blue-500 focus:ring-2 focus:ring-blue-500 focus:ring-opacity-50 outline-none transition-all"
                  value={formData.email}
                  onChange={e => setFormData({...formData, email: e.target.value})}
                  required
                />
              </div>
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <div>
                  <label className="block text-gray-300 text-sm font-medium mb-2">First Name</label>
                  <input
                    placeholder="First Name"
                    className="w-full bg-gray-900 text-white p-3 rounded-lg border border-gray-600 focus:border-blue-500 focus:ring-2 focus:ring-blue-500 focus:ring-opacity-50 outline-none transition-all"
                    value={formData.first_name}
                    onChange={e => setFormData({...formData, first_name: e.target.value})}
                  />
                </div>
                <div>
                  <label className="block text-gray-300 text-sm font-medium mb-2">Last Name</label>
                  <input
                    placeholder="Last Name"
                    className="w-full bg-gray-900 text-white p-3 rounded-lg border border-gray-600 focus:border-blue-500 focus:ring-2 focus:ring-blue-500 focus:ring-opacity-50 outline-none transition-all"
                    value={formData.last_name}
                    onChange={e => setFormData({...formData, last_name: e.target.value})}
                  />
                </div>
              </div>
            </div>

            {/* Action Buttons */}
            <div className="flex flex-col sm:flex-row gap-3 pt-4">
              <button
                type="button"
                onClick={onClose}
                className="flex-1 bg-gray-700 hover:bg-gray-600 py-3 px-4 rounded-lg font-semibold transition-colors"
              >
                Cancel
              </button>
              <button
                type="submit"
                className="flex-1 bg-gradient-to-r from-blue-600 to-teal-600 hover:from-blue-500 hover:to-teal-500 py-3 px-4 rounded-lg font-semibold transition-all shadow-lg shadow-blue-900/50 flex items-center justify-center gap-2"
              >
                <Save size={18} />
                Save Changes
              </button>
            </div>

            {/* Logout Button */}
            <div className="pt-4 border-t border-gray-600">
              <button
                type="button"
                onClick={handleLogout}
                className="w-full bg-red-600 hover:bg-red-500 py-3 px-4 rounded-lg font-semibold transition-all shadow-lg shadow-red-900/50 flex items-center justify-center gap-2 text-white"
              >
                <LogOut size={18} />
                Logout & Sign In Again
              </button>
            </div>
          </form>
        </motion.div>
      </div>
    </AnimatePresence>
  );
}

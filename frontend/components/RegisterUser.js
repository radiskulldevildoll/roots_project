"use client";
import { useState } from 'react';
import { useRouter } from 'next/navigation';
import axios from 'axios';
import { endpoints } from '../utils/config';

export default function RegisterUser({ isOpen, onClose }) {
  if (!isOpen) return null;

  const router = useRouter();
  const [formData, setFormData] = useState({
    username: '',
    password: '',
    re_password: ''
  });
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);

  const handleSubmit = async (e) => {
    e.preventDefault();
    setLoading(true);
    setError('');

    if (formData.password !== formData.re_password) {
      setError("Passwords don't match!");
      setLoading(false);
      return;
    }

    try {
      await axios.post(endpoints.auth.register, {
        username: formData.username,
        password: formData.password,
        re_password: formData.re_password
      });

      // Auto-login after successful registration
      const loginResponse = await axios.post(endpoints.auth.login, {
        username: formData.username,
        password: formData.password
      });

      localStorage.setItem('access_token', loginResponse.data.access);
      router.push('/dashboard/tree');
      onClose();
    } catch (err) {
      console.error('Registration failed:', err);
      setError("That username might be taken by a distinct cousin.");
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="fixed inset-0 bg-black bg-opacity-70 flex justify-center items-center z-50">
      <div className="bg-gray-800 p-8 rounded-xl shadow-2xl w-96 border border-gray-700">
        <h2 className="text-2xl font-bold mb-6 text-emerald-400 text-center">Create Account</h2>

        <form onSubmit={handleSubmit}>
          <div className="mb-4">
            <input
              type="text"
              placeholder="Username"
              className="w-full p-3 bg-gray-900 text-white rounded border border-gray-600 focus:border-emerald-500 outline-none"
              value={formData.username}
              onChange={e => setFormData({...formData, username: e.target.value})}
              required
            />
          </div>

          <div className="mb-4">
            <input
              type="password"
              placeholder="Password"
              className="w-full p-3 bg-gray-900 text-white rounded border border-gray-600 focus:border-emerald-500 outline-none"
              value={formData.password}
              onChange={e => setFormData({...formData, password: e.target.value})}
              required
            />
          </div>

          <div className="mb-6">
            <input
              type="password"
              placeholder="Confirm Password"
              className="w-full p-3 bg-gray-900 text-white rounded border border-gray-600 focus:border-emerald-500 outline-none"
              value={formData.re_password}
              onChange={e => setFormData({...formData, re_password: e.target.value})}
              required
            />
          </div>

          <button
            type="submit"
            disabled={loading}
            className="w-full bg-emerald-600 hover:bg-emerald-500 disabled:bg-gray-600 p-3 rounded font-bold transition-colors"
          >
            {loading ? 'Creating Account...' : 'Register'}
          </button>

          {error && <p className="text-red-500 mt-4 text-sm text-center">{error}</p>}
        </form>
      </div>
    </div>
  );
}

"use client";
import { useState } from 'react';
import { useRouter } from 'next/navigation';
import axios from 'axios';
import { endpoints } from '../../utils/config';
import { tokenStorage } from '../../utils/storage';

export default function Register() {
  const router = useRouter();
  const [formData, setFormData] = useState({ email: '', password: '', username: '' });
  const [error, setError] = useState('');

  const handleRegister = async (e) => {
    e.preventDefault();
    try {
      // 1. Create the Account
      await axios.post(endpoints.auth.register, formData);

      // 2. Auto-Login (Get the Token immediately)
      const response = await axios.post(endpoints.auth.login, {
        username: formData.username,
        password: formData.password
      });

      // 3. Stash the token and redirect to the Canvas
      tokenStorage.setAccessToken(response.data.access);
      router.push('/dashboard/tree');

    } catch (err) {
      setError("Registration failed. That username might be taken by a distinct cousin.");
    }
  };

  return (
    <div className="flex h-screen items-center justify-center bg-gray-900 text-white">
      <form onSubmit={handleRegister} className="w-96 p-8 bg-gray-800 rounded-xl shadow-2xl border border-gray-700">
        <h1 className="text-2xl font-bold mb-6 text-emerald-400">Join Roots & Rumors</h1>
        <input
          type="text" placeholder="Username"
          className="w-full mb-4 p-3 bg-gray-900 rounded border border-gray-600 focus:border-emerald-500 outline-none"
          value={formData.username}
          onChange={e => setFormData({...formData, username: e.target.value})}
        />
        <input
          type="email" placeholder="Email"
          className="w-full mb-4 p-3 bg-gray-900 rounded border border-gray-600 focus:border-emerald-500 outline-none"
          value={formData.email}
          onChange={e => setFormData({...formData, email: e.target.value})}
        />
        <input
          type="password" placeholder="Password"
          className="w-full mb-6 p-3 bg-gray-900 rounded border border-gray-600 focus:border-emerald-500 outline-none"
          value={formData.password}
          onChange={e => setFormData({...formData, password: e.target.value})}
        />
        <button type="submit" className="w-full bg-emerald-600 hover:bg-emerald-500 p-3 rounded font-bold transition-colors">
          Start Building History
        </button>
        {error && <p className="text-red-500 mt-4 text-sm">{error}</p>}
      </form>
    </div>
  );
}

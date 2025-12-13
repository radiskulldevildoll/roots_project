"use client";
import { useState } from 'react';
import { useRouter } from 'next/navigation';
import axios from 'axios';
import { endpoints } from '../../utils/config';
import RegisterUser from '../../components/RegisterUser';

export default function Login() {
  const router = useRouter();
  const [formData, setFormData] = useState({ username: '', password: '' });
  const [error, setError] = useState('');
  const [showRegister, setShowRegister] = useState(false);
  const [loading, setLoading] = useState(false);

  const handleLogin = async (e) => {
    e.preventDefault();
    setLoading(true);
    setError('');

    try {
      const response = await axios.post(endpoints.auth.login, formData);
      localStorage.setItem('access_token', response.data.access);
      router.push('/dashboard/tree');
    } catch (err) {
      setError("Login failed. Check your credentials.");
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="flex h-screen items-center justify-center bg-gray-900 text-white">
      <form onSubmit={handleLogin} className="w-96 p-8 bg-gray-800 rounded-xl shadow-2xl border border-gray-700" suppressHydrationWarning={true}>
        <h1 className="text-2xl font-bold mb-6 text-emerald-400">Login</h1>
        <input
          type="text" placeholder="Username"
          className="w-full mb-4 p-3 bg-gray-900 rounded border border-gray-600 focus:border-emerald-500 outline-none"
          value={formData.username}
          onChange={e => setFormData({...formData, username: e.target.value})}
          required
        />
        <input
          type="password" placeholder="Password"
          className="w-full mb-6 p-3 bg-gray-900 rounded border border-gray-600 focus:border-emerald-500 outline-none"
          value={formData.password}
          onChange={e => setFormData({...formData, password: e.target.value})}
          required
        />
        <button
          type="submit"
          disabled={loading}
          className="w-full bg-emerald-600 hover:bg-emerald-500 disabled:bg-gray-600 p-3 rounded font-bold transition-colors mb-4"
        >
          {loading ? 'Entering Archive...' : 'Enter Archive'}
        </button>

        <div className="text-center">
          <button
            type="button"
            onClick={() => setShowRegister(true)}
            className="text-emerald-400 hover:text-emerald-300 text-sm underline"
          >
            Need an account? Register here
          </button>
        </div>

        {error && <p className="text-red-500 mt-4 text-sm text-center">{error}</p>}
      </form>

      <RegisterUser
        isOpen={showRegister}
        onClose={() => setShowRegister(false)}
      />
    </div>
  );
}

"use client";
import { useState } from 'react';
import { useRouter } from 'next/navigation';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { LogIn, Eye, EyeOff, AlertCircle, Loader2 } from 'lucide-react';
import toast from 'react-hot-toast';
import api from '../../utils/api';
import { loginSchema } from '../../utils/validations';
import RegisterUser from '../../components/RegisterUser';

export default function Login() {
  const router = useRouter();
  const [showPassword, setShowPassword] = useState(false);
  const [showRegister, setShowRegister] = useState(false);
  
  const {
    register,
    handleSubmit,
    formState: { errors, isSubmitting },
    setError,
  } = useForm({
    resolver: zodResolver(loginSchema),
    defaultValues: {
      username: '',
      password: '',
    },
  });

  const onSubmit = async (data) => {
    try {
      const response = await api.post('/api/auth/jwt/create/', data);
      
      // Store tokens
      localStorage.setItem('access_token', response.data.access);
      if (response.data.refresh) {
        localStorage.setItem('refresh_token', response.data.refresh);
      }
      
      toast.success('Welcome back! 🌳');
      router.push('/dashboard/tree');
    } catch (err) {
      console.error('Login error:', err);
      
      if (err.response?.status === 401) {
        setError('root', {
          type: 'manual',
          message: 'Invalid username or password. Please try again.',
        });
      } else if (err.response?.status === 429) {
        setError('root', {
          type: 'manual',
          message: 'Too many login attempts. Please try again later.',
        });
      } else if (!err.response) {
        setError('root', {
          type: 'manual',
          message: 'Unable to connect to server. Please check your connection.',
        });
      } else {
        setError('root', {
          type: 'manual',
          message: 'Login failed. Please try again.',
        });
      }
    }
  };

  return (
    <div className="min-h-screen flex items-center justify-center bg-gradient-to-br from-gray-900 via-gray-800 to-gray-900 text-white p-4">
      {/* Background decoration */}
      <div className="absolute inset-0 overflow-hidden opacity-10 pointer-events-none">
        <div className="absolute w-96 h-96 bg-emerald-500 rounded-full blur-3xl -top-48 -left-48 animate-pulse"></div>
        <div className="absolute w-96 h-96 bg-teal-500 rounded-full blur-3xl -bottom-48 -right-48 animate-pulse delay-1000"></div>
      </div>

      <div className="w-full max-w-md relative z-10">
        {/* Logo/Title Section */}
        <div className="text-center mb-8">
          <div className="bg-gradient-to-br from-emerald-500 to-teal-500 w-16 h-16 rounded-2xl flex items-center justify-center mx-auto mb-4 shadow-lg shadow-emerald-900/50">
            <span className="text-3xl">🌳</span>
          </div>
          <h1 className="text-3xl font-bold bg-clip-text text-transparent bg-gradient-to-r from-emerald-400 to-teal-400">
            Roots & Rumors
          </h1>
          <p className="text-gray-400 mt-2">Welcome back to your family tree</p>
        </div>

        {/* Login Form */}
        <form 
          onSubmit={handleSubmit(onSubmit)} 
          className="bg-gray-800 p-8 rounded-2xl shadow-2xl border border-gray-700"
        >
          <h2 className="text-xl font-semibold text-white mb-6 flex items-center gap-2">
            <LogIn size={20} className="text-emerald-400" />
            Sign In
          </h2>

          {/* Root Error */}
          {errors.root && (
            <div className="mb-4 p-3 bg-red-900/30 border border-red-500/50 rounded-lg flex items-start gap-2">
              <AlertCircle size={18} className="text-red-400 mt-0.5 flex-shrink-0" />
              <span className="text-red-300 text-sm">{errors.root.message}</span>
            </div>
          )}

          {/* Username Field */}
          <div className="mb-4">
            <label htmlFor="username" className="block text-gray-300 text-sm font-medium mb-2">
              Username
            </label>
            <input
              id="username"
              type="text"
              autoComplete="username"
              placeholder="Enter your username"
              className={`w-full p-3 bg-gray-900 rounded-lg border ${
                errors.username ? 'border-red-500 focus:border-red-500' : 'border-gray-600 focus:border-emerald-500'
              } focus:ring-2 focus:ring-emerald-500/20 outline-none transition-colors`}
              {...register('username')}
            />
            {errors.username && (
              <p className="mt-1 text-red-400 text-sm flex items-center gap-1">
                <AlertCircle size={14} />
                {errors.username.message}
              </p>
            )}
          </div>

          {/* Password Field */}
          <div className="mb-6">
            <label htmlFor="password" className="block text-gray-300 text-sm font-medium mb-2">
              Password
            </label>
            <div className="relative">
              <input
                id="password"
                type={showPassword ? 'text' : 'password'}
                autoComplete="current-password"
                placeholder="Enter your password"
                className={`w-full p-3 pr-12 bg-gray-900 rounded-lg border ${
                  errors.password ? 'border-red-500 focus:border-red-500' : 'border-gray-600 focus:border-emerald-500'
                } focus:ring-2 focus:ring-emerald-500/20 outline-none transition-colors`}
                {...register('password')}
              />
              <button
                type="button"
                onClick={() => setShowPassword(!showPassword)}
                className="absolute right-3 top-1/2 -translate-y-1/2 text-gray-400 hover:text-white transition-colors"
                tabIndex={-1}
              >
                {showPassword ? <EyeOff size={20} /> : <Eye size={20} />}
              </button>
            </div>
            {errors.password && (
              <p className="mt-1 text-red-400 text-sm flex items-center gap-1">
                <AlertCircle size={14} />
                {errors.password.message}
              </p>
            )}
          </div>

          {/* Submit Button */}
          <button
            type="submit"
            disabled={isSubmitting}
            className="w-full bg-gradient-to-r from-emerald-600 to-teal-600 hover:from-emerald-500 hover:to-teal-500 disabled:from-gray-600 disabled:to-gray-600 disabled:cursor-not-allowed p-3 rounded-lg font-bold transition-all shadow-lg shadow-emerald-900/50 flex items-center justify-center gap-2"
          >
            {isSubmitting ? (
              <>
                <Loader2 size={20} className="animate-spin" />
                Signing In...
              </>
            ) : (
              <>
                <LogIn size={20} />
                Enter Archive
              </>
            )}
          </button>

          {/* Register Link */}
          <div className="mt-6 text-center">
            <p className="text-gray-400 text-sm">
              Don't have an account?{' '}
              <button
                type="button"
                onClick={() => setShowRegister(true)}
                className="text-emerald-400 hover:text-emerald-300 font-medium underline underline-offset-2 transition-colors"
              >
                Register here
              </button>
            </p>
          </div>
        </form>

        {/* Footer */}
        <p className="text-center text-gray-500 text-xs mt-6">
          © {new Date().getFullYear()} Roots & Rumors. Preserve your family history.
        </p>
      </div>

      <RegisterUser
        isOpen={showRegister}
        onClose={() => setShowRegister(false)}
      />
    </div>
  );
}

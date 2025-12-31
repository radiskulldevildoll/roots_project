"use client";
import { useState } from 'react';
import { useRouter } from 'next/navigation';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { X, UserPlus, Eye, EyeOff, AlertCircle, Loader2, Check } from 'lucide-react';
import { motion, AnimatePresence } from 'framer-motion';
import toast from 'react-hot-toast';
import api from '../utils/api';
import { registerSchema } from '../utils/validations';
import { tokenStorage } from '../utils/storage';

export default function RegisterUser({ isOpen, onClose }) {
  const router = useRouter();
  const [showPassword, setShowPassword] = useState(false);
  const [showConfirmPassword, setShowConfirmPassword] = useState(false);

  const {
    register,
    handleSubmit,
    formState: { errors, isSubmitting },
    setError,
    watch,
    reset,
  } = useForm({
    resolver: zodResolver(registerSchema),
    defaultValues: {
      username: '',
      email: '',
      password: '',
      confirmPassword: '',
    },
  });

  const password = watch('password', '');

  // Password strength indicator
  const getPasswordStrength = (pwd) => {
    if (!pwd) return { score: 0, label: '', color: '' };
    let score = 0;
    if (pwd.length >= 8) score++;
    if (/[A-Z]/.test(pwd)) score++;
    if (/[a-z]/.test(pwd)) score++;
    if (/[0-9]/.test(pwd)) score++;
    if (/[^A-Za-z0-9]/.test(pwd)) score++;

    if (score <= 2) return { score, label: 'Weak', color: 'bg-red-500' };
    if (score <= 3) return { score, label: 'Fair', color: 'bg-yellow-500' };
    if (score <= 4) return { score, label: 'Good', color: 'bg-blue-500' };
    return { score, label: 'Strong', color: 'bg-emerald-500' };
  };

  const passwordStrength = getPasswordStrength(password);

  const onSubmit = async (data) => {
    try {
      // Register the user
      await api.post('/api/auth/users/', {
        username: data.username,
        email: data.email,
        password: data.password,
        re_password: data.confirmPassword,
      });

      // Auto-login after successful registration
      const loginResponse = await api.post('/api/auth/jwt/create/', {
        username: data.username,
        password: data.password,
      });

      tokenStorage.setAccessToken(loginResponse.data.access);
      if (loginResponse.data.refresh) {
        tokenStorage.setRefreshToken(loginResponse.data.refresh);
      }

      toast.success('Welcome to Roots & Rumors! 🌳');
      reset();
      onClose();
      router.push('/dashboard/tree');
    } catch (err) {
      console.error('Registration error:', err);

      if (err.response?.data) {
        const errorData = err.response.data;
        
        // Handle specific field errors from the backend
        if (errorData.username) {
          setError('username', {
            type: 'manual',
            message: Array.isArray(errorData.username) 
              ? errorData.username[0] 
              : 'This username is already taken',
          });
        }
        if (errorData.email) {
          setError('email', {
            type: 'manual',
            message: Array.isArray(errorData.email) 
              ? errorData.email[0] 
              : 'This email is already registered',
          });
        }
        if (errorData.password) {
          setError('password', {
            type: 'manual',
            message: Array.isArray(errorData.password) 
              ? errorData.password[0] 
              : 'Password does not meet requirements',
          });
        }
        if (errorData.non_field_errors) {
          setError('root', {
            type: 'manual',
            message: Array.isArray(errorData.non_field_errors)
              ? errorData.non_field_errors[0]
              : 'Registration failed',
          });
        }
      } else if (!err.response) {
        setError('root', {
          type: 'manual',
          message: 'Unable to connect to server. Please check your connection.',
        });
      } else {
        setError('root', {
          type: 'manual',
          message: 'Registration failed. Please try again.',
        });
      }
    }
  };

  const handleClose = () => {
    reset();
    onClose();
  };

  if (!isOpen) return null;

  return (
    <AnimatePresence>
      <div className="fixed inset-0 bg-black/70 backdrop-blur-sm flex justify-center items-center z-50 p-4">
        <motion.div
          initial={{ opacity: 0, scale: 0.95, y: 20 }}
          animate={{ opacity: 1, scale: 1, y: 0 }}
          exit={{ opacity: 0, scale: 0.95, y: 20 }}
          transition={{ duration: 0.2 }}
          className="bg-gray-800 rounded-2xl shadow-2xl w-full max-w-md border border-gray-700 overflow-hidden"
        >
          {/* Header */}
          <div className="bg-gradient-to-r from-emerald-600 to-teal-600 p-6">
            <div className="flex justify-between items-center">
              <div className="flex items-center gap-3">
                <div className="bg-white/20 p-2 rounded-lg">
                  <UserPlus className="text-white" size={24} />
                </div>
                <div>
                  <h2 className="text-xl font-bold text-white">Create Account</h2>
                  <p className="text-emerald-100 text-sm">Join your family tree</p>
                </div>
              </div>
              <button
                onClick={handleClose}
                className="text-white/80 hover:text-white hover:bg-white/20 p-2 rounded-lg transition-colors"
              >
                <X size={24} />
              </button>
            </div>
          </div>

          {/* Form */}
          <form onSubmit={handleSubmit(onSubmit)} className="p-6 space-y-4">
            {/* Root Error */}
            {errors.root && (
              <div className="p-3 bg-red-900/30 border border-red-500/50 rounded-lg flex items-start gap-2">
                <AlertCircle size={18} className="text-red-400 mt-0.5 flex-shrink-0" />
                <span className="text-red-300 text-sm">{errors.root.message}</span>
              </div>
            )}

            {/* Username */}
            <div>
              <label htmlFor="reg-username" className="block text-gray-300 text-sm font-medium mb-2">
                Username
              </label>
              <input
                id="reg-username"
                type="text"
                autoComplete="username"
                placeholder="Choose a username"
                className={`w-full p-3 bg-gray-900 text-white rounded-lg border ${
                  errors.username ? 'border-red-500' : 'border-gray-600 focus:border-emerald-500'
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

            {/* Email */}
            <div>
              <label htmlFor="reg-email" className="block text-gray-300 text-sm font-medium mb-2">
                Email
              </label>
              <input
                id="reg-email"
                type="email"
                autoComplete="email"
                placeholder="Enter your email"
                className={`w-full p-3 bg-gray-900 text-white rounded-lg border ${
                  errors.email ? 'border-red-500' : 'border-gray-600 focus:border-emerald-500'
                } focus:ring-2 focus:ring-emerald-500/20 outline-none transition-colors`}
                {...register('email')}
              />
              {errors.email && (
                <p className="mt-1 text-red-400 text-sm flex items-center gap-1">
                  <AlertCircle size={14} />
                  {errors.email.message}
                </p>
              )}
            </div>

            {/* Password */}
            <div>
              <label htmlFor="reg-password" className="block text-gray-300 text-sm font-medium mb-2">
                Password
              </label>
              <div className="relative">
                <input
                  id="reg-password"
                  type={showPassword ? 'text' : 'password'}
                  autoComplete="new-password"
                  placeholder="Create a strong password"
                  className={`w-full p-3 pr-12 bg-gray-900 text-white rounded-lg border ${
                    errors.password ? 'border-red-500' : 'border-gray-600 focus:border-emerald-500'
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
              
              {/* Password Strength Indicator */}
              {password && (
                <div className="mt-2">
                  <div className="flex gap-1 mb-1">
                    {[1, 2, 3, 4, 5].map((level) => (
                      <div
                        key={level}
                        className={`h-1 flex-1 rounded-full transition-colors ${
                          level <= passwordStrength.score ? passwordStrength.color : 'bg-gray-700'
                        }`}
                      />
                    ))}
                  </div>
                  <p className="text-xs text-gray-400">
                    Password strength: <span className={`font-medium ${
                      passwordStrength.color.replace('bg-', 'text-')
                    }`}>{passwordStrength.label}</span>
                  </p>
                </div>
              )}

              {/* Password Requirements */}
              <div className="mt-2 space-y-1">
                {[
                  { test: password.length >= 8, text: 'At least 8 characters' },
                  { test: /[A-Z]/.test(password), text: 'One uppercase letter' },
                  { test: /[a-z]/.test(password), text: 'One lowercase letter' },
                  { test: /[0-9]/.test(password), text: 'One number' },
                ].map((req, idx) => (
                  <p key={idx} className={`text-xs flex items-center gap-1 ${
                    req.test ? 'text-emerald-400' : 'text-gray-500'
                  }`}>
                    {req.test ? <Check size={12} /> : <span className="w-3" />}
                    {req.text}
                  </p>
                ))}
              </div>
            </div>

            {/* Confirm Password */}
            <div>
              <label htmlFor="reg-confirm-password" className="block text-gray-300 text-sm font-medium mb-2">
                Confirm Password
              </label>
              <div className="relative">
                <input
                  id="reg-confirm-password"
                  type={showConfirmPassword ? 'text' : 'password'}
                  autoComplete="new-password"
                  placeholder="Confirm your password"
                  className={`w-full p-3 pr-12 bg-gray-900 text-white rounded-lg border ${
                    errors.confirmPassword ? 'border-red-500' : 'border-gray-600 focus:border-emerald-500'
                  } focus:ring-2 focus:ring-emerald-500/20 outline-none transition-colors`}
                  {...register('confirmPassword')}
                />
                <button
                  type="button"
                  onClick={() => setShowConfirmPassword(!showConfirmPassword)}
                  className="absolute right-3 top-1/2 -translate-y-1/2 text-gray-400 hover:text-white transition-colors"
                  tabIndex={-1}
                >
                  {showConfirmPassword ? <EyeOff size={20} /> : <Eye size={20} />}
                </button>
              </div>
              {errors.confirmPassword && (
                <p className="mt-1 text-red-400 text-sm flex items-center gap-1">
                  <AlertCircle size={14} />
                  {errors.confirmPassword.message}
                </p>
              )}
            </div>

            {/* Submit Button */}
            <button
              type="submit"
              disabled={isSubmitting}
              className="w-full bg-gradient-to-r from-emerald-600 to-teal-600 hover:from-emerald-500 hover:to-teal-500 disabled:from-gray-600 disabled:to-gray-600 disabled:cursor-not-allowed p-3 rounded-lg font-bold transition-all shadow-lg shadow-emerald-900/50 flex items-center justify-center gap-2 mt-6"
            >
              {isSubmitting ? (
                <>
                  <Loader2 size={20} className="animate-spin" />
                  Creating Account...
                </>
              ) : (
                <>
                  <UserPlus size={20} />
                  Create Account
                </>
              )}
            </button>

            {/* Terms Notice */}
            <p className="text-xs text-gray-500 text-center mt-4">
              By creating an account, you agree to our terms of service and privacy policy.
            </p>
          </form>
        </motion.div>
      </div>
    </AnimatePresence>
  );
}

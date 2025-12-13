"use client";
import { useEffect } from 'react';
import { useRouter, usePathname } from 'next/navigation';
import axios from 'axios';
import toast from 'react-hot-toast';

let isRedirecting = false; // Prevent multiple simultaneous redirects

export default function AxiosInterceptor() {
  const router = useRouter();
  const pathname = usePathname();

  useEffect(() => {
    // Don't handle auth errors on login/register pages to prevent loops
    if (pathname === '/login' || pathname === '/register') {
      return;
    }

    // Add a response interceptor
    const interceptor = axios.interceptors.response.use(
      (response) => response,
      (error) => {
        if (error.response?.status === 401 && !isRedirecting) {
          isRedirecting = true;

          // Clear the token
          localStorage.removeItem('access_token');

          // Show user-friendly message
          toast.error('🔐 Session expired. Please login again.', {
            duration: 5000,
          });

          // Small delay to let toast show, then redirect
          setTimeout(() => {
            router.push('/login');
            isRedirecting = false;
          }, 500);
        }
        return Promise.reject(error);
      }
    );

    // Clean up interceptor when component unmounts
    return () => {
      axios.interceptors.response.eject(interceptor);
    };
  }, [router, pathname]);

  // This component doesn't render anything
  return null;
}

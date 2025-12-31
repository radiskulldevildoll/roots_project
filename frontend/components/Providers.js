"use client";
import { Toaster } from 'react-hot-toast';
import AxiosInterceptor from './AxiosInterceptor';
import ErrorBoundary from './ErrorBoundary';

export default function Providers({ children }) {
  return (
    <ErrorBoundary>
      <AxiosInterceptor />
      {children}
      <Toaster
        position="top-right"
        toastOptions={{
          style: {
            background: '#1f2937',
            color: '#fff',
            border: '1px solid #374151',
          },
          success: {
            iconTheme: {
              primary: '#10b981',
              secondary: '#fff',
            },
          },
          error: {
            iconTheme: {
              primary: '#ef4444',
              secondary: '#fff',
            },
          },
        }}
      />
    </ErrorBoundary>
  );
}

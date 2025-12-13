"use client";
import './globals.css';
import { Toaster } from 'react-hot-toast';
import AxiosInterceptor from '../components/AxiosInterceptor';

export default function RootLayout({ children }) {
 return (
    <html lang="en">
      <body className="bg-gray-900 text-white antialiased" style={{ backgroundColor: '#111827', color: 'white', minHeight: '100vh' }}>
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
      </body>
    </html>
  )
}

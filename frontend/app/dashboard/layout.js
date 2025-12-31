"use client";
import React, { useState } from 'react';
import Link from 'next/link';
import { usePathname } from 'next/navigation';
import { Network, BookOpen, Image as ImageIcon, LogOut, Menu, X } from 'lucide-react';
import { useRouter } from 'next/navigation';
import { tokenStorage } from '../../utils/storage';

export default function DashboardLayout({ children }) {
  const pathname = usePathname();
  const router = useRouter();
  const [isMobileMenuOpen, setIsMobileMenuOpen] = useState(false);

  const navItems = [
    { href: '/dashboard/tree', label: 'Family Tree', icon: Network },
    { href: '/dashboard/stories', label: 'Stories', icon: BookOpen },
    { href: '/dashboard/media', label: 'Gallery', icon: ImageIcon },
  ];

  const handleLogout = () => {
    tokenStorage.clearTokens();
    router.push('/login');
  };

  return (
    <div className="flex h-screen w-full bg-gray-900 overflow-hidden">
      {/* Sidebar - Desktop */}
      <aside className="hidden md:flex flex-col w-64 bg-gray-800 border-r border-gray-700">
        <div className="p-6 flex items-center justify-center border-b border-gray-700">
          <h1 className="text-2xl font-bold bg-clip-text text-transparent bg-gradient-to-r from-emerald-400 to-teal-500">
            Roots & Rumors
          </h1>
        </div>
        
        <nav className="flex-1 px-4 py-6 space-y-2">
          {navItems.map((item) => {
            const Icon = item.icon;
            const isActive = pathname === item.href;
            return (
              <Link 
                key={item.href} 
                href={item.href}
                className={`flex items-center gap-3 px-4 py-3 rounded-xl transition-all ${
                  isActive 
                    ? 'bg-emerald-600 text-white shadow-lg shadow-emerald-900/50' 
                    : 'text-gray-400 hover:bg-gray-700 hover:text-white'
                }`}
              >
                <Icon size={20} />
                <span className="font-medium">{item.label}</span>
              </Link>
            );
          })}
        </nav>

        <div className="p-4 border-t border-gray-700">
          <button 
            onClick={handleLogout}
            className="flex items-center gap-3 px-4 py-3 w-full text-red-400 hover:bg-red-900/20 rounded-xl transition-colors"
          >
            <LogOut size={20} />
            <span className="font-medium">Logout</span>
          </button>
        </div>
      </aside>

      {/* Mobile Header & Navigation */}
      <div className="md:hidden fixed top-0 left-0 right-0 z-50 bg-gray-800 border-b border-gray-700 px-4 py-3 flex items-center justify-between">
         <h1 className="text-lg font-bold bg-clip-text text-transparent bg-gradient-to-r from-emerald-400 to-teal-500">
            Roots & Rumors
          </h1>
          <button onClick={() => setIsMobileMenuOpen(!isMobileMenuOpen)} className="text-gray-300">
            {isMobileMenuOpen ? <X /> : <Menu />}
          </button>
      </div>

      {/* Mobile Menu Overlay */}
      {isMobileMenuOpen && (
        <div className="md:hidden fixed inset-0 z-40 bg-gray-900 pt-16 px-4">
           <nav className="space-y-2">
            {navItems.map((item) => {
              const Icon = item.icon;
              const isActive = pathname === item.href;
              return (
                <Link 
                  key={item.href} 
                  href={item.href}
                  onClick={() => setIsMobileMenuOpen(false)}
                  className={`flex items-center gap-3 px-4 py-4 rounded-xl transition-all ${
                    isActive 
                      ? 'bg-emerald-600 text-white' 
                      : 'text-gray-400 hover:bg-gray-700'
                  }`}
                >
                  <Icon size={24} />
                  <span className="font-medium text-lg">{item.label}</span>
                </Link>
              );
            })}
             <button 
              onClick={handleLogout}
              className="flex items-center gap-3 px-4 py-4 w-full text-red-400 hover:bg-red-900/20 rounded-xl transition-colors mt-8"
            >
              <LogOut size={24} />
              <span className="font-medium text-lg">Logout</span>
            </button>
          </nav>
        </div>
      )}

      {/* Main Content Area */}
      <main className="flex-1 relative w-full h-full overflow-hidden md:static pt-14 md:pt-0">
        {children}
      </main>
    </div>
  );
}

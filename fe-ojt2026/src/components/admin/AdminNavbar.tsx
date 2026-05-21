"use client";
import React from 'react';
import Image from 'next/image';

interface AdminNavbarProps {
  onMenuToggle?: () => void;
  isMobileMenuOpen?: boolean;
}

const AdminNavbar: React.FC<AdminNavbarProps> = ({ onMenuToggle, isMobileMenuOpen }) => {
  return (
    <header className="flex items-center h-20 px-4 md:px-8 bg-white border-b border-gray-100 shadow-sm w-full fixed top-0 left-0 z-[100]">
      {/* Logo Group */}
      <div className="flex items-center gap-4 shrink-0">
        {/* Mobile Menu Button */}
        <button
          onClick={onMenuToggle}
          className="md:hidden p-2 rounded-xl hover:bg-gray-50 transition-colors"
          aria-label="Toggle menu"
        >
          <svg className="w-6 h-6 text-gray-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            {isMobileMenuOpen ? (
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M6 18L18 6M6 6l12 12" />
            ) : (
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M4 6h16M4 12h16M4 18h16" />
            )}
          </svg>
        </button>

        <Image
          src="https://upload.wikimedia.org/wikipedia/sco/b/bf/KFC_logo.svg"
          alt="KFC Logo"
          width={40}
          height={40}
          className="w-10 h-10 object-contain"
        />
        <div className="hidden sm:block">
          <h1 className="text-md font-bold text-gray-900 uppercase tracking-tight">KFC SCM</h1>
          <p className="text-[10px] font-bold text-[#E4002B] uppercase tracking-tighter">Administrator IT</p>
        </div>
      </div>
    </header>
  );
};

export default AdminNavbar;

"use client";
import React from 'react';

interface LoadingSpinnerProps {
  size?: 'sm' | 'md' | 'lg';
  color?: string;
  className?: string;
}

const LoadingSpinner: React.FC<LoadingSpinnerProps> = ({
  size = 'md',
  color = '#E4002B',
  className = ''
}) => {
  const sizeClasses = {
    sm: 'w-5 h-5',
    md: 'w-8 h-8',
    lg: 'w-12 h-12'
  };

  return (
    <div className={`flex items-center justify-center ${className}`}>
      <div
        className={`${sizeClasses[size]} animate-spin rounded-full border-2 border-gray-200 border-t-[#E4002B]`}
        style={{ borderTopColor: color }}
      />
    </div>
  );
};

export default LoadingSpinner;

// Skeleton Loader for Tables
export const TableSkeleton: React.FC<{ rows?: number }> = ({ rows = 5 }) => {
  return (
    <div className="w-full">
      {Array.from({ length: rows }).map((_, index) => (
        <div
          key={index}
          className="flex items-center gap-4 px-10 py-6 border-b border-gray-50 animate-pulse"
        >
          {/* ID Skeleton */}
          <div className="w-20 h-4 bg-gray-200 rounded-lg" />

          {/* Employee Skeleton */}
          <div className="flex items-center gap-3 flex-1">
            <div className="w-10 h-10 bg-gray-200 rounded-full" />
            <div className="w-32 h-4 bg-gray-200 rounded-lg" />
          </div>

          {/* Email Skeleton */}
          <div className="w-48 h-4 bg-gray-200 rounded-lg flex-1" />

          {/* Role Skeleton */}
          <div className="w-16 h-4 bg-gray-200 rounded-lg" />

          {/* Status Skeleton */}
          <div className="w-20 h-6 bg-gray-200 rounded-full" />
        </div>
      ))}
    </div>
  );
};

// Skeleton for Cards
export const CardSkeleton: React.FC = () => {
  return (
    <div className="bg-white border border-gray-100 rounded-[2rem] p-6 animate-pulse">
      <div className="flex items-start justify-between">
        <div className="flex-1">
          <div className="w-24 h-3 bg-gray-200 rounded-lg mb-2" />
          <div className="w-16 h-8 bg-gray-200 rounded-lg mb-2" />
          <div className="w-20 h-4 bg-gray-200 rounded-lg" />
        </div>
        <div className="w-14 h-14 bg-gray-200 rounded-2xl" />
      </div>
    </div>
  );
};

// Full Page Loading
export const PageLoader: React.FC<{ message?: string }> = ({ message = 'Loading...' }) => {
  return (
    <div className="flex flex-col items-center justify-center min-h-[400px] gap-4">
      <LoadingSpinner size="lg" />
      <p className="text-sm font-medium text-gray-500">{message}</p>
    </div>
  );
};

// Full Screen Loader blocking entire page (used for initialization/auth context)
export const FullScreenLoader: React.FC<{ message?: string }> = ({ message = 'Đang xác thực...' }) => {
  return (
    <div className="flex items-center justify-center min-h-screen bg-gray-50 fixed inset-0 z-[9999]">
      <div className="text-center">
        <div className="w-12 h-12 border-4 border-red-100 border-t-[#E4002B] rounded-full animate-spin mx-auto mb-4"></div>
        <p className="text-gray-500 font-medium">{message}</p>
      </div>
    </div>
  );
};

"use client";
import React from 'react';

interface StatusBadgeProps {
  isActive: boolean;
}

const StatusBadge: React.FC<StatusBadgeProps> = ({ isActive }) => {
  if (isActive) {
    return (
      <div className="inline-flex items-center gap-2 px-4 py-1.5 bg-green-50 text-green-600 rounded-full uppercase tracking-wider text-[10px] font-bold">
        ✓ Active
      </div>
    );
  }

  return (
    <div className="inline-flex items-center gap-2 px-4 py-1.5 bg-gray-100 text-gray-600 rounded-full uppercase tracking-wider text-[10px] font-bold">
      ✕ Inactive
    </div>
  );
};

export default StatusBadge;

"use client";
import React from 'react';

interface DashboardCardProps {
  title: string;
  value: string | number;
  icon: React.ReactNode;
  trend?: {
    value: string;
    isPositive: boolean;
  };
  status?: 'active' | 'warning' | 'neutral';
  color?: 'red' | 'green' | 'blue' | 'gray';
  className?: string;
  isHero?: boolean;
}

const DashboardCard: React.FC<DashboardCardProps> = ({
  title,
  value,
  icon,
  trend,
  status,
  color = 'red',
  className = '',
  isHero = false
}) => {
  const colorClasses = {
    red: {
      bg: 'bg-red-50',
      iconBg: 'bg-[#E4002B]',
      text: 'text-[#E4002B]'
    },
    green: {
      bg: 'bg-green-50',
      iconBg: 'bg-green-600',
      text: 'text-green-600'
    },
    blue: {
      bg: 'bg-blue-50',
      iconBg: 'bg-blue-600',
      text: 'text-blue-600'
    },
    gray: {
      bg: 'bg-gray-100',
      iconBg: 'bg-gray-400',
      text: 'text-gray-500'
    }
  };

  const colors = colorClasses[color];

  return (
    <div className={`bg-white border border-gray-100 rounded-[2rem] p-6 hover:shadow-lg hover:shadow-gray-100/50 transition-all duration-300 group ${className} overflow-hidden`}>
      {isHero ? (
        <div className="flex flex-col items-center justify-center h-full relative z-10 w-full p-4 text-center">
          {/* Subtle Ambient Background Blur */}
          <div className={`absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-[120%] h-[120%] ${colors.bg} rounded-full blur-[80px] -z-10 opacity-70`}></div>
          
          <div className={`w-12 h-12 shrink-0 ${colors.iconBg} rounded-[1rem] flex items-center justify-center text-white shadow-xl shadow-${color}-200/50 group-hover:scale-110 transition-transform duration-500 mb-3`}>
            {icon}
          </div>
          
          <div className="flex flex-col items-center justify-center">
            <p className="text-[11px] font-bold text-gray-400 uppercase tracking-[0.1em] mb-1">
              {title}
            </p>
            <p className="text-4xl md:text-5xl font-black text-gray-900 tracking-tight drop-shadow-sm leading-none">
              {value}
            </p>
            {trend && (
              <div className={`flex items-center justify-center gap-1 text-xs font-bold mt-3 ${trend.isPositive ? 'text-green-600 bg-green-50 px-2.5 py-1 rounded-full' : 'text-red-600 bg-red-50 px-2.5 py-1 rounded-full'}`}>
                {trend.isPositive ? (
                  <svg className="w-3.5 h-3.5" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2.5" d="M5 10l7-7m0 0l7 7m-7-7v18" /></svg>
                ) : (
                  <svg className="w-3.5 h-3.5" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2.5" d="M19 14l-7 7m0 0l-7-7m7 7V3" /></svg>
                )}
                <span>{trend.value}</span>
              </div>
            )}
            {!trend && (
              <p className="text-[11px] font-medium text-gray-400 mt-3 max-w-[85%] leading-relaxed">
                Toàn bộ nhân sự đang làm việc
              </p>
            )}
          </div>
        </div>
      ) : (
        <div className="flex items-start justify-between">
          {/* Content */}
          <div className="flex-1 w-full pr-4">
            <p className="text-xs mb-2 font-bold text-gray-400 uppercase tracking-wider">
              {title}
            </p>
            <p className="text-3xl font-black text-gray-900 tracking-tight">
              {value}
            </p>
            {trend && (
              <div className={`flex items-center gap-1 text-sm font-bold mt-1 ${trend.isPositive ? 'text-green-600' : 'text-red-500'}`}>
                {trend.isPositive ? (
                  <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M5 10l7-7m0 0l7 7m-7-7v18" />
                  </svg>
                ) : (
                  <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M19 14l-7 7m0 0l-7-7m7 7V3" />
                  </svg>
                )}
                <span>{trend.value}</span>
              </div>
            )}
            {status && !trend && (
              <div className="flex items-center gap-2 mt-2">
                <span className={`w-2 h-2 rounded-full ${status === 'active' ? 'bg-green-500 animate-pulse' : status === 'warning' ? 'bg-yellow-500 animate-pulse' : 'bg-gray-400'}`} />
                <span className="text-sm font-semibold text-gray-500">
                  {status === 'active' ? 'Active' : status === 'warning' ? 'Active' : 'Inactive'}
                </span>
              </div>
            )}
          </div>

          {/* Icon */}
          <div className={`w-14 h-14 shrink-0 ${colors.iconBg} rounded-2xl flex items-center justify-center text-white shadow-lg group-hover:scale-110 transition-transform duration-300`}>
            {icon}
          </div>
        </div>
      )}
    </div>
  );
};

export default DashboardCard;

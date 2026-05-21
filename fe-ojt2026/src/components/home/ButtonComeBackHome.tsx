import Link from "next/link";

export const HomeButton = () => {
  return (
    <Link 
      href="/" 
      className="absolute top-4 right-4 md:top-8 md:right-8 p-3 bg-red-50 text-[#E4002B] rounded-full hover:bg-[#E4002B] hover:text-white transition-all shadow-sm z-50 group"
      title="Quay về trang chủ"
    >
      <svg 
        className="w-6 h-6" 
        fill="none" 
        stroke="currentColor" 
        viewBox="0 0 24 24"
      >
        <path 
          strokeLinecap="round" 
          strokeLinejoin="round" 
          strokeWidth="2" 
          d="M3 12l2-2m0 0l7-7 7 7M5 10v10a1 1 0 001 1h3m10-11l2 2m-2-2v10a1 1 0 01-1 1h-3m-6 0a1 1 0 001-1v-4a1 1 0 011-1h2a1 1 0 011 1v4a1 1 0 001 1m-6 0h6" 
        />
      </svg>
    </Link>
  );
};
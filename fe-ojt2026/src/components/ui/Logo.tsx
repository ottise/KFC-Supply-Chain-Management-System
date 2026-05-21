export function Logo() {
  return (
    <div className="flex items-center gap-4 shrink-0">
      <img
        src="https://upload.wikimedia.org/wikipedia/sco/b/bf/KFC_logo.svg"
        alt="KFC Logo"
        className="w-12 h-12 object-contain"
      />
      <div>
        <h1 className="text-xl font-black text-gray-900 uppercase tracking-tighter leading-none">
          KFC Việt Nam
        </h1>
        <p className="text-[10px] font-bold text-[#E4002B] uppercase tracking-[0.2em] mt-1.5 leading-none">
          SCM Việt Nam
        </p>
      </div>
    </div>
  );
}

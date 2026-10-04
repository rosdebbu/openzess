import { Link } from 'react-router-dom';
import { Home, BookOpen, HelpCircle, Compass } from 'lucide-react';

export default function NotFound() {
  return (
    <div className="flex-1 flex items-center justify-center p-10 bg-[#F5F0EB] dark:bg-[#1E1C1C] text-[#3A3838] dark:text-[#E2DAD2] overflow-y-auto">
      <div className="max-w-lg w-full text-center flex flex-col items-center">
        <div className="w-20 h-20 rounded-3xl bg-brand/10 text-brand flex items-center justify-center mb-6 shadow-lg shadow-brand/5 border border-brand/20">
          <Compass size={40} />
        </div>
        <p className="text-sm font-bold uppercase tracking-widest text-[#B8AFA8] mb-2">Error 404</p>
        <h1 className="text-4xl font-bold tracking-tight mb-4" style={{ fontFamily: "'Outfit', sans-serif" }}>
          This page wandered off
        </h1>
        <p className="text-[#B8AFA8] dark:text-[#B8AFA8] leading-relaxed mb-8">
          The route you requested does not exist in the Openzess workspace. Use the links below to get back on track.
        </p>
        <nav className="flex flex-wrap items-center justify-center gap-3" aria-label="Helpful navigation">
          <Link
            to="/"
            className="flex items-center gap-2 bg-brand hover:bg-brand-hover text-white px-5 py-3 rounded-xl font-medium text-sm transition-all shadow-lg shadow-brand/20 active:scale-95"
          >
            <Home size={16} /> Back to Workspace
          </Link>
          <Link
            to="/doc"
            className="flex items-center gap-2 border border-[#E2DAD2] dark:border-[#3A3838] hover:border-brand/50 hover:text-brand px-5 py-3 rounded-xl font-medium text-sm transition-all active:scale-95"
          >
            <BookOpen size={16} /> Documentation
          </Link>
          <Link
            to="/faq"
            className="flex items-center gap-2 border border-[#E2DAD2] dark:border-[#3A3838] hover:border-brand/50 hover:text-brand px-5 py-3 rounded-xl font-medium text-sm transition-all active:scale-95"
          >
            <HelpCircle size={16} /> FAQ
          </Link>
        </nav>
      </div>
    </div>
  );
}

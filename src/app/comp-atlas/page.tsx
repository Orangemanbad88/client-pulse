'use client';

import { useState, useEffect } from 'react';
import Link from 'next/link';
import { ArrowLeft, ExternalLink } from 'lucide-react';

const COMP_ATLAS_URL = 'http://localhost:3001';

export default function CompAtlasPage() {
  const [isMobile, setIsMobile] = useState(false);

  useEffect(() => {
    const check = () => setIsMobile(window.innerWidth < 768);
    check();
    window.addEventListener('resize', check);
    return () => window.removeEventListener('resize', check);
  }, []);

  return (
    <div className="flex flex-col h-[calc(100vh-0px)]">
      {/* Header */}
      <div className="flex items-center justify-between px-4 h-12 border-b border-amber-200/25 dark:border-gray-800 bg-white/50 dark:bg-gray-900/70 backdrop-blur-xl shrink-0">
        <div className="flex items-center gap-3">
          <Link
            href="/"
            className="flex items-center gap-1.5 text-[13px] font-medium text-gray-500 dark:text-gray-400 hover:text-gray-700 dark:hover:text-gray-300 transition-colors"
          >
            <ArrowLeft size={14} />
            Back
          </Link>
          <span className="text-[11px] text-gray-300 dark:text-gray-700">|</span>
          <h1 className="text-[13px] font-semibold text-gray-800 dark:text-gray-100">
            CompAtlas
          </h1>
        </div>
        <a
          href={COMP_ATLAS_URL}
          target="_blank"
          rel="noopener noreferrer"
          className="flex items-center gap-1.5 text-[12px] font-medium text-teal-600 dark:text-teal-400 hover:text-teal-700 dark:hover:text-teal-300 transition-colors"
        >
          Open in new tab
          <ExternalLink size={12} />
        </a>
      </div>

      {/* Content */}
      {isMobile ? (
        <div className="flex-1 flex items-center justify-center p-6">
          <div className="bg-white/60 dark:bg-gray-900/60 backdrop-blur-xl rounded-xl border border-amber-200/25 dark:border-gray-800/60 p-6 text-center max-w-sm w-full">
            <div className="w-10 h-10 rounded-lg bg-teal-50 dark:bg-teal-900/30 flex items-center justify-center mx-auto mb-3">
              <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" className="text-teal-600 dark:text-teal-400">
                <path d="M21 15v4a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2v-4" /><polyline points="7 10 12 15 17 10" /><line x1="12" y1="15" x2="12" y2="3" />
              </svg>
            </div>
            <h2 className="text-[15px] font-semibold text-gray-800 dark:text-gray-100 mb-1">CompAtlas</h2>
            <p className="text-[12px] text-gray-500 dark:text-gray-400 mb-4">
              For the best experience on mobile, open CompAtlas in a new tab.
            </p>
            <a
              href={COMP_ATLAS_URL}
              target="_blank"
              rel="noopener noreferrer"
              className="inline-flex items-center gap-2 bg-teal-600 hover:bg-teal-700 text-white text-[13px] font-medium px-4 py-2 rounded-lg transition-colors"
            >
              Open CompAtlas <ExternalLink size={14} />
            </a>
          </div>
        </div>
      ) : (
        <iframe
          src={COMP_ATLAS_URL}
          className="flex-1 w-full border-0"
          title="CompAtlas"
          allow="clipboard-read; clipboard-write"
          sandbox="allow-scripts allow-same-origin allow-forms allow-popups"
        />
      )}
    </div>
  );
}

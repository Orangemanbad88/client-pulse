'use client';

import { useState, useEffect } from 'react';
import Link from 'next/link';
import { ArrowLeft, ExternalLink } from 'lucide-react';

interface EmbedPageProps {
  title: string;
  url: string;
  mobileIcon: React.ReactNode;
}

export const EmbedPage = ({ title, url, mobileIcon }: EmbedPageProps) => {
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
      <div className="flex items-center justify-between px-4 h-12 border-b border-[#1E293B]/50 shrink-0" style={{ background: 'linear-gradient(135deg, #475569 0%, #1E293B 50%, #475569 100%)' }}>
        <div className="flex items-center gap-3">
          <Link
            href="/"
            className="flex items-center gap-1.5 text-[13px] font-medium text-slate-300 hover:text-white transition-colors"
          >
            <ArrowLeft size={14} />
            Back
          </Link>
          <span className="text-[11px] text-slate-500">|</span>
          <h1 className="text-[13px] font-semibold text-white">
            {title}
          </h1>
        </div>
        <a
          href={url}
          target="_blank"
          rel="noopener noreferrer"
          className="flex items-center gap-1.5 text-[12px] font-medium text-teal-300 hover:text-teal-200 transition-colors"
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
              {mobileIcon}
            </div>
            <h2 className="text-[15px] font-semibold text-gray-800 dark:text-gray-100 mb-1">{title}</h2>
            <p className="text-[12px] text-gray-500 dark:text-gray-400 mb-4">
              For the best experience on mobile, open {title} in a new tab.
            </p>
            <a
              href={url}
              target="_blank"
              rel="noopener noreferrer"
              className="inline-flex items-center gap-2 bg-teal-600 hover:bg-teal-700 text-white text-[13px] font-medium px-4 py-2 rounded-lg transition-colors"
            >
              Open {title} <ExternalLink size={14} />
            </a>
          </div>
        </div>
      ) : (
        <iframe
          src={url}
          className="flex-1 w-full border-0"
          title={title}
          allow="clipboard-read; clipboard-write"
          sandbox="allow-scripts allow-same-origin allow-forms allow-popups"
        />
      )}
    </div>
  );
};

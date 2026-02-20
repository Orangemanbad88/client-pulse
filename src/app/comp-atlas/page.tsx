'use client';

import { EmbedPage } from '@/components/ui/EmbedPage';

export default function CompAtlasPage() {
  return (
    <EmbedPage
      title="CompAtlas"
      url="https://comp-search.vercel.app"
      mobileIcon={
        <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" className="text-teal-600 dark:text-teal-400">
          <path d="M21 15v4a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2v-4" /><polyline points="7 10 12 15 17 10" /><line x1="12" y1="15" x2="12" y2="3" />
        </svg>
      }
    />
  );
}

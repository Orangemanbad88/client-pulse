'use client';

import { EmbedPage } from '@/components/ui/EmbedPage';

export default function RentAtlasPage() {
  return (
    <EmbedPage
      title="RentAtlas"
      url="https://rental-comp-search.vercel.app"
      mobileIcon={
        <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" className="text-teal-600 dark:text-teal-400">
          <path d="M3 9l9-7 9 7v11a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2z" /><polyline points="9 22 9 12 15 12 15 22" />
        </svg>
      }
    />
  );
}

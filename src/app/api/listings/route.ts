import { NextResponse } from 'next/server';

const COMP_SEARCH_URL = process.env.COMP_SEARCH_URL || 'https://comp-search.vercel.app';

export async function GET() {
  try {
    const res = await fetch(`${COMP_SEARCH_URL}/api/listings`, {
      next: { revalidate: 300 }, // cache 5 minutes
    });

    if (!res.ok) {
      console.error('CompSearch API error:', res.status, res.statusText);
      return NextResponse.json([], { status: 502 });
    }

    const listings = await res.json();
    return NextResponse.json(listings);
  } catch (error) {
    console.error('Failed to fetch MLS listings:', error);
    return NextResponse.json([], { status: 502 });
  }
}

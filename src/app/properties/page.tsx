'use client';

import { useEffect, useState, useCallback, useRef, useMemo } from 'react';
import Image from 'next/image';
import {
  Building2,
  MapPin,
  Bed,
  Bath,
  Calendar,
  ChevronLeft,
  ChevronRight,
  Pause,
  Play,
  TrendingUp,
  Home,
  Loader2,
  Search,
  X,
  ChevronDown,
  Users,
} from 'lucide-react';
import { useDark } from '@/hooks/useDark';

interface Listing {
  id: string;
  address: string;
  city: string;
  state: string;
  zip: string;
  bedrooms: number;
  bathrooms: number;
  sleeps: number;
  sqft: number;
  yearBuilt: number;
  propertyType: string;
  salePrice: number;
  daysOnMarket: number;
  availableSlots: number;
  listingType: 'rental' | 'for_sale';
  description: string;
  lat: number;
  lng: number;
  photos: string[];
  pricePerSqft: number;
  similarityScore: number;
}

const CYCLE_INTERVAL = 6000;

function formatPrice(price: number, type: 'rental' | 'for_sale'): string {
  if (price === 0) return type === 'rental' ? 'Call for rates' : 'Call for price';
  if (type === 'for_sale') {
    if (price >= 1_000_000) return `$${(price / 1_000_000).toFixed(2)}M`;
    if (price >= 1_000) return `$${(price / 1_000).toFixed(0)}K`;
  }
  return `$${price.toLocaleString()}`;
}

const PHOTO_URL = 'https://comp-search.vercel.app/api/photos';

function getPhotoUrl(listing: Listing): string {
  if (listing.listingType === 'rental') return listing.photos[0] || '';
  return `${PHOTO_URL}/${listing.id}?idx=0`;
}

export default function PropertiesPage() {
  const [listings, setListings] = useState<Listing[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [activeIndex, setActiveIndex] = useState(0);
  const [playing, setPlaying] = useState(true);
  const [filter, setFilter] = useState<'all' | 'Single Family' | 'Condo' | 'Townhouse' | 'Duplex'>('all');
  const [listingTypeFilter, setListingTypeFilter] = useState<'all' | 'rental' | 'for_sale'>('all');
  const [direction, setDirection] = useState<'next' | 'prev'>('next');
  const [visibleCount, setVisibleCount] = useState(9);
  const timerRef = useRef<ReturnType<typeof setInterval> | null>(null);
  const heroRef = useRef<HTMLDivElement>(null);
  const dark = useDark();

  // Advanced filters
  const [search, setSearch] = useState('');
  const [bedFilter, setBedFilter] = useState<number | null>(null);
  const [bathFilter, setBathFilter] = useState<number | null>(null);
  const [townFilter, setTownFilter] = useState<string | null>(null);
  const [showFilters, setShowFilters] = useState(false);

  useEffect(() => {
    fetch('/api/listings')
      .then((res) => {
        if (!res.ok) throw new Error(`API returned ${res.status}`);
        return res.json();
      })
      .then((data: Listing[]) => {
        if (data.length === 0) {
          setError('No listings available');
        }
        setListings(data);
        setLoading(false);
      })
      .catch(() => {
        setError('Could not connect to listing feed');
        setLoading(false);
      });
  }, []);

  // Unique values for filter dropdowns
  const towns = useMemo(() => {
    const set = new Set(listings.map((l) => l.city));
    return Array.from(set).sort();
  }, [listings]);

  const bedOptions = useMemo(() => {
    const set = new Set(listings.map((l) => l.bedrooms));
    return Array.from(set).sort((a, b) => a - b);
  }, [listings]);

  const bathOptions = useMemo(() => {
    const set = new Set(listings.map((l) => l.bathrooms));
    return Array.from(set).sort((a, b) => a - b);
  }, [listings]);

  const filtered = useMemo(() => {
    let result = listings;

    // Listing type filter (rental vs for sale)
    if (listingTypeFilter !== 'all') {
      result = result.filter((l) => l.listingType === listingTypeFilter);
    }

    // Property type filter
    if (filter !== 'all') {
      result = result.filter((l) => l.propertyType === filter);
    }

    // Search
    if (search.trim()) {
      const q = search.toLowerCase().trim();
      result = result.filter((l) =>
        l.address.toLowerCase().includes(q) ||
        l.city.toLowerCase().includes(q) ||
        l.zip.includes(q),
      );
    }

    // Bedrooms
    if (bedFilter !== null) {
      result = result.filter((l) => l.bedrooms >= bedFilter);
    }

    // Bathrooms
    if (bathFilter !== null) {
      result = result.filter((l) => l.bathrooms >= bathFilter);
    }

    // Town
    if (townFilter) {
      result = result.filter((l) => l.city === townFilter);
    }

    return result;
  }, [listings, listingTypeFilter, filter, search, bedFilter, bathFilter, townFilter]);

  const activeFiltersCount = [bedFilter, bathFilter, townFilter, search.trim() || null, listingTypeFilter !== 'all' ? listingTypeFilter : null].filter(Boolean).length;

  const clearAllFilters = () => {
    setSearch('');
    setBedFilter(null);
    setBathFilter(null);
    setTownFilter(null);
    setFilter('all');
    setListingTypeFilter('all');
  };

  const goTo = useCallback(
    (idx: number, dir: 'next' | 'prev') => {
      if (filtered.length === 0) return;
      setDirection(dir);
      setActiveIndex(((idx % filtered.length) + filtered.length) % filtered.length);
    },
    [filtered.length],
  );

  const next = useCallback(() => goTo(activeIndex + 1, 'next'), [activeIndex, goTo]);
  const prev = useCallback(() => goTo(activeIndex - 1, 'prev'), [activeIndex, goTo]);

  // Auto-cycle
  useEffect(() => {
    if (timerRef.current) clearInterval(timerRef.current);
    if (playing && filtered.length > 1) {
      timerRef.current = setInterval(next, CYCLE_INTERVAL);
    }
    return () => {
      if (timerRef.current) clearInterval(timerRef.current);
    };
  }, [playing, next, filtered.length]);

  // Reset index and visible count when any filter changes
  useEffect(() => {
    setActiveIndex(0);
    setVisibleCount(9);
  }, [listingTypeFilter, filter, search, bedFilter, bathFilter, townFilter]);

  const featured = filtered[activeIndex];

  // Counts based on current listing type filter
  const typeBase = listingTypeFilter === 'all' ? listings : listings.filter((l) => l.listingType === listingTypeFilter);
  const typeCounts = {
    all: typeBase.length,
    'Single Family': typeBase.filter((l) => l.propertyType === 'Single Family').length,
    Condo: typeBase.filter((l) => l.propertyType === 'Condo').length,
    Townhouse: typeBase.filter((l) => l.propertyType === 'Townhouse').length,
    Duplex: typeBase.filter((l) => l.propertyType === 'Duplex').length,
  };

  const rentalCount = listings.filter((l) => l.listingType === 'rental').length;
  const forSaleCount = listings.filter((l) => l.listingType === 'for_sale').length;

  if (loading) {
    return (
      <div className="flex flex-col items-center justify-center min-h-[500px] gap-3">
        <Loader2 size={28} className="text-gold animate-spin" />
        <p className="text-sm text-gray-400">Fetching listings...</p>
      </div>
    );
  }

  return (
    <>
      {/* Header */}
      <header
        className="sticky top-0 z-10 px-4 lg:px-8 py-3 lg:py-4 border-b border-[#132a4a]/50 flex items-center justify-between"
        style={{ background: 'linear-gradient(135deg, #1e3a5f 0%, #1a3456 50%, #1e3a5f 100%)' }}
      >
        <div className="flex items-center gap-3">
          <div className="w-10 h-10 rounded-xl bg-gradient-to-br from-gold to-gold-muted flex items-center justify-center shadow-sm shadow-gold/15">
            <Building2 size={18} className="text-white" />
          </div>
          <div>
            <h1 className="text-lg text-white" style={{ fontWeight: 600, letterSpacing: '-0.025em' }}>
              Properties
            </h1>
            <p className="text-xs text-slate-400 mt-0.5">
              {filtered.length} of {listings.length} listings
              {listings.length > 0 && (
                <span className="ml-2 inline-flex items-center gap-1 text-emerald-400">
                  <span className="w-1.5 h-1.5 rounded-full bg-emerald-400 animate-pulse" />
                  Live feed
                </span>
              )}
            </p>
          </div>
        </div>
        <div className="flex items-center gap-2">
          <button
            onClick={() => setPlaying(!playing)}
            className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-medium text-slate-300 hover:text-white hover:bg-white/10 transition-all duration-300"
          >
            {playing ? <Pause size={13} /> : <Play size={13} />}
            {playing ? 'Pause' : 'Play'}
          </button>
        </div>
      </header>

      <div className="px-4 lg:px-8 py-4 lg:py-6 space-y-4">
        {/* Search bar */}
        <div className="relative">
          <Search size={15} className="absolute left-3.5 top-1/2 -translate-y-1/2 text-gray-400" />
          <input
            type="text"
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            placeholder="Search by address, city, or zip..."
            className="w-full pl-10 pr-10 py-2.5 rounded-xl text-sm bg-white/60 dark:bg-gray-900/60 backdrop-blur-md border border-amber-200/25 dark:border-gray-800/60 text-gray-800 dark:text-gray-100 placeholder-gray-400 dark:placeholder-gray-500 focus:outline-none focus:ring-2 focus:ring-gold/30 focus:border-gold/40 transition-all"
          />
          {search && (
            <button
              onClick={() => setSearch('')}
              className="absolute right-3.5 top-1/2 -translate-y-1/2 p-0.5 rounded-full hover:bg-gray-200 dark:hover:bg-gray-700 transition-colors"
            >
              <X size={14} className="text-gray-400" />
            </button>
          )}
        </div>

        {/* Listing type toggle */}
        <div className="flex items-center gap-1">
          {([
            { key: 'all' as const, label: 'All', count: listings.length },
            { key: 'for_sale' as const, label: 'For Sale', count: forSaleCount },
            { key: 'rental' as const, label: 'Rentals', count: rentalCount },
          ]).map((t) => (
            <button
              key={t.key}
              onClick={() => setListingTypeFilter(t.key)}
              className={`px-3.5 py-1.5 rounded-lg text-xs font-semibold transition-all duration-300 ${
                listingTypeFilter === t.key
                  ? 'bg-gold text-white shadow-sm shadow-gold/20'
                  : 'text-gray-500 dark:text-gray-400 hover:bg-gray-100 dark:hover:bg-gray-800/50'
              }`}
            >
              {t.label}
              <span className="ml-1.5 text-[10px] font-data opacity-70">{t.count}</span>
            </button>
          ))}
        </div>

        {/* Type tabs + filter toggle */}
        <div className="flex items-center justify-between gap-3">
          <div className="flex items-center gap-1">
            {(['all', 'Single Family', 'Condo', 'Townhouse', 'Duplex'] as const).map((f) => (
              <button
                key={f}
                onClick={() => setFilter(f)}
                className={`px-3 py-1.5 rounded-lg text-xs font-medium transition-all duration-300 ${
                  filter === f
                    ? 'bg-amber-50 dark:bg-amber-900/20 text-gold-muted dark:text-gold-light shadow-sm'
                    : 'text-gray-500 dark:text-gray-400 hover:bg-gray-100 dark:hover:bg-gray-800/50'
                }`}
              >
                {f === 'all' ? 'All' : f}
                <span className="ml-1.5 text-[10px] font-data opacity-60">{typeCounts[f]}</span>
              </button>
            ))}
          </div>

          <button
            onClick={() => setShowFilters(!showFilters)}
            className={`flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-medium transition-all duration-300 ${
              showFilters || activeFiltersCount > 0
                ? 'bg-amber-50 dark:bg-amber-900/20 text-gold-muted dark:text-gold-light shadow-sm'
                : 'text-gray-500 dark:text-gray-400 hover:bg-gray-100 dark:hover:bg-gray-800/50'
            }`}
          >
            <svg width="13" height="13" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><path d="M22 3H2l8 9.46V19l4 2v-8.54L22 3z"/></svg>
            Filters
            {activeFiltersCount > 0 && (
              <span className="ml-1 w-4 h-4 rounded-full bg-gold text-white text-[10px] font-bold flex items-center justify-center">{activeFiltersCount}</span>
            )}
            <ChevronDown size={12} className={`transition-transform duration-200 ${showFilters ? 'rotate-180' : ''}`} />
          </button>
        </div>

        {/* Filter panel */}
        {showFilters && (
          <div className="bg-white/60 dark:bg-gray-900/60 backdrop-blur-xl rounded-xl border border-amber-200/25 dark:border-gray-800/60 p-4 shadow-sm">
            <div className="flex flex-wrap items-end gap-4">
              {/* Bedrooms */}
              <div className="flex-1 min-w-[140px]">
                <label className="text-[11px] font-semibold uppercase tracking-wider text-gray-400 dark:text-gray-500 mb-1.5 block">
                  <Bed size={11} className="inline mr-1" />Bedrooms
                </label>
                <select
                  value={bedFilter ?? ''}
                  onChange={(e) => setBedFilter(e.target.value ? Number(e.target.value) : null)}
                  className="w-full px-3 py-2 rounded-lg text-sm bg-white dark:bg-gray-800 border border-gray-200 dark:border-gray-700 text-gray-800 dark:text-gray-100 focus:outline-none focus:ring-2 focus:ring-gold/30 focus:border-gold/40 transition-all appearance-none cursor-pointer"
                >
                  <option value="">Any</option>
                  {bedOptions.map((b) => (
                    <option key={b} value={b}>{b}+ beds</option>
                  ))}
                </select>
              </div>

              {/* Bathrooms */}
              <div className="flex-1 min-w-[140px]">
                <label className="text-[11px] font-semibold uppercase tracking-wider text-gray-400 dark:text-gray-500 mb-1.5 block">
                  <Bath size={11} className="inline mr-1" />Bathrooms
                </label>
                <select
                  value={bathFilter ?? ''}
                  onChange={(e) => setBathFilter(e.target.value ? Number(e.target.value) : null)}
                  className="w-full px-3 py-2 rounded-lg text-sm bg-white dark:bg-gray-800 border border-gray-200 dark:border-gray-700 text-gray-800 dark:text-gray-100 focus:outline-none focus:ring-2 focus:ring-gold/30 focus:border-gold/40 transition-all appearance-none cursor-pointer"
                >
                  <option value="">Any</option>
                  {bathOptions.map((b) => (
                    <option key={b} value={b}>{b}+ baths</option>
                  ))}
                </select>
              </div>

              {/* Town */}
              <div className="flex-1 min-w-[180px]">
                <label className="text-[11px] font-semibold uppercase tracking-wider text-gray-400 dark:text-gray-500 mb-1.5 block">
                  <MapPin size={11} className="inline mr-1" />Town
                </label>
                <select
                  value={townFilter ?? ''}
                  onChange={(e) => setTownFilter(e.target.value || null)}
                  className="w-full px-3 py-2 rounded-lg text-sm bg-white dark:bg-gray-800 border border-gray-200 dark:border-gray-700 text-gray-800 dark:text-gray-100 focus:outline-none focus:ring-2 focus:ring-gold/30 focus:border-gold/40 transition-all appearance-none cursor-pointer"
                >
                  <option value="">All Towns</option>
                  {towns.map((t) => (
                    <option key={t} value={t}>{t}</option>
                  ))}
                </select>
              </div>

              {/* Clear */}
              {activeFiltersCount > 0 && (
                <button
                  onClick={clearAllFilters}
                  className="flex items-center gap-1.5 px-3 py-2 rounded-lg text-xs font-medium text-red-500 hover:bg-red-50 dark:hover:bg-red-900/10 transition-colors"
                >
                  <X size={12} /> Clear all
                </button>
              )}
            </div>

            {/* Active filter pills */}
            {activeFiltersCount > 0 && (
              <div className="flex flex-wrap gap-2 mt-3 pt-3 border-t border-gray-100 dark:border-gray-800">
                {search.trim() && (
                  <span className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-lg text-xs font-medium bg-amber-50/80 dark:bg-amber-900/20 text-gold-muted dark:text-gold-light border border-gold-light/40 dark:border-gold-muted/20">
                    &ldquo;{search}&rdquo;
                    <button onClick={() => setSearch('')} className="hover:text-red-500 transition-colors"><X size={11} /></button>
                  </span>
                )}
                {bedFilter !== null && (
                  <span className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-lg text-xs font-medium bg-amber-50/80 dark:bg-amber-900/20 text-gold-muted dark:text-gold-light border border-gold-light/40 dark:border-gold-muted/20">
                    {bedFilter}+ beds
                    <button onClick={() => setBedFilter(null)} className="hover:text-red-500 transition-colors"><X size={11} /></button>
                  </span>
                )}
                {bathFilter !== null && (
                  <span className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-lg text-xs font-medium bg-amber-50/80 dark:bg-amber-900/20 text-gold-muted dark:text-gold-light border border-gold-light/40 dark:border-gold-muted/20">
                    {bathFilter}+ baths
                    <button onClick={() => setBathFilter(null)} className="hover:text-red-500 transition-colors"><X size={11} /></button>
                  </span>
                )}
                {townFilter && (
                  <span className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-lg text-xs font-medium bg-amber-50/80 dark:bg-amber-900/20 text-gold-muted dark:text-gold-light border border-gold-light/40 dark:border-gold-muted/20">
                    {townFilter}
                    <button onClick={() => setTownFilter(null)} className="hover:text-red-500 transition-colors"><X size={11} /></button>
                  </span>
                )}
                <span className="text-xs text-gray-400 dark:text-gray-500 self-center font-data">
                  {filtered.length} result{filtered.length !== 1 ? 's' : ''}
                </span>
              </div>
            )}
          </div>
        )}

        {error && filtered.length === 0 ? (
          <div className="text-center py-16">
            <Building2 size={40} className="text-gray-300 dark:text-gray-700 mx-auto mb-4" />
            <p className="text-sm text-gray-500 dark:text-gray-400 mb-1">{error}</p>
            <p className="text-xs text-gray-400 dark:text-gray-500">
              Could not connect to McCann Realtors listing feed
            </p>
          </div>
        ) : filtered.length === 0 ? (
          <div className="text-center py-16">
            <Home size={40} className="text-gray-300 dark:text-gray-700 mx-auto mb-4" />
            <p className="text-sm text-gray-500 dark:text-gray-400 mb-1">No listings match your filters</p>
            <button
              onClick={clearAllFilters}
              className="text-xs text-gold dark:text-gold-light hover:underline mt-2"
            >
              Clear all filters
            </button>
          </div>
        ) : (
          <>
            {/* Featured Listing - Hero Carousel */}
            {featured && (
              <div ref={heroRef} className="relative group">
                <div
                  className="relative overflow-hidden rounded-2xl border border-amber-200/30 dark:border-gray-700/60 bg-white/70 dark:bg-gray-900/70 backdrop-blur-md shadow-lg shadow-gold/5 dark:shadow-black/20 transition-all duration-500"
                >
                  <div className="flex flex-col lg:flex-row">
                    {/* Photo */}
                    <div className="relative lg:w-[420px] h-[240px] lg:h-[320px] flex-shrink-0 overflow-hidden bg-gray-100 dark:bg-gray-800">
                      {getPhotoUrl(featured) ? (
                        <Image
                          key={featured.id}
                          src={getPhotoUrl(featured)}
                          alt={featured.address}
                          fill
                          className="object-cover transition-opacity duration-700 ease-out"
                          style={{ animation: `${direction === 'next' ? 'slideInRight' : 'slideInLeft'} 0.5s ease` }}
                          sizes="(max-width: 1024px) 100vw, 420px"
                          onError={(e) => {
                            (e.target as HTMLImageElement).style.display = 'none';
                          }}
                        />
                      ) : (
                        <div className="w-full h-full flex items-center justify-center">
                          <Building2 size={40} className="text-gray-300 dark:text-gray-700" />
                        </div>
                      )}
                      <div className="absolute inset-0 bg-gradient-to-t from-black/40 via-transparent to-transparent" />

                      {/* Listing counter */}
                      <div className="absolute top-3 left-3 px-2.5 py-1 rounded-lg bg-black/50 backdrop-blur-sm text-white text-xs font-data font-medium">
                        {activeIndex + 1} / {filtered.length}
                      </div>

                      {/* Status badge */}
                      <div className="absolute top-3 right-3 px-2.5 py-1 rounded-lg bg-black/50 backdrop-blur-sm text-white text-xs font-medium flex items-center gap-1">
                        {featured.listingType === 'rental' ? (
                          <><Calendar size={11} /> {featured.availableSlots > 0 ? `${featured.availableSlots} wk${featured.availableSlots !== 1 ? 's' : ''} available` : 'Rental'}</>
                        ) : (
                          <><TrendingUp size={11} /> {featured.daysOnMarket <= 7 ? 'New Listing' : `${featured.daysOnMarket}d on market`}</>
                        )}
                      </div>
                    </div>

                    {/* Details */}
                    <div className="flex-1 p-5 lg:p-6 flex flex-col justify-between">
                      <div>
                        {/* Price */}
                        <div className="flex items-baseline gap-3 mb-1">
                          <span className="text-2xl lg:text-3xl font-bold font-data text-gold dark:text-gold-light">
                            {formatPrice(featured.salePrice, featured.listingType)}
                          </span>
                          {featured.salePrice > 0 && (
                            <span className="text-xs text-gray-400 font-data">
                              {featured.listingType === 'rental' ? '/week' : featured.pricePerSqft > 0 ? `$${Math.round(featured.pricePerSqft)}/sqft` : ''}
                            </span>
                          )}
                        </div>

                        {/* Address */}
                        <h2 className="text-base lg:text-lg font-semibold text-gray-800 dark:text-gray-100 mb-0.5">
                          {featured.address}
                        </h2>
                        <p className="text-sm text-gray-500 dark:text-gray-400 flex items-center gap-1 mb-4">
                          <MapPin size={13} />
                          {featured.city}, {featured.state} {featured.zip}
                        </p>

                        {/* Stats row */}
                        <div className="flex items-center gap-5 mb-4">
                          <div className="flex items-center gap-1.5 text-sm text-gray-600 dark:text-gray-300">
                            <Bed size={16} className="text-gray-400" />
                            <span className="font-data font-semibold">{featured.bedrooms}</span>
                            <span className="text-xs text-gray-400">beds</span>
                          </div>
                          <div className="flex items-center gap-1.5 text-sm text-gray-600 dark:text-gray-300">
                            <Bath size={16} className="text-gray-400" />
                            <span className="font-data font-semibold">{featured.bathrooms}</span>
                            <span className="text-xs text-gray-400">baths</span>
                          </div>
                          {featured.listingType === 'rental' && featured.sleeps > 0 && (
                            <div className="flex items-center gap-1.5 text-sm text-gray-600 dark:text-gray-300">
                              <Users size={16} className="text-gray-400" />
                              <span className="font-data font-semibold">{featured.sleeps}</span>
                              <span className="text-xs text-gray-400">sleeps</span>
                            </div>
                          )}
                          {featured.listingType === 'for_sale' && featured.sqft > 0 && (
                            <div className="flex items-center gap-1.5 text-sm text-gray-600 dark:text-gray-300">
                              <Building2 size={16} className="text-gray-400" />
                              <span className="font-data font-semibold">{featured.sqft.toLocaleString()}</span>
                              <span className="text-xs text-gray-400">sqft</span>
                            </div>
                          )}
                        </div>

                        {/* Tags */}
                        <div className="flex flex-wrap gap-2">
                          <span className="text-xs px-2.5 py-1 rounded-lg bg-amber-50/80 dark:bg-amber-900/20 text-gold-muted dark:text-gold-light border border-gold-light/40 dark:border-gold-muted/20 font-medium">
                            {featured.propertyType}
                          </span>
                          <span className={`text-xs px-2.5 py-1 rounded-lg font-medium ${
                            featured.listingType === 'rental'
                              ? 'bg-blue-50 dark:bg-blue-900/20 text-blue-600 dark:text-blue-400 border border-blue-200/40 dark:border-blue-800/30'
                              : 'bg-emerald-50 dark:bg-emerald-900/20 text-emerald-600 dark:text-emerald-400 border border-emerald-200/40 dark:border-emerald-800/30'
                          }`}>
                            {featured.listingType === 'rental' ? 'Rental' : 'For Sale'}
                          </span>
                          {featured.photos.length > 1 && (
                            <span className="text-xs px-2.5 py-1 rounded-lg bg-gray-50 dark:bg-gray-800 text-gray-500 dark:text-gray-400 border border-gray-200/40 dark:border-gray-700/40">
                              {featured.photos.length} photos
                            </span>
                          )}
                        </div>
                      </div>

                      {/* Progress dots */}
                      <div className="flex items-center gap-1.5 mt-4 lg:mt-0">
                        {filtered.slice(0, Math.min(filtered.length, 20)).map((_, i) => (
                          <button
                            key={i}
                            onClick={() => goTo(i, i > activeIndex ? 'next' : 'prev')}
                            className={`h-1.5 rounded-full transition-all duration-500 ${
                              i === activeIndex
                                ? 'w-6 bg-gold dark:bg-gold-light'
                                : 'w-1.5 bg-gray-300 dark:bg-gray-600 hover:bg-gray-400'
                            }`}
                          />
                        ))}
                        {filtered.length > 20 && (
                          <span className="text-[10px] text-gray-400 ml-1">+{filtered.length - 20}</span>
                        )}
                      </div>
                    </div>
                  </div>
                </div>

                {/* Nav arrows */}
                <button
                  onClick={prev}
                  className="absolute left-2 top-1/2 -translate-y-1/2 w-9 h-9 rounded-full bg-white/90 dark:bg-gray-800/90 shadow-lg border border-gray-200/50 dark:border-gray-700/50 flex items-center justify-center text-gray-600 dark:text-gray-300 opacity-0 group-hover:opacity-100 hover:scale-110 transition-all duration-300"
                >
                  <ChevronLeft size={18} />
                </button>
                <button
                  onClick={next}
                  className="absolute right-2 top-1/2 -translate-y-1/2 w-9 h-9 rounded-full bg-white/90 dark:bg-gray-800/90 shadow-lg border border-gray-200/50 dark:border-gray-700/50 flex items-center justify-center text-gray-600 dark:text-gray-300 opacity-0 group-hover:opacity-100 hover:scale-110 transition-all duration-300"
                >
                  <ChevronRight size={18} />
                </button>
              </div>
            )}

            {/* Listings Grid */}
            <div>
              <h3 className="text-sm font-semibold text-gray-700 dark:text-gray-300 mb-3">
                All Listings
                <span className="ml-2 text-xs font-normal text-gray-400">
                  Showing {Math.min(visibleCount, filtered.length)} of {filtered.length}
                </span>
              </h3>
              <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-4">
                {filtered.slice(0, visibleCount).map((listing, i) => (
                  <div
                    key={listing.id}
                    onClick={() => {
                      goTo(i, i > activeIndex ? 'next' : 'prev');
                      heroRef.current?.scrollIntoView({ behavior: 'smooth', block: 'center' });
                    }}
                    className={`group/card cursor-pointer rounded-xl border overflow-hidden transition-all duration-300 hover:shadow-lg hover:scale-[1.01] ${
                      i === activeIndex
                        ? 'border-gold/40 dark:border-gold-light/30 shadow-md shadow-gold/10 ring-1 ring-gold/20'
                        : 'border-amber-200/25 dark:border-gray-800/60 bg-white/60 dark:bg-gray-900/60 backdrop-blur-md shadow-sm hover:shadow-gold/10'
                    }`}
                    style={{ animationDelay: `${i * 40}ms` }}
                  >
                    {/* Thumbnail */}
                    <div className="relative h-36 overflow-hidden bg-gray-100 dark:bg-gray-800">
                      {getPhotoUrl(listing) ? (
                        <Image
                          src={getPhotoUrl(listing)}
                          alt={listing.address}
                          fill
                          className="object-cover group-hover/card:scale-105 transition-transform duration-500"
                          sizes="(max-width: 768px) 100vw, (max-width: 1280px) 50vw, 33vw"
                          onError={(e) => {
                            (e.target as HTMLImageElement).style.display = 'none';
                          }}
                        />
                      ) : (
                        <div className="w-full h-full flex items-center justify-center">
                          <Building2 size={24} className="text-gray-300 dark:text-gray-700" />
                        </div>
                      )}
                      <div className="absolute inset-0 bg-gradient-to-t from-black/30 via-transparent to-transparent" />
                      <div className="absolute bottom-2 left-2 px-2 py-0.5 rounded-md bg-black/50 backdrop-blur-sm text-white text-xs font-data font-bold">
                        {listing.listingType === 'rental'
                          ? (listing.salePrice > 0 ? `${formatPrice(listing.salePrice, 'rental')}/wk` : 'Call')
                          : formatPrice(listing.salePrice, 'for_sale')}
                      </div>
                      <div className={`absolute top-2 right-2 px-2 py-0.5 rounded-md text-white text-[10px] font-semibold uppercase tracking-wider ${
                        listing.listingType === 'rental' ? 'bg-blue-500/90' : 'bg-emerald-500/90'
                      }`}>
                        {listing.listingType === 'rental' ? 'Rental' : 'For Sale'}
                      </div>
                    </div>

                    {/* Card body */}
                    <div className="p-3.5">
                      <p className="text-sm font-semibold text-gray-800 dark:text-gray-100 truncate mb-0.5">
                        {listing.address}
                      </p>
                      <p className="text-xs text-gray-500 dark:text-gray-400 flex items-center gap-1 mb-2.5">
                        <MapPin size={11} />
                        {listing.city}, {listing.state}
                      </p>
                      <div className="flex items-center gap-3 text-xs text-gray-500 dark:text-gray-400">
                        <span className="flex items-center gap-1">
                          <Bed size={12} /> {listing.bedrooms}
                        </span>
                        <span className="flex items-center gap-1">
                          <Bath size={12} /> {listing.bathrooms}
                        </span>
                        {listing.listingType === 'rental' && listing.sleeps > 0 && (
                          <span className="flex items-center gap-1">
                            <Users size={12} /> {listing.sleeps}
                          </span>
                        )}
                        {listing.listingType === 'for_sale' && listing.sqft > 0 && (
                          <span className="flex items-center gap-1">
                            <Building2 size={12} /> {listing.sqft.toLocaleString()}
                          </span>
                        )}
                        <span className={`ml-auto text-[10px] font-medium flex items-center gap-0.5 ${
                          listing.listingType === 'rental' ? 'text-blue-500' : 'text-emerald-500'
                        }`}>
                          {listing.listingType === 'rental' ? (
                            <><Calendar size={10} /> {listing.availableSlots > 0 ? `${listing.availableSlots} wk${listing.availableSlots !== 1 ? 's' : ''}` : 'Rental'}</>
                          ) : (
                            <><TrendingUp size={10} /> {listing.daysOnMarket}d</>
                          )}
                        </span>
                      </div>
                    </div>
                  </div>
                ))}
              </div>

              {/* Load More */}
              {visibleCount < filtered.length && (
                <div className="flex justify-center mt-6">
                  <button
                    onClick={() => setVisibleCount((c) => c + 9)}
                    className="px-5 py-2.5 rounded-xl text-sm font-medium text-gold dark:text-gold-light bg-amber-50/80 dark:bg-amber-900/15 border border-gold-light/30 dark:border-gold-muted/20 hover:bg-amber-100/80 dark:hover:bg-amber-900/25 hover:border-gold/40 transition-all duration-300 hover:shadow-md hover:shadow-gold/10"
                  >
                    Show More
                    <span className="ml-2 text-xs text-gray-400 font-data">
                      ({Math.min(9, filtered.length - visibleCount)} more)
                    </span>
                  </button>
                </div>
              )}

              {visibleCount >= filtered.length && filtered.length > 9 && (
                <p className="text-center text-xs text-gray-400 mt-6">
                  All {filtered.length} listings shown
                </p>
              )}
            </div>
          </>
        )}
      </div>

      {/* Slide animations */}
      <style jsx global>{`
        @keyframes slideInRight {
          from { opacity: 0; transform: translateX(30px); }
          to   { opacity: 1; transform: translateX(0); }
        }
        @keyframes slideInLeft {
          from { opacity: 0; transform: translateX(-30px); }
          to   { opacity: 1; transform: translateX(0); }
        }
      `}</style>
    </>
  );
}

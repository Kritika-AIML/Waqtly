import React, { useState } from 'react';
import { useApp } from '../context/AppContext';
import { LocationCard } from '../components/home/LocationCard';
import { HonestyBadge } from '../components/common/HonestyBadge';
import { Search } from 'lucide-react';
import { predictDay } from '../services/predictionService';

interface LocationsPageProps {
  onSelectLocation: (id: string) => void;
  onPlanVisit: (id: string) => void;
}

export const LocationsPage: React.FC<LocationsPageProps> = ({
  onSelectLocation,
  onPlanVisit,
}) => {
  const { locations, demoClock } = useApp();
  const [query, setQuery] = useState('');

  const filtered = locations.filter(
    (l) =>
      l.name.toLowerCase().includes(query.toLowerCase()) ||
      l.shortDescription.toLowerCase().includes(query.toLowerCase()) ||
      l.purposes.some((p) => p.toLowerCase().includes(query.toLowerCase()))
  );

  return (
    <div className="space-y-8 animate-in fade-in duration-200">
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <div className="flex items-center gap-2 mb-1.5">
            <HonestyBadge />
            <span className="text-xs text-slate-400">•</span>
            <span className="text-xs font-semibold text-slate-500">Service Directory</span>
          </div>
          <h1 className="text-2xl sm:text-3xl font-black text-slate-900 tracking-tight">
            Demo Locations
          </h1>
          <p className="text-xs sm:text-sm text-slate-600 mt-1 max-w-xl">
            Explore active counters, service rates, and hourly predictions for each of our 4 prototype venues.
          </p>
        </div>

        {/* Search */}
        <div className="relative min-w-64">
          <Search className="w-4 h-4 text-slate-400 absolute left-3 top-1/2 -translate-y-1/2" />
          <input
            type="text"
            placeholder="Search locations or services..."
            value={query}
            onChange={(e) => setQuery(e.target.value)}
            className="w-full pl-9 pr-3 py-2 text-xs rounded-xl border border-slate-200 bg-white focus:outline-hidden focus:border-blue-600 focus:ring-1 focus:ring-blue-600 shadow-2xs"
          />
        </div>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
        {filtered.map((loc) => (
          <LocationCard
            key={loc.id}
            location={loc}
            onSelect={onSelectLocation}
            onPlanVisit={onPlanVisit}
          />
        ))}
      </div>
    </div>
  );
};

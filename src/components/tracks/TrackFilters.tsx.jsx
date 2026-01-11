import React from 'react';
import { Search, X, SlidersHorizontal } from 'lucide-react';
import { Input } from '@/components/ui/input';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import {
  Sheet,
  SheetContent,
  SheetHeader,
  SheetTitle,
  SheetTrigger,
} from '@/components/ui/sheet';
import { cn } from '@/lib/utils';

interface FilterState {
  search: string;
  theme: string;
  nervousSystem: string;
  chakra: string;
  difficulty: string;
  voicePresent: string;
  accessTier: string;
}

interface TrackFiltersProps {
  filters: FilterState;
  onFilterChange: (filters: FilterState) => void;
  themes: string[];
  activeFiltersCount: number;
}

const nervousSystemOptions = [
  { value: 'all', label: 'All States' },
  { value: 'calming', label: 'Calming' },
  { value: 'activating', label: 'Activating' },
  { value: 'balancing', label: 'Balancing' },
];

const chakraOptions = [
  { value: 'all', label: 'All Chakras' },
  { value: 'root', label: 'Root' },
  { value: 'sacral', label: 'Sacral' },
  { value: 'solar_plexus', label: 'Solar Plexus' },
  { value: 'heart', label: 'Heart' },
  { value: 'throat', label: 'Throat' },
  { value: 'third_eye', label: 'Third Eye' },
  { value: 'crown', label: 'Crown' },
];

const difficultyOptions = [
  { value: 'all', label: 'All Levels' },
  { value: 'beginner', label: 'Beginner' },
  { value: 'intermediate', label: 'Intermediate' },
  { value: 'advanced', label: 'Advanced' },
];

const voiceOptions = [
  { value: 'all', label: 'All Tracks' },
  { value: 'true', label: 'Guided (with voice)' },
  { value: 'false', label: 'Music only' },
];

const tierOptions = [
  { value: 'all', label: 'All Tiers' },
  { value: 'free', label: 'Free' },
  { value: 'member', label: 'Member' },
  { value: 'resonance_path', label: 'ResonancePath' },
];

export default function TrackFilters({
  filters,
  onFilterChange,
  themes,
  activeFiltersCount,
}: TrackFiltersProps) {
  const updateFilter = (key: keyof FilterState, value: string) => {
    onFilterChange({ ...filters, [key]: value });
  };

  const clearFilters = () => {
    onFilterChange({
      search: '',
      theme: 'all',
      nervousSystem: 'all',
      chakra: 'all',
      difficulty: 'all',
      voicePresent: 'all',
      accessTier: 'all',
    });
  };

  const FilterContent = () => (
    <div className="space-y-6">
      {/* Theme */}
      <div className="space-y-2">
        <label className="text-sm font-medium text-stone-300">Theme</label>
        <Select value={filters.theme} onValueChange={(v) => updateFilter('theme', v)}>
          <SelectTrigger className="bg-stone-800/50 border-stone-700 text-white">
            <SelectValue placeholder="All Themes" />
          </SelectTrigger>
          <SelectContent className="bg-stone-800 border-stone-700">
            <SelectItem value="all">All Themes</SelectItem>
            {themes.map((theme) => (
              <SelectItem key={theme} value={theme} className="capitalize">
                {theme}
              </SelectItem>
            ))}
          </SelectContent>
        </Select>
      </div>

      {/* Nervous System State */}
      <div className="space-y-2">
        <label className="text-sm font-medium text-stone-300">Nervous System</label>
        <Select value={filters.nervousSystem} onValueChange={(v) => updateFilter('nervousSystem', v)}>
          <SelectTrigger className="bg-stone-800/50 border-stone-700 text-white">
            <SelectValue placeholder="All States" />
          </SelectTrigger>
          <SelectContent className="bg-stone-800 border-stone-700">
            {nervousSystemOptions.map((opt) => (
              <SelectItem key={opt.value} value={opt.value}>
                {opt.label}
              </SelectItem>
            ))}
          </SelectContent>
        </Select>
      </div>

      {/* Chakra */}
      <div className="space-y-2">
        <label className="text-sm font-medium text-stone-300">Chakra</label>
        <Select value={filters.chakra} onValueChange={(v) => updateFilter('chakra', v)}>
          <SelectTrigger className="bg-stone-800/50 border-stone-700 text-white">
            <SelectValue placeholder="All Chakras" />
          </SelectTrigger>
          <SelectContent className="bg-stone-800 border-stone-700">
            {chakraOptions.map((opt) => (
              <SelectItem key={opt.value} value={opt.value}>
                {opt.label}
              </SelectItem>
            ))}
          </SelectContent>
        </Select>
      </div>

      {/* Difficulty */}
      <div className="space-y-2">
        <label className="text-sm font-medium text-stone-300">Level</label>
        <Select value={filters.difficulty} onValueChange={(v) => updateFilter('difficulty', v)}>
          <SelectTrigger className="bg-stone-800/50 border-stone-700 text-white">
            <SelectValue placeholder="All Levels" />
          </SelectTrigger>
          <SelectContent className="bg-stone-800 border-stone-700">
            {difficultyOptions.map((opt) => (
              <SelectItem key={opt.value} value={opt.value}>
                {opt.label}
              </SelectItem>
            ))}
          </SelectContent>
        </Select>
      </div>

      {/* Voice */}
      <div className="space-y-2">
        <label className="text-sm font-medium text-stone-300">Guidance</label>
        <Select value={filters.voicePresent} onValueChange={(v) => updateFilter('voicePresent', v)}>
          <SelectTrigger className="bg-stone-800/50 border-stone-700 text-white">
            <SelectValue placeholder="All Tracks" />
          </SelectTrigger>
          <SelectContent className="bg-stone-800 border-stone-700">
            {voiceOptions.map((opt) => (
              <SelectItem key={opt.value} value={opt.value}>
                {opt.label}
              </SelectItem>
            ))}
          </SelectContent>
        </Select>
      </div>

      {/* Access Tier */}
      <div className="space-y-2">
        <label className="text-sm font-medium text-stone-300">Access</label>
        <Select value={filters.accessTier} onValueChange={(v) => updateFilter('accessTier', v)}>
          <SelectTrigger className="bg-stone-800/50 border-stone-700 text-white">
            <SelectValue placeholder="All Tiers" />
          </SelectTrigger>
          <SelectContent className="bg-stone-800 border-stone-700">
            {tierOptions.map((opt) => (
              <SelectItem key={opt.value} value={opt.value}>
                {opt.label}
              </SelectItem>
            ))}
          </SelectContent>
        </Select>
      </div>

      {activeFiltersCount > 0 && (
        <Button
          variant="outline"
          onClick={clearFilters}
          className="w-full border-stone-700 text-stone-300 hover:bg-stone-800"
        >
          <X className="w-4 h-4 mr-2" />
          Clear All Filters
        </Button>
      )}
    </div>
  );

  return (
    <div className="space-y-4">
      {/* Search Bar */}
      <div className="relative">
        <Search className="absolute left-4 top-1/2 -translate-y-1/2 w-5 h-5 text-stone-500" />
        <Input
          placeholder="Search tracks, themes, intentions..."
          value={filters.search}
          onChange={(e) => updateFilter('search', e.target.value)}
          className={cn(
            "pl-12 pr-4 py-6 text-base",
            "bg-stone-900/50 border-stone-800 text-white placeholder:text-stone-500",
            "focus:border-amber-600/50 focus:ring-amber-600/20",
            "rounded-xl"
          )}
        />
        {filters.search && (
          <button
            onClick={() => updateFilter('search', '')}
            className="absolute right-4 top-1/2 -translate-y-1/2 text-stone-500 hover:text-white"
          >
            <X className="w-5 h-5" />
          </button>
        )}
      </div>

      {/* Filter Button - Mobile */}
      <div className="flex items-center gap-3">
        <Sheet>
          <SheetTrigger asChild>
            <Button
              variant="outline"
              className={cn(
                "flex-1 md:flex-none border-stone-700 text-stone-300 hover:bg-stone-800",
                activeFiltersCount > 0 && "border-amber-600/50 text-amber-400"
              )}
            >
              <SlidersHorizontal className="w-4 h-4 mr-2" />
              Filters
              {activeFiltersCount > 0 && (
                <Badge className="ml-2 bg-amber-600 text-white text-xs">
                  {activeFiltersCount}
                </Badge>
              )}
            </Button>
          </SheetTrigger>
          <SheetContent side="right" className="bg-stone-900 border-stone-800 w-80">
            <SheetHeader>
              <SheetTitle className="text-white">Filter Tracks</SheetTitle>
            </SheetHeader>
            <div className="mt-6">
              <FilterContent />
            </div>
          </SheetContent>
        </Sheet>

        {/* Quick Filter Badges */}
        <div className="hidden md:flex items-center gap-2 flex-wrap">
          {filters.nervousSystem !== 'all' && (
            <Badge
              variant="outline"
              className="bg-stone-800 border-stone-700 text-stone-300 capitalize cursor-pointer hover:bg-stone-700"
              onClick={() => updateFilter('nervousSystem', 'all')}
            >
              {filters.nervousSystem}
              <X className="w-3 h-3 ml-1" />
            </Badge>
          )}
          {filters.theme !== 'all' && (
            <Badge
              variant="outline"
              className="bg-stone-800 border-stone-700 text-stone-300 capitalize cursor-pointer hover:bg-stone-700"
              onClick={() => updateFilter('theme', 'all')}
            >
              {filters.theme}
              <X className="w-3 h-3 ml-1" />
            </Badge>
          )}
        </div>
      </div>
    </div>
  );
}
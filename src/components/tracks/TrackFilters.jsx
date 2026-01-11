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
}) {
  const updateFilter = (key, value) => {
    onFilterChange({ ...filters, [key]: value });
  };

  const clearFilters = () => {
    onFilterChange({
      search: '',
      theme: 'all',
      intention: '',
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
        <label className="text-sm font-medium" style={{ color: 'hsl(var(--text-body))' }}>Theme</label>
        <Select value={filters.theme} onValueChange={(v) => updateFilter('theme', v)}>
          <SelectTrigger style={{ backgroundColor: 'hsl(var(--input))', borderColor: 'hsl(var(--border))', color: 'hsl(var(--foreground))' }}>
            <SelectValue placeholder="All Themes" />
          </SelectTrigger>
          <SelectContent style={{ backgroundColor: 'hsl(var(--surface))', borderColor: 'hsl(var(--border))' }}>
            <SelectItem value="all">All Themes</SelectItem>
            {themes.map((theme) => (
              <SelectItem key={theme} value={theme} className="capitalize">
                {theme}
              </SelectItem>
            ))}
          </SelectContent>
        </Select>
      </div>

      {/* Intention */}
      <div className="space-y-2">
        <label className="text-sm font-medium" style={{ color: 'hsl(var(--text-body))' }}>Intention</label>
        <Input
          value={filters.intention}
          onChange={(e) => updateFilter('intention', e.target.value)}
          placeholder="e.g., relaxation, focus"
          style={{ backgroundColor: 'hsl(var(--input))', borderColor: 'hsl(var(--border))', color: 'hsl(var(--foreground))' }}
        />
      </div>

      {/* Nervous System State */}
      <div className="space-y-2">
        <label className="text-sm font-medium" style={{ color: 'hsl(var(--text-body))' }}>Nervous System</label>
        <Select value={filters.nervousSystem} onValueChange={(v) => updateFilter('nervousSystem', v)}>
          <SelectTrigger style={{ backgroundColor: 'hsl(var(--input))', borderColor: 'hsl(var(--border))', color: 'hsl(var(--foreground))' }}>
            <SelectValue placeholder="All States" />
          </SelectTrigger>
          <SelectContent style={{ backgroundColor: 'hsl(var(--surface))', borderColor: 'hsl(var(--border))' }}>
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
        <label className="text-sm font-medium" style={{ color: 'hsl(var(--text-body))' }}>Chakra</label>
        <Select value={filters.chakra} onValueChange={(v) => updateFilter('chakra', v)}>
          <SelectTrigger style={{ backgroundColor: 'hsl(var(--input))', borderColor: 'hsl(var(--border))', color: 'hsl(var(--foreground))' }}>
            <SelectValue placeholder="All Chakras" />
          </SelectTrigger>
          <SelectContent style={{ backgroundColor: 'hsl(var(--surface))', borderColor: 'hsl(var(--border))' }}>
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
        <label className="text-sm font-medium" style={{ color: 'hsl(var(--text-body))' }}>Level</label>
        <Select value={filters.difficulty} onValueChange={(v) => updateFilter('difficulty', v)}>
          <SelectTrigger style={{ backgroundColor: 'hsl(var(--input))', borderColor: 'hsl(var(--border))', color: 'hsl(var(--foreground))' }}>
            <SelectValue placeholder="All Levels" />
          </SelectTrigger>
          <SelectContent style={{ backgroundColor: 'hsl(var(--surface))', borderColor: 'hsl(var(--border))' }}>
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
        <label className="text-sm font-medium" style={{ color: 'hsl(var(--text-body))' }}>Guidance</label>
        <Select value={filters.voicePresent} onValueChange={(v) => updateFilter('voicePresent', v)}>
          <SelectTrigger style={{ backgroundColor: 'hsl(var(--input))', borderColor: 'hsl(var(--border))', color: 'hsl(var(--foreground))' }}>
            <SelectValue placeholder="All Tracks" />
          </SelectTrigger>
          <SelectContent style={{ backgroundColor: 'hsl(var(--surface))', borderColor: 'hsl(var(--border))' }}>
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
        <label className="text-sm font-medium" style={{ color: 'hsl(var(--text-body))' }}>Access</label>
        <Select value={filters.accessTier} onValueChange={(v) => updateFilter('accessTier', v)}>
          <SelectTrigger style={{ backgroundColor: 'hsl(var(--input))', borderColor: 'hsl(var(--border))', color: 'hsl(var(--foreground))' }}>
            <SelectValue placeholder="All Tiers" />
          </SelectTrigger>
          <SelectContent style={{ backgroundColor: 'hsl(var(--surface))', borderColor: 'hsl(var(--border))' }}>
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
          className="w-full"
          style={{ borderColor: 'hsl(var(--border))', color: 'hsl(var(--foreground))' }}
        >
          <X className="w-4 h-4 mr-2" />
          Clear All Filters
        </Button>
      )}
    </div>
  );

  return (
    <div className="w-full">
      {/* Search Bar */}
      <div className="relative mb-4">
        <Search className="absolute left-4 top-1/2 -translate-y-1/2 w-5 h-5" style={{ color: 'hsl(var(--text-subtle))' }} />
        <Input
          placeholder="Search by title, description, tags, themes..."
          value={filters.search}
          onChange={(e) => updateFilter('search', e.target.value)}
          className="pl-12 pr-4 py-6 text-base w-full rounded-xl"
          style={{ backgroundColor: 'hsl(var(--surface))', borderColor: 'hsl(var(--border))', color: 'hsl(var(--foreground))' }}
        />
        {filters.search && (
          <button
            onClick={() => updateFilter('search', '')}
            className="absolute right-4 top-1/2 -translate-y-1/2"
            style={{ color: 'hsl(var(--text-muted))' }}
          >
            <X className="w-5 h-5" />
          </button>
        )}
      </div>

      {/* Filter Button */}
      <div className="flex items-center gap-3">
        <Sheet>
          <SheetTrigger asChild>
            <Button
              variant="outline"
              style={activeFiltersCount > 0 ? 
                { borderColor: 'hsl(var(--accent))', color: 'hsl(var(--accent))' } : 
                { borderColor: 'hsl(var(--border))', color: 'hsl(var(--foreground))' }}
            >
              <SlidersHorizontal className="w-4 h-4 mr-2" />
              <span className="hidden sm:inline">Filters</span>
              {activeFiltersCount > 0 && (
                <Badge className="ml-2 text-xs" style={{ backgroundColor: 'hsl(var(--accent))', color: 'white' }}>
                  {activeFiltersCount}
                </Badge>
              )}
            </Button>
          </SheetTrigger>
          <SheetContent side="bottom" className="h-[85vh] sm:h-auto sm:side-right sm:w-96" style={{ backgroundColor: 'hsl(var(--surface))', borderColor: 'hsl(var(--border))' }}>
            <SheetHeader>
              <SheetTitle style={{ color: 'hsl(var(--foreground))' }}>Filter Tracks</SheetTitle>
            </SheetHeader>
            <div className="mt-6 overflow-y-auto max-h-[calc(85vh-80px)] sm:max-h-[calc(100vh-120px)]">
              <FilterContent />
            </div>
          </SheetContent>
        </Sheet>

        {/* Active Filter Badges */}
        {activeFiltersCount > 0 && (
          <div className="flex items-center gap-2 flex-wrap">
            {filters.nervousSystem !== 'all' && (
              <Badge
                variant="outline"
                className="capitalize cursor-pointer"
                style={{ backgroundColor: 'hsl(var(--muted))', borderColor: 'hsl(var(--border))', color: 'hsl(var(--foreground))' }}
                onClick={() => updateFilter('nervousSystem', 'all')}
              >
                {filters.nervousSystem}
                <X className="w-3 h-3 ml-1" />
              </Badge>
            )}
            {filters.theme !== 'all' && (
              <Badge
                variant="outline"
                className="capitalize cursor-pointer"
                style={{ backgroundColor: 'hsl(var(--muted))', borderColor: 'hsl(var(--border))', color: 'hsl(var(--foreground))' }}
                onClick={() => updateFilter('theme', 'all')}
              >
                {filters.theme}
                <X className="w-3 h-3 ml-1" />
              </Badge>
            )}
            {filters.chakra !== 'all' && (
              <Badge
                variant="outline"
                className="capitalize cursor-pointer"
                style={{ backgroundColor: 'hsl(var(--muted))', borderColor: 'hsl(var(--border))', color: 'hsl(var(--foreground))' }}
                onClick={() => updateFilter('chakra', 'all')}
              >
                {filters.chakra.replace('_', ' ')}
                <X className="w-3 h-3 ml-1" />
              </Badge>
            )}
          </div>
        )}
      </div>
    </div>
  );
}
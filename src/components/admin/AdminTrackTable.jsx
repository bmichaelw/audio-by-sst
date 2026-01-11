import React, { useState, useMemo } from 'react';
import { base44 } from '@/api/base44Client';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Badge } from '@/components/ui/badge';
import { Checkbox } from '@/components/ui/checkbox';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from '@/components/ui/table';
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu';
import { Edit, Trash2, MoreVertical, Star, Music, Search, Archive, ArchiveRestore } from 'lucide-react';
import { cn } from '@/lib/utils';
import { toast } from 'sonner';

function formatDuration(seconds) {
  const mins = Math.floor(seconds / 60);
  const secs = seconds % 60;
  return `${mins}:${secs.toString().padStart(2, '0')}`;
}

const tierColors = {
  free: 'bg-stone-600',
  member: 'bg-blue-600',
  resonance_path: 'bg-amber-600',
  collaborations: 'bg-purple-600',
};

async function logAuditAction(action, targetType, targetId, details = {}) {
  try {
    const user = await base44.auth.me();
    await base44.entities.AuditLog.create({
      admin_email: user.email,
      action,
      target_type: targetType,
      target_id: targetId,
      details,
    });
  } catch (error) {
    console.error('Failed to log audit action:', error);
  }
}

export default function AdminTrackTable({ tracks, onEdit, onDelete, onRefresh }) {
  const [searchQuery, setSearchQuery] = useState('');
  const [filterTier, setFilterTier] = useState('all');
  const [filterArchived, setFilterArchived] = useState('active');
  const [selectedTracks, setSelectedTracks] = useState([]);
  const [isBulkUpdating, setIsBulkUpdating] = useState(false);

  // Filter tracks
  const filteredTracks = useMemo(() => {
    return tracks.filter((track) => {
      // Search filter
      if (searchQuery) {
        const query = searchQuery.toLowerCase();
        const matchesSearch =
          track.title?.toLowerCase().includes(query) ||
          track.description?.toLowerCase().includes(query) ||
          track.themes?.some((t) => t.toLowerCase().includes(query));
        if (!matchesSearch) return false;
      }

      // Tier filter
      if (filterTier !== 'all' && track.access_tier !== filterTier) {
        return false;
      }

      // Archived filter
      if (filterArchived === 'active' && track.is_archived) return false;
      if (filterArchived === 'archived' && !track.is_archived) return false;

      return true;
    });
  }, [tracks, searchQuery, filterTier, filterArchived]);

  const toggleSelectAll = () => {
    if (selectedTracks.length === filteredTracks.length) {
      setSelectedTracks([]);
    } else {
      setSelectedTracks(filteredTracks.map((t) => t.id));
    }
  };

  const toggleSelectTrack = (trackId) => {
    setSelectedTracks((prev) =>
      prev.includes(trackId) ? prev.filter((id) => id !== trackId) : [...prev, trackId]
    );
  };

  const handleBulkAction = async (action, value) => {
    if (selectedTracks.length === 0) {
      toast.error('No tracks selected');
      return;
    }

    setIsBulkUpdating(true);
    try {
      const updates = {};
      if (action === 'featured') updates.is_featured = value;
      if (action === 'tier') updates.access_tier = value;
      if (action === 'archive') updates.is_archived = true;
      if (action === 'unarchive') updates.is_archived = false;

      // Update all selected tracks
      await Promise.all(
        selectedTracks.map((trackId) => base44.entities.Track.update(trackId, updates))
      );

      // Log audit action
      await logAuditAction(
        `bulk_${action}`,
        'Track',
        selectedTracks.join(','),
        { count: selectedTracks.length, updates }
      );

      toast.success(`Updated ${selectedTracks.length} tracks`);
      setSelectedTracks([]);
      onRefresh();
    } catch (error) {
      toast.error('Bulk update failed');
    } finally {
      setIsBulkUpdating(false);
    }
  };

  const handleToggleFeatured = async (track) => {
    try {
      await base44.entities.Track.update(track.id, { is_featured: !track.is_featured });
      await logAuditAction('toggle_featured', 'Track', track.id, { is_featured: !track.is_featured });
      toast.success(track.is_featured ? 'Removed from featured' : 'Added to featured');
      onRefresh();
    } catch {
      toast.error('Failed to update track');
    }
  };

  const handleToggleArchive = async (track) => {
    try {
      await base44.entities.Track.update(track.id, { is_archived: !track.is_archived });
      await logAuditAction('toggle_archive', 'Track', track.id, { is_archived: !track.is_archived });
      toast.success(track.is_archived ? 'Track unarchived' : 'Track archived');
      onRefresh();
    } catch {
      toast.error('Failed to update track');
    }
  };

  if (tracks.length === 0) {
    return (
      <div className="text-center py-12 rounded-xl border" style={{ backgroundColor: 'hsl(var(--card))', borderColor: 'hsl(var(--border))' }}>
        <Music className="w-16 h-16 mx-auto mb-4" style={{ color: 'hsl(var(--text-subtle))' }} />
        <p style={{ color: 'hsl(var(--text-muted))' }}>No tracks yet. Upload your first track to get started.</p>
      </div>
    );
  }

  return (
    <div className="space-y-4">
      {/* Search and Filters */}
      <div className="flex flex-col md:flex-row gap-4">
        <div className="relative flex-1">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4" style={{ color: 'hsl(var(--text-subtle))' }} />
          <Input
            placeholder="Search tracks..."
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            className="pl-10"
            style={{ backgroundColor: 'hsl(var(--input))', borderColor: 'hsl(var(--border))', color: 'hsl(var(--foreground))' }}
          />
        </div>
        <Select value={filterTier} onValueChange={setFilterTier}>
          <SelectTrigger className="w-full md:w-[180px]" style={{ backgroundColor: 'hsl(var(--input))', borderColor: 'hsl(var(--border))', color: 'hsl(var(--foreground))' }}>
            <SelectValue placeholder="All Tiers" />
          </SelectTrigger>
          <SelectContent style={{ backgroundColor: 'hsl(var(--surface))', borderColor: 'hsl(var(--border))' }}>
            <SelectItem value="all">All Tiers</SelectItem>
            <SelectItem value="free">Free</SelectItem>
            <SelectItem value="member">Member</SelectItem>
            <SelectItem value="resonance_path">ResonancePath</SelectItem>
            <SelectItem value="collaborations">Collaborations</SelectItem>
          </SelectContent>
        </Select>
        <Select value={filterArchived} onValueChange={setFilterArchived}>
          <SelectTrigger className="w-full md:w-[180px]" style={{ backgroundColor: 'hsl(var(--input))', borderColor: 'hsl(var(--border))', color: 'hsl(var(--foreground))' }}>
            <SelectValue placeholder="Status" />
          </SelectTrigger>
          <SelectContent style={{ backgroundColor: 'hsl(var(--surface))', borderColor: 'hsl(var(--border))' }}>
            <SelectItem value="all">All Tracks</SelectItem>
            <SelectItem value="active">Active Only</SelectItem>
            <SelectItem value="archived">Archived Only</SelectItem>
          </SelectContent>
        </Select>
      </div>

      {/* Bulk Actions */}
      {selectedTracks.length > 0 && (
        <div className="flex items-center gap-2 p-3 border rounded-lg" style={{ backgroundColor: 'hsl(var(--accent) / 0.1)', borderColor: 'hsl(var(--accent) / 0.3)' }}>
          <span className="text-sm" style={{ color: 'hsl(var(--accent))' }}>
            {selectedTracks.length} track{selectedTracks.length > 1 ? 's' : ''} selected
          </span>
          <div className="flex-1" />
          <DropdownMenu>
            <DropdownMenuTrigger asChild>
              <Button
                size="sm"
                disabled={isBulkUpdating}
                style={{ backgroundColor: 'hsl(var(--primary))', color: 'hsl(var(--primary-foreground))' }}
              >
                Bulk Actions
              </Button>
            </DropdownMenuTrigger>
            <DropdownMenuContent style={{ backgroundColor: 'hsl(var(--surface))', borderColor: 'hsl(var(--border))' }}>
              <DropdownMenuItem onClick={() => handleBulkAction('featured', true)}>
                Set as Featured
              </DropdownMenuItem>
              <DropdownMenuItem onClick={() => handleBulkAction('featured', false)}>
                Remove from Featured
              </DropdownMenuItem>
              <DropdownMenuSeparator style={{ backgroundColor: 'hsl(var(--border))' }} />
              <DropdownMenuItem onClick={() => handleBulkAction('tier', 'free')}>
                Set Tier: Free
              </DropdownMenuItem>
              <DropdownMenuItem onClick={() => handleBulkAction('tier', 'member')}>
                Set Tier: Member
              </DropdownMenuItem>
              <DropdownMenuItem onClick={() => handleBulkAction('tier', 'resonance_path')}>
                Set Tier: ResonancePath
              </DropdownMenuItem>
              <DropdownMenuSeparator style={{ backgroundColor: 'hsl(var(--border))' }} />
              <DropdownMenuItem onClick={() => handleBulkAction('archive')}>
                Archive Tracks
              </DropdownMenuItem>
              <DropdownMenuItem onClick={() => handleBulkAction('unarchive')}>
                Unarchive Tracks
              </DropdownMenuItem>
            </DropdownMenuContent>
          </DropdownMenu>
          <Button
            size="sm"
            variant="ghost"
            onClick={() => setSelectedTracks([])}
            style={{ color: 'hsl(var(--text-muted))' }}
          >
            Clear
          </Button>
        </div>
      )}

      {/* Table */}
      <div className="rounded-xl border overflow-hidden" style={{ borderColor: 'hsl(var(--border))', backgroundColor: 'hsl(var(--card))' }}>
        <Table>
          <TableHeader>
            <TableRow className="hover:bg-transparent" style={{ borderColor: 'hsl(var(--divider))' }}>
              <TableHead className="w-12">
                <Checkbox
                  checked={selectedTracks.length === filteredTracks.length && filteredTracks.length > 0}
                  onCheckedChange={toggleSelectAll}
                />
              </TableHead>
              <TableHead style={{ color: 'hsl(var(--text-muted))' }}>Track</TableHead>
              <TableHead style={{ color: 'hsl(var(--text-muted))' }}>Duration</TableHead>
              <TableHead style={{ color: 'hsl(var(--text-muted))' }}>Tier</TableHead>
              <TableHead style={{ color: 'hsl(var(--text-muted))' }}>Status</TableHead>
              <TableHead style={{ color: 'hsl(var(--text-muted))' }}>Plays</TableHead>
              <TableHead className="text-right" style={{ color: 'hsl(var(--text-muted))' }}>Actions</TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {filteredTracks.map((track) => (
              <TableRow key={track.id} className="hover:bg-purple-50/30" style={{ borderColor: 'hsl(var(--divider))' }}>
                <TableCell>
                  <Checkbox
                    checked={selectedTracks.includes(track.id)}
                    onCheckedChange={() => toggleSelectTrack(track.id)}
                  />
                </TableCell>
                <TableCell>
                  <div className="flex items-center gap-3">
                    {track.cover_image_url ? (
                      <img
                        src={track.cover_image_url}
                        alt={track.title}
                        className="w-10 h-10 rounded-lg object-cover"
                      />
                    ) : (
                      <div className="w-10 h-10 rounded-lg flex items-center justify-center" style={{ backgroundColor: 'hsl(var(--muted))' }}>
                        <Music className="w-5 h-5" style={{ color: 'hsl(var(--text-subtle))' }} />
                      </div>
                    )}
                    <div>
                      <div className="flex items-center gap-2">
                        <span className="font-medium" style={{ color: 'hsl(var(--foreground))' }}>{track.title}</span>
                        {track.is_featured && <Star className="w-4 h-4 fill-current" style={{ color: 'hsl(var(--accent))' }} />}
                        {track.is_archived && <Archive className="w-4 h-4" style={{ color: 'hsl(var(--text-subtle))' }} />}
                      </div>
                      {track.themes && track.themes.length > 0 && (
                        <span className="text-sm" style={{ color: 'hsl(var(--text-muted))' }}>{track.themes.slice(0, 2).join(', ')}</span>
                      )}
                    </div>
                  </div>
                </TableCell>
                <TableCell className="font-mono text-sm" style={{ color: 'hsl(var(--text-body))' }}>
                  {formatDuration(track.duration_seconds)}
                </TableCell>
                <TableCell>
                  <Badge className={cn(tierColors[track.access_tier], 'text-white border-0 capitalize')}>
                    {track.access_tier.replace('_', ' ')}
                  </Badge>
                </TableCell>
                <TableCell>
                  <Badge variant="outline" className={track.is_archived ? '' : 'text-green-600'} style={{ color: track.is_archived ? 'hsl(var(--text-subtle))' : undefined }}>
                    {track.is_archived ? 'Archived' : 'Active'}
                  </Badge>
                </TableCell>
                <TableCell style={{ color: 'hsl(var(--text-muted))' }}>{track.play_count || 0}</TableCell>
                <TableCell className="text-right">
                  <DropdownMenu>
                    <DropdownMenuTrigger asChild>
                      <Button variant="ghost" size="icon" style={{ color: 'hsl(var(--text-muted))' }}>
                        <MoreVertical className="w-4 h-4" />
                      </Button>
                    </DropdownMenuTrigger>
                    <DropdownMenuContent align="end" style={{ backgroundColor: 'hsl(var(--surface))', borderColor: 'hsl(var(--border))' }}>
                      <DropdownMenuItem
                        onClick={() => onEdit(track)}
                        style={{ color: 'hsl(var(--foreground))' }}
                      >
                        <Edit className="w-4 h-4 mr-2" />
                        Edit
                      </DropdownMenuItem>
                      <DropdownMenuItem
                        onClick={() => handleToggleFeatured(track)}
                        style={{ color: 'hsl(var(--foreground))' }}
                      >
                        <Star className="w-4 h-4 mr-2" />
                        {track.is_featured ? 'Unfeature' : 'Feature'}
                      </DropdownMenuItem>
                      <DropdownMenuItem
                        onClick={() => handleToggleArchive(track)}
                        style={{ color: 'hsl(var(--foreground))' }}
                      >
                        {track.is_archived ? (
                          <><ArchiveRestore className="w-4 h-4 mr-2" />Unarchive</>
                        ) : (
                          <><Archive className="w-4 h-4 mr-2" />Archive</>
                        )}
                      </DropdownMenuItem>
                      <DropdownMenuSeparator style={{ backgroundColor: 'hsl(var(--border))' }} />
                      <DropdownMenuItem
                        onClick={() => onDelete(track.id)}
                        className="text-red-400 focus:text-red-300 focus:bg-stone-700"
                      >
                        <Trash2 className="w-4 h-4 mr-2" />
                        Delete
                      </DropdownMenuItem>
                    </DropdownMenuContent>
                  </DropdownMenu>
                </TableCell>
              </TableRow>
            ))}
          </TableBody>
        </Table>
      </div>

      <div className="text-sm" style={{ color: 'hsl(var(--text-muted))' }}>
        Showing {filteredTracks.length} of {tracks.length} tracks
      </div>
    </div>
  );
}
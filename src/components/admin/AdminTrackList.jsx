import React from 'react';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
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
  DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu';
import { Edit, Trash2, MoreVertical, Star, Music } from 'lucide-react';
import { cn } from '@/lib/utils';

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

export default function AdminTrackList({ tracks, onEdit, onDelete }) {
  if (tracks.length === 0) {
    return (
      <div className="text-center py-12">
        <div className="w-16 h-16 rounded-full bg-stone-800 flex items-center justify-center mx-auto mb-4">
          <Music className="w-8 h-8 text-stone-600" />
        </div>
        <p className="text-stone-400">No tracks yet. Upload your first track to get started.</p>
      </div>
    );
  }

  return (
    <div className="rounded-xl border border-stone-800 overflow-hidden">
      <Table>
        <TableHeader>
          <TableRow className="border-stone-800 hover:bg-transparent">
            <TableHead className="text-stone-400">Track</TableHead>
            <TableHead className="text-stone-400">Duration</TableHead>
            <TableHead className="text-stone-400">Tier</TableHead>
            <TableHead className="text-stone-400">Plays</TableHead>
            <TableHead className="text-stone-400 text-right">Actions</TableHead>
          </TableRow>
        </TableHeader>
        <TableBody>
          {tracks.map((track) => (
            <TableRow key={track.id} className="border-stone-800 hover:bg-stone-800/30">
              <TableCell>
                <div className="flex items-center gap-3">
                  {track.cover_image_url ? (
                    <img
                      src={track.cover_image_url}
                      alt={track.title}
                      className="w-10 h-10 rounded-lg object-cover"
                    />
                  ) : (
                    <div className="w-10 h-10 rounded-lg bg-stone-800 flex items-center justify-center">
                      <Music className="w-5 h-5 text-stone-600" />
                    </div>
                  )}
                  <div>
                    <div className="flex items-center gap-2">
                      <span className="text-white font-medium">{track.title}</span>
                      {track.is_featured && (
                        <Star className="w-4 h-4 text-amber-500 fill-amber-500" />
                      )}
                    </div>
                    {track.themes && track.themes.length > 0 && (
                      <span className="text-stone-500 text-sm">
                        {track.themes.slice(0, 2).join(', ')}
                      </span>
                    )}
                  </div>
                </div>
              </TableCell>
              <TableCell className="text-stone-300 font-mono text-sm">
                {formatDuration(track.duration_seconds)}
              </TableCell>
              <TableCell>
                <Badge className={cn(tierColors[track.access_tier], 'text-white border-0 capitalize')}>
                  {track.access_tier.replace('_', ' ')}
                </Badge>
              </TableCell>
              <TableCell className="text-stone-400">
                {track.play_count || 0}
              </TableCell>
              <TableCell className="text-right">
                <DropdownMenu>
                  <DropdownMenuTrigger asChild>
                    <Button variant="ghost" size="icon" className="text-stone-400 hover:text-white">
                      <MoreVertical className="w-4 h-4" />
                    </Button>
                  </DropdownMenuTrigger>
                  <DropdownMenuContent align="end" className="bg-stone-800 border-stone-700">
                    <DropdownMenuItem
                      onClick={() => onEdit(track)}
                      className="text-stone-300 focus:text-white focus:bg-stone-700"
                    >
                      <Edit className="w-4 h-4 mr-2" />
                      Edit
                    </DropdownMenuItem>
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
  );
}
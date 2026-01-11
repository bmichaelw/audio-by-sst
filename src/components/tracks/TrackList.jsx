import React from 'react';
import TrackCard from './TrackCard';
import { Loader2, Music } from 'lucide-react';
import { motion, AnimatePresence } from 'framer-motion';

export default function TrackList({
  tracks,
  isLoading,
  userTier,
  onUpgradeClick,
  emptyMessage = "No tracks found matching your filters.",
}) {
  if (isLoading) {
    return (
      <div className="flex flex-col items-center justify-center py-20">
        <Loader2 className="w-8 h-8 text-amber-600 animate-spin mb-4" />
        <p className="text-stone-400 text-sm">Loading your sound library...</p>
      </div>
    );
  }

  if (tracks.length === 0) {
    return (
      <motion.div
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        className="flex flex-col items-center justify-center py-20 text-center"
      >
        <div className="w-20 h-20 rounded-full bg-stone-800/50 flex items-center justify-center mb-6">
          <Music className="w-10 h-10 text-stone-600" />
        </div>
        <p className="text-stone-400 text-lg mb-2">{emptyMessage}</p>
        <p className="text-stone-500 text-sm">Try adjusting your filters</p>
      </motion.div>
    );
  }

  return (
    <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-4 md:gap-6">
      <AnimatePresence mode="popLayout">
        {tracks.map((track, index) => (
          <motion.div
            key={track.id}
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, scale: 0.95 }}
            transition={{ delay: index * 0.05, duration: 0.3 }}
          >
            <TrackCard
              track={track}
              userTier={userTier}
              onUpgradeClick={onUpgradeClick}
            />
          </motion.div>
        ))}
      </AnimatePresence>
    </div>
  );
}
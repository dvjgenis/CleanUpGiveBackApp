'use client';

import { useState } from 'react';
import Image from 'next/image';
import { motion, AnimatePresence } from 'framer-motion';
import { formatDate } from '@/lib/format';
import type { Checkpoint } from '@/types/database';

interface SignedCheckpoint extends Checkpoint {
  selfieSignedUrl: string | null;
  progressSignedUrl: string | null;
}

export function PhotoGrid({ checkpoints }: { checkpoints: SignedCheckpoint[] }) {
  const [lightbox, setLightbox] = useState<string | null>(null);

  const allPhotos = checkpoints.flatMap((cp) => [
    cp.selfieSignedUrl ? { url: cp.selfieSignedUrl, label: 'Selfie', time: cp.captured_at } : null,
    cp.progressSignedUrl ? { url: cp.progressSignedUrl, label: 'Progress', time: cp.captured_at } : null,
  ]).filter(Boolean) as { url: string; label: string; time: string | null }[];

  return (
    <>
      <div className="grid grid-cols-2 sm:grid-cols-3 gap-sm">
        {allPhotos.map((photo, i) => (
          <button
            key={i}
            onClick={() => setLightbox(photo.url)}
            className="group relative aspect-square rounded-sm overflow-hidden border border-border-outline hover:border-primary transition-colors"
          >
            <Image
              src={photo.url}
              alt={photo.label}
              fill
              className="object-cover group-hover:opacity-90 transition-opacity"
              sizes="(max-width: 640px) 50vw, (max-width: 768px) 33vw, 200px"
            />
            <div className="absolute bottom-0 left-0 right-0 bg-gradient-to-t from-black/60 to-transparent px-xs py-1">
              <p className="font-data text-[10px] text-white">{photo.label}</p>
              {photo.time && (
                <p className="font-data text-[9px] text-white/70">{formatDate(photo.time, 'HH:mm')}</p>
              )}
            </div>
          </button>
        ))}
      </div>

      {/* Lightbox */}
      <AnimatePresence>
        {lightbox && (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            transition={{ duration: 0.2 }}
            className="fixed inset-0 z-50 flex items-center justify-center bg-[var(--color-overlay-scrim)]"
            onClick={() => setLightbox(null)}
          >
            <motion.div
              initial={{ scale: 0.92, opacity: 0 }}
              animate={{ scale: 1, opacity: 1 }}
              exit={{ scale: 0.92, opacity: 0 }}
              transition={{ duration: 0.25, ease: [0.23, 1, 0.32, 1] }}
              className="relative max-w-2xl max-h-[80vh] w-full mx-lg"
              onClick={(e) => e.stopPropagation()}
            >
              <Image
                src={lightbox}
                alt="Photo"
                width={800}
                height={800}
                className="rounded-md object-contain w-full h-full"
              />
              <button
                onClick={() => setLightbox(null)}
                className="absolute top-md right-md w-8 h-8 rounded-full bg-black/50 text-white flex items-center justify-center hover:bg-black/70 transition-colors"
                aria-label="Close lightbox"
              >
                ✕
              </button>
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>
    </>
  );
}

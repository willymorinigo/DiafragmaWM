import React, { useState } from 'react';
import { Bookmark, Trash2, Heart, Award, Link, FolderPlus, Eye } from 'lucide-react';
import { motion, AnimatePresence } from 'motion/react';
import { Photo, Collection, Translations } from '../types';

interface PhotoCardProps {
  key?: string;
  photo: Photo;
  isAdmin: boolean;
  collections: Collection[];
  onToggleCurated: (id: string, currentVal: boolean) => void;
  onDeletePhoto: (id: string) => void;
  onAssignToCollection: (photoId: string, collectionId: string) => void;
  t: Translations;
}

export default function PhotoCard({
  photo,
  isAdmin,
  collections,
  onToggleCurated,
  onDeletePhoto,
  onAssignToCollection,
  t
}: PhotoCardProps) {
  const [isHovered, setIsHovered] = useState(false);
  const [showAssignor, setShowAssignor] = useState(false);
  const [loading, setLoading] = useState(true);

  const formattedDate = new Date(photo.timestamp || photo.createdAt).toLocaleDateString(undefined, {
    year: 'numeric',
    month: 'short',
    day: 'numeric'
  });

  return (
    <motion.div
      layout
      initial={{ opacity: 0, scale: 0.98 }}
      animate={{ opacity: 1, scale: 1 }}
      exit={{ opacity: 0, scale: 0.98 }}
      transition={{ duration: 0.4 }}
      className="relative aspect-[3/4] bg-neutral-100 dark:bg-[#080808] overflow-hidden group border border-neutral-200 dark:border-white/10 rounded-sm"
      onMouseEnter={() => setIsHovered(true)}
      onMouseLeave={() => {
        setIsHovered(false);
        setShowAssignor(false);
      }}
      id={`photo-card-${photo.id}`}
    >
      {/* Real Image */}
      <img
        src={photo.url}
        alt={photo.title}
        referrerPolicy="no-referrer"
        onLoad={() => setLoading(false)}
        className={`w-full h-full object-cover transition-transform duration-[1.2s] ease-out ${
          loading ? 'blur-lg scale-105' : 'blur-0 scale-100'
        } ${isHovered ? 'scale-[1.03]' : 'scale-100'}`}
      />

      {/* Badges */}
      <div className="absolute top-4 left-4 flex flex-col gap-1.5 z-10" id={`badges-${photo.id}`}>
        {/* Curated/Featured Badge */}
        {photo.isCurated && (
          <div className="flex items-center gap-1.5 bg-black/90 text-white dark:bg-[#050505] dark:text-zinc-100 py-1 px-2.5 text-[8px] font-mono uppercase tracking-[0.2em] border border-neutral-200 dark:border-white/10">
            <Award className="w-3 h-3 text-amber-400 fill-amber-400" />
            <span>{t.featured}</span>
          </div>
        )}

        {/* Category Badge */}
        <div className="bg-white/90 text-black dark:bg-[#050505] dark:text-zinc-300 py-1 px-2.5 text-[8px] font-mono uppercase tracking-[0.2em] border border-neutral-200 dark:border-white/10">
          {photo.category}
        </div>
      </div>

      {/* Info Hover Overlay */}
      <div 
        className={`absolute inset-0 bg-gradient-to-t from-black/95 via-black/50 to-transparent flex flex-col justify-end p-6 transition-all duration-300 ${
          isHovered ? 'opacity-100' : 'opacity-0 translate-y-1'
        }`}
        id={`overlay-${photo.id}`}
      >
        <div className="text-white">
          <p className="text-[8px] font-mono tracking-[0.25em] text-neutral-400 uppercase">
            {formattedDate}
          </p>
          <h3 className="text-base font-light tracking-tight mt-1 leading-snug text-white">
            {photo.title}
          </h3>
          <p className="text-xs text-neutral-350 font-sans tracking-wide mt-2 line-clamp-2 leading-relaxed opacity-90">
            {photo.caption}
          </p>

          <div className="flex items-center gap-4 mt-4 pt-3 border-t border-white/10 text-[10px] font-mono" id={`actions-${photo.id}`}>
            {photo.permalink && (
              <a
                href={photo.permalink}
                target="_blank"
                rel="noreferrer"
                className="flex items-center gap-1.5 text-zinc-300 hover:text-white transition-colors uppercase tracking-wider"
                id={`link-insta-${photo.id}`}
              >
                <Link className="w-3 h-3" />
                <span>Instagram</span>
              </a>
            )}
            
            {photo.collectionId && (
              <div className="text-zinc-400 uppercase tracking-wider">
                Col: <span className="text-neutral-100 font-semibold">{collections.find(c => c.id === photo.collectionId)?.name || '...'}</span>
              </div>
            )}
          </div>
        </div>
      </div>

      {/* administrative interactions when logged in & admin */}
      {isAdmin && (
        <div 
          className="absolute bottom-4 right-4 flex items-center gap-1.5 z-20 bg-white/95 dark:bg-[#050505] p-1.5 border border-neutral-200 dark:border-white/10 backdrop-blur-md"
          id={`admin-card-bar-${photo.id}`}
        >
          {/* Highlight/Curate trigger */}
          <button
            onClick={() => onToggleCurated(photo.id, photo.isCurated)}
            id={`toggle-curated-${photo.id}`}
            title={photo.isCurated ? t.removeCurateBtn : t.curateBtn}
            className={`p-1.5 transition-colors border ${
              photo.isCurated 
                ? 'bg-amber-100/20 text-amber-550 border-amber-500/30' 
                : 'bg-transparent text-gray-500 hover:text-black dark:text-neutral-400 dark:hover:text-white border-transparent'
            }`}
          >
            <Award className="w-3.5 h-3.5" />
          </button>

          {/* Collection Organizer */}
          <div className="relative">
            <button
              onClick={() => setShowAssignor(!showAssignor)}
              id={`assign-col-btn-${photo.id}`}
              title={t.manageCollections}
              className={`p-1.5 transition-colors border ${
                photo.collectionId 
                  ? 'bg-blue-100/20 text-blue-400 border-blue-500/30' 
                  : 'bg-transparent text-gray-500 hover:text-black border-transparent'
              }`}
            >
              <FolderPlus className="w-3.5 h-3.5" />
            </button>

            {showAssignor && (
              <div className="absolute bottom-full right-0 mb-2 bg-white dark:bg-[#080808] border border-neutral-200 dark:border-white/10 shadow-xl p-2 min-w-[180px] z-50 flex flex-col gap-1">
                <p className="text-[8px] font-mono text-zinc-400 uppercase tracking-widest mb-1.5 px-1.5">
                  {t.manageCollections}
                </p>
                <button
                  onClick={() => {
                    onAssignToCollection(photo.id, "");
                    setShowAssignor(false);
                  }}
                  className={`text-left text-[10px] font-mono py-1 px-1.5 hover:bg-neutral-150 dark:hover:bg-white/5 text-red-500 uppercase tracking-wider`}
                >
                  [ {t.cancelBtn} ]
                </button>
                {collections.map((col) => (
                  <button
                    key={col.id}
                    onClick={() => {
                      onAssignToCollection(photo.id, col.id);
                      setShowAssignor(false);
                    }}
                    className={`text-left text-[10px] font-mono py-1.5 px-1.5 hover:bg-neutral-150 dark:hover:bg-white/5 uppercase tracking-wider ${
                      photo.collectionId === col.id 
                        ? 'font-bold underline text-black dark:text-white' 
                        : 'text-gray-700 dark:text-neutral-300'
                    }`}
                  >
                    {col.name}
                  </button>
                ))}
              </div>
            )}
          </div>

          {/* Delete Photo with strict confirmation dialog */}
          <button
            onClick={() => onDeletePhoto(photo.id)}
            id={`delete-photo-${photo.id}`}
            title={t.deleteBtn}
            className="p-1.5 bg-transparent text-red-500 hover:bg-red-50 hover:text-red-700 dark:hover:bg-red-950/20 border border-transparent transition-colors"
          >
            <Trash2 className="w-3.5 h-3.5" />
          </button>
        </div>
      )}
    </motion.div>
  );
}

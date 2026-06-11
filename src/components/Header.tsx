import React from 'react';
import { Camera, Sun, Moon, Languages, Shield, CheckCircle } from 'lucide-react';
import { motion } from 'motion/react';
import { LangType, Translations } from '../types';

interface HeaderProps {
  currentLang: LangType;
  setLang: (lang: LangType) => void;
  darkMode: boolean;
  setDarkMode: (dark: boolean) => void;
  isAdminMode: boolean;
  setIsAdminMode: (admin: boolean) => void;
  t: Translations;
  hasInstagram?: boolean;
  hasDrive?: boolean;
}

export default function Header({
  currentLang,
  setLang,
  darkMode,
  setDarkMode,
  isAdminMode,
  setIsAdminMode,
  t,
  hasInstagram = true,
  hasDrive = true
}: HeaderProps) {
  return (
    <header className="border-b border-neutral-200 dark:border-white/10 bg-[#fafafa] dark:bg-[#080808] transition-colors duration-300">
      <div className="max-w-7xl mx-auto px-6 py-5 flex flex-col md:flex-row justify-between items-start md:items-center gap-6">
        
        {/* Branding Title */}
        <motion.div 
          initial={{ opacity: 0, y: -10 }}
          animate={{ opacity: 1, y: 0 }}
          className="flex items-center gap-4 group"
          id="branding-title"
        >
          <div className="p-2 border border-black dark:border-white/20 rounded-none transition-colors duration-300 bg-white/5">
            <Camera className="w-5 h-5 text-black dark:text-white transition-colors duration-300" />
          </div>
          <div>
            <h1 className="text-lg font-light tracking-[0.2em] text-black dark:text-white uppercase transition-colors duration-300">
              ISO / <span className="font-bold">MIND</span>
            </h1>
            <p className="text-[9px] font-mono tracking-[0.15em] text-zinc-500 dark:text-zinc-500 mt-0.5 uppercase">
              {t.subtitle}
            </p>
          </div>
        </motion.div>

        {/* Sync status labels & Controls */}
        <div className="flex flex-wrap items-center gap-6 w-full md:w-auto justify-between md:justify-end" id="header-controls">
          
          {/* Immersive UI Sync Status Indicators */}
          <div className="hidden lg:flex items-center gap-6 font-mono text-[10px]">
            {hasInstagram && (
              <div className="flex items-center gap-2 tracking-wider text-emerald-600 dark:text-emerald-400 font-semibold" id="insta-sync-status">
                <span className="relative flex h-1.5 w-1.5">
                  <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-emerald-400 opacity-75"></span>
                  <span className="relative inline-flex rounded-full h-1.5 w-1.5 bg-emerald-400"></span>
                </span>
                <span>INSTAGRAM SYNC ACTIVE</span>
              </div>
            )}
            
            {hasDrive && (
              <div className="flex items-center gap-2 tracking-wider text-blue-600 dark:text-blue-400 font-semibold" id="drive-backup-status">
                <span className="relative flex h-1.5 w-1.5">
                  <span className="animate-pulse absolute inline-flex h-full w-full rounded-full bg-blue-400 opacity-75"></span>
                  <span className="relative inline-flex rounded-full h-1.5 w-1.5 bg-blue-500"></span>
                </span>
                <span>DRIVE BACKUP: OK</span>
              </div>
            )}
          </div>

          <div className="flex flex-wrap items-center gap-3 w-auto" id="control-buttons-row">
            {/* Admin Switcher tab */}
            <button
              id="toggle-admin-btn"
              onClick={() => setIsAdminMode(!isAdminMode)}
              className={`flex items-center gap-2 px-3 py-1.5 text-xs font-mono uppercase tracking-wider border transition-all ${
                isAdminMode 
                  ? 'bg-black text-white dark:bg-white dark:text-black border-black dark:border-white font-semibold' 
                  : 'bg-transparent text-zinc-600 dark:text-zinc-400 border-zinc-200 dark:border-white/10 hover:border-black dark:hover:border-white'
              }`}
            >
              <Shield className="w-3 h-3" />
              <span>Admin</span>
            </button>

            {/* Language select buttons */}
            <div className="flex items-center border border-zinc-200 dark:border-white/10 p-0.5 font-mono text-[10px]" id="lang-selector">
              {(['es', 'en', 'it', 'fr'] as LangType[]).map((lang) => (
                <button
                  key={lang}
                  id={`lang-btn-${lang}`}
                  onClick={() => setLang(lang)}
                  className={`px-2 py-1 uppercase tracking-wider transition-all ${
                    currentLang === lang 
                      ? 'bg-black text-white dark:bg-white dark:text-black font-semibold' 
                      : 'text-zinc-500 hover:text-black dark:hover:text-white'
                  }`}
                >
                  {lang}
                </button>
              ))}
            </div>

            {/* Theme Switcher Button */}
            <button
              id="theme-toggler"
              onClick={() => setDarkMode(!darkMode)}
              className="p-2 border border-zinc-200 dark:border-white/10 hover:border-black dark:hover:border-white text-zinc-600 dark:text-zinc-400 rounded-none transition-all"
              aria-label="Toggle Theme"
            >
              {darkMode ? (
                <Sun className="w-4 h-4 text-amber-500" />
              ) : (
                <Moon className="w-4 h-4 text-black" />
              )}
            </button>
          </div>

        </div>
      </div>
    </header>
  );
}

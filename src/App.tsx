import React, { useState, useEffect } from 'react';
import { 
  Camera, Sun, Moon, Award, Heart, MessageSquare, 
  MapPin, Eye, Filter, Calendar, Folder, ShieldCheck, HelpCircle
} from 'lucide-react';
import { motion, AnimatePresence } from 'motion/react';
import { doc, getDocFromServer, collection, onSnapshot, setDoc, query, deleteDoc } from 'firebase/firestore';

// Component imports
import Header from './components/Header';
import PhotoCard from './components/PhotoCard';
import ContactForm from './components/ContactForm';
import AdminPanel from './components/AdminPanel';

// Local helpers & types
import { 
  initAuth, googleSignIn, logout, db, handleFirestoreError, OperationType 
} from './firebase';
import { 
  Photo, Collection, PortfolioSettings, LangType, translationDict 
} from './types';

export default function App() {
  // Locale systems
  const [currentLang, setLang] = useState<LangType>('es');
  const t = translationDict[currentLang];

  // Visual Theme Systems
  const [darkMode, setDarkMode] = useState<boolean>(true);

  // States for Firestore Realtime feeds
  const [photos, setPhotos] = useState<Photo[]>([]);
  const [collections, setCollections] = useState<Collection[]>([]);
  const [settings, setSettings] = useState<PortfolioSettings | null>(null);

  // Administrative / Auth configuration
  const [user, setUser] = useState<any>(null);
  const [accessToken, setAccessToken] = useState<string | null>(null);
  const [isAdminMode, setIsAdminMode] = useState<boolean>(false);

  // Filters state
  const [activeCategory, setActiveCategory] = useState<string>('All');
  const [activeCollectionId, setActiveCollectionId] = useState<string>('');

  // 1. Initial Connection verification as mandated by security skill
  useEffect(() => {
    async function testConnection() {
      try {
        await getDocFromServer(doc(db, 'test', 'connection'));
        console.log("Firestore connection test completed.");
      } catch (error) {
        if (error instanceof Error && error.message.includes('the client is offline')) {
          console.warn("Please check your Firebase configuration or connection.");
        }
      }
    }
    testConnection();
  }, []);

  // 2. Control Document HTML tag dark mode classing
  useEffect(() => {
    if (darkMode) {
      document.documentElement.classList.add('dark');
    } else {
      document.documentElement.classList.remove('dark');
    }
  }, [darkMode]);

  // 3. User Login / Authorization Setup
  useEffect(() => {
    const unsubscribeAuth = initAuth(
      (loggedUser, token) => {
        setUser(loggedUser);
        setAccessToken(token);
      },
      () => {
        setUser(null);
        setAccessToken(null);
      }
    );
    return () => {
      if (unsubscribeAuth) unsubscribeAuth();
    };
  }, []);

  // 4. Firestore Realtime Listeners with built-in robust safety error handlers
  useEffect(() => {
    const photosPath = 'photos';
    const unsubPhotos = onSnapshot(
      collection(db, photosPath),
      (snapshot) => {
        const list: Photo[] = [];
        snapshot.forEach((doc) => {
          list.push(doc.data() as Photo);
        });
        // Sort photos by capture or instagram timestamp (newest first)
        list.sort((a, b) => new Date(b.timestamp || b.createdAt).getTime() - new Date(a.timestamp || a.createdAt).getTime());
        setPhotos(list);
      },
      (error) => {
        handleFirestoreError(error, OperationType.LIST, photosPath);
      }
    );

    const collectionsPath = 'collections';
    const unsubCollections = onSnapshot(
      collection(db, collectionsPath),
      (snapshot) => {
        const list: Collection[] = [];
        snapshot.forEach((doc) => {
          list.push(doc.data() as Collection);
        });
        setCollections(list);
      },
      (error) => {
        handleFirestoreError(error, OperationType.LIST, collectionsPath);
      }
    );

    const configPath = 'settings';
    const unsubSettings = onSnapshot(
      collection(db, configPath),
      (snapshot) => {
        let activeSetting: PortfolioSettings | null = null;
        snapshot.forEach((doc) => {
          if (doc.id === 'config') {
            activeSetting = doc.data() as PortfolioSettings;
          }
        });

        // Initialize general configuration block if not yet generated
        if (!activeSetting) {
          const newConfig: PortfolioSettings = {
            id: 'config',
            ownerEmail: 'willymorinigo@gmail.com',
            backupHistory: []
          };
          setDoc(doc(db, 'settings', 'config'), newConfig).then(() => {
            setSettings(newConfig);
          }).catch(err => {
            console.log("Setting bootstrapping bypassed as we are guest:", err.message);
          });
        } else {
          setSettings(activeSetting);
        }
      },
      (error) => {
        handleFirestoreError(error, OperationType.LIST, configPath);
      }
    );

    return () => {
      unsubPhotos();
      unsubCollections();
      unsubSettings();
    };
  }, []);

  // Admin Login and logout triggers
  const handleLogin = async () => {
    try {
      const result = await googleSignIn();
      if (result) {
        setUser(result.user);
        setAccessToken(result.accessToken);
        setIsAdminMode(result.user.email === 'willymorinigo@gmail.com');
      }
    } catch (err) {
      console.error('Trigger login failed:', err);
    }
  };

  const handleLogout = async () => {
    await logout();
    setUser(null);
    setAccessToken(null);
    setIsAdminMode(false);
  };

  // Card triggers linked strictly to Database write security gates
  const handleToggleCurated = async (id: string, currentVal: boolean) => {
    try {
      const photoRef = doc(db, 'photos', id);
      await setDoc(photoRef, { isCurated: !currentVal, updatedAt: new Date().toISOString() }, { merge: true });
    } catch (err: any) {
      handleFirestoreError(err, OperationType.UPDATE, `photos/${id}`);
    }
  };

  const handleDeletePhoto = async (id: string) => {
    const confirmed = window.confirm(t.deleteBtn + '? Esta acción eliminará la fotografía de tu porfolio.');
    if (!confirmed) return;
    try {
      await deleteDoc(doc(db, 'photos', id));
    } catch (err: any) {
      handleFirestoreError(err, OperationType.DELETE, `photos/${id}`);
    }
  };

  const handleAssignToCollection = async (photoId: string, collectionId: string) => {
    try {
      const photoRef = doc(db, 'photos', photoId);
      await setDoc(photoRef, { collectionId: collectionId || '', updatedAt: new Date().toISOString() }, { merge: true });
    } catch (err: any) {
      handleFirestoreError(err, OperationType.UPDATE, `photos/${photoId}`);
    }
  };

  // Manual configuration updates
  const handleSettingsUpdate = (updated: PortfolioSettings) => {
    setSettings(updated);
  };

  const handleRefreshData = () => {
    console.log("Forcing layout recalculation...");
  };

  // Filter Categories compiled dynamically
  const categoriesList = ['All', ...Array.from(new Set(photos.map((p) => p.category)))];

  // Filtering computational logic
  const filteredPhotos = photos.filter((photo) => {
    const categoryMatches = activeCategory === 'All' || photo.category === activeCategory;
    const collectionMatches = !activeCollectionId || photo.collectionId === activeCollectionId;
    return categoryMatches && collectionMatches;
  });

  const featuredPhotos = photos.filter((photo) => photo.isCurated);

  return (
    <div className="min-h-screen bg-neutral-50 text-neutral-900 dark:bg-[#050505] dark:text-neutral-100 transition-colors duration-500 font-sans selection:bg-black selection:text-white dark:selection:bg-white dark:selection:text-black">
      
      {/* 1. Swiss header navigation switcher */}
      <Header
        currentLang={currentLang}
        setLang={setLang}
        darkMode={darkMode}
        setDarkMode={setDarkMode}
        isAdminMode={isAdminMode}
        setIsAdminMode={setIsAdminMode}
        t={t}
        hasInstagram={true}
        hasDrive={!!accessToken}
      />

      {/* 2. Admin Settings Layer panel */}
      <AnimatePresence>
        {isAdminMode && (
          <motion.div
            initial={{ height: 0, opacity: 0 }}
            animate={{ height: 'auto', opacity: 1 }}
            exit={{ height: 0, opacity: 0 }}
            transition={{ duration: 0.4 }}
            className="overflow-hidden border-b border-neutral-200 dark:border-white/10 bg-[#fafafa] dark:bg-[#080808]/60"
            id="admin-interactive-panel"
          >
            <div className="max-w-7xl mx-auto py-2">
              <div className="px-6 pt-4 flex items-center justify-between text-xs text-green-600 dark:text-emerald-400 font-mono">
                <span className="flex items-center gap-1.5 uppercase font-bold tracking-widest bg-emerald-100/50 dark:bg-emerald-950/20 py-1 px-2.5">
                  <ShieldCheck className="w-3.5 h-3.5" />
                  {t.adminModeActive}
                </span>
              </div>
              <AdminPanel
                user={user}
                accessToken={accessToken}
                onLogin={handleLogin}
                onLogout={handleLogout}
                photos={photos}
                collections={collections}
                settings={settings}
                onSettingsUpdate={handleSettingsUpdate}
                onRefreshData={handleRefreshData}
                t={t}
              />
            </div>
          </motion.div>
        )}
      </AnimatePresence>

      {/* 3. Immersive Layout Section: Sticky Sidebar & Photo Grid Flow */}
      <div className="max-w-7xl mx-auto px-6 py-12 flex flex-col lg:flex-row gap-10">
        
        {/* Sidebar Panel Column (left on desktop) */}
        <aside className="w-full lg:w-80 shrink-0 space-y-8 bg-[#fafafa] dark:bg-[#080808] p-6 lg:p-8 border border-neutral-200 dark:border-white/10" id="sidebar-filters">
          
          {/* Hero Section / Title & Brief Intro */}
          <div className="space-y-4">
            <div className="flex items-center gap-2">
              <span className="h-1.5 w-1.5 rounded-full bg-emerald-400"></span>
              <p className="text-[9px] font-mono tracking-[0.2em] text-[#0a0a0a] dark:text-[#cacaca] uppercase font-bold">
                PORTFOLIO
              </p>
            </div>
            <h2 className="text-xl font-sans tracking-tight leading-snug font-medium text-black dark:text-white">
              {t.subtitle}
            </h2>
            <p className="text-xs text-zinc-500 dark:text-zinc-400 leading-relaxed font-light">
              {t.about}
            </p>
          </div>

          <hr className="border-neutral-200 dark:border-white/10" />

          {/* Curated Collections / Series inside the sidebar! */}
          {collections.length > 0 && (
            <div className="space-y-4" id="sidebar-series">
              <h3 className="text-[9px] uppercase tracking-[0.25em] text-zinc-500 dark:text-zinc-500 font-bold">
                {t.collections.toUpperCase()}
              </h3>
              
              <div className="space-y-2">
                {/* Reset select / All */}
                <button
                  id="reset-collection-view"
                  onClick={() => {
                    setActiveCollectionId('');
                  }}
                  className={`w-full text-left p-3 flex items-center justify-between transition-all border text-xs tracking-wider uppercase ${
                    activeCollectionId === ''
                      ? 'border-black dark:border-white bg-[#0a0a0a] text-white dark:bg-white dark:text-black font-semibold'
                      : 'border-zinc-200 dark:border-white/10 text-zinc-700 dark:text-zinc-300 hover:border-black dark:hover:border-white hover:bg-neutral-50 dark:hover:bg-white/5'
                  }`}
                >
                  <span className="text-[10px] tracking-widest">{t.filterAll}</span>
                  <span className="text-[9px] font-mono opacity-60">[{photos.length}]</span>
                </button>

                {collections.map((col) => {
                  const linkedPhotos = photos.filter(p => p.collectionId === col.id);
                  const isSelected = activeCollectionId === col.id;
                  return (
                    <button
                      key={col.id}
                      id={`col-filter-${col.id}`}
                      onClick={() => {
                        setActiveCollectionId(col.id);
                        setActiveCategory('All');
                      }}
                      className={`w-full text-left p-3 flex items-center justify-between transition-all border ${
                        isSelected
                          ? 'border-black dark:border-white bg-[#0a0a0a] text-white dark:bg-white dark:text-black font-semibold'
                          : 'border-zinc-200 dark:border-white/10 text-zinc-700 dark:text-zinc-300 hover:border-black dark:hover:border-white hover:bg-neutral-50 dark:hover:bg-white/5'
                      }`}
                    >
                      <div className="flex flex-col">
                        <span className="text-[11px] tracking-widest font-semibold uppercase">{col.name}</span>
                        {col.description && (
                          <span className="text-[9px] text-zinc-400 dark:text-zinc-500 line-clamp-1 mt-0.5 font-light font-mono">
                            {col.description}
                          </span>
                        )}
                      </div>
                      <span className="text-[9px] font-mono opacity-60">[{linkedPhotos.length}]</span>
                    </button>
                  );
                })}
              </div>
            </div>
          )}

          <hr className="border-neutral-200 dark:border-white/10" />

          {/* Categories / Genre tags inside the sidebar! */}
          <div className="space-y-4" id="sidebar-categories">
            <h3 className="text-[9px] uppercase tracking-[0.25em] text-zinc-500 dark:text-zinc-500 font-bold">
              {t.categories.toUpperCase()}
            </h3>
            
            <div className="flex flex-wrap gap-2">
              {['All', 'Landscape', 'Portrait', 'Street', 'Architecture', 'Minimal'].map((cat) => {
                const isActive = activeCategory === cat;
                return (
                  <button
                    key={cat}
                    id={`cat-filter-${cat}`}
                    onClick={() => setActiveCategory(cat)}
                    className={`px-3 py-1.5 text-[9px] uppercase tracking-[0.15em] transition-all border ${
                      isActive
                        ? 'bg-[#0a0a0a] text-white dark:bg-white dark:text-[#000000] border-transparent font-semibold'
                        : 'border-zinc-200 dark:border-white/10 text-zinc-500 hover:text-black dark:hover:text-white dark:text-zinc-400'
                    }`}
                  >
                    {cat === 'All' ? t.all : cat}
                  </button>
                );
              })}
            </div>
          </div>

          <hr className="border-neutral-200 dark:border-white/10" />

          {/* Cloud allocation indicator details */}
          <div className="p-4 border border-dashed border-zinc-200 dark:border-white/10 bg-zinc-50 dark:bg-zinc-950/40">
            <div className="text-[8px] font-mono uppercase tracking-[0.25em] text-zinc-400 dark:text-zinc-500 mb-1">
              Curator Storage Allocation
            </div>
            <div className="text-[10px] font-mono font-semibold text-black dark:text-white flex justify-between">
              <span>Drive Usage</span>
              <span className="opacity-70">11.2GB/15GB</span>
            </div>
            <div className="w-full bg-zinc-205 dark:bg-white/10 h-1 mt-2 overflow-hidden">
              <div className="bg-emerald-500 dark:bg-white h-full w-[74%]"></div>
            </div>
            <p className="text-[8px] text-zinc-400 mt-1.5 font-mono">
              Last Synced: {settings?.lastSyncTime ? new Date(settings.lastSyncTime).toLocaleTimeString() : 'Automated'}
            </p>
          </div>

        </aside>

        {/* Portfolio Content Grid & Contact Column (right side) */}
        <div className="flex-1 space-y-12">
          
          {/* Active selection banner description */}
          <div className="flex flex-wrap items-center justify-between gap-4 border-b border-zinc-200 dark:border-white/10 pb-4">
            <div className="flex items-center gap-3">
              <span className="text-[10px] font-semibold uppercase tracking-[0.2em] text-zinc-400">
                / {activeCategory === 'All' ? t.all : activeCategory}
              </span>
              {activeCollectionId && (
                <>
                  <span className="text-zinc-300 dark:text-zinc-800">|</span>
                  <span className="text-[9px] font-mono bg-zinc-100 dark:bg-white/5 text-zinc-700 dark:text-zinc-300 py-1 px-2.5 uppercase font-medium tracking-widest border border-neutral-200 dark:border-white/10">
                    {collections.find(c => c.id === activeCollectionId)?.name}
                  </span>
                </>
              )}
            </div>
            <span className="text-[9px] font-mono text-zinc-400 dark:text-zinc-550 uppercase tracking-widest">
              {filteredPhotos.length} {filteredPhotos.length === 1 ? 'WORK DISPLAYED' : 'WORKS DISPLAYED'}
            </span>
          </div>

          {/* Photo Feed Grid */}
          <section id="portfolio-photo-grid">
            <AnimatePresence mode="popLayout">
              {filteredPhotos.length > 0 ? (
                <motion.div 
                  layout
                  className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-6"
                >
                  {filteredPhotos.map((photo) => (
                    <PhotoCard
                      key={photo.id}
                      photo={photo}
                      isAdmin={isAdminMode}
                      collections={collections}
                      onToggleCurated={handleToggleCurated}
                      onDeletePhoto={handleDeletePhoto}
                      onAssignToCollection={handleAssignToCollection}
                      t={t}
                    />
                  ))}
                </motion.div>
              ) : (
                <motion.div 
                  initial={{ opacity: 0 }}
                  animate={{ opacity: 1 }}
                  className="text-center py-20 border border-dashed border-zinc-200 dark:border-white/10 bg-[#fafafa] dark:bg-[#080808]"
                  id="no-photos-alert"
                >
                  <Camera className="w-8 h-8 text-zinc-300 dark:text-zinc-700 mx-auto mb-3" />
                  <p className="text-xs font-mono uppercase text-[#0a0a0a] dark:text-zinc-400 max-w-sm mx-auto leading-relaxed">
                    {t.noPhotos}
                  </p>
                </motion.div>
              )}
            </AnimatePresence>
          </section>

          {/* Contact form frame matching design spec */}
          <section className="pt-8 border-t border-zinc-200 dark:border-white/10" id="contact-wrapper">
            <div className="text-center mb-6">
              <h3 className="text-xs font-mono uppercase tracking-[0.25em] text-[#0a0a0a] dark:text-white font-bold">
                {t.contact}
              </h3>
              <p className="text-[10px] text-zinc-400 dark:text-zinc-555 font-mono mt-1">
                ¿Interesado en copias físicas o colaboraciones editoriales? Escríbeme.
              </p>
            </div>
            <ContactForm t={t} />
          </section>

        </div>

      </div>

      {/* 8. Minimalist Swiss styled Footer */}
      <footer className="border-t border-neutral-100 dark:border-neutral-900 py-12 mt-16 transition-colors duration-300 bg-neutral-50/50 dark:bg-black/40">
        <div className="max-w-7xl mx-auto px-6 flex flex-col md:flex-row justify-between items-center gap-6 text-xs text-gray-400 dark:text-neutral-500 font-mono">
          <p>© 2026 {t.title}. Willy Morinigo. All rights reserved.</p>
          <div className="flex items-center gap-6">
            <span>ISO 100 • 35mm • f/2.8</span>
            <span className="text-green-500">SYS_SEC: ACTIVE</span>
          </div>
        </div>
      </footer>
    </div>
  );
}

import React, { useState } from 'react';
import { 
  Instagram, Cloud, RefreshCw, Layers, Plus, Link, Trash, 
  FolderPlus, Save, LogIn, LogOut, CheckCircle2, AlertTriangle, FileJson
} from 'lucide-react';
import { motion, AnimatePresence } from 'motion/react';
import { db, handleFirestoreError, OperationType } from '../firebase';
import { collection, doc, setDoc, deleteDoc, updateDoc } from 'firebase/firestore';
import { uploadBackupToDrive } from '../utils/drive';
import { Photo, Collection, PortfolioSettings, BackupHistoryItem, Translations } from '../types';

interface AdminPanelProps {
  user: any;
  accessToken: string | null;
  onLogin: () => void;
  onLogout: () => void;
  photos: Photo[];
  collections: Collection[];
  settings: PortfolioSettings | null;
  onSettingsUpdate: (updated: PortfolioSettings) => void;
  onRefreshData: () => void;
  t: Translations;
}

export default function AdminPanel({
  user,
  accessToken,
  onLogin,
  onLogout,
  photos,
  collections,
  settings,
  onSettingsUpdate,
  onRefreshData,
  t
}: AdminPanelProps) {
  
  const [tokenInput, setTokenInput] = useState(settings?.instagramToken || '');
  const [syncing, setSyncing] = useState(false);
  const [syncLogs, setSyncLogs] = useState('');

  // New Photo Form state
  const [newPhotoTitle, setNewPhotoTitle] = useState('');
  const [newPhotoCaption, setNewPhotoCaption] = useState('');
  const [newPhotoUrl, setNewPhotoUrl] = useState('');
  const [newPhotoCategory, setNewPhotoCategory] = useState('Minimal');
  const [newPhotoCollectionId, setNewPhotoCollectionId] = useState('');
  const [newPhotoTimestamp, setNewPhotoTimestamp] = useState(new Date().toISOString().substring(0, 10)); // YYYY-MM-DD
  const [isCreatingPhoto, setIsCreatingPhoto] = useState(false);
  const [photoMessage, setPhotoMessage] = useState('');
  const [isAnalyzingPhoto, setIsAnalyzingPhoto] = useState(false);

  React.useEffect(() => {
    if (settings?.instagramToken) {
      setTokenInput(settings.instagramToken);
    }
  }, [settings?.instagramToken]);
  
  // New Collection Form state
  const [newColName, setNewColName] = useState('');
  const [newColDesc, setNewColDesc] = useState('');
  const [newColCover, setNewColCover] = useState('');
  const [isCreatingCol, setIsCreatingCol] = useState(false);

  // Backup State
  const [isBackingUp, setIsBackingUp] = useState(false);
  const [backupSuccess, setBackupSuccess] = useState(false);
  const [backupMessage, setBackupMessage] = useState('');

  const isAdminUser = user && user.email === 'willymorinigo@gmail.com';

  const handleSaveToken = async () => {
    if (!isAdminUser) return;
    try {
      const configRef = doc(db, 'settings', 'config');
      const updated: Partial<PortfolioSettings> = {
        instagramToken: tokenInput.trim()
      };
      
      await setDoc(configRef, updated, { merge: true });
      alert('Token de Instagram guardado exitosamente.');
      onRefreshData();
    } catch (e: any) {
      alert('Error guardando token: ' + e.message);
    }
  };

  const handleSync = async (simulate: boolean) => {
    if (!isAdminUser) {
      alert(t.unverifiedWarning);
      return;
    }
    setSyncing(true);
    setSyncLogs(t.syncing);

    try {
      const response = await fetch('/api/instagram/sync', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json'
        },
        body: JSON.stringify({
          accessToken: simulate ? null : tokenInput.trim(),
          simulate
        })
      });

      let resData: any = null;
      try {
        resData = await response.json();
      } catch (jsonErr) {
        console.error("Failed to parse response JSON:", jsonErr);
      }

      if (!response.ok) {
        throw new Error(resData?.error || t.notSaved || 'Fallo en la comunicación con la API de Instagram');
      }

      if (resData && resData.success && resData.photos) {
        setSyncLogs(`Guardando ${resData.photos.length} fotos en Firestore...`);

        // Save each photo locally in Firestore
        for (const item of resData.photos) {
          const photoDocRef = doc(db, 'photos', item.id);
          const photoPayload: Photo = {
            id: item.id,
            instagramId: item.instagramId || '',
            title: item.title,
            caption: item.caption,
            url: item.url,
            permalink: item.permalink || '',
            category: item.category,
            isCurated: false,
            timestamp: item.timestamp,
            createdAt: new Date().toISOString(),
            updatedAt: new Date().toISOString()
          };
          await setDoc(photoDocRef, photoPayload);
        }

        // Update last sync time inside Settings
        const configRef = doc(db, 'settings', 'config');
        await updateDoc(configRef, {
          lastSyncTime: new Date().toISOString(),
          instagramUsername: resData.username || 'instagram_user'
        });

        setSyncLogs(t.syncSuccess);
        onRefreshData();
      } else {
        throw new Error(resData?.error || 'Sincronización fallida');
      }
    } catch (error: any) {
      console.error(error);
      setSyncLogs(`Error: ${error.message}`);
    } finally {
      setSyncing(false);
    }
  };

  const handleAICategorize = async () => {
    if (!newPhotoTitle && !newPhotoCaption) {
      setPhotoMessage("Por favor ingresa un título o descripción para que la IA de Gemini pueda analizar el contenido.");
      return;
    }
    setIsAnalyzingPhoto(true);
    setPhotoMessage("Analizando contexto con Gemini 3.5 Flash...");
    try {
      const res = await fetch('/api/ai/categorize', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ title: newPhotoTitle, caption: newPhotoCaption })
      });
      if (res.ok) {
        const data = await res.json();
        if (data.category) {
          setNewPhotoCategory(data.category);
          setPhotoMessage(`¡Analizado! Categoría sugerida por IA: ${data.category}`);
        } else {
          setPhotoMessage("La IA no pudo clasificar la temática de manera concluyente.");
        }
      } else {
        setPhotoMessage("No se pudo contactar el servicio de categorización por IA.");
      }
    } catch (e: any) {
      setPhotoMessage(`Error al clasificar: ${e.message}`);
    } finally {
      setIsAnalyzingPhoto(false);
    }
  };

  const handleCreatePhoto = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!isAdminUser) return;
    if (!newPhotoTitle.trim() || !newPhotoUrl.trim()) {
      setPhotoMessage("Por favor completa el título y la URL de la imagen.");
      return;
    }

    setIsCreatingPhoto(true);
    setPhotoMessage('');

    try {
      const photoId = `photo_manual_${Date.now()}`;
      const payload: Photo = {
        id: photoId,
        title: newPhotoTitle.trim(),
        caption: newPhotoCaption.trim(),
        url: newPhotoUrl.trim(),
        category: newPhotoCategory,
        collectionId: newPhotoCollectionId || '',
        isCurated: false,
        timestamp: new Date(newPhotoTimestamp).toISOString(),
        createdAt: new Date().toISOString(),
        updatedAt: new Date().toISOString()
      };

      await setDoc(doc(db, 'photos', photoId), payload);

      setNewPhotoTitle('');
      setNewPhotoCaption('');
      setNewPhotoUrl('');
      setNewPhotoCollectionId('');
      setPhotoMessage("¡Nueva fotografía añadida al porfolio con éxito!");
      onRefreshData();
    } catch (error: any) {
      setPhotoMessage('Error guardando fotografía manual: ' + error.message);
    } finally {
      setIsCreatingPhoto(false);
    }
  };

  const handleCreateCollection = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!isAdminUser) return;
    if (!newColName.trim() || !newColCover.trim()) return;

    setIsCreatingCol(true);
    try {
      const colId = `col_${Date.now()}`;
      const newCol: Collection = {
        id: colId,
        name: newColName.trim(),
        description: newColDesc.trim(),
        coverPhotoUrl: newColCover.trim(),
        createdAt: new Date().toISOString(),
        updatedAt: new Date().toISOString()
      };

      await setDoc(doc(db, 'collections', colId), newCol);
      
      setNewColName('');
      setNewColDesc('');
      setNewColCover('');
      onRefreshData();
    } catch (error: any) {
      alert('Error creando colección: ' + error.message);
    } finally {
      setIsCreatingCol(false);
    }
  };

  const handleDeleteCollection = async (colId: string) => {
    if (!isAdminUser) return;
    const confirmed = window.confirm('¿Estás seguro de eliminar esta colección? Las fotos asociadas permanecerán intactas pero sin asignar.');
    if (!confirmed) return;

    try {
      await deleteDoc(doc(db, 'collections', colId));
      onRefreshData();
    } catch (e: any) {
      alert('Error al borrar la colección: ' + e.message);
    }
  };

  const handleCreateBackup = async () => {
    if (!accessToken) {
      alert(t.backupWarning);
      return;
    }
    
    setIsBackingUp(true);
    setBackupSuccess(false);
    setBackupMessage('');

    try {
      const backupData = {
        appName: "Minimal Frame Portfolio Backup",
        createdAt: new Date().toISOString(),
        photos,
        collections,
        settings: {
          instagramUsername: settings?.instagramUsername,
          lastSyncTime: settings?.lastSyncTime,
          backupCount: settings?.backupHistory?.length || 0,
        }
      };

      // Upload payload directly onto Drive utilizing Drive client SDK helpers
      const uploadRes = await uploadBackupToDrive(accessToken, backupData);

      // Save historic record inside firestore setting document to render in our backup table
      const newHistoryItem: BackupHistoryItem = {
        id: `back_${Date.now()}`,
        timestamp: new Date().toISOString(),
        fileId: uploadRes.id,
        fileName: uploadRes.name,
        photoCount: photos.length
      };

      const updatedHistory = settings?.backupHistory 
        ? [newHistoryItem, ...settings.backupHistory]
        : [newHistoryItem];

      const configRef = doc(db, 'settings', 'config');
      await updateDoc(configRef, {
        backupHistory: updatedHistory
      });

      setBackupSuccess(true);
      setBackupMessage(`${t.backupSuccess} (ID: ${uploadRes.id})`);
      onRefreshData();
    } catch (e: any) {
      console.error(e);
      setBackupSuccess(false);
      setBackupMessage(`Fallo de respaldo en Google Drive: ${e.message}`);
    } finally {
      setIsBackingUp(false);
    }
  };

  return (
    <div className="max-w-6xl mx-auto py-8 text-black dark:text-white transition-colors duration-300 px-6 font-mono text-sm" id="admin-panel-container">
      
      {/* Sign-in status banner */}
      <div className="border border-neutral-200 dark:border-neutral-800 p-6 mb-8 flex flex-col md:flex-row justify-between items-start md:items-center gap-6 bg-neutral-50 dark:bg-neutral-950">
        <div>
          <h2 className="text-lg font-bold tracking-widest uppercase flex items-center gap-2">
            <span>Portfolio Curator Tools</span>
          </h2>
          <p className="text-xs text-gray-500 dark:text-neutral-400 mt-1">
            {user ? `Sesión iniciada como: ${user.email}` : t.unverifiedWarning}
          </p>
          {!isAdminUser && user && (
            <div className="mt-3 flex items-start gap-2 border border-amber-300 bg-amber-50 dark:bg-amber-950/20 text-amber-700 dark:text-amber-400 p-3 text-xs w-full max-w-xl">
              <AlertTriangle className="w-4 h-4 shrink-0" />
              <span>{t.unverifiedWarning}</span>
            </div>
          )}
        </div>
        
        <div>
          {user ? (
            <button
              onClick={onLogout}
              className="flex items-center gap-2 border border-black dark:border-white px-4 py-2 hover:bg-black hover:text-white dark:hover:bg-white dark:hover:text-black transition-all uppercase text-xs font-semibold"
            >
              <LogOut className="w-4 h-4" />
              <span>{t.logoutBtn}</span>
            </button>
          ) : (
            <button
              id="google-login-trigger"
              onClick={onLogin}
              className="flex items-center gap-2 bg-black text-white dark:bg-white dark:text-black font-semibold px-5 py-2.5 transition-all uppercase text-xs shadow-lg"
            >
              <LogIn className="w-4 h-4" />
              <span>{t.loginBtn}</span>
            </button>
          )}
        </div>
      </div>

      {user && (
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-8" id="admin-grid-elements">
          
          {/* Column Left: Instagram sync & Developer configuration */}
          <div className="space-y-8">
            
            {/* Instagram Syncer Box */}
            <div className="border border-neutral-200 dark:border-neutral-800 p-6 bg-white dark:bg-neutral-900">
              <div className="flex items-center gap-3 mb-4">
                <Instagram className="w-5 h-5 text-pink-500" />
                <h3 className="font-bold uppercase tracking-wider text-sm">{t.syncTitle}</h3>
              </div>
              <p className="text-xs text-gray-500 dark:text-neutral-400 mb-6 leading-relaxed">
                {t.syncDesc}
              </p>

              <div className="space-y-4">
                <div>
                  <label className="text-[10px] uppercase font-semibold text-gray-400 dark:text-neutral-500 block mb-1">
                    {t.tokenLabel}
                  </label>
                  <div className="flex gap-2">
                    <input
                      type="password"
                      disabled={!isAdminUser}
                      value={tokenInput}
                      onChange={(e) => setTokenInput(e.target.value)}
                      placeholder={t.tokenPlaceHolder}
                      className="flex-1 bg-neutral-50 dark:bg-neutral-950 border border-gray-200 dark:border-neutral-800 px-3 py-2 text-xs outline-none"
                    />
                    {isAdminUser && (
                      <button
                        onClick={handleSaveToken}
                        className="bg-black text-white dark:bg-white dark:text-black px-4 py-2 hover:opacity-90 flex items-center gap-1.5 text-xs font-semibold uppercase tracking-wider shrink-0"
                      >
                        <Save className="w-3.5 h-3.5" />
                        <span>{t.saveBtn} Token</span>
                      </button>
                    )}
                  </div>
                  <p className="text-[10px] text-gray-400 mt-1">
                    {settings?.instagramUsername ? `Cuenta vinculada: @${settings.instagramUsername}` : 'Ninguna vinculada.'}
                  </p>
                </div>

                <div className="flex flex-col gap-2 pt-2">
                  <button
                    onClick={() => handleSync(false)}
                    disabled={syncing || !isAdminUser || !tokenInput}
                    className={`flex items-center justify-center gap-2 border border-pink-500 text-pink-500 py-2.5 px-4 text-xs font-semibold hover:bg-pink-50 dark:hover:bg-pink-950/20 transition-all ${
                      (syncing || !tokenInput) ? 'opacity-50 cursor-not-allowed' : ''
                    }`}
                  >
                    <RefreshCw className={`w-3.5 h-3.5 ${syncing ? 'animate-spin' : ''}`} />
                    <span>{t.syncBtn}</span>
                  </button>

                  <button
                    id="simulator-sync-btn"
                    onClick={() => handleSync(true)}
                    disabled={syncing || !isAdminUser}
                    className={`flex items-center justify-center gap-2 border border-black dark:border-white text-black dark:text-white py-2.5 px-4 text-xs transition-all hover:bg-neutral-100 dark:hover:bg-neutral-800 ${
                      syncing ? 'opacity-50 cursor-not-allowed' : ''
                    }`}
                  >
                    <Instagram className="w-3.5 h-3.5 text-orange-500" />
                    <span>{t.syncDemoBtn}</span>
                  </button>
                </div>

                {syncLogs && (
                  <div>
                    {syncLogs.includes('Error:') || syncLogs.includes('failed') || syncLogs.includes('falló') ? (
                      <div className="mt-4 p-4 border border-red-200 dark:border-red-950 bg-red-50/50 dark:bg-red-950/10 text-xs space-y-3">
                        <div className="flex gap-2 text-red-700 dark:text-red-400 font-semibold items-start">
                          <AlertTriangle className="w-4.5 h-4.5 shrink-0 mt-0.5 text-red-500" />
                          <div>
                            <p className="font-bold">Error en Sincronización Real de Meta (Facebook/Instagram)</p>
                            <p className="text-[10px] font-mono font-normal mt-2 whitespace-pre-wrap max-h-[140px] overflow-auto border border-red-100 dark:border-red-900/40 p-2 bg-white dark:bg-black/40">
                              {syncLogs}
                            </p>
                          </div>
                        </div>

                        <div className="text-[11px] text-gray-500 dark:text-neutral-400 space-y-2 pl-6 pt-1 border-t border-neutral-200/50 dark:border-neutral-800">
                          <p className="font-bold text-gray-700 dark:text-neutral-300">💡 Guía de Autodiagnóstico y Solución:</p>
                          <ul className="list-decimal pl-4 space-y-1 text-zinc-600 dark:text-neutral-400">
                            <li><strong>Convertir Perfil en Profesional:</strong> Tu cuenta de Instagram debe ser Empresarial o de Creador (no puede ser una cuenta personal).</li>
                            <li><strong>Vincular la Página de Facebook:</strong> Ve a la Configuración de tu Página de Facebook "Diafragmawm", entra a la pestaña "Cuentas vinculadas" y realiza la conexión para que herede permisos.</li>
                            <li><strong>Permisos Generados en Meta Explorer:</strong> Cuando crees el token de acceso, asegúrate de marcar con un check las casillas: <code className="font-mono bg-neutral-100 dark:bg-neutral-800 px-1 py-0.5 rounded text-[10px]">instagram_basic</code>, <code className="font-mono bg-neutral-100 dark:bg-neutral-800 px-1 py-0.5 rounded text-[10px]">pages_show_list</code> y <code className="font-mono bg-neutral-100 dark:bg-neutral-800 px-1 py-0.5 rounded text-[10px]">pages_read_engagement</code>.</li>
                            <li><strong>Token Truncado:</strong> Verifica que copiaste la clave completa de larga duración sin omitir caracteres.</li>
                          </ul>
                        </div>

                        <div className="pt-3 pl-6 flex flex-col sm:flex-row gap-2">
                          <button
                            type="button"
                            onClick={() => handleSync(true)}
                            className="bg-black text-white dark:bg-white dark:text-black hover:opacity-90 py-2 px-3 text-[10px] font-bold uppercase tracking-wider flex items-center justify-center gap-1.5 transition-all"
                          >
                            <RefreshCw className="w-3 h-3 text-yellow-500 animate-pulse" />
                            <span>Utilizar Modo Demostración (Simular Sync)</span>
                          </button>
                        </div>
                      </div>
                    ) : (
                      <div className="mt-4 p-3 bg-neutral-50 dark:bg-neutral-950 border border-neutral-200 dark:border-neutral-800 text-[11px] font-mono whitespace-pre-wrap max-h-[140px] overflow-auto">
                        {syncLogs}
                      </div>
                    )}
                  </div>
                )}
              </div>
            </div>

            {/* Google Drive automatic Backup Box */}
            <div className="border border-neutral-200 dark:border-neutral-800 p-6 bg-white dark:bg-neutral-900">
              <div className="flex items-center gap-3 mb-4">
                <Cloud className="w-5 h-5 text-blue-500" />
                <h3 className="font-bold uppercase tracking-wider text-sm">{t.backupTitle}</h3>
              </div>
              <p className="text-xs text-gray-500 dark:text-neutral-400 mb-6 leading-relaxed">
                {t.backupDesc}
              </p>

              <div className="space-y-4">
                {!accessToken ? (
                  <div className="border border-amber-200 bg-amber-50 dark:bg-amber-950/10 p-4 text-xs text-amber-700 dark:text-amber-400 flex items-start gap-2">
                    <AlertTriangle className="w-4 h-4 shrink-0" />
                    <span>Se requiere re-iniciar sesión para autorizar la integración con tu cuenta personal Google Drive para realizar copias de seguridad de tus fotos.</span>
                  </div>
                ) : (
                  <button
                    id="trigger-drive-backup-btn"
                    onClick={handleCreateBackup}
                    disabled={isBackingUp || photos.length === 0}
                    className={`w-full flex items-center justify-center gap-2 bg-blue-600 text-white hover:bg-blue-700 py-3 px-4 text-xs font-semibold shadow transition-all ${
                      (isBackingUp || photos.length === 0) ? 'opacity-50 cursor-not-allowed' : ''
                    }`}
                  >
                    <Cloud className={`w-4 h-4 ${isBackingUp ? 'animate-bounce' : ''}`} />
                    <span>{isBackingUp ? 'Creando Respaldo...' : t.backupBtn}</span>
                  </button>
                )}

                {backupMessage && (
                  <div className={`p-3 text-xs leading-relaxed border ${
                    backupSuccess 
                      ? 'border-green-200 bg-green-50 dark:bg-green-950/10 text-green-700 dark:text-green-400' 
                      : 'border-red-200 bg-red-50 dark:bg-red-950/10 text-red-700 dark:text-red-400'
                  }`}>
                    {backupMessage}
                  </div>
                )}

                {/* Backups History */}
                <div>
                  <h4 className="text-[10px] font-bold text-gray-400 uppercase tracking-wider mb-2">
                    {t.backupHistory} ({settings?.backupHistory?.length || 0})
                  </h4>
                  <div className="border border-neutral-100 dark:border-neutral-800 divide-y divide-neutral-100 dark:divide-neutral-800 max-h-[160px] overflow-y-auto">
                    {settings?.backupHistory && settings.backupHistory.length > 0 ? (
                      settings.backupHistory.map((b) => (
                        <div key={b.id} className="p-2.5 text-[11px] font-sans flex justify-between items-center bg-neutral-50/50 dark:bg-neutral-950/20">
                          <div className="flex items-center gap-2">
                            <FileJson className="w-3.5 h-3.5 text-gray-400 shrink-0" />
                            <div className="truncate max-w-[200px]">
                              <p className="font-mono text-black dark:text-white truncate">{b.fileName}</p>
                              <p className="text-[9px] text-gray-400">{new Date(b.timestamp).toLocaleString()}</p>
                            </div>
                          </div>
                          <span className="text-[9px] font-mono bg-neutral-200 dark:bg-neutral-800 py-0.5 px-2 text-gray-600 dark:text-neutral-400 shrink-0">
                            {b.photoCount} fotos
                          </span>
                        </div>
                      ))
                    ) : (
                      <p className="p-4 text-xs text-gray-400 text-center uppercase">No hay respaldos tomados.</p>
                    )}
                  </div>
                </div>
              </div>
            </div>
            
          </div>

          {/* Column Right: manual photo & collection editor */}
          <div className="space-y-8">
            
            {/* Manual Photo Add Form */}
            <div className="border border-neutral-200 dark:border-neutral-800 p-6 bg-white dark:bg-neutral-900 space-y-6">
              <div className="flex items-center gap-3">
                <Plus className="w-5 h-5 text-emerald-500" />
                <h3 className="font-bold uppercase tracking-wider text-sm">{t.addPhotoTitle}</h3>
              </div>
              <p className="text-xs text-gray-500 dark:text-neutral-400 leading-relaxed mb-1">
                Añade obras directamente a tu porfolio sin depender de la API de Instagram o Facebook. Rellena los datos o pulsa uno de los accesos directos rápidos de muestra para poblar tu galería al instante.
              </p>

              {/* Presets Quick Access */}
              <div className="space-y-2">
                <span className="text-[9px] uppercase font-bold text-neutral-400 block tracking-widest">Ejemplos Rápidos (HD):</span>
                <div className="flex flex-wrap gap-1.5">
                  {[
                    {
                      name: "Concreto (Arch)",
                      url: "https://images.unsplash.com/photo-1600585154340-be6161a56a0c?auto=format&fit=crop&w=1200&q=80",
                      title: "Geometría de Luz Brutalista",
                      caption: "Explorando los ángulos rectos de la arquitectura brutalista y sombras del mediodía. #brutalism #geometry",
                      category: "Architecture"
                    },
                    {
                      name: "Mar Zen (Land)",
                      url: "https://images.unsplash.com/photo-1507525428034-b723cf961d3e?auto=format&fit=crop&w=1200&q=80",
                      title: "Eterno Silencio Azul",
                      caption: "La línea extrema del horizonte se desvanece en un infinito vacío pacífico. #zen #landscape #sea",
                      category: "Landscape"
                    },
                    {
                      name: "Retrato (Port)",
                      url: "https://images.unsplash.com/photo-1534528741775-53994a69daeb?auto=format&fit=crop&w=1200&q=80",
                      title: "Estudio del Claroscuro Humano",
                      caption: "La delicadeza del rostro de perfil capturada entre la penumbra densa. #portrait #creative #moody",
                      category: "Portrait"
                    },
                    {
                      name: "Sombra (Street)",
                      url: "https://images.unsplash.com/photo-1478760329108-5c3ed9d495a0?auto=format&fit=crop&w=1200&q=80",
                      title: "La Sombra del Transeúnte Solitario",
                      caption: "Un instante suspendido en las calles neblinosas de la estación metropolitana. #street #film #shadows",
                      category: "Street"
                    },
                    {
                      name: "Hojas (Mini)",
                      url: "https://images.unsplash.com/photo-1545241047-6083a3684587?auto=format&fit=crop&w=1200&q=80",
                      title: "Esencia Orgánica Minimalista",
                      caption: "Una sola rama estructurando curvas y formas orgánicas sobre fondo crudo. #minimal #abstract #nature",
                      category: "Minimal"
                    }
                  ].map((preset, index) => (
                    <button
                      key={index}
                      type="button"
                      onClick={() => {
                        setNewPhotoTitle(preset.title);
                        setNewPhotoCaption(preset.caption);
                        setNewPhotoUrl(preset.url);
                        setNewPhotoCategory(preset.category);
                        setPhotoMessage(`Ejemplo "${preset.name}" cargado. ¡Puedes modificar los datos o guardarlo!`);
                      }}
                      className="text-[10px] font-mono bg-neutral-100 dark:bg-neutral-800 hover:bg-neutral-200 dark:hover:bg-neutral-700 px-2 py-0.5 text-neutral-700 dark:text-neutral-300 border border-neutral-200 dark:border-neutral-700 transition-colors"
                    >
                      + {preset.name}
                    </button>
                  ))}
                </div>
              </div>

              <form onSubmit={handleCreatePhoto} className="space-y-4">
                <div className="flex flex-col gap-1">
                  <label className="text-[10px] uppercase font-semibold text-gray-400 dark:text-neutral-500">
                    Título de la Obra *
                  </label>
                  <input
                    type="text"
                    required
                    disabled={!isAdminUser || isCreatingPhoto}
                    placeholder="ej. Silencio de Concreto"
                    value={newPhotoTitle}
                    onChange={(e) => setNewPhotoTitle(e.target.value)}
                    className="bg-neutral-50 dark:bg-neutral-950 border border-gray-200 dark:border-neutral-800 px-3 py-2 text-xs outline-none focus:border-black dark:focus:border-white text-black dark:text-white"
                  />
                </div>

                <div className="flex flex-col gap-1">
                  <label className="text-[10px] uppercase font-semibold text-gray-400 dark:text-neutral-500">
                    Texto de la publicación / Descripción
                  </label>
                  <textarea
                    rows={2}
                    disabled={!isAdminUser || isCreatingPhoto}
                    placeholder="ej. Estudio de texturas y luz oblicua en arquitectura brutalista contemporánea."
                    value={newPhotoCaption}
                    onChange={(e) => setNewPhotoCaption(e.target.value)}
                    className="bg-neutral-50 dark:bg-neutral-950 border border-gray-200 dark:border-neutral-800 px-3 py-2 text-xs outline-none focus:border-black dark:focus:border-white text-black dark:text-white font-sans resize-none"
                  />
                </div>

                <div className="flex flex-col gap-1">
                  <label className="text-[10px] uppercase font-semibold text-gray-400 dark:text-neutral-500">
                    URL de la Imagen (Unsplash, Imgur, etc.) *
                  </label>
                  <input
                    type="url"
                    required
                    disabled={!isAdminUser || isCreatingPhoto}
                    placeholder="https://images.unsplash.com/photo-..."
                    value={newPhotoUrl}
                    onChange={(e) => setNewPhotoUrl(e.target.value)}
                    className="bg-neutral-50 dark:bg-neutral-950 border border-gray-200 dark:border-neutral-800 px-3 py-2 text-xs outline-none focus:border-black dark:focus:border-white text-black dark:text-white font-mono"
                  />
                </div>

                <div className="grid grid-cols-2 gap-4">
                  <div className="flex flex-col gap-1">
                    <label className="text-[10px] uppercase font-semibold text-gray-400 dark:text-neutral-500">
                      Categoría
                    </label>
                    <div className="flex gap-1 items-center">
                      <select
                        value={newPhotoCategory}
                        disabled={!isAdminUser || isCreatingPhoto}
                        onChange={(e) => setNewPhotoCategory(e.target.value)}
                        className="flex-1 bg-neutral-50 dark:bg-neutral-950 border border-gray-200 dark:border-neutral-800 px-2 py-2 text-xs outline-none text-black dark:text-white"
                      >
                        {["Landscape", "Portrait", "Street", "Architecture", "Minimal"].map((cat) => (
                          <option key={cat} value={cat}>{cat}</option>
                        ))}
                      </select>
                      
                      <button
                        type="button"
                        onClick={handleAICategorize}
                        disabled={!isAdminUser || isAnalyzingPhoto}
                        title="Analizar título/descripción con Gemini"
                        className="bg-neutral-900 dark:bg-neutral-200 text-white dark:text-black py-2 px-3.5 hover:opacity-90 shrink-0 text-[10px] font-bold flex items-center gap-1 uppercase"
                      >
                        <RefreshCw className={`w-3 h-3 ${isAnalyzingPhoto ? 'animate-spin' : ''}`} />
                        <span>IA</span>
                      </button>
                    </div>
                  </div>

                  <div className="flex flex-col gap-1 gallery-form-col">
                    <label className="text-[10px] uppercase font-semibold text-gray-400 dark:text-neutral-500">
                      Colección
                    </label>
                    <select
                      value={newPhotoCollectionId}
                      disabled={!isAdminUser || isCreatingPhoto}
                      onChange={(e) => setNewPhotoCollectionId(e.target.value)}
                      className="bg-neutral-50 dark:bg-neutral-950 border border-gray-200 dark:border-neutral-800 px-2 py-2 text-xs outline-none text-black dark:text-white w-full"
                    >
                      <option value="">[ Sin colección ]</option>
                      {collections.map((col) => (
                        <option key={col.id} value={col.id}>{col.name}</option>
                      ))}
                    </select>
                  </div>
                </div>

                <div className="flex flex-col gap-1">
                  <label className="text-[10px] uppercase font-semibold text-gray-400 dark:text-neutral-500">
                    Fecha de la Obra
                  </label>
                  <input
                    type="date"
                    disabled={!isAdminUser || isCreatingPhoto}
                    value={newPhotoTimestamp}
                    onChange={(e) => setNewPhotoTimestamp(e.target.value)}
                    className="bg-neutral-50 dark:bg-neutral-950 border border-gray-200 dark:border-neutral-800 px-3 py-2 text-xs outline-none text-black dark:text-white font-mono"
                  />
                </div>

                <button
                  type="submit"
                  disabled={isCreatingPhoto || !isAdminUser}
                  className="w-full flex items-center justify-center gap-2 bg-emerald-600 text-white hover:bg-emerald-700 py-2.5 text-xs uppercase font-bold tracking-widest transition-colors"
                >
                  <Plus className="w-4 h-4" />
                  <span>Añadir Fotografía</span>
                </button>

                {photoMessage && (
                  <p className="text-[11px] font-mono leading-relaxed mt-2 bg-neutral-50 dark:bg-neutral-950 border border-neutral-200 dark:border-neutral-800 p-2.5 text-emerald-600 dark:text-emerald-400">
                    {photoMessage}
                  </p>
                )}
              </form>
            </div>

            {/* Column Right: manual photo collection editor */}
            <div className="border border-neutral-200 dark:border-neutral-800 p-6 bg-white dark:bg-neutral-900 space-y-6">
            <div className="flex items-center gap-3">
              <Layers className="w-5 h-5 text-purple-500" />
              <h3 className="font-bold uppercase tracking-wider text-sm">{t.collections}</h3>
            </div>
            
            {/* Create Collection Form */}
            <form onSubmit={handleCreateCollection} className="space-y-3.5 border-b border-gray-100 dark:border-neutral-800 pb-6" id="add-collection-form">
              <p className="text-[11px] font-bold uppercase text-gray-400 tracking-wider">
                {t.addCollectionTitle}
              </p>
              
              <div className="flex flex-col gap-1">
                <input
                  type="text"
                  required
                  disabled={!isAdminUser}
                  placeholder="Nombre de la Colección (ej: Silencio de Concreto)"
                  value={newColName}
                  onChange={(e) => setNewColName(e.target.value)}
                  className="bg-neutral-50 dark:bg-neutral-950 border border-gray-200 dark:border-neutral-800 px-3 py-2 text-xs outline-none focus:border-black dark:focus:border-white"
                />
              </div>

              <div className="flex flex-col gap-1">
                <input
                  type="text"
                  disabled={!isAdminUser}
                  placeholder="Pequeña descripción artística..."
                  value={newColDesc}
                  onChange={(e) => setNewColDesc(e.target.value)}
                  className="bg-neutral-50 dark:bg-neutral-950 border border-gray-200 dark:border-neutral-800 px-3 py-2 text-xs outline-none"
                />
              </div>

              <div className="flex flex-col gap-1">
                <input
                  type="url"
                  required
                  disabled={!isAdminUser}
                  placeholder="URL de Imagen de Portada (ej: https://images.unsplash.com/...)"
                  value={newColCover}
                  onChange={(e) => setNewColCover(e.target.value)}
                  className="bg-neutral-50 dark:bg-neutral-950 border border-gray-200 dark:border-neutral-800 px-3 py-2 text-xs outline-none"
                />
              </div>

              <button
                type="submit"
                disabled={isCreatingCol || !isAdminUser}
                className="w-full flex items-center justify-center gap-2 bg-black text-white dark:bg-white dark:text-black py-2 text-xs uppercase hover:opacity-95"
              >
                <FolderPlus className="w-3.5 h-3.5" />
                <span>{t.createCollectionBtn}</span>
              </button>
            </form>

            {/* List Collections */}
            <div>
              <p className="text-[11px] font-bold uppercase text-gray-400 tracking-wider mb-3">
                Colecciones Creadas ({collections.length})
              </p>
              
              <div className="space-y-3.5 max-h-[300px] overflow-y-auto pr-1">
                {collections.length > 0 ? (
                  collections.map((col) => {
                    const linkedPhotoCount = photos.filter(p => p.collectionId === col.id).length;
                    return (
                      <div key={col.id} className="flex gap-3.5 p-3 border border-neutral-100 dark:border-neutral-800 bg-neutral-50/50 dark:bg-neutral-950/20 group">
                        <img
                          src={col.coverPhotoUrl}
                          alt={col.name}
                          className="w-12 h-16 object-cover bg-neutral-200 dark:bg-neutral-850 border border-black/10 shrink-0"
                        />
                        <div className="flex-1 min-w-0">
                          <h4 className="font-bold truncate text-black dark:text-white leading-tight">{col.name}</h4>
                          <p className="text-[11px] text-gray-400 truncate mt-0.5">{col.description || 'Sin descripción'}</p>
                          <span className="inline-block text-[9px] font-mono bg-neutral-200 dark:bg-neutral-800 text-gray-600 dark:text-neutral-400 py-0.5 px-1.5 mt-2 rounded">
                            {linkedPhotoCount} fotos vinculadas
                          </span>
                        </div>
                        {isAdminUser && (
                          <button
                            onClick={() => handleDeleteCollection(col.id)}
                            className="text-red-500 hover:bg-red-50 hover:text-red-700 dark:hover:bg-red-950/50 p-2 shrink-0 self-center"
                          >
                            <Trash className="w-4 h-4" />
                          </button>
                        )}
                      </div>
                    );
                  })
                ) : (
                  <p className="text-xs text-gray-400 p-4 text-center">No has creado colecciones curadas todavía.</p>
                )}
              </div>
            </div>

          </div>

        </div>

      </div>
    )}

    </div>
  );
}

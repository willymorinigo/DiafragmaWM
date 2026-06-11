export interface Photo {
  id: string;
  instagramId?: string;
  title: string;
  caption: string;
  url: string;
  permalink?: string;
  category: string;
  isCurated: boolean;
  collectionId?: string;
  timestamp: string; // ISO date of capture or Instagram post
  createdAt: string;
  updatedAt: string;
}

export interface Collection {
  id: string;
  name: string;
  description: string;
  coverPhotoUrl: string;
  createdAt: string;
  updatedAt: string;
}

export interface ContactMessage {
  id: string;
  name: string;
  email: string;
  message: string;
  status: 'unread' | 'read' | 'replied';
  createdAt: string;
}

export interface BackupHistoryItem {
  id: string;
  timestamp: string;
  fileId: string;
  fileName: string;
  photoCount: number;
}

export interface PortfolioSettings {
  id: string;
  instagramToken?: string;
  instagramUsername?: string;
  lastSyncTime?: string;
  backupHistory: BackupHistoryItem[];
  ownerEmail: string;
}

// Global translations dictionary
export type LangType = 'es' | 'en' | 'it' | 'fr';

export interface Translations {
  title: string;
  subtitle: string;
  about: string;
  all: string;
  categories: string;
  collections: string;
  collectionsDesc: string;
  contact: string;
  contactName: string;
  contactEmail: string;
  contactMsg: string;
  contactSubmit: string;
  contactSuccess: string;
  contactSending: string;
  syncTitle: string;
  syncDesc: string;
  syncBtn: string;
  syncDemoBtn: string;
  syncing: string;
  syncSuccess: string;
  tokenLabel: string;
  tokenPlaceHolder: string;
  backupTitle: string;
  backupDesc: string;
  backupBtn: string;
  backupHistory: string;
  backupSuccess: string;
  backupWarning: string;
  noPhotos: string;
  adminPanel: string;
  adminModeActive: string;
  unverifiedWarning: string;
  loginBtn: string;
  logoutBtn: string;
  featured: string;
  filterAll: string;
  addPhotoTitle: string;
  addCollectionTitle: string;
  manageCollections: string;
  curateBtn: string;
  removeCurateBtn: string;
  deleteBtn: string;
  saveBtn: string;
  cancelBtn: string;
  details: string;
  notSaved: string;
  createCollectionBtn: string;
}

export const translationDict: Record<LangType, Translations> = {
  es: {
    title: "Encuadre Minimal",
    subtitle: "Porfolio de Fotografía Contemporánea",
    about: "Exploración de la luz, el espacio y las formas geométricas a través de la fotografía minimalista.",
    all: "Todos",
    categories: "Categorías",
    collections: "Colecciones Curadas",
    collectionsDesc: "Selecciones de obras unificadas por un concepto, luz o atmósfera.",
    contact: "Contacto",
    contactName: "Nombre",
    contactEmail: "Email",
    contactMsg: "Mensaje",
    contactSubmit: "Enviar Mensaje",
    contactSuccess: "¡Mensaje recibido con éxito! Responderé a la brevedad.",
    contactSending: "Enviando...",
    syncTitle: "Sincronización con Instagram",
    syncDesc: "Alimenta tu galería directamente de tu feed. Puedes usar el token oficial de Instagram o probar con el simulador de IA para poblar tu portfolio con fotografías temáticas.",
    syncBtn: "Sincronizar Feed Real",
    syncDemoBtn: "Simular Sincronización (Fotos de Muestra de Alta Definición)",
    syncing: "Sincronizando...",
    syncSuccess: "Sincronización completada con éxito. Las fotos han sido categorizadas por la IA.",
    tokenLabel: "Token de Acceso de Instagram Developer",
    tokenPlaceHolder: "Ingresa tu Instagram Access Token...",
    backupTitle: "Respaldos en la Nube",
    backupDesc: "Guarda copias de seguridad de tu portfolio actual (fotos categorizadas y colecciones) en tu cuenta de Google Drive de manera segura.",
    backupBtn: "Crear Respaldo en Google Drive",
    backupHistory: "Historial de Respaldos",
    backupSuccess: "Respaldo creado con éxito en Google Drive.",
    backupWarning: "Requiere iniciar sesión con Google con permisos de Drive.",
    noPhotos: "No hay fotos publicadas en esta sección. Inicia sincronización en el panel de administración.",
    adminPanel: "Gestión de Portfolio",
    adminModeActive: "Modo Administrador Activo",
    unverifiedWarning: "Inicia sesión con willymorinigo@gmail.com para administrar colecciones y sincronizar feed.",
    loginBtn: "Iniciar sesión con Google",
    logoutBtn: "Cerrar Sesión",
    featured: "Destacados",
    filterAll: "Todo",
    addPhotoTitle: "Añadir Foto Manualmente",
    addCollectionTitle: "Nueva Colección Kurada",
    manageCollections: "Gestionar Colecciones",
    curateBtn: "Destacar",
    removeCurateBtn: "Quitar Destacado",
    deleteBtn: "Eliminar",
    saveBtn: "Guardar",
    cancelBtn: "Cancelar",
    details: "Detalles",
    notSaved: "Pendiente de guardar",
    createCollectionBtn: "Crear Colección"
  },
  en: {
    title: "Minimal Frame",
    subtitle: "Contemporary Photography Portfolio",
    about: "Exploring light, space, and geometry through a minimal Photographic lens.",
    all: "All",
    categories: "Categories",
    collections: "Curated Collections",
    collectionsDesc: "Selections of artworks unified by a concept, light, or atmosphere.",
    contact: "Contact",
    contactName: "Name",
    contactEmail: "Email",
    contactMsg: "Message",
    contactSubmit: "Send Message",
    contactSuccess: "Message received successfully! I will get back to you shortly.",
    contactSending: "Sending...",
    syncTitle: "Instagram Synchronization",
    syncDesc: "Power your gallery from your feed. Use an official Instagram token or try the AI simulator to instantly populate your portfolio with themed photos.",
    syncBtn: "Sync Real Feed",
    syncDemoBtn: "Simulate Sync (HD Sample Photos)",
    syncing: "Syncing...",
    syncSuccess: "Sync completed. Photos have been categorized by AI.",
    tokenLabel: "Instagram Developer Access Token",
    tokenPlaceHolder: "Enter your Instagram Access Token...",
    backupTitle: "Cloud Backups",
    backupDesc: "Securely backup your current portfolio (categorized photos and collections) directly to your Google Drive account.",
    backupBtn: "Create Backup in Google Drive",
    backupHistory: "Backup History",
    backupSuccess: "Backup successfully created in Google Drive.",
    backupWarning: "Requires Google login with Gmail and Drive access.",
    noPhotos: "No photos published in this section. Start syncing in the administration panel.",
    adminPanel: "Portfolio Management",
    adminModeActive: "Admin Mode Active",
    unverifiedWarning: "Sign in with willymorinigo@gmail.com to manage and sync.",
    loginBtn: "Sign in with Google",
    logoutBtn: "Sign Out",
    featured: "Featured",
    filterAll: "All",
    addPhotoTitle: "Add Photo Manually",
    addCollectionTitle: "New Curated Collection",
    manageCollections: "Manage Collections",
    curateBtn: "Feature",
    removeCurateBtn: "Unfeature",
    deleteBtn: "Delete",
    saveBtn: "Save",
    cancelBtn: "Cancel",
    details: "Details",
    notSaved: "Unsaved changes",
    createCollectionBtn: "Create Collection"
  },
  it: {
    title: "Inquadratore Minimale",
    subtitle: "Portfolio di Fotografia Contemporanea",
    about: "Esplorazione della luce, dello spazio e delle forme geometriche attraverso la fotografia minimalista.",
    all: "Tutti",
    categories: "Categorie",
    collections: "Collezioni Curate",
    collectionsDesc: "Selezioni di opere unificate da un concetto, luce o atmosfera.",
    contact: "Contatto",
    contactName: "Nome",
    contactEmail: "Email",
    contactMsg: "Messaggio",
    contactSubmit: "Invia Messaggio",
    contactSuccess: "Messaggio ricevuto con successo! Ti risponderò al più presto.",
    contactSending: "Invio in corso...",
    syncTitle: "Sincronizzazione Instagram",
    syncDesc: "Alimenta la tua galleria direttamente dal tuo feed. Puoi usare il token ufficiale di Instagram o testare il simulatore AI per popolare il portfolio con foto artistiche.",
    syncBtn: "Sincronizza Feed Reale",
    syncDemoBtn: "Simula Sincronizzazione (Foto HD)",
    syncing: "In corso...",
    syncSuccess: "Sincronizzazione completata con successo. Foto categorizzate tramite IA.",
    tokenLabel: "Token Accesso Instagram Developer",
    tokenPlaceHolder: "Inserisci il tuo Instagram Access Token...",
    backupTitle: "Backup nel Cloud",
    backupDesc: "Salva copie di sicurezza del tuo portfolio corrente direttamente sul tuo account Google Drive.",
    backupBtn: "Crea Backup su Google Drive",
    backupHistory: "Cronologia dei Backup",
    backupSuccess: "Backup creato con successo su Google Drive.",
    backupWarning: "Richiede l'accesso con Google Drive attivato.",
    noPhotos: "Non ci sono ancora foto in questa sezione. Avvia la sincronizzazione nel pannello amministrativo.",
    adminPanel: "Gestione del Portfolio",
    adminModeActive: "Modalità Amministratore Attiva",
    unverifiedWarning: "Accedi con willymorinigo@gmail.com per configurare e sincronizzare.",
    loginBtn: "Accedi con Google",
    logoutBtn: "Disconnetti",
    featured: "In Evidenza",
    filterAll: "Tutto",
    addPhotoTitle: "Aggiungi Foto Manualmente",
    addCollectionTitle: "Nuova Collezione Curata",
    manageCollections: "Gestisci Collezioni",
    curateBtn: "Evidenzia",
    removeCurateBtn: "Rimuovi Evidenziato",
    deleteBtn: "Elimina",
    saveBtn: "Salva",
    cancelBtn: "Annulla",
    details: "Dettagli",
    notSaved: "Pendenti",
    createCollectionBtn: "Crea Collezione"
  },
  fr: {
    title: "Cadre Minimal",
    subtitle: "Portfolio de Photographie Contemporaine",
    about: "Exploration de la lumière, de l'espace et de la géométrie par un regard photographique minimaliste.",
    all: "Tous",
    categories: "Catégories",
    collections: "Collections Sélectionnées",
    collectionsDesc: "Séries d'œuvres de photographies unifiées par un concept d'ambiance.",
    contact: "Contact",
    contactName: "Nom",
    contactEmail: "Email",
    contactMsg: "Message",
    contactSubmit: "Envoyer Message",
    contactSuccess: "Message reçu avec succès! Nous vous répondrons sous peu.",
    contactSending: "Envoi en cours...",
    syncTitle: "Sincronisation Instagram",
    syncDesc: "Alimentez votre galerie directement depuis votre feed Instagram. Utilisez un jeton d'accès ou simulez avec l'IA pour obtenir des photos HD.",
    syncBtn: "Sincroniser Feed Réel",
    syncDemoBtn: "Simuler Sincronisation (HD photos de démonstration)",
    syncing: "Sincronisation...",
    syncSuccess: "Sincronisation terminée. Les photos ont été catégorisées par l'IA.",
    tokenLabel: "Jeton d'accès Instagram Developer",
    tokenPlaceHolder: "Saisissez votre jeton d'accès Instagram...",
    backupTitle: "Sauvegarde Cloud",
    backupDesc: "Sauvegardez de manière sécurisée votre portfolio actuel de photographies et collections directement sur votre compte Google Drive.",
    backupBtn: "Créer une Sauvegarde Google Drive",
    backupHistory: "Historique des Sauvegardes",
    backupSuccess: "Sauvegarde créée avec succès sur Google Drive.",
    backupWarning: "Nécessite une connexion Google avec accès Google Drive.",
    noPhotos: "Aucune photo publiée ici. Lancez une synchronisation dans l'onglet d'administration.",
    adminPanel: "Gestion du Portfolio",
    adminModeActive: "Mode Administrateur Actif",
    unverifiedWarning: "Connectez-vous avec willymorinigo@gmail.com pour gérer le portfolio.",
    loginBtn: "Se connecter avec Google",
    logoutBtn: "Se déconnecter",
    featured: "À la Une",
    filterAll: "Tout",
    addPhotoTitle: "Ajouter Photo Manuellement",
    addCollectionTitle: "Nouvelle Collection",
    manageCollections: "Gérer les Collections",
    curateBtn: "Mettre en avant",
    removeCurateBtn: "Retirer des favoris",
    deleteBtn: "Supprimer",
    saveBtn: "Enregistrer",
    cancelBtn: "Annuler",
    details: "Détails",
    notSaved: "Modifications non enregistrées",
    createCollectionBtn: "Créer Collection"
  }
};

import express from "express";
import path from "path";
import fs from "fs";
import { createServer as createViteServer } from "vite";
import { GoogleGenAI } from "@google/genai";
import dotenv from "dotenv";

// Load environment variables
dotenv.config();

const app = express();
const PORT = 3000;

// Enable JSON bodies
app.use(express.json());

// Initialize Gemini SDK with custom required User-Agent
let ai: GoogleGenAI | null = null;
try {
  if (process.env.GEMINI_API_KEY) {
    ai = new GoogleGenAI({
      apiKey: process.env.GEMINI_API_KEY,
      httpOptions: {
        headers: {
          'User-Agent': 'aistudio-build',
        }
      }
    });
    console.log("Gemini API initialized successfully.");
  } else {
    console.warn("GEMINI_API_KEY is not defined. AI categorization will run on fallback logic.");
  }
} catch (error) {
  console.error("Failed to initialize Gemini:", error);
}

// ------------------------------------------------------------
// API Endpoints
// ------------------------------------------------------------

app.get("/api/health", (req, res) => {
  res.json({ status: "ok", time: new Date().toISOString() });
});

// AI Categorizer proxy route (fails gracefully if no key)
app.post("/api/ai/categorize", async (req, res) => {
  const { title, caption } = req.body;
  if (!title && !caption) {
    res.status(400).json({ error: "Faltan parámetros 'title' o 'caption'" });
    return;
  }

  const promptText = `Identifica a qué categoría de portfolio de fotografía pertenece la siguiente publicación. 
Título: "${title || "Sin título"}"
Texto de la publicación: "${caption || "Sin texto"}"

Escoge EXACTAMENTE una de las siguientes categorías (responde únicamente con el término exacto):
- Landscape
- Portrait
- Street
- Architecture
- Minimal

No agregues puntos finales, explicaciones ni etiquetas de markdown. Responde solo con el nombre de la categoría exacta.`;

  try {
    if (ai) {
      const response = await ai.models.generateContent({
        model: "gemini-3.5-flash",
        contents: promptText,
      });

      const rawCategory = response.text?.trim() || "Minimal";
      // Sanitize response to make sure it matches
      const categories = ["Landscape", "Portrait", "Street", "Architecture", "Minimal"];
      const matched = categories.find(c => rawCategory.toLowerCase().includes(c.toLowerCase())) || "Minimal";
      
      res.json({ category: matched, raw: rawCategory });
    } else {
      // Graceful local fallback parsing of captions
      const text = `${title} ${caption}`.toLowerCase();
      let matched = "Minimal";
      if (text.includes("landscape") || text.includes("paisaje") || text.includes("naturaleza") || text.includes("horizonte")) {
        matched = "Landscape";
      } else if (text.includes("portrait") || text.includes("retrato") || text.includes("rostro") || text.includes("shadow")) {
        matched = "Portrait";
      } else if (text.includes("street") || text.includes("calle") || text.includes("transeúnte") || text.includes("ciudad")) {
        matched = "Street";
      } else if (text.includes("architecture") || text.includes("edificio") || text.includes("geometría") || text.includes("construcción") || text.includes("concrete")) {
        matched = "Architecture";
      }
      res.json({ category: matched, fallback: true });
    }
  } catch (error: any) {
    console.error("Error calling Gemini API:", error);
    res.json({ category: "Minimal", error: error.message });
  }
});

// Instagram API synchronizer endpoint
app.post("/api/instagram/sync", async (req, res) => {
  const { accessToken, simulate } = req.body;

  // Simulator mode (8 beautiful curated high definition pictures)
  if (simulate || !accessToken) {
    const samplePhotos = [
      {
        id: "insta_mock_1",
        title: "Geometría de Luz",
        caption: "Explorando los ángulos rectos de la arquitectura brutalista bajo el sol meridiano. #architecture #concrete #geometry",
        url: "https://images.unsplash.com/photo-1600585154340-be6161a56a0c?auto=format&fit=crop&w=1200&q=80",
        permalink: "https://instagram.com/p/insta_mock_1",
        timestamp: new Date(Date.now() - 3600000 * 1).toISOString(),
      },
      {
        id: "insta_mock_2",
        title: "Eterno Silencio",
        caption: "La línea extrema del horizonte se desvanece en un infinito vacío azul. Meditación visual. #landscape #sea #zen",
        url: "https://images.unsplash.com/photo-1507525428034-b723cf961d3e?auto=format&fit=crop&w=1200&q=80",
        permalink: "https://instagram.com/p/insta_mock_2",
        timestamp: new Date(Date.now() - 3600000 * 12).toISOString(),
      },
      {
        id: "insta_mock_3",
        title: "Estudio del Claroscuro",
        caption: "La delicadeza del retrato capturada entre la sombra densa y una sutil línea de luz incandescente. #portrait #shadow #moody",
        url: "https://images.unsplash.com/photo-1534528741775-53994a69daeb?auto=format&fit=crop&w=1200&q=80",
        permalink: "https://instagram.com/p/insta_mock_3",
        timestamp: new Date(Date.now() - 3600000 * 24).toISOString(),
      },
      {
        id: "insta_mock_4",
        title: "Reflejo Mineral",
        caption: "Líneas de cristal que cortan el azul intenso del cielo mediterráneo. Abstracción geométrica del hogar urbano. #architecture #lines #design",
        url: "https://images.unsplash.com/photo-1486406146926-c627a92ad1ab?auto=format&fit=crop&w=1200&q=80",
        permalink: "https://instagram.com/p/insta_mock_4",
        timestamp: new Date(Date.now() - 3600000 * 48).toISOString(),
      },
      {
        id: "insta_mock_5",
        title: "La Sombra del Transeúnte",
        caption: "Un instante suspendido en las calles neblinosas de la gran ciudad. La figura solitaria unida a la luz oblicua. #street #bw #film",
        url: "https://images.unsplash.com/photo-1478760329108-5c3ed9d495a0?auto=format&fit=crop&w=1200&q=80",
        permalink: "https://instagram.com/p/insta_mock_5",
        timestamp: new Date(Date.now() - 3600000 * 72).toISOString(),
      },
      {
        id: "insta_mock_6",
        title: "Esencia Orgánica",
        caption: "Estudio botánico de una planta desértica. Una sola rama estructurando formas orgánicas sobre lienzo crudo. #minimal #leaves",
        url: "https://images.unsplash.com/photo-1545241047-6083a3684587?auto=format&fit=crop&w=1200&q=80",
        permalink: "https://instagram.com/p/insta_mock_6",
        timestamp: new Date(Date.now() - 3600000 * 96).toISOString(),
      },
      {
        id: "insta_mock_7",
        title: "Ondas de Arena",
        caption: "La arena esculpida suavemente por el viento del Sahara. Silueta rítmica y sombras interminables en calma absoluta. #landscape #desert #peace",
        url: "https://images.unsplash.com/photo-1509316975850-ff9c5deb0cd9?auto=format&fit=crop&w=1200&q=80",
        permalink: "https://instagram.com/p/insta_mock_7",
        timestamp: new Date(Date.now() - 3600000 * 120).toISOString(),
      },
      {
        id: "insta_mock_8",
        title: "Espiral Calva y Mar",
        caption: "Curvas y volúmenes puros esculpidos en arquitectura blanca sobre la costa. La poética matemática de la luz solar. #architecture #minimalism",
        url: "https://images.unsplash.com/photo-1512917774080-9991f1c4c750?auto=format&fit=crop&w=1200&q=80",
        permalink: "https://instagram.com/p/insta_mock_8",
        timestamp: new Date(Date.now() - 3600000 * 144).toISOString(),
      }
    ];

    // Auto-categorize each mock photo using Gemini is active
    const categorizedPhotos = [];
    for (const photo of samplePhotos) {
      let category = "Minimal";
      try {
        if (ai) {
          const response = await ai.models.generateContent({
            model: "gemini-3.5-flash",
            contents: `Identify the photo category: Title "${photo.title}", Caption "${photo.caption}". Output strictly one of these exact words: [Landscape, Portrait, Street, Architecture, Minimal].`,
          });
          const raw = response.text?.trim() || "Minimal";
          const list = ["Landscape", "Portrait", "Street", "Architecture", "Minimal"];
          category = list.find(c => raw.toLowerCase().includes(c.toLowerCase())) || "Minimal";
        } else {
          const desc = `${photo.title} ${photo.caption}`.toLowerCase();
          if (desc.includes("landscape") || desc.includes("desert") || desc.includes("sea")) category = "Landscape";
          else if (desc.includes("portrait") || desc.includes("retrato")) category = "Portrait";
          else if (desc.includes("street") || desc.includes("transeúnte")) category = "Street";
          else if (desc.includes("architecture") || desc.includes("edificio")) category = "Architecture";
        }
      } catch (e) {
        console.error("AI Categorization failed in simulator loop:", e);
      }

      categorizedPhotos.push({
        ...photo,
        category,
      });
    }

    res.json({
      success: true,
      simulated: true,
      photos: categorizedPhotos,
      username: "willy_studio_demo",
    });
    return;
  }

  // Real Instagram API Sync
  try {
    const cleanToken = (accessToken || "").replace(/["'\s\t\r\n]/g, "").trim();
    console.log(`[sync] Token recibido. Longitud original: ${accessToken ? accessToken.length : 0}, Longitud limpia: ${cleanToken.length}`);

    if (!cleanToken) {
      throw new Error("El token de acceso de Instagram está vacío o es inválido.");
    }

    let mediaList: any[] = [];
    let linkedUsername = "instagram_user_linked";
    let success = false;
    const detailedErrors: string[] = [];

    // Strategy 1: Instagram Basic Display API (Personal/Consumer Profile)
    try {
      console.log("Sync Strategy 1: Attempting Instagram Basic Display API...");
      const url = `https://graph.instagram.com/me/media?fields=id,caption,media_type,media_url,permalink,timestamp&access_token=${cleanToken}`;
      const result = await fetch(url);
      if (result.ok) {
        const data = await result.json();
        mediaList = data.data || [];
        success = true;
        console.log("Sync Strategy 1 Succeeded.");

        // Fetch username if possible
        try {
          const uRes = await fetch(`https://graph.instagram.com/me?fields=username&access_token=${cleanToken}`);
          if (uRes.ok) {
            const uData = await uRes.json();
            if (uData.username) {
              linkedUsername = uData.username;
            }
          }
        } catch (_) {}
      } else {
        const errJson = await result.json().catch(() => ({}));
        const msg = errJson.error?.message || JSON.stringify(errJson);
        detailedErrors.push(`Basic Display API (Status ${result.status}): ${msg}`);
      }
    } catch (err: any) {
      detailedErrors.push(`Basic Display API Exception: ${err.message}`);
    }

    // Strategy 2: Meta Graph API directly checking if Page Token contains instagram_business_account
    if (!success) {
      try {
        console.log("Sync Strategy 2: Checking if token is Page or User token...");
        const checkUrl = `https://graph.facebook.com/me?fields=id,name,category&access_token=${cleanToken}`;
        const checkRes = await fetch(checkUrl);
        if (checkRes.ok) {
          const checkData = await checkRes.json();
          const isPage = !!checkData.category;
          
          if (isPage) {
            console.log(`Token belongs to page "${checkData.name}". Querying linked instagram account...`);
            const url = `https://graph.facebook.com/me?fields=instagram_business_account{id,username},id,name&access_token=${cleanToken}`;
            const result = await fetch(url);
            if (result.ok) {
              const data = await result.json();
              if (data.instagram_business_account && data.instagram_business_account.id) {
                const igId = data.instagram_business_account.id;
                linkedUsername = data.instagram_business_account.username || data.name || "instagram_business_user";
                console.log(`Found linked Instagram Business Account: ${igId} (@${linkedUsername})`);

                // Fetch media from Instagram Business account
                const mediaUrl = `https://graph.facebook.com/${igId}/media?fields=id,caption,media_type,media_url,permalink,timestamp&access_token=${cleanToken}`;
                const mediaRes = await fetch(mediaUrl);
                if (mediaRes.ok) {
                  const mediaData = await mediaRes.json();
                  mediaList = mediaData.data || [];
                  success = true;
                  console.log("Sync Strategy 2 Succeeded.");
                } else {
                  const mErr = await mediaRes.json().catch(() => ({}));
                  detailedErrors.push(`Meta Graph /${igId}/media (Status ${mediaRes.status}): ${mErr.error?.message || JSON.stringify(mErr)}`);
                }
              } else {
                detailedErrors.push(`Meta Graph /me succeeded but page "${checkData.name}" has no linked Instagram Business Account.`);
              }
            } else {
              const errJson = await result.json().catch(() => ({}));
              detailedErrors.push(`Meta Graph /me secondary fetch failed: ${errJson.error?.message || JSON.stringify(errJson)}`);
            }
          } else {
            detailedErrors.push(`Token matches Facebook User account "${checkData.name}" (Direct page instagram_business_account fetch bypassed).`);
          }
        } else {
          const errJson = await checkRes.json().catch(() => ({}));
          detailedErrors.push(`Meta Graph /me (Status ${checkRes.status}): ${errJson.error?.message || JSON.stringify(errJson)}`);
        }
      } catch (err: any) {
        detailedErrors.push(`Meta Graph /me Exception: ${err.message}`);
      }
    }

    // Strategy 3: Meta Graph API via User Accounts (/me/accounts) to list Pages linked to Instagram
    if (!success) {
      try {
        console.log("Sync Strategy 3: Attempting Meta Graph API via accounts listing...");
        const url = `https://graph.facebook.com/me/accounts?fields=id,name,access_token,instagram_business_account{id,username}&access_token=${cleanToken}`;
        const result = await fetch(url);
        if (result.ok) {
          const data = await result.json();
          const pages = data.data || [];
          let foundIgId = "";
          let pageTokenToUse = "";

          for (const page of pages) {
            if (page.instagram_business_account && page.instagram_business_account.id) {
              foundIgId = page.instagram_business_account.id;
              pageTokenToUse = page.access_token || cleanToken;
              linkedUsername = page.instagram_business_account.username || page.name || "instagram_business_user";
              console.log(`Found Instagram Business Account ${foundIgId} on Facebook page: ${page.name}`);
              break;
            }
          }

          if (foundIgId) {
            const mediaUrl = `https://graph.facebook.com/${foundIgId}/media?fields=id,caption,media_type,media_url,permalink,timestamp&access_token=${pageTokenToUse}`;
            const mediaRes = await fetch(mediaUrl);
            if (mediaRes.ok) {
              const mediaData = await mediaRes.json();
              mediaList = mediaData.data || [];
              success = true;
              console.log("Sync Strategy 3 Succeeded.");
            } else {
              const mErr = await mediaRes.json().catch(() => ({}));
              detailedErrors.push(`Meta Graph User Account /${foundIgId}/media (Status ${mediaRes.status}): ${mErr.error?.message || JSON.stringify(mErr)}`);
            }
          } else {
            detailedErrors.push(`Meta/Facebook accounts fetched but no pages has an Instagram Business account linked.`);
          }
        } else {
          const errJson = await result.json().catch(() => ({}));
          detailedErrors.push(`Meta Graph /me/accounts (Status ${result.status}): ${errJson.error?.message || JSON.stringify(errJson)}`);
        }
      } catch (err: any) {
        detailedErrors.push(`Meta Graph /me/accounts Exception: ${err.message}`);
      }
    }

    // Strategy 4: Facebook Page Photos Direct (if token is a Page Access Token)
    if (!success) {
      try {
        console.log("Sync Strategy 4: Fetching Facebook Page Photos directly via /me/photos...");
        const url = `https://graph.facebook.com/me/photos?type=uploaded&fields=id,name,images,link,created_time&access_token=${cleanToken}`;
        const result = await fetch(url);
        if (result.ok) {
          const data = await result.json();
          const photos = data.data || [];
          if (photos.length > 0) {
            mediaList = photos.map((p: any) => ({
              id: p.id,
              caption: p.name || "",
              media_type: "IMAGE",
              media_url: p.images?.[0]?.source || p.picture || "",
              permalink: p.link || "",
              timestamp: p.created_time || new Date().toISOString(),
            }));
            success = true;
            linkedUsername = "facebook_page_photos";
            console.log(`Sync Strategy 4 Succeeded. Fetched ${mediaList.length} photos.`);
          } else {
            detailedErrors.push(`Facebook Page /me/photos returned 0 photos.`);
          }
        } else {
          const errJson = await result.json().catch(() => ({}));
          detailedErrors.push(`Facebook Page /me/photos (Status ${result.status}): ${errJson.error?.message || JSON.stringify(errJson)}`);
        }
      } catch (err: any) {
        detailedErrors.push(`Facebook Page /me/photos Exception: ${err.message}`);
      }
    }

    // Strategy 5: Facebook Page Photos via User Accounts (/me/accounts -> checking /photos for listed pages)
    if (!success) {
      try {
        console.log("Sync Strategy 5: Fetching Facebook Page Photos via registered /me/accounts...");
        const url = `https://graph.facebook.com/me/accounts?fields=id,name,access_token&access_token=${cleanToken}`;
        const result = await fetch(url);
        if (result.ok) {
          const data = await result.json();
          const pages = data.data || [];
          if (pages.length > 0) {
            console.log(`Found ${pages.length} Facebook pages to check for photos.`);
            for (const page of pages) {
              const pageToken = page.access_token || cleanToken;
              console.log(`Attempting to fetch photos for page: ${page.name} (${page.id})`);
              const pUrl = `https://graph.facebook.com/${page.id}/photos?type=uploaded&fields=id,name,images,link,created_time&access_token=${pageToken}`;
              const pRes = await fetch(pUrl);
              if (pRes.ok) {
                const pData = await pRes.json().catch(() => null);
                const photos = pData?.data || [];
                if (photos.length > 0) {
                  mediaList = photos.map((p: any) => ({
                    id: p.id,
                    caption: p.name || "",
                    media_type: "IMAGE",
                    media_url: p.images?.[0]?.source || p.picture || "",
                    permalink: p.link || "",
                    timestamp: p.created_time || new Date().toISOString(),
                  }));
                  success = true;
                  linkedUsername = page.name || "facebook_page_photos";
                  console.log(`Sync Strategy 5 Succeeded for page ${page.name}. Fetched ${mediaList.length} photos.`);
                  break;
                } else {
                  detailedErrors.push(`Facebook Page ${page.name} /photos returned 0 photos.`);
                }
              } else {
                const pErr = await pRes.json().catch(() => ({}));
                detailedErrors.push(`Facebook Page ${page.name} /photos (Status ${pRes.status}): ${pErr.error?.message || JSON.stringify(pErr)}`);
              }
            }
          } else {
            detailedErrors.push(`Meta Graph /me/accounts returned 0 pages in Strategy 5.`);
          }
        } else {
          const errJson = await result.json().catch(() => ({}));
          detailedErrors.push(`Meta/Facebook accounts fetched (Status ${result.status}): ${errJson.error?.message || JSON.stringify(errJson)}`);
        }
      } catch (err: any) {
        detailedErrors.push(`Meta/Facebook accounts Exception in Strategy 5: ${err.message}`);
      }
    }

    // Strategy 6: Facebook Page Feed with full_picture (if token is page token or user token has pages)
    if (!success) {
      try {
        console.log("Sync Strategy 6: Fetching Facebook Page Feed directly via /me/feed...");
        const url = `https://graph.facebook.com/me/feed?fields=id,message,full_picture,permalink_url,created_time,status_type&access_token=${cleanToken}`;
        const result = await fetch(url);
        if (result.ok) {
          const data = await result.json();
          const posts = data.data || [];
          const photoPosts = posts.filter((post: any) => post.full_picture);
          if (photoPosts.length > 0) {
            mediaList = photoPosts.map((p: any) => ({
              id: p.id,
              caption: p.message || "",
              media_type: "IMAGE",
              media_url: p.full_picture,
              permalink: p.permalink_url || "",
              timestamp: p.created_time || new Date().toISOString(),
            }));
            success = true;
            linkedUsername = "facebook_page_feed";
            console.log(`Sync Strategy 6 Succeeded. Fetched ${mediaList.length} photo items from Page Feed.`);
          } else {
            detailedErrors.push(`Facebook Page /me/feed returned 0 items with pictures.`);
          }
        } else {
          const errJson = await result.json().catch(() => ({}));
          detailedErrors.push(`Facebook Page /me/feed (Status ${result.status}): ${errJson.error?.message || JSON.stringify(errJson)}`);
        }
      } catch (err: any) {
        detailedErrors.push(`Facebook Page /me/feed Exception: ${err.message}`);
      }
    }

    // Strategy 7: Facebook Page Feed via User Accounts (/me/accounts -> /feed)
    if (!success) {
      try {
        console.log("Sync Strategy 7: Fetching Facebook Page Feed via /me/accounts...");
        const url = `https://graph.facebook.com/me/accounts?fields=id,name,access_token&access_token=${cleanToken}`;
        const result = await fetch(url);
        if (result.ok) {
          const data = await result.json();
          const pages = data.data || [];
          for (const page of pages) {
            const pageToken = page.access_token || cleanToken;
            console.log(`Attempting to fetch feed for page: ${page.name} (${page.id})`);
            const feedUrl = `https://graph.facebook.com/${page.id}/feed?fields=id,message,full_picture,permalink_url,created_time,status_type&access_token=${pageToken}`;
            const feedRes = await fetch(feedUrl);
            if (feedRes.ok) {
              const feedData = await feedRes.json();
              const posts = feedData.data || [];
              const photoPosts = posts.filter((post: any) => post.full_picture);
              if (photoPosts.length > 0) {
                mediaList = photoPosts.map((p: any) => ({
                  id: p.id,
                  caption: p.message || "",
                  media_type: "IMAGE",
                  media_url: p.full_picture,
                  permalink: p.permalink_url || "",
                  timestamp: p.created_time || new Date().toISOString(),
                }));
                success = true;
                linkedUsername = page.name || "facebook_page_feed";
                console.log(`Sync Strategy 7 Succeeded for page ${page.name}. Fetched ${mediaList.length} photos.`);
                break;
              }
            }
          }
        }
      } catch (err: any) {
        detailedErrors.push(`Strategy 7 Exception: ${err.message}`);
      }
    }

    if (!success) {
      const combinedMsg = detailedErrors.join(" // ");
      throw new Error(`Instagram/Facebook Sync failed. Error details: ${combinedMsg}`);
    }

    // Filter to retain only images
    const imagesOnly = mediaList.filter((item: any) => 
      item.media_type === "IMAGE" || item.media_type === "CAROUSEL_ALBUM"
    );


    const processedPhotos = [];
    for (const item of imagesOnly) {
      // Get title from caption's first line, or default to generic title
      let title = "Obras sin título";
      const lines = item.caption ? item.caption.split("\n") : [];
      if (lines.length > 0 && lines[0].length < 60 && !lines[0].startsWith("#")) {
        title = lines[0].replace(/^[ \t\r\n#*-]+/g, "");
      }

      // Auto classify with Gemini
      let category = "Minimal";
      try {
        if (ai) {
          const gemRes = await ai.models.generateContent({
            model: "gemini-3.5-flash",
            contents: `Identify the photo category: Title "${title}", Caption "${item.caption || ""}". Output strictly one of these exact words: [Landscape, Portrait, Street, Architecture, Minimal].`,
          });
          const raw = gemRes.text?.trim() || "Minimal";
          const list = ["Landscape", "Portrait", "Street", "Architecture", "Minimal"];
          category = list.find(c => raw.toLowerCase().includes(c.toLowerCase())) || "Minimal";
        } else {
          const desc = `${title} ${item.caption || ""}`.toLowerCase();
          if (desc.includes("landscape") || desc.includes("desert") || desc.includes("sea")) category = "Landscape";
          else if (desc.includes("portrait") || desc.includes("shadow")) category = "Portrait";
          else if (desc.includes("street")) category = "Street";
          else if (desc.includes("architecture")) category = "Architecture";
        }
      } catch (err) {
        console.error("Gemini sync failed for post:", item.id);
      }

      processedPhotos.push({
        id: `insta_${item.id}`,
        instagramId: item.id,
        title,
        caption: item.caption || "",
        url: item.media_url,
        permalink: item.permalink,
        category,
        timestamp: item.timestamp || new Date().toISOString(),
      });
    }

    res.json({
      success: true,
      simulated: false,
      photos: processedPhotos,
      username: linkedUsername,
    });

  } catch (error: any) {
    console.error("Instagram sync failed:", error);
    
    let diagInfo = "";
    try {
      const cleanToken = (accessToken || "").replace(/["'\s\t\r\n]/g, "").trim();
      if (cleanToken) {
        const diagRes = await fetch(`https://graph.facebook.com/me?fields=id,name,category&access_token=${cleanToken}`);
        const diagData = diagRes.ok ? await diagRes.json() : null;
        
        const permRes = await fetch(`https://graph.facebook.com/me/permissions?access_token=${cleanToken}`);
        const permData = permRes.ok ? await permRes.json() : null;
        
        if (diagData) {
          const isPage = !!diagData.category;
          diagInfo += `\n\n=== DIAGNÓSTICO DE TU ACCESO A META POR EL SERVIDOR ===\n`;
          diagInfo += `• Cuenta de Meta vinculada: ${diagData.name} (ID: ${diagData.id})\n`;
          diagInfo += `• Tipo de cuenta identificada en este Token: ${isPage ? `Página de Facebook ("${diagData.category || "Página"}")` : "Usuario de Facebook"}\n`;
          
          if (permData && permData.data) {
            const granted = permData.data
              .filter((p: any) => p.status === "granted")
              .map((p: any) => p.permission);
            diagInfo += `• Permisos que diste a este Token: [${granted.join(", ")}]\n`;
            
            diagInfo += `\n🛠️ CÓMO SOLUCIONAR EL ERROR DE ACCESO EN FACEBOOK DE ENTRADA:\n`;
            if (isPage) {
              if (!granted.includes("instagram_basic")) {
                diagInfo += `❌ Falta el permiso 'instagram_basic'. Activa este permiso en la herramienta Meta Graph Explorer antes de generar y copiar tu token de larga duración de la Página.\n`;
              }
              if (!granted.includes("pages_read_engagement") && !granted.includes("pages_read_user_content")) {
                diagInfo += `❌ Falta el permiso 'pages_read_engagement' o 'pages_read_user_content' en tu token de Página para poder leer sus imágenes o Feed.\n`;
              }
              diagInfo += `👉 Si estás conectando tu Página de Facebook "Diafragmawm", asegúrate de que tu cuenta de Instagram esté convertida en Perfil Comercial (Negocio o Creador) desde la app del móvil y esté formalmente "Cuentas vinculadas > Instagram" en el menú de Configuración de tu Página de Facebook.\n`;
            } else {
              diagInfo += `👉 Si estás usando un token de Usuario, marca las opciones 'instagram_basic', 'pages_show_list' y 'pages_read_engagement' en los alcances (scopes) al obtener tu token.\n`;
            }
          } else {
            diagInfo += `• No se pudieron recuperar tus permisos concedidos. Selecciona más casillas de permisos al generar tu token en el Meta Graph Explorer.\n`;
          }
        } else {
          diagInfo += `\n⚠️ No pudimos identificar tu cuenta de Meta con ese Token de acceso. Comprueba que copiaste el token completo desde la herramienta sin cortes de caracteres.`;
        }
      }
    } catch (diagErr: any) {
      console.error("Diagnosis internal error:", diagErr);
    }

    const finalErrorMsg = `${error.message || "Fallo en la sincronización"}${diagInfo}`;
    res.status(500).json({ error: finalErrorMsg });
  }
});

// ------------------------------------------------------------
// Client-Side Route Handling & Vite Middleware integration
// ------------------------------------------------------------

async function startServer() {
  if (process.env.NODE_ENV !== "production") {
    // Development mode uses Vite Dev Server as middleware
    const vite = await createViteServer({
      server: { middlewareMode: true },
      appType: "spa",
    });
    app.use(vite.middlewares);
    console.log("Vite Development Middleware integrated.");
  } else {
    // Production mode serves precompiled static client files
    const distPath = path.join(process.cwd(), "dist");
    app.use(express.static(distPath));
    app.get("*", (req, res) => {
      res.sendFile(path.join(distPath, "index.html"));
    });
    console.log("Serving compiled static assets from dist/");
  }

  app.listen(PORT, "0.0.0.0", () => {
    console.log(`Node Server listening securely at http://localhost:${PORT}`);
  });
}

startServer();

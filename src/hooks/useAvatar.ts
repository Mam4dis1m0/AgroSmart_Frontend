// src/hooks/useAvatar.ts
import { useState, useEffect } from 'react';
import { cloudinaryService } from '../APis/cloudinaryService';

const memCache: Record<string, string | null> = {};

function getGooglePicture(email: string): string | null {
  return localStorage.getItem(`agrosmart_google_picture_${email}`);
}

export function useAvatar(email: string): string | null {
  const [foto, setFoto] = useState<string | null>(null);

  useEffect(() => {
    if (!email) return;

    // 1️⃣ Google tiene SIEMPRE prioridad absoluta
    const gPic = getGooglePicture(email);
    if (gPic) {
      memCache[email] = gPic;
      setFoto(gPic);
      return;
    }

    // 2️⃣ Caché en memoria (Cloudinary ya verificado)
    if (email in memCache) {
      setFoto(memCache[email]);
      return;
    }

    // 3️⃣ Verifica Cloudinary como fallback
    const url = cloudinaryService.getFotoUrl(email);
    const img = new Image();
    img.onload  = () => { memCache[email] = url;  setFoto(url);  };
    img.onerror = () => { memCache[email] = null; setFoto(null); };
    img.src = url;
  }, [email]);

  return foto;
}
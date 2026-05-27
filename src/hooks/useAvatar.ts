// src/hooks/useAvatar.ts
import { useState, useEffect } from 'react';
import { cloudinaryService } from '../APis/cloudinaryService';
import { authService } from '../APis/authService';

const cache: Record<string, string | null> = {};

export function useAvatar(email: string): string | null {
  const [foto, setFoto] = useState<string | null>(() => {
    // Primero revisa si tiene foto de Google (instantáneo, sin petición)
    return authService.getGooglePicture(email) ?? cache[email] ?? null;
  });

  useEffect(() => {
    if (!email) return;

    // Si tiene foto de Google, úsala directamente
    const googlePic = authService.getGooglePicture(email);
    if (googlePic) {
      setFoto(googlePic);
      return;
    }

    // Si ya está en caché de Cloudinary
    if (email in cache) {
      setFoto(cache[email]);
      return;
    }

    // Verifica si tiene foto en Cloudinary
    const url = cloudinaryService.getFotoUrl(email);
    const img = new Image();
    img.onload  = () => { cache[email] = url;  setFoto(url);  };
    img.onerror = () => { cache[email] = null; setFoto(null); };
    img.src = `${url}?t=${Date.now()}`;
  }, [email]);

  return foto;
}
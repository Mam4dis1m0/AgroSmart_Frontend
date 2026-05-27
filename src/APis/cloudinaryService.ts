// src/APis/cloudinaryService.ts

const CLOUD_NAME = 'dv4ufjzse';       // ← reemplaza
const UPLOAD_PRESET = 'agrosmart_avatars'; // ← el que creaste

export const cloudinaryService = {

  // Sube foto y devuelve URL pública permanente
  async subirFoto(email: string, file: File): Promise<string> {
    const formData = new FormData();
    formData.append('file', file);
    formData.append('upload_preset', UPLOAD_PRESET);
    // Usa el email como public_id para sobreescribir siempre la misma foto
    formData.append('public_id', `avatars/${email.replace(/[@.]/g, '_')}`);
    formData.append('overwrite', 'true');
    formData.append('invalidate', 'true'); // limpia la caché CDN

    const res = await fetch(
      `https://api.cloudinary.com/v1_1/${CLOUD_NAME}/image/upload`,
      { method: 'POST', body: formData }
    );

    if (!res.ok) throw new Error('Error al subir la foto');
    const data = await res.json();
    return data.secure_url; // URL pública accesible desde cualquier PC
  },

  // Genera la URL de la foto a partir del email (sin hacer petición)
  getFotoUrl(email: string): string {
    const publicId = `avatars/${email.replace(/[@.]/g, '_')}`;
    return `https://res.cloudinary.com/${CLOUD_NAME}/image/upload/${publicId}`;
  },
};
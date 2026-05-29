// src/APis/cloudinaryService.ts
const CLOUD_NAME = 'dv4ufjzse';     
const UPLOAD_PRESET = 'agrosmart_avatars';

export const cloudinaryService = {

  async subirFoto(email: string, file: File): Promise<string> {
    const formData = new FormData();
    formData.append('file', file);
    formData.append('upload_preset', UPLOAD_PRESET);
    formData.append('public_id', `avatars/${email.replace(/[@.]/g, '_')}`);
    formData.append('overwrite', 'true');
    formData.append('invalidate', 'true');

    const res = await fetch(
      `https://api.cloudinary.com/v1_1/${CLOUD_NAME}/image/upload`,
      { method: 'POST', body: formData }
    );
    if (!res.ok) throw new Error('Error al subir foto');
    const data = await res.json();
    return data.secure_url;
  },

  // Cualquier PC con el email puede obtener la foto
  getFotoUrl(email: string): string {
    const publicId = `avatars/${email.replace(/[@.]/g, '_')}`;
    return `https://res.cloudinary.com/${CLOUD_NAME}/image/upload/q_auto,f_auto/${publicId}`;
  },
};
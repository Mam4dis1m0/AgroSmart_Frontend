// src/APis/authService.ts
const API_URL = 'http://localhost:3000';

export interface Usuario {
  id: number;
  nombre: string;
  email: string;
  role: 'admin' | 'empleado';
  fotoperfil?: string | null;
}

export interface LoginResponse {
  usuario: Usuario;
}

export const authService = {

  // ── Login tradicional ─────────────────────────────────────────────────────
  async login(email: string, contrasena: string): Promise<LoginResponse> {
    const response = await fetch(`${API_URL}/usuarios/login`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ email, contrasena }),
      credentials: 'include',
    });

    if (!response.ok) {
      const error = await response.json();
      throw new Error(error.message || 'Error en login');
    }

    const data = await response.json();
    localStorage.setItem('usuario', JSON.stringify(data.usuario));
    return data;
  },

  // En authService.ts — método loginConGoogle
// Después de obtener perfil.picture, súbela a Cloudinary automáticamente
async loginConGoogle(accessToken: string): Promise<{ usuario: Usuario; picture: string; fullName: string }> {
  const perfil = await fetch('https://www.googleapis.com/oauth2/v3/userinfo', {
    headers: { Authorization: `Bearer ${accessToken}` },
  }).then(r => r.json());

  const res = await fetch(`http://localhost:3000/usuarios/login-google`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ email: perfil.email }),
  });

  if (!res.ok) {
    const err = await res.json();
    throw new Error(err.message || 'Correo no registrado en AgroSmart');
  }

  const data = await res.json();
  const usuarioFinal: Usuario = { ...data.usuario, nombre: perfil.name };

  localStorage.setItem('usuario', JSON.stringify(usuarioFinal));
  localStorage.setItem(`agrosmart_google_picture_${perfil.email}`, perfil.picture);
  localStorage.setItem(`agrosmart_nombre_${perfil.email}`, perfil.name);

  // ── NUEVO: sube la foto de Google a Cloudinary para que sea global ──
  try {
    // Descarga la imagen de Google como blob
    const imgRes  = await fetch(perfil.picture);
    const blob    = await imgRes.blob();
    const file    = new File([blob], 'avatar.jpg', { type: 'image/jpeg' });

    // Sube a Cloudinary con el mismo public_id que usa useAvatar
    const formData = new FormData();
    formData.append('file', file);
    formData.append('upload_preset', 'agrosmart_avatars');
    formData.append('public_id', `avatars/${perfil.email.replace(/[@.]/g, '_')}`);
    formData.append('overwrite', 'true');
    formData.append('invalidate', 'true');

    await fetch(
      `https://api.cloudinary.com/v1_1/TU_CLOUD_NAME/image/upload`,
      { method: 'POST', body: formData }
    );
  } catch {
    // No bloquea el login si falla Cloudinary
  }

  try {
    await fetch(`http://localhost:3000/usuarios/${data.usuario.id}/nombre`, {
      method: 'PUT',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ nombremostrar: perfil.name }),
    });
  } catch { /* no bloquea */ }

  return { usuario: usuarioFinal, picture: perfil.picture, fullName: perfil.name };
},

  // ── Sesión ────────────────────────────────────────────────────────────────
  getUsuario(): Usuario | null {
    const raw = localStorage.getItem('usuario');
    return raw ? JSON.parse(raw) : null;
  },

  logout(): void {
    localStorage.removeItem('usuario');
  },

  isAuthenticated(): boolean {
    return !!this.getUsuario();
  },

  isAdmin(): boolean {
    return this.getUsuario()?.role === 'admin';
  },

  isEmpleado(): boolean {
    return this.getUsuario()?.role === 'empleado';
  },

  // ── Foto de Google ────────────────────────────────────────────────────────
  getGooglePicture(email: string): string | null {
    return localStorage.getItem(`agrosmart_google_picture_${email}`);
  },

  async forgotPassword(email: string): Promise<void> {
  const res = await fetch(`${API_URL}/usuarios/forgot-password`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ email }),
  });
  if (!res.ok) {
    const err = await res.json();
    throw new Error(err.message ?? 'Error al enviar el correo');
  }
},

async resetPassword(token: string, nuevaContrasena: string): Promise<void> {
  const res = await fetch(`${API_URL}/usuarios/reset-password`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ token, nuevaContrasena }),
  });
  if (!res.ok) {
    const err = await res.json();
    throw new Error(err.message ?? 'Error al restablecer la contraseña');
  }
},
  // ── Cambiar contraseña ────────────────────────────────────────────────────
  async cambiarPassword(id: number, contrasenaActual: string, contrasenaNueva: string): Promise<void> {
    const res = await fetch(`${API_URL}/usuarios/${id}/password`, {
      method: 'PUT',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ contrasenaActual, contrasenaNueva }),
    });

    if (!res.ok) {
      const error = await res.json();
      throw new Error(error.message ?? 'Error al cambiar la contraseña');
    }
  },
};
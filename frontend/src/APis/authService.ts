const API_URL = 'http://localhost:3000';

export interface Usuario {
  id: number;
  nombre: string;
  email: string;
  role: 'admin' | 'empleado';
}

export interface LoginResponse {
  usuario: Usuario;
}

export interface AuthState {
  usuario: Usuario | null;
  isAuthenticated: boolean;
}

export const authService = {
  // Login con el backend
  async login(email: string, contrasena: string): Promise<LoginResponse> {
    const response = await fetch(`${API_URL}/usuarios/login`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({ email, contrasena }),
      credentials: 'include',
    });

    if (!response.ok) {
      const error = await response.json();
      throw new Error(error.message || 'Error en login');
    }

    const data = await response.json();
    
    // Guardar usuario en localStorage
    localStorage.setItem('usuario', JSON.stringify(data.usuario));
    
    return data;
  },

  // Obtener usuario guardado
  getUsuario(): Usuario | null {
    const usuario = localStorage.getItem('usuario');
    return usuario ? JSON.parse(usuario) : null;
  },

  // Logout
  logout(): void {
    localStorage.removeItem('usuario');
  },

  // Verificar si está autenticado
  isAuthenticated(): boolean {
    return !!this.getUsuario();
  },

  // Verificar si es admin
  isAdmin(): boolean {
    const usuario = this.getUsuario();
    return usuario?.role === 'admin';
  },

  // Verificar si es empleado
  isEmpleado(): boolean {
    const usuario = this.getUsuario();
    return usuario?.role === 'empleado';
  },
};

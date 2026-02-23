import axios from "axios";
import type { TipoSesion, ReservaFormData, Reserva } from "../types";

const API_URL = import.meta.env.VITE_API_URL || "http://localhost:5000/api";

const api = axios.create({
  baseURL: API_URL,
  headers: {
    "Content-Type": "application/json",
  },
});

// Servicios de API
const apiService = {
  // Health check
  healthCheck: async () => {
    const response = await api.get("/health");
    return response.data;
  },

  // Tipos de sesión
  getTiposSesion: async (): Promise<TipoSesion[]> => {
    const response = await api.get("/tipos-sesion");
    return response.data;
  },

  // Crear reserva
  createReserva: async (data: ReservaFormData) => {
    const response = await api.post("/reservas", data);
    return response.data;
  },

  // Obtener todas las reservas
  getAllReservas: async (): Promise<Reserva[]> => {
    const response = await api.get("/reservas");
    return response.data;
  },

  // Actualizar estado de reserva
  updateReservaEstado: async (id: string, estado: string) => {
    const response = await api.patch(`/reservas/${id}/estado`, { estado });
    return response.data;
  },

  // Obtener disponibilidad (para futuro)
  getDisponibilidad: async (fecha: string) => {
    const response = await api.get(`/disponibilidad?fecha=${fecha}`);
    return response.data;
  },

  // Eliminar múltiples reservas
  deleteReservas: async (ids: string[]) => {
    const response = await api.post('/reservas/delete', { ids });
    return response.data;
  },

  // ==========================================
  // DISPONIBILITAT HORÀRIA
  // ==========================================
  
  // Obtenir disponibilitat per data
  getDisponibilidadPorFecha: async (fecha: string) => {
    const response = await api.get(`/disponibilidad/${fecha}`);
    return response.data;
  },

  // Crear franges horàries per una data
  crearDisponibilidad: async (fecha: string, horarios: { horaInicio: string; horaFin: string }[]) => {
    const response = await api.post('/disponibilidad', { fecha, horarios });
    return response.data;
  },

  // Eliminar franja horària
  eliminarDisponibilidad: async (id: string) => {
    const response = await api.delete(`/disponibilidad/${id}`);
    return response.data;
  },

  // Bloquejar/desbloquejar franja
  toggleDisponibilidad: async (id: string) => {
    const response = await api.patch(`/disponibilidad/${id}/toggle`);
    return response.data;
  },

  // ==========================================
  // AUTENTICACIÓ
  // ==========================================
  
  // Login
  login: async (email: string, password: string) => {
    const response = await api.post("/auth/login", { email, password });
    return response.data;
  },

  // Verificar token
  verifyToken: async () => {
    const token = localStorage.getItem("token");
    if (!token) throw new Error("No token found");

    const response = await api.get("/auth/verify", {
      headers: {
        Authorization: `Bearer ${token}`,
      },
    });
    return response.data;
  },

  // Logout
  logout: () => {
    localStorage.removeItem("token");
    localStorage.removeItem("admin");
  },
};

// IMPORTANT: Exportar apiService com a default
export default apiService;
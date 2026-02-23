export interface TipoSesion {
  id: string;
  nombre: string;
  descripcion?: string;
  duracion: number;
  precio?: number;
  activo: boolean;
}

export interface Cliente {
  id: string;
  nombre: string;
  email: string;
  telefono: string;
}

export interface Reserva {
  id?: string;
  clienteId?: string;
  tipoSesionId: string;
  fechaHora: string;
  comentarios?: string;
  estado?: string;
  cliente?: Cliente;
  tipoSesion?: TipoSesion;
}

export interface ReservaFormData {
  nombre: string;
  email: string;
  telefono: string;
  tipoSesionId: string;
  fechaHora: string;
  comentarios?: string;
}
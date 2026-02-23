import { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import apiService from '../services/api';
import { AxiosError } from 'axios';

interface Reserva {
  id: string;
  cliente?: {
    nombre: string;
    email: string;
  };
  tipoSesion?: {
    nombre: string;
  };
}

interface DisponibilidadHoraria {
  id: string;
  fecha: string;
  horaInicio: string;
  horaFin: string;
  disponible: boolean;
  reservaId?: string;
  reserva?: Reserva;
}

export default function CalendarioDisponibilidadPage() {
  const navigate = useNavigate();
  const [fechaSeleccionada, setFechaSeleccionada] = useState<string>('');
  const [disponibilidad, setDisponibilidad] = useState<DisponibilidadHoraria[]>([]);
  const [loading, setLoading] = useState(false);
  const [mostrarFormulario, setMostrarFormulario] = useState(false);
  
  const [horaInicio, setHoraInicio] = useState('09:00');
  const [horaFin, setHoraFin] = useState('20:00');
  const [intervalo, setIntervalo] = useState(60);

  useEffect(() => {
    const hoy = new Date().toISOString().split('T')[0];
    setFechaSeleccionada(hoy);
  }, []);

  useEffect(() => {
    if (fechaSeleccionada) {
      cargarDisponibilidad();
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [fechaSeleccionada]);

  const cargarDisponibilidad = async () => {
    try {
      setLoading(true);
      const data = await apiService.getDisponibilidadPorFecha(fechaSeleccionada);
      setDisponibilidad(data);
    } catch (err) {
      console.error('Error carregant disponibilitat:', err);
    } finally {
      setLoading(false);
    }
  };

  const generarFranges = () => {
    const franges: { horaInicio: string; horaFin: string }[] = [];
    const [horaInicioH, horaInicioM] = horaInicio.split(':').map(Number);
    const [horaFinH, horaFinM] = horaFin.split(':').map(Number);
    let currentMinutes = horaInicioH * 60 + horaInicioM;
    const endMinutes = horaFinH * 60 + horaFinM;
    
    while (currentMinutes < endMinutes) {
      const startH = Math.floor(currentMinutes / 60);
      const startM = currentMinutes % 60;
      const start = `${String(startH).padStart(2, '0')}:${String(startM).padStart(2, '0')}`;
      currentMinutes += intervalo;
      const endH = Math.floor(currentMinutes / 60);
      const endM = currentMinutes % 60;
      const end = `${String(endH).padStart(2, '0')}:${String(endM).padStart(2, '0')}`;
      franges.push({ horaInicio: start, horaFin: end });
    }
    return franges;
  };

  const handleCrearFranges = async () => {
    try {
      const franges = generarFranges();
      await apiService.crearDisponibilidad(fechaSeleccionada, franges);
      alert(`${franges.length} franges creades correctament`);
      setMostrarFormulario(false);
      cargarDisponibilidad();
    } catch (err) {
      const axiosError = err as AxiosError<{ message: string }>;
      alert('Error: ' + (axiosError.response?.data?.message || axiosError.message));
    }
  };

  const handleEliminarFranja = async (id: string) => {
    if (!window.confirm('Segur que vols eliminar aquesta franja?')) return;
    try {
      await apiService.eliminarDisponibilidad(id);
      alert('Franja eliminada');
      cargarDisponibilidad();
    } catch (err) {
      const axiosError = err as AxiosError<{ message: string }>;
      alert('Error: ' + (axiosError.response?.data?.message || axiosError.message));
    }
  };

  const handleToggleDisponible = async (id: string) => {
    try {
      await apiService.toggleDisponibilidad(id);
      cargarDisponibilidad();
    } catch (err) {
      const axiosError = err as AxiosError<{ message: string }>;
      alert('Error: ' + (axiosError.response?.data?.message || axiosError.message));
    }
  };

  return (
    <div className="calendario-container">
      {/* Header */}
      <div className="calendario-header">
        <h1 className="calendario-title">
          Gestió d'Horaris Disponibles
        </h1>
        <button
          onClick={() => navigate('/admin')}
          className="btn-primary"
        >
          ← Tornar al Panel
        </button>
      </div>

      {/* Controls */}
      <div className="calendario-controls">
        <label>Selecciona data:</label>
        <input
          type="date"
          value={fechaSeleccionada}
          onChange={(e) => setFechaSeleccionada(e.target.value)}
        />
        <button
          onClick={() => setMostrarFormulario(!mostrarFormulario)}
          className="btn-primary"
        >
          {mostrarFormulario ? 'Cancel·lar' : '+ Afegir Franges'}
        </button>
      </div>

      {/* Formulario para crear franjas */}
      {mostrarFormulario && (
        <div className="franjas-form">
          <h3>Generar Franges Horàries</h3>
          <div className="franjas-grid">
            <div>
              <label>Hora Inici:</label>
              <input
                type="time"
                value={horaInicio}
                onChange={(e) => setHoraInicio(e.target.value)}
              />
            </div>
            <div>
              <label>Hora Fi:</label>
              <input
                type="time"
                value={horaFin}
                onChange={(e) => setHoraFin(e.target.value)}
              />
            </div>
            <div>
              <label>Interval (minuts):</label>
              <select
                value={intervalo}
                onChange={(e) => setIntervalo(Number(e.target.value))}
              >
                <option value={30}>30 min</option>
                <option value={60}>60 min</option>
                <option value={90}>90 min</option>
                <option value={120}>120 min</option>
              </select>
            </div>
          </div>
          <p className="franjas-info">
            Es generaran {generarFranges().length} franges horàries
          </p>
          <button
            onClick={handleCrearFranges}
            className="btn-crear-franjas"
          >
            ✓ Crear Franges
          </button>
        </div>
      )}

      {/* Contenido principal */}
      {loading ? (
        <div className="admin-loading">Carregant...</div>
      ) : disponibilidad.length === 0 ? (
        <div className="calendario-empty">
          <p>No hi ha franges horàries definides per aquesta data.</p>
          <p>Fes clic a "Afegir Franges" per crear-les.</p>
        </div>
      ) : (
        <div className="franjas-disponibles">
          {disponibilidad.map((franja) => (
            <div
              key={franja.id}
              className={`franja-card ${franja.disponible ? 'disponible' : 'ocupada'}`}
            >
              <div className="franja-header">
                <span className="franja-hora">
                  {franja.horaInicio} - {franja.horaFin}
                </span>
                <span className={`franja-estado ${franja.disponible ? 'lliure' : 'ocupada'}`}>
                  {franja.disponible ? 'LLIURE' : 'OCUPADA'}
                </span>
              </div>
              
              {franja.reserva && (
                <div className="franja-reserva">
                  <p><strong>Client:</strong> {franja.reserva.cliente?.nombre}</p>
                  <p><strong>Sessió:</strong> {franja.reserva.tipoSesion?.nombre}</p>
                  <p><strong>Email:</strong> {franja.reserva.cliente?.email}</p>
                </div>
              )}
              
              {!franja.reservaId && (
                <div className="franja-actions">
                  <button
                    onClick={() => handleToggleDisponible(franja.id)}
                    className={`btn-toggle ${franja.disponible ? 'bloquear' : 'desbloquear'}`}
                  >
                    {franja.disponible ? '🔒 Bloquejar' : '🔓 Desbloquejar'}
                  </button>
                  <button
                    onClick={() => handleEliminarFranja(franja.id)}
                    className="btn-eliminar"
                  >
                    🗑️ Eliminar
                  </button>
                </div>
              )}
            </div>
          ))}
        </div>
      )}
    </div>
  );
}
import { useState, useEffect } from 'react';
import { useForm } from 'react-hook-form';
import apiService from '../services/api';
import type { ReservaFormData } from '../types';
import { AxiosError } from 'axios';

export default function BookingPage() {
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [successMessage, setSuccessMessage] = useState('');
  const [errorMessage, setErrorMessage] = useState('');
  const [horasDisponibles, setHorasDisponibles] = useState<string[]>([]);
  const [cargandoHoras, setCargandoHoras] = useState(false);

  const { register, handleSubmit, formState: { errors }, reset, watch } = useForm<ReservaFormData & { hora?: string }>();

  const fechaSeleccionada = watch('fechaHora');

  const cargarHorasDisponibles = async (fecha: string) => {
    try {
      setCargandoHoras(true);
      const disponibilidad = await apiService.getDisponibilidadPorFecha(fecha);
      
      const horasLibres = disponibilidad
        .filter((franja: { disponible: boolean; horaInicio: string }) => franja.disponible)
        .map((franja: { disponible: boolean; horaInicio: string }) => franja.horaInicio);
      
      setHorasDisponibles(horasLibres);
    } catch (err) {
      console.error('Error carregant hores:', err);
      generarHorasPorDefecto();
    } finally {
      setCargandoHoras(false);
    }
  };

  const generarHorasPorDefecto = () => {
    const horas = [];
    for (let h = 9; h <= 19; h++) {
      horas.push(`${String(h).padStart(2, '0')}:00`);
    }
    setHorasDisponibles(horas);
  };

  useEffect(() => {
    const subscription = watch((value, { name }) => {
      if (name === 'fechaHora' && value.fechaHora) {
        const fecha = value.fechaHora as string;
        cargarHorasDisponibles(fecha);
      }
    });
    return () => subscription.unsubscribe();
  }, [watch]);

  const onSubmit = async (data: ReservaFormData & { hora?: string }) => {
    setIsSubmitting(true);
    setSuccessMessage('');
    setErrorMessage('');

    try {
      const fechaHoraCompleta = `${data.fechaHora}T${data.hora}:00`;
      const dataToSend = {
        nombre: data.nombre,
        email: data.email,
        telefono: data.telefono,
        tipoSesionId: data.tipoSesionId,
        fechaHora: fechaHoraCompleta,
        comentarios: data.comentarios
      };

      await apiService.createReserva(dataToSend);
      setSuccessMessage('Reserva creada correctament! Rebràs un email de confirmació.');
      reset();
      setHorasDisponibles([]);
    } catch (error) {
      const axiosError = error as AxiosError<{ message: string }>;
      setErrorMessage(axiosError.response?.data?.message || 'Error al crear la reserva');
    } finally {
      setIsSubmitting(false);
    }
  };

  // Funció per renderitzar el selector d'hora
  const renderHoraSelector = () => {
    // Si s'ha enviat amb èxit, mostrar missatge neutre
    if (successMessage) {
      return (
        <p className="form-info">
          Selecciona una data per veure les hores disponibles
        </p>
      );
    }

    // Si està carregant
    if (cargandoHoras) {
      return (
        <p className="form-info">
          Carregant hores disponibles...
        </p>
      );
    }

    // Si no hi ha data seleccionada
    if (!fechaSeleccionada) {
      return (
        <p className="form-info">
          Selecciona primer una data per veure les hores disponibles
        </p>
      );
    }

    // Si hi ha data però no hi ha hores disponibles
    if (horasDisponibles.length === 0) {
      return (
        <p className="form-warning">
          No hi ha hores disponibles per aquesta data. Si us plau, selecciona una altra data.
        </p>
      );
    }

    // Si hi ha hores disponibles, mostrar el selector
    return (
      <select
        {...register('hora', { required: "L'hora és obligatòria" })}
        className="form-select"
      >
        <option value="">Selecciona una hora</option>
        {horasDisponibles.map((hora) => (
          <option key={hora} value={hora}>
            {hora}
          </option>
        ))}
      </select>
    );
  };

  return (
    <div className="booking-container">
      <div className="booking-wrapper">
        {/* Header */}
        <div className="booking-header">
          <h1 className="booking-title">
            Reserva la teva Sessió Fotogràfica
          </h1>
          <p className="booking-subtitle">
            La Camereta - Estudi Fotogràfic de Barcelona
          </p>
        </div>

        <div className="booking-form-container">
          <form onSubmit={handleSubmit(onSubmit)}>
            <div className="form-group">
              <label className="form-label">
                Nom Complet *
              </label>
              <input
                {...register('nombre', { required: 'El nom es obligatori' })}
                type="text"
                className="form-input"
                placeholder="El teu nom complet"
                autoComplete="name"
              />
              {errors.nombre && (
                <p className="form-error">{errors.nombre.message}</p>
              )}
            </div>

            <div className="form-group">
              <label className="form-label">
                Email *
              </label>
              <input
                {...register('email', {
                  required: 'El email es obligatori',
                  pattern: {
                    value: /^[A-Z0-9._%+-]+@[A-Z0-9.-]+\.[A-Z]{2,}$/i,
                    message: 'Email invàlid'
                  }
                })}
                type="email"
                className="form-input"
                placeholder="tu@email.com"
                autoComplete="email"
              />
              {errors.email && (
                <p className="form-error">{errors.email.message}</p>
              )}
            </div>

            <div className="form-group">
              <label className="form-label">
                Telèfon *
              </label>
              <input
                {...register('telefono', { required: 'El telèfon es obligatori' })}
                type="tel"
                className="form-input"
                placeholder="+34 600 000 000"
                autoComplete="tel"
              />
              {errors.telefono && (
                <p className="form-error">{errors.telefono.message}</p>
              )}
            </div>

            <div className="form-group">
              <label className="form-label">
                Tipus de sessió *
              </label>
              <select
                {...register('tipoSesionId', { required: 'Selecciona un tipus de sessió' })}
                className="form-select"
              >
                <option value="">Selecciona una opció</option>
                <option value="navidad">Nadal</option>
                <option value="familia">Família</option>
                <option value="embarazo">Embaràs</option>
                <option value="pareja">Parella</option>
                <option value="producto">Producte</option>
              </select>
              {errors.tipoSesionId && (
                <p className="form-error">{errors.tipoSesionId.message}</p>
              )}
            </div>

            <div className="form-group">
              <label className="form-label">
                Data *
              </label>
              <input
                {...register('fechaHora', { required: 'La data és obligatòria' })}
                type="date"
                className="form-input"
                min={new Date().toISOString().split('T')[0]}
              />
              {errors.fechaHora && (
                <p className="form-error">{errors.fechaHora.message}</p>
              )}
            </div>

            <div className="form-group">
              <label className="form-label">
                Hora *
              </label>
              {renderHoraSelector()}
              {errors.hora && (
                <p className="form-error">{errors.hora.message as string}</p>
              )}
            </div>

            <div className="form-group">
              <label className="form-label">
                Comentaris addicionals
              </label>
              <textarea
                {...register('comentarios')}
                rows={4}
                className="form-textarea"
                placeholder="Explica'ns qualsevol detall important..."
              />
            </div>

            {successMessage && (
              <div className="alert alert-success">
                {successMessage}
              </div>
            )}

            {errorMessage && (
              <div className="alert alert-error">
                {errorMessage}
              </div>
            )}

            <button
              type="submit"
              disabled={isSubmitting || (!successMessage && horasDisponibles.length === 0)}
              className="btn-submit"
            >
              {isSubmitting ? 'Enviant...' : 'Reservar Sessió'}
            </button>
          </form>
        </div>
      </div>
    </div>
  );
}
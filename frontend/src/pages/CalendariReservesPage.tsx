import { useState, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import FullCalendar from "@fullcalendar/react";
import dayGridPlugin from "@fullcalendar/daygrid";
import timeGridPlugin from "@fullcalendar/timegrid";
import interactionPlugin from "@fullcalendar/interaction";
import apiService from "../services/api";
import type { Reserva } from "../types";

interface CalendarEvent {
  id: string;
  title: string;
  start: Date;
  end: Date;
  backgroundColor: string;
  borderColor: string;
  extendedProps: {
    reserva: Reserva;
  };
}

export default function CalendariReservesPage() {
  const navigate = useNavigate();
  const [reservas, setReservas] = useState<Reserva[]>([]);
  const [loading, setLoading] = useState(true);
  const [selectedReserva, setSelectedReserva] = useState<Reserva | null>(null);
  const [showModal, setShowModal] = useState(false);

  useEffect(() => {
    cargarReservas();
  }, []);

  const cargarReservas = async () => {
    try {
      setLoading(true);
      const data = await apiService.getAllReservas();
      setReservas(data.filter((r: Reserva) => r.estado !== "eliminada"));
    } catch (err) {
      console.error("Error carregant reserves:", err);
    } finally {
      setLoading(false);
    }
  };

  const getEstadoColor = (estado: string) => {
    switch (estado) {
      case "pendiente":
        return { bg: "#FFA500", border: "#E69500" };
      case "confirmada":
        return { bg: "#4CAF50", border: "#45a049" };
      case "cancelada":
        return { bg: "#F44336", border: "#d32f2f" };
      case "completada":
        return { bg: "#2196F3", border: "#1976D2" };
      default:
        return { bg: "#999", border: "#777" };
    }
  };

  const getEstadoTraducido = (estado: string) => {
    switch (estado) {
      case "pendiente": return "Pendent";
      case "confirmada": return "Confirmada";
      case "cancelada": return "Cancel·lada";
      case "completada": return "Completada";
      default: return estado;
    }
  };

  const events: CalendarEvent[] = reservas.map((reserva) => {
    const colors = getEstadoColor(reserva.estado || "pendiente");
    const startDate = new Date(reserva.fechaHora);
    const endDate = new Date(startDate);
    endDate.setMinutes(endDate.getMinutes() + (reserva.tipoSesion?.duracion || 60));

    return {
      id: reserva.id!,
      title: `${reserva.cliente?.nombre} - ${reserva.tipoSesion?.nombre}`,
      start: startDate,
      end: endDate,
      backgroundColor: colors.bg,
      borderColor: colors.border,
      extendedProps: {
        reserva: reserva,
      },
    };
  });

  const handleCambiarEstado = async (nuevoEstado: string) => {
    if (!selectedReserva) return;

    try {
      await apiService.updateReservaEstado(selectedReserva.id!, nuevoEstado);
      await cargarReservas();
      setShowModal(false);
      setSelectedReserva(null);
    } catch (err) {
      console.error("Error actualitzant estat:", err);
      alert("Error al actualitzar l'estat");
    }
  };

  const handleEliminar = async () => {
    if (!selectedReserva) return;

    const confirmar = window.confirm(
      `Estàs segur que vols eliminar la reserva de ${selectedReserva.cliente?.nombre}?`
    );

    if (!confirmar) return;

    try {
      await apiService.updateReservaEstado(selectedReserva.id!, "eliminada");
      await cargarReservas();
      setShowModal(false);
      setSelectedReserva(null);
    } catch (err) {
      console.error("Error eliminant reserva:", err);
      alert("Error al eliminar la reserva");
    }
  };

  if (loading) {
    return (
      <div className="admin-container">
        <div className="admin-loading">Carregant calendari...</div>
      </div>
    );
  }

  return (
    <div className="calendario-reservas-container">
      {/* Header */}
      <div className="calendario-reservas-header">
        <h1 className="calendario-reservas-title">📅 Calendari de Reserves</h1>
        <div className="calendario-reservas-actions">
          <button
            onClick={() => navigate("/admin/horarios")}
            className="btn-primary"
          >
            ➕ Gestionar Horaris
          </button>
          <button
            onClick={() => navigate("/admin")}
            className="btn-primary"
          >
            ← Tornar al Panell
          </button>
        </div>
      </div>

      {/* Llegenda */}
      <div className="calendario-llegenda">
        <span className="llegenda-item">
          <span className="llegenda-color" style={{ backgroundColor: "#FFA500" }}></span>
          Pendent
        </span>
        <span className="llegenda-item">
          <span className="llegenda-color" style={{ backgroundColor: "#4CAF50" }}></span>
          Confirmada
        </span>
        <span className="llegenda-item">
          <span className="llegenda-color" style={{ backgroundColor: "#2196F3" }}></span>
          Completada
        </span>
        <span className="llegenda-item">
          <span className="llegenda-color" style={{ backgroundColor: "#F44336" }}></span>
          Cancel·lada
        </span>
      </div>

      {/* Calendari */}
      <div className="calendario-wrapper">
        <FullCalendar
          plugins={[dayGridPlugin, timeGridPlugin, interactionPlugin]}
          initialView="timeGridWeek"
          headerToolbar={{
            left: "prev,next today",
            center: "title",
            right: "dayGridMonth,timeGridWeek,timeGridDay",
          }}
          locale="ca"
          firstDay={1}
          slotMinTime="08:00:00"
          slotMaxTime="21:00:00"
          slotDuration="00:30:00"
          height="auto"
          events={events}
          eventClick={(info) => {
            const reserva = info.event.extendedProps.reserva as Reserva;
            setSelectedReserva(reserva);
            setShowModal(true);
          }}
          dateClick={(info) => {
            const fecha = info.dateStr.split("T")[0];
            navigate(`/admin/horarios?fecha=${fecha}`);
          }}
          editable={false}
          selectable={true}
          nowIndicator={true}
          businessHours={{
            daysOfWeek: [1, 2, 3, 4, 5, 6],
            startTime: "09:00",
            endTime: "20:00",
          }}
          buttonText={{
            today: "Avui",
            month: "Mes",
            week: "Setmana",
            day: "Dia",
          }}
          allDaySlot={false}
          eventTimeFormat={{
            hour: "2-digit",
            minute: "2-digit",
            hour12: false,
          }}
        />
      </div>

      {/* Modal de detalls */}
      {showModal && selectedReserva && (
        <div className="modal-overlay" onClick={() => setShowModal(false)}>
          <div className="modal-content" onClick={(e) => e.stopPropagation()}>
            <div className="modal-header">
              <h2>Detalls de la Reserva</h2>
              <button className="modal-close" onClick={() => setShowModal(false)}>
                ✕
              </button>
            </div>

            <div className="modal-body">
              <div className="modal-info-grid">
                <div className="modal-info-item">
                  <span className="modal-label">👤 Client:</span>
                  <span className="modal-value">{selectedReserva.cliente?.nombre}</span>
                </div>
                <div className="modal-info-item">
                  <span className="modal-label">📧 Email:</span>
                  <span className="modal-value">{selectedReserva.cliente?.email}</span>
                </div>
                <div className="modal-info-item">
                  <span className="modal-label">📱 Telèfon:</span>
                  <span className="modal-value">{selectedReserva.cliente?.telefono}</span>
                </div>
                <div className="modal-info-item">
                  <span className="modal-label">📸 Tipus:</span>
                  <span className="modal-value">{selectedReserva.tipoSesion?.nombre}</span>
                </div>
                <div className="modal-info-item">
                  <span className="modal-label">📅 Data:</span>
                  <span className="modal-value">
                    {new Date(selectedReserva.fechaHora).toLocaleString("ca-ES", {
                      day: "2-digit",
                      month: "2-digit",
                      year: "numeric",
                      hour: "2-digit",
                      minute: "2-digit",
                    })}
                  </span>
                </div>
                <div className="modal-info-item">
                  <span className="modal-label">📊 Estat:</span>
                  <span 
                    className="modal-estado"
                    style={{ backgroundColor: getEstadoColor(selectedReserva.estado || "pendiente").bg }}
                  >
                    {getEstadoTraducido(selectedReserva.estado || "pendiente")}
                  </span>
                </div>
                {selectedReserva.comentarios && (
                  <div className="modal-info-item modal-info-full">
                    <span className="modal-label">💬 Comentaris:</span>
                    <span className="modal-value">{selectedReserva.comentarios}</span>
                  </div>
                )}
              </div>
            </div>

            <div className="modal-footer">
              <div className="modal-estado-buttons">
                <button
                  onClick={() => handleCambiarEstado("pendiente")}
                  className="btn-estado btn-pendiente"
                  disabled={selectedReserva.estado === "pendiente"}
                >
                  Pendent
                </button>
                <button
                  onClick={() => handleCambiarEstado("confirmada")}
                  className="btn-estado btn-confirmada"
                  disabled={selectedReserva.estado === "confirmada"}
                >
                  Confirmar
                </button>
                <button
                  onClick={() => handleCambiarEstado("completada")}
                  className="btn-estado btn-completada"
                  disabled={selectedReserva.estado === "completada"}
                >
                  Completar
                </button>
                <button
                  onClick={() => handleCambiarEstado("cancelada")}
                  className="btn-estado btn-cancelada"
                  disabled={selectedReserva.estado === "cancelada"}
                >
                  Cancel·lar
                </button>
              </div>
              <button onClick={handleEliminar} className="btn-eliminar-reserva">
                🗑️ Eliminar Reserva
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
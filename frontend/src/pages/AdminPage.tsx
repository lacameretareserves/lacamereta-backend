import { useState, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import apiService from "../services/api";
import type { Reserva } from "../types";
import { AxiosError } from "axios";

export default function AdminPage() {
  const navigate = useNavigate();
  const [reservas, setReservas] = useState<Reserva[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");
  const [filtroEstado, setFiltroEstado] = useState<string>("todos");
  const [reservaEditando, setReservaEditando] = useState<string | null>(null);
  const [nuevoEstado, setNuevoEstado] = useState<string>("");
  const [updating, setUpdating] = useState(false);
  const [reservasSeleccionadas, setReservasSeleccionadas] = useState<string[]>(
    [],
  );
  const [deleting, setDeleting] = useState(false);

  useEffect(() => {
    cargarReservas();
  }, []);

  const cargarReservas = async () => {
    try {
      setLoading(true);
      const data = await apiService.getAllReservas();
      setReservas(data);
      setError("");
      setReservasSeleccionadas([]);
    } catch (err) {
      const axiosError = err as AxiosError<{ message: string }>;
      setError("Error al carregar les reserves");
      console.error(axiosError);
    } finally {
      setLoading(false);
    }
  };

  const handleCambiarEstado = async (reservaId: string) => {
    if (!nuevoEstado) {
      alert("Selecciona un nou estat");
      return;
    }

    try {
      setUpdating(true);
      await apiService.updateReservaEstado(reservaId, nuevoEstado);

      setReservas(
        reservas.map((r) =>
          r.id === reservaId ? { ...r, estado: nuevoEstado } : r,
        ),
      );

      setReservaEditando(null);
      setNuevoEstado("");

      alert("Estat actualitzat correctament");
    } catch (err) {
      const axiosError = err as AxiosError<{ message: string }>;
      alert(
        "Error a l'actualitzar l'estat: " +
          (axiosError.response?.data?.message || axiosError.message),
      );
    } finally {
      setUpdating(false);
    }
  };

  const handleEliminarSeleccionadas = async () => {
    if (reservasSeleccionadas.length === 0) {
      alert("No hi ha reserves seleccionades");
      return;
    }

    const confirmar = window.confirm(
      `Estàs segur que vols eliminar ${reservasSeleccionadas.length} reserves?`,
    );

    if (!confirmar) return;

    try {
      setDeleting(true);

      for (const id of reservasSeleccionadas) {
        await apiService.updateReservaEstado(id, "eliminada");
      }

      setReservas(
        reservas.filter((r) => !reservasSeleccionadas.includes(r.id!)),
      );
      setReservasSeleccionadas([]);

      alert("Reserves eliminades correctament");
    } catch (err) {
      const axiosError = err as AxiosError<{ message: string }>;
      alert(
        "Error al eliminar: " +
          (axiosError.response?.data?.message || axiosError.message),
      );
    } finally {
      setDeleting(false);
    }
  };

  const handleToggleReserva = (id: string) => {
    setReservasSeleccionadas((prev) =>
      prev.includes(id) ? prev.filter((rid) => rid !== id) : [...prev, id],
    );
  };

  const handleToggleTodas = () => {
    if (reservasSeleccionadas.length === reservasFiltradas.length) {
      setReservasSeleccionadas([]);
    } else {
      setReservasSeleccionadas(reservasFiltradas.map((r) => r.id!));
    }
  };

  const abrirEditor = (reservaId: string, estadoActual: string) => {
    setReservaEditando(reservaId);
    setNuevoEstado(estadoActual);
  };

  const cancelarEdicion = () => {
    setReservaEditando(null);
    setNuevoEstado("");
  };

  const reservasFiltradas =
    filtroEstado === "todos"
      ? reservas.filter((r) => r.estado !== "eliminada")
      : reservas.filter((r) => r.estado === filtroEstado);

  const formatearFecha = (fecha: string) => {
    return new Date(fecha).toLocaleString("ca-ES", {
      day: "2-digit",
      month: "2-digit",
      year: "numeric",
      hour: "2-digit",
      minute: "2-digit",
    });
  };

  const getEstadoColor = (estado: string) => {
    switch (estado) {
      case "pendiente":
        return "#FFA500";
      case "confirmada":
        return "#4CAF50";
      case "cancelada":
        return "#F44336";
      case "completada":
        return "#2196F3";
      case "eliminada":
        return "#999999";
      default:
        return "#999";
    }
  };

  const getEstadoTraducido = (estado: string) => {
    switch (estado) {
      case "pendiente":
        return "Pendent";
      case "confirmada":
        return "Confirmada";
      case "cancelada":
        return "Cancel·lada";
      case "completada":
        return "Completada";
      case "eliminada":
        return "Eliminada";
      default:
        return estado;
    }
  };

  if (loading) {
    return (
      <div className="admin-container">
        <div className="admin-loading">Carregant reserves...</div>
      </div>
    );
  }

  return (
    <div className="admin-container">
      <div className="admin-wrapper">
        {/* Header */}
        <div className="admin-header">
          <h1 className="admin-title">Panell d'Administració</h1>
          <p className="admin-subtitle">Gestió de Reserves - La Camereta</p>
        </div>

        {/* Filtros y acciones */}
        <div className="admin-filters">
          <div className="filter-group">
            <label className="filter-label">Filtrar per estat:</label>
            <select
              value={filtroEstado}
              onChange={(e) => setFiltroEstado(e.target.value)}
              className="filter-select"
            >
              <option value="todos">
                Totes ({reservas.filter((r) => r.estado !== "eliminada").length}
                )
              </option>
              <option value="pendiente">
                Pendents (
                {reservas.filter((r) => r.estado === "pendiente").length})
              </option>
              <option value="confirmada">
                Confirmades (
                {reservas.filter((r) => r.estado === "confirmada").length})
              </option>
              <option value="completada">
                Completades (
                {reservas.filter((r) => r.estado === "completada").length})
              </option>
              <option value="cancelada">
                Cancel·lades (
                {reservas.filter((r) => r.estado === "cancelada").length})
              </option>
            </select>
          </div>

          <div className="admin-actions">
            <button
              onClick={() => navigate("/admin/horarios")}
              className="btn-primary"
            >
              📅 Gestionar Horaris
            </button>

            <button
              onClick={() => navigate("/admin/calendari")}
              className="btn-primary"
            >
              📆 Calendari
            </button>

            {reservasSeleccionadas.length > 0 && (
              <button
                onClick={handleEliminarSeleccionadas}
                disabled={deleting}
                className="btn-danger"
              >
                {deleting
                  ? "Eliminant..."
                  : `🗑️ Eliminar (${reservasSeleccionadas.length})`}
              </button>
            )}

            <button onClick={cargarReservas} className="btn-primary">
              🔄 Actualitzar
            </button>
          </div>
        </div>

        {/* Error */}
        {error && <div className="alert alert-error">{error}</div>}

        {/* Lista de reservas */}
        <div className="reservas-container">
          {reservasFiltradas.length === 0 ? (
            <div className="no-reservas">
              <p>
                No hi ha reserves{" "}
                {filtroEstado !== "todos"
                  ? `amb estat "${getEstadoTraducido(filtroEstado)}"`
                  : ""}
              </p>
            </div>
          ) : (
            <>
              {/* Seleccionar todas */}
              <div className="reservas-header">
                <label>
                  <input
                    type="checkbox"
                    checked={
                      reservasSeleccionadas.length ===
                        reservasFiltradas.length && reservasFiltradas.length > 0
                    }
                    onChange={handleToggleTodas}
                  />
                  <span>Seleccionar totes ({reservasFiltradas.length})</span>
                </label>
              </div>

              <div className="reservas-grid">
                {reservasFiltradas.map((reserva) => (
                  <div key={reserva.id} className="reserva-card">
                    {/* Checkbox de selección */}
                    <div
                      style={{
                        position: "absolute",
                        top: "1rem",
                        left: "1rem",
                      }}
                    >
                      <input
                        type="checkbox"
                        checked={reservasSeleccionadas.includes(reserva.id!)}
                        onChange={() => handleToggleReserva(reserva.id!)}
                        onClick={(e) => e.stopPropagation()}
                      />
                    </div>

                    <div
                      className="reserva-header"
                      style={{ paddingLeft: "2rem" }}
                    >
                      <h3 className="reserva-cliente">
                        {reserva.cliente?.nombre}
                      </h3>
                      <span
                        className="reserva-estado"
                        style={{
                          backgroundColor: getEstadoColor(
                            reserva.estado || "pendiente",
                          ),
                        }}
                      >
                        {getEstadoTraducido(reserva.estado || "pendiente")}
                      </span>
                    </div>

                    <div className="reserva-detalles">
                      <div className="detalle-item">
                        <span className="detalle-label">📅 Data:</span>
                        <span className="detalle-value">
                          {formatearFecha(reserva.fechaHora)}
                        </span>
                      </div>

                      <div className="detalle-item">
                        <span className="detalle-label">📸 Tipus:</span>
                        <span className="detalle-value">
                          {reserva.tipoSesion?.nombre}
                        </span>
                      </div>

                      <div className="detalle-item">
                        <span className="detalle-label">📧 Email:</span>
                        <span className="detalle-value">
                          {reserva.cliente?.email}
                        </span>
                      </div>

                      <div className="detalle-item">
                        <span className="detalle-label">📱 Telèfon:</span>
                        <span className="detalle-value">
                          {reserva.cliente?.telefono}
                        </span>
                      </div>

                      {reserva.comentarios && (
                        <div className="detalle-item">
                          <span className="detalle-label">💬 Comentaris:</span>
                          <span className="detalle-value">
                            {reserva.comentarios}
                          </span>
                        </div>
                      )}
                    </div>

                    {/* Editor de estado */}
                    {reservaEditando === reserva.id ? (
                      <div className="estado-editor">
                        <label className="estado-label">Canviar estat:</label>
                        <select
                          value={nuevoEstado}
                          onChange={(e) => setNuevoEstado(e.target.value)}
                          className="estado-select"
                        >
                          <option value="pendiente">Pendent</option>
                          <option value="confirmada">Confirmada</option>
                          <option value="completada">Completada</option>
                          <option value="cancelada">Cancel·lada</option>
                        </select>
                        <div className="estado-actions">
                          <button
                            onClick={() => handleCambiarEstado(reserva.id!)}
                            disabled={updating}
                            className="btn-guardar"
                          >
                            {updating ? "Desant..." : "✓ Desar"}
                          </button>
                          <button
                            onClick={cancelarEdicion}
                            disabled={updating}
                            className="btn-cancelar"
                          >
                            ✕ Cancel·lar
                          </button>
                        </div>
                      </div>
                    ) : (
                      <div className="reserva-actions">
                        <button
                          onClick={() =>
                            abrirEditor(reserva.id!, reserva.estado!)
                          }
                          className="btn-action btn-editar"
                        >
                          Canviar Estat
                        </button>
                      </div>
                    )}
                  </div>
                ))}
              </div>
            </>
          )}
        </div>
      </div>
    </div>
  );
}

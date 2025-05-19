import React, { useEffect, useState } from "react";
import { useSearchParams } from "react-router-dom";
import { getDisponibilidad, reservar } from "../api/api";
import "../styles/reserveCourt.css";
import Swal from "sweetalert2";

export default function ReserveCourt() {
  const [searchParams] = useSearchParams();
  const canchaId = searchParams.get("cancha_id");
  const [disponibilidad, setDisponibilidad] = useState([]);
  const [error, setError] = useState("");
  const [success, setSuccess] = useState("");
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    if (!canchaId) {
      setError("No se proporcionó un ID de cancha válido.");
      return;
    }
    getDisponibilidad(canchaId)
      .then(data => {
        if (Array.isArray(data)) {
          setDisponibilidad(data);
        } else if (data.error) {
          setError(data.error);
        } else {
          setError("No se pudo cargar la disponibilidad.");
        }
      })
      .catch(() => setError("Error al consultar la disponibilidad."));
  }, [canchaId]);

  const handleReservar = async (id, fecha, hora_inicio, hora_fin) => {
    const result = await Swal.fire({
      title: "¿Reservar este horario?",
      html: `<b>Fecha:</b> ${fecha}<br/><b>Hora:</b> ${hora_inicio} - ${hora_fin}`,
      icon: "question",
      showCancelButton: true,
      confirmButtonText: "Sí, reservar",
      cancelButtonText: "Cancelar",
      confirmButtonColor: "#43e97b",
      cancelButtonColor: "#d33",
    });
    if (!result.isConfirmed) return;
    setLoading(true);
    setSuccess("");
    setError("");
    try {
      const data = await reservar(id);
      if (!data.error) {
        setSuccess("¡Reserva creada exitosamente!");
        setDisponibilidad(disponibilidad.filter(d => d.id !== id));
        Swal.fire({
          title: "¡Reserva exitosa!",
          text: "Tu reserva ha sido realizada.",
          icon: "success",
          confirmButtonColor: "#43e97b"
        });
      } else {
        setError(data.error || "Error al crear la reserva");
        Swal.fire({
          title: "Error",
          text: data.error || "Error al crear la reserva",
          icon: "error",
          confirmButtonColor: "#d33"
        });
      }
    } catch {
      setError("Error de conexión con el servidor");
      Swal.fire({
        title: "Error",
        text: "Error de conexión con el servidor",
        icon: "error",
        confirmButtonColor: "#d33"
      });
    }
    setLoading(false);
  };

  return (
    <div className="reserve-bg">
      <div className="reserve-container">
        <h2 className="reserve-title">Disponibilidad para reservar</h2>
        {error && <div className="reserve-error">{error}</div>}
        {success && <div className="reserve-success">{success}</div>}
        {disponibilidad.length === 0 && !error && (
          <div className="reserve-empty">No hay horarios disponibles para esta cancha.</div>
        )}
        <div className="reserve-cards">
          {disponibilidad.map((d) => (
            <div
              className="reserve-card"
              key={d.id}
              style={{
                borderColor: d.disponible ? "#43e97b" : "#d32f2f",
                background: d.disponible
                  ? "linear-gradient(120deg, #e0ffe8 0%, #e0f7fa 100%)"
                  : "linear-gradient(120deg, #ffd6d6 0%, #ffe0e0 100%)"
              }}
            >
              <div className="reserve-card-fecha">
                <span className="reserve-card-label">📅 Fecha:</span> <span>{d.fecha}</span>
              </div>
              <div className="reserve-card-hora">
                <span className="reserve-card-label">⏰ Hora:</span> <span>{d.hora_inicio} - {d.hora_fin}</span>
              </div>
              <div className="reserve-card-disponible">
                <span className="reserve-card-label">
                  {d.disponible ? "✅ Disponible:" : "❌ Estado:"}
                </span>
                <span
                  style={{
                    color: d.disponible ? "#43e97b" : "#d32f2f",
                    fontWeight: 700
                  }}
                >
                  {d.disponible ? "Disponible" : "Reservado"}
                </span>
              </div>
              <button
                className="reserve-btn"
                onClick={() => handleReservar(d.id, d.fecha, d.hora_inicio, d.hora_fin)}
                disabled={loading || !d.disponible}
                style={{
                  background: d.disponible
                    ? "linear-gradient(90deg, #43e97b 0%, #0b8c3a 100%)"
                    : "#ccc",
                  cursor: d.disponible ? "pointer" : "not-allowed"
                }}
              >
                {d.disponible ? "Reservar" : "Reservado"}
              </button>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}

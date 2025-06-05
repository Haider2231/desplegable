import React, { useEffect, useState } from "react";
import { useSearchParams, useNavigate } from "react-router-dom";
import { getCanchasConHorarios } from "../api/api";
import "../styles/reserveCourt.css";
import Swal from "sweetalert2";

export default function ReserveCourt() {
  const [searchParams] = useSearchParams();
  const navigate = useNavigate();
  const establecimientoId = searchParams.get("cancha_id");
  const [canchas, setCanchas] = useState([]);
  const [error, setError] = useState("");
  const [loading, setLoading] = useState(false);
  const [expandedCanchaId, setExpandedCanchaId] = useState(null);
  const [selectedFecha, setSelectedFecha] = useState(null);
  const [showHorarios, setShowHorarios] = useState(true);

  // Cargar canchas y horarios del establecimiento seleccionado
  useEffect(() => {
    if (!establecimientoId) {
      setError("No se proporcionó un establecimiento válido.");
      return;
    }
    getCanchasConHorarios(establecimientoId)
      .then(data => {
        if (Array.isArray(data)) {
          setCanchas(data);
        } else if (data.error) {
          setError(data.error);
        } else {
          setError("No se pudo cargar la información.");
        }
      })
      .catch(() => setError("Error al consultar la información."));
  }, [establecimientoId]);

  // Reservar y pagar con abono
  const handleReservarYPagar = async (cancha, horario) => {
    // Usa el precio de la cancha (que es el del establecimiento)
    const precioCancha = cancha.precio;
    const { value: abono } = await Swal.fire({
      title: "¿Cuánto deseas abonar?",
      input: "number",
      inputLabel: `Valor de la cancha: $${precioCancha}`,
      inputPlaceholder: "Mínimo $10.000",
      inputAttributes: {
        min: 10000,
        max: precioCancha,
        step: 1000,
      },
      showCancelButton: true,
      confirmButtonText: "Continuar",
      cancelButtonText: "Cancelar",
      inputValidator: (value) => {
        if (!value || isNaN(value)) return "Debes ingresar un valor";
        if (parseInt(value) < 10000) return "El abono mínimo es $10.000";
        if (parseInt(value) > precioCancha) return "No puedes abonar más que el valor de la cancha";
        return null;
      },
    });
    if (!abono) return;

    // Confirmación del monto a pagar antes de reservar
    const confirm = await Swal.fire({
      title: "Confirmar abono",
      html: `Vas a abonar <b>$${parseInt(abono)}</b> de un total de $${precioCancha}.<br>¿Deseas continuar con la reserva?`,
      icon: "info",
      showCancelButton: true,
      confirmButtonText: "Reservar",
      cancelButtonText: "Cancelar"
    });
    if (!confirm.isConfirmed) return;

    setLoading(true);
    try {
      // Llama a la API de reserva con abono y con_factura
      const token = localStorage.getItem("token");
      const response = await fetch("/reservas", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${token}`,
        },
        body: JSON.stringify({
          disponibilidad_id: horario.id,
          con_factura: true,
          abono: parseInt(abono)
        }),
      });
      const data = await response.json();
      if (response.ok && data.factura_url) {
        // Actualiza el estado local para reflejar el cambio (horario ya no disponible)
        setCanchas(prev =>
          prev.map(c =>
            c.cancha_id === cancha.cancha_id
              ? {
                  ...c,
                  horarios: c.horarios.map(h =>
                    h.id === horario.id ? { ...h, disponible: false, abono: data.abono, restante: data.restante } : h
                  )
                }
              : c
          )
        );
        // Redirige a la página de éxito y pasa los datos por estado
        navigate("/reserva-exitosa", {
          state: {
            monto: data.monto,
            abono: data.abono,
            restante: data.restante,
            factura_url: data.factura_url
          }
        });
      } else {
        Swal.fire("Error", data.error || "No se pudo crear la reserva", "error");
      }
    } catch {
      Swal.fire("Error", "No se pudo conectar con el servidor", "error");
    }
    setLoading(false);
  };

  return (
    <div className="reserve-bg" style={{ minHeight: "100vh", background: "linear-gradient(120deg, #43e97b 0%, #38f9d7 100%)" }}>
      <div className="reserve-container" style={{
        maxWidth: 1100,
        margin: "0 auto",
        padding: "2.5rem 1.5rem",
        background: "#fff",
        borderRadius: 18,
        boxShadow: "0 8px 32px #43e97b33",
        marginTop: 32,
        marginBottom: 32,
        display: "flex",
        flexDirection: "row",
        gap: "32px"
      }}>
        {/* Panel izquierdo: lista de canchas */}
        <div style={{
          minWidth: 320,
          maxWidth: 340,
          flex: "0 0 340px",
          display: "flex",
          flexDirection: "column",
          gap: "12px"
        }}>
          <h2 className="reserve-title" style={{
            color: "#007991",
            fontWeight: 900,
            fontSize: 26,
            textAlign: "left",
            marginBottom: 18,
            letterSpacing: 2
          }}>Canchas</h2>
          {canchas.map((cancha, idx) => (
            <div key={cancha.cancha_id} className="reserve-card" style={{
              background: "linear-gradient(120deg, #e0f7fa 0%, #f7fff7 100%)",
              border: "1.5px solid #43e97b",
              borderRadius: 10,
              boxShadow: "0 1px 6px #43e97b22",
              padding: "0.5rem 0.8rem",
              marginBottom: 0,
              display: "flex",
              flexDirection: "column",
              alignItems: "stretch"
            }}>
              <button
                style={{
                  background: "none",
                  border: "none",
                  width: "100%",
                  textAlign: "left",
                  padding: "10px 0",
                  fontWeight: 800,
                  color: "#007991",
                  fontSize: 18,
                  letterSpacing: 1,
                  cursor: "pointer",
                  display: "flex",
                  alignItems: "center",
                  justifyContent: "space-between"
                }}
                onClick={() => setExpandedCanchaId(expandedCanchaId === cancha.cancha_id ? null : cancha.cancha_id)}
              >
                <span>
                  {cancha.nombre || `Cancha ${idx + 1}`}
                </span>
                <span style={{
                  fontSize: 18,
                  transform: expandedCanchaId === cancha.cancha_id ? "rotate(90deg)" : "rotate(0deg)",
                  transition: "transform 0.2s"
                }}>
                  ▶
                </span>
              </button>
            </div>
          ))}
        </div>
        {/* Panel derecho: horarios de la cancha seleccionada */}
        <div style={{
          flex: 1,
          minWidth: 0,
          display: "flex",
          flexDirection: "column",
          maxHeight: 600,
          overflowY: "auto",
          borderLeft: "2px solid #b2f7ef",
          paddingLeft: 24
        }}>
          <h2 style={{
            color: "#007991",
            fontWeight: 900,
            fontSize: 26,
            textAlign: "left",
            marginBottom: 18,
            letterSpacing: 2
          }}>
            Horarios
          </h2>
          {error && <div className="reserve-error" style={{
            background: "#ffd6d6",
            color: "#d32f2f",
            borderRadius: 8,
            padding: "12px 18px",
            fontWeight: 700,
            textAlign: "center",
            marginBottom: 24
          }}>{error}</div>}
          {canchas.length === 0 && !error && (
            <div className="reserve-empty" style={{
              color: "#888",
              fontSize: 18,
              textAlign: "center",
              marginBottom: 24
            }}>No hay canchas registradas para este establecimiento.</div>
          )}
          {expandedCanchaId ? (
            (() => {
              const cancha = canchas.find(c => c.cancha_id === expandedCanchaId);
              if (!cancha) return <div style={{ color: "#888", fontSize: 15 }}>Selecciona una cancha.</div>;
              // Filtra solo los horarios disponibles
              const horariosDisponibles = (cancha.horarios || []).filter(h => h.disponible);
              // Agrupa por fecha
              const horariosPorFecha = {};
              horariosDisponibles.forEach(h => {
                const fecha = h.fecha?.split("T")[0] || h.fecha;
                if (!horariosPorFecha[fecha]) horariosPorFecha[fecha] = [];
                horariosPorFecha[fecha].push(h);
              });
              const fechas = Object.keys(horariosPorFecha).sort();
              // Si no hay fecha seleccionada, selecciona la primera
              const fechaActiva = selectedFecha && fechas.includes(selectedFecha) ? selectedFecha : fechas[0];
              return (
                <div style={{ marginBottom: 8, marginTop: 6 }}>
                  {fechas.length > 0 ? (
                    <>
                      <div style={{ display: "flex", gap: 8, marginBottom: 18, flexWrap: "wrap" }}>
                        {fechas.map(fecha => (
                          <button
                            key={fecha}
                            onClick={() => {
                              if (fecha === fechaActiva) {
                                setShowHorarios(h => !h);
                              } else {
                                setSelectedFecha(fecha);
                                setShowHorarios(true);
                              }
                            }}
                            style={{
                              background: fechaActiva === fecha && showHorarios ? "#43e97b" : "#e0f7fa",
                              color: fechaActiva === fecha && showHorarios ? "#fff" : "#007991",
                              border: "none",
                              borderRadius: 8,
                              padding: "8px 18px",
                              fontWeight: 700,
                              fontSize: 15,
                              cursor: "pointer",
                              boxShadow: fechaActiva === fecha && showHorarios ? "0 2px 8px #43e97b33" : "none"
                            }}
                          >
                            {new Date(fecha + "T00:00:00").toLocaleDateString("es-CO", { weekday: "long", day: "numeric", month: "short" })}
                          </button>
                        ))}
                      </div>
                      {showHorarios && (
                        <div
                          style={{
                            maxHeight: 5 * 72,
                            overflowY: horariosPorFecha[fechaActiva].length > 5 ? "auto" : "visible",
                            paddingRight: horariosPorFecha[fechaActiva].length > 5 ? 8 : 0
                          }}
                        >
                          <ul style={{ paddingLeft: 0, listStyle: "none", margin: 0 }}>
                            {horariosPorFecha[fechaActiva].slice(0, 100).map((horario, idx) => (
                              <li key={horario.id} style={{
                                marginBottom: 14,
                                background: "#e0ffe8",
                                borderRadius: 10,
                                padding: "14px 16px",
                                display: "flex",
                                alignItems: "center",
                                justifyContent: "space-between",
                                boxShadow: "0 2px 8px #43e97b33"
                              }}>
                                <span style={{ fontWeight: 600, color: "#222" }}>
                                  <span style={{ display: "block" }}>
                                    <b>Fecha:</b> {horario.fecha?.split("T")[0] || horario.fecha}
                                  </span>
                                  <span style={{ display: "block" }}>
                                    <b>Hora:</b> {horario.hora_inicio} - {horario.hora_fin}
                                  </span>
                                </span>
                                <button
                                  className="reserve-btn"
                                  onClick={() => handleReservarYPagar(cancha, horario)}
                                  disabled={loading}
                                  style={{
                                    marginLeft: 12,
                                    background: "linear-gradient(90deg, #388e3c 0%, #43a047 100%)",
                                    color: "#fff",
                                    border: "none",
                                    borderRadius: 8,
                                    padding: "8px 18px",
                                    fontWeight: 700,
                                    fontSize: 15,
                                    cursor: "pointer",
                                    boxShadow: "0 2px 8px #43e97b33"
                                  }}
                                >
                                  Reservar y pagar
                                </button>
                              </li>
                            ))}
                          </ul>
                        </div>
                      )}
                    </>
                  ) : (
                    <div style={{ color: "#888", fontSize: 15, textAlign: "center" }}>No hay horarios disponibles.</div>
                  )}
                </div>
              );
            })()
          ) : (
            <div style={{ color: "#888", fontSize: 16, textAlign: "center", marginTop: 40 }}>
              Selecciona una cancha para ver sus horarios.
            </div>
          )}
        </div>
      </div>
    </div>
  );
}

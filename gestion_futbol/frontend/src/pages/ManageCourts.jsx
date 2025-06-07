import React, { useEffect, useState } from "react";
import { getCanchasConHorarios } from "../api/api";
import Swal from "sweetalert2";
import "../styles/manageCourts.css";

// NUEVO: Usa react-calendar para el calendario visual
import Calendar from "react-calendar";
import "react-calendar/dist/Calendar.css";

export default function ManageCourts() {
  const [establecimientos, setEstablecimientos] = useState([]);
  const [expandedEstId, setExpandedEstId] = useState(null);
  const [canchasConHorarios, setCanchasConHorarios] = useState([]);
  const [selectedCancha, setSelectedCancha] = useState(null);
  const [horariosPorFecha, setHorariosPorFecha] = useState({});
  const [selectedDate, setSelectedDate] = useState(null);

  // Cargar establecimientos activos
  useEffect(() => {
    const token = localStorage.getItem("token");
    let userId = null;
    if (token) {
      try {
        const base64Url = token.split(".")[1];
        let base64 = base64Url.replace(/-/g, "+").replace(/_/g, "/");
        while (base64.length % 4) base64 += "=";
        const payload = JSON.parse(atob(base64));
        userId = payload.userId;
      } catch {}
    }
    if (userId) {
      fetch(`/establecimientos/dueno/${userId}`, {
        headers: { Authorization: `Bearer ${localStorage.getItem("token")}` }
      })
        .then(res => res.json())
        .then(data => {
          setEstablecimientos(Array.isArray(data) ? data.filter(e => e.estado === "activo") : []);
        });
    }
  }, []);

  // Cargar canchas y horarios al expandir un establecimiento
  useEffect(() => {
    if (expandedEstId) {
      getCanchasConHorarios(expandedEstId)
        .then(data => {
          const normalizadas = Array.isArray(data)
            ? data.map(c => ({
                ...c,
                cancha_id: c.cancha_id || c.id
              }))
            : [];
          setCanchasConHorarios(normalizadas);
        });
    } else {
      setCanchasConHorarios([]);
      setSelectedCancha(null);
      setHorariosPorFecha({});
      setSelectedDate(null);
    }
  }, [expandedEstId]);

  // Agrupa horarios por fecha para la cancha seleccionada
  useEffect(() => {
    if (!selectedCancha) {
      setHorariosPorFecha({});
      return;
    }
    const horarios = selectedCancha.horarios || [];
    const porFecha = {};
    horarios.forEach(h => {
      const fecha = h.fecha?.split("T")[0] || h.fecha;
      if (!porFecha[fecha]) porFecha[fecha] = [];
      porFecha[fecha].push(h);
    });
    setHorariosPorFecha(porFecha);
  }, [selectedCancha]);

  // Días con horarios para el calendario
  const fechasConHorarios = Object.keys(horariosPorFecha);

  // Render principal
  return (
    <div className="manage-courts-bg" style={{ background: "linear-gradient(120deg, #e0f7fa 0%, #f7fff7 100%)" }}>
      <div className="manage-courts-panel" style={{ display: "flex", minHeight: 600 }}>
        {/* Menú lateral izquierdo */}
        <div style={{
          width: 220,
          background: "#f7f7f7",
          borderRight: "2px solid #b2f7ef",
          padding: "2rem 1rem 2rem 1.5rem",
          display: "flex",
          flexDirection: "column",
          gap: 18
        }}>
          <button
            className="manage-menu-btn active"
            style={{
              background: "#43e97b",
              color: "#fff",
              border: "none",
              borderRadius: 8,
              padding: "12px 18px",
              fontWeight: 700,
              fontSize: 16,
              marginBottom: 8,
              cursor: "pointer"
            }}
            disabled
          >
            🏢 Establecimientos
          </button>
        </div>
        {/* Panel central */}
        <div style={{ flex: 1, padding: "2rem" }}>
          <h3 style={{ color: "#007991", fontWeight: 700, marginBottom: 12, fontSize: 26, letterSpacing: 1 }}>Mis establecimientos</h3>
          <ul>
            {establecimientos.map(est => (
              <li key={est.id} style={{
                background: "rgba(255,255,255,0.98)",
                borderRadius: 16,
                boxShadow: "0 4px 16px #b2f7ef44",
                marginBottom: 28,
                padding: 24,
                display: "flex",
                alignItems: "flex-start",
                gap: 24,
                border: "2px solid #43e97b22"
              }}>
                {est.imagen_url && (
                  <img src={est.imagen_url} alt="Establecimiento" style={{ width: 100, height: 100, objectFit: "cover", borderRadius: 12, border: "2px solid #43e97b" }} />
                )}
                <div style={{ flex: 1 }}>
                  <div style={{ fontWeight: 800, fontSize: 22, color: "#007991", marginBottom: 2 }}>{est.nombre}</div>
                  <div style={{ color: "#388e3c", fontWeight: 600 }}>{est.direccion}</div>
                  <div style={{ color: "#007991", fontWeight: 500, marginTop: 2 }}>Teléfono: <b>{est.telefono}</b></div>
                  <div style={{ color: "#007991", fontWeight: 500 }}>Precio: <b>${est.precio}</b></div>
                  <div style={{ color: "#007991", fontWeight: 500 }}>
                    Canchas registradas: <b>{expandedEstId === est.id ? canchasConHorarios.length : "..."}</b>
                  </div>
                  <button
                    style={{
                      marginTop: 14,
                      background: "#43e97b",
                      color: "#fff",
                      border: "none",
                      borderRadius: 8,
                      padding: "8px 22px",
                      fontWeight: 700,
                      fontSize: 16,
                      cursor: "pointer",
                      boxShadow: "0 2px 8px #43e97b33",
                      transition: "background 0.2s"
                    }}
                    onClick={() => {
                      setExpandedEstId(expandedEstId === est.id ? null : est.id);
                      setSelectedCancha(null);
                      setSelectedDate(null);
                    }}
                  >
                    {expandedEstId === est.id ? "Ocultar canchas" : "Ver canchas"}
                  </button>
                  {expandedEstId === est.id && (
                    <ul style={{ marginTop: 18 }}>
                      {canchasConHorarios.length > 0 ? (
                        canchasConHorarios.map((cancha, idx) => (
                          <li key={cancha.cancha_id || cancha.id} style={{ marginBottom: 28 }}>
                            <div style={{ fontWeight: 700, fontSize: 19, color: "#007991", marginBottom: 6 }}>
                              {cancha.nombre?.trim() ? cancha.nombre : `Cancha ${idx + 1}`}
                            </div>
                            <button
                              style={{
                                background: selectedCancha?.cancha_id === cancha.cancha_id ? "#388e3c" : "#e0f7fa",
                                color: selectedCancha?.cancha_id === cancha.cancha_id ? "#fff" : "#007991",
                                border: "none",
                                borderRadius: 8,
                                padding: "7px 18px",
                                fontWeight: 700,
                                fontSize: 15,
                                cursor: "pointer",
                                marginBottom: 12,
                                boxShadow: selectedCancha?.cancha_id === cancha.cancha_id ? "0 2px 8px #43e97b33" : "none",
                                transition: "background 0.2s"
                              }}
                              onClick={() => {
                                setSelectedCancha(cancha);
                                setSelectedDate(null);
                              }}
                            >
                              {selectedCancha?.cancha_id === cancha.cancha_id ? "Ocultar horarios" : "Ver horarios"}
                            </button>
                            {/* Calendario visual */}
                            {selectedCancha?.cancha_id === cancha.cancha_id && (
                              <div style={{
                                marginTop: 18,
                                marginLeft:"-130px",
                                background: "#f7fff7",
                                borderRadius: 20,
                                boxShadow: "0 6px 32px #43e97b33, 0 1.5px 8px #00799122",
                                padding: "28px 32px 38px 32px",
                                border: "3px solid #43e97b55",
                                width: "100%",
                                minWidth: 800,
                                maxWidth: "none",
                                display: "flex",
                                flexDirection: "column",
                                alignItems: "center"
                              }}>
                                <div style={{ fontWeight: 700, color: "#007991", fontSize: 19, marginBottom: 16, textAlign: "center", width: "100%", letterSpacing: 0.5 }}>
                                  Selecciona un día para ver los horarios
                                </div>
                                <div style={{
                                  display: "flex",
                                  justifyContent: "center",
                                  width: "100%"
                                }}>
                                  <div style={{
                                    minWidth: 420,
                                    maxWidth: 520,
                                    background: "#fff",
                                    borderRadius: 18,
                                    boxShadow: "0 2px 16px #43e97b22",
                                    padding: "18px 16px 12px 16px",
                                    border: "2.5px solid #43e97b33"
                                  }}>
                                    <Calendar
                                      locale="es-CO"
                                      tileClassName={({ date }) => {
                                        const fechaStr = date.toISOString().slice(0, 10);
                                        if (selectedDate && fechaStr === selectedDate) return "calendar-selected";
                                        if (fechasConHorarios.includes(fechaStr)) return "calendar-has-horario";
                                        return "";
                                      }}
                                      onClickDay={date => {
                                        const fechaStr = date.toISOString().slice(0, 10);
                                        setSelectedDate(fechaStr);
                                      }}
                                      value={selectedDate ? new Date(selectedDate) : null}
                                      prevLabel="‹"
                                      nextLabel="›"
                                      prev2Label="«"
                                      next2Label="»"
                                      tileContent={({ date, view }) => {
                                        const fechaStr = date.toISOString().slice(0, 10);
                                        if (fechasConHorarios.includes(fechaStr)) {
                                          return <div style={{
                                            width: 10,
                                            height: 10,
                                            background: "#43e97b",
                                            border: "2px solid #388e3c",
                                            borderRadius: "50%",
                                            margin: "0 auto",
                                            marginTop: 2,
                                            boxShadow: "0 0 6px #43e97b99"
                                          }} />;
                                        }
                                        return null;
                                      }}
                                      tileDisabled={({ date, view }) => {
                                        const today = new Date();
                                        today.setHours(0,0,0,0);
                                        return date < today;
                                      }}
                                    />
                                  </div>
                                </div>
                                {/* Horarios debajo del calendario */}
                                {selectedDate && horariosPorFecha[selectedDate] && (
                                  <div style={{
                                    background: "#fff",
                                    border: "2px solid #43e97b22",
                                    borderRadius: 12,
                                    padding: "16px 18px",
                                    marginTop: 24,
                                    boxShadow: "0 2px 8px #43e97b22",
                                    width: "100%",
                                    maxWidth: 650, // antes 420, ahora más ancho
                                    minWidth: 0,
                                    marginLeft: "auto",
                                    marginRight: "auto",
                                    boxSizing: "border-box",
                                    display: "block"
                                  }}>
                                    <div style={{ fontWeight: 700, color: "#007991", marginBottom: 8, fontSize: 16, textAlign: "center" }}>
                                      Horarios para {new Date(selectedDate + "T00:00:00").toLocaleDateString("es-CO", { weekday: "long", day: "numeric", month: "short" })}
                                    </div>
                                    <ul style={{ paddingLeft: 0, listStyle: "none", margin: 0, width: "100%" }}>
                                      {horariosPorFecha[selectedDate] && horariosPorFecha[selectedDate].length > 0 ? (
                                        horariosPorFecha[selectedDate].map((h, idx) => (
                                          <li key={h.id} style={{
                                            background: h.disponible
                                              ? "#e6fbe6"
                                              : h.pago_completado
                                                ? "#e0f7fa"
                                                : "#ffeaea",
                                            border: `2px solid ${
                                              h.disponible
                                                ? "#43e97b"
                                                : h.pago_completado
                                                  ? "#388e3c"
                                                  : "#d32f2f"
                                            }`,
                                            borderRadius: 10,
                                            padding: "14px 18px",
                                            display: "flex",
                                            alignItems: "center",
                                            justifyContent: "space-between",
                                            boxShadow: h.disponible
                                              ? "0 1px 4px #43e97b33"
                                              : h.pago_completado
                                                ? "0 1px 4px #388e3c33"
                                                : "0 1px 4px #d32f2f22",
                                            fontWeight: 700,
                                            color: h.disponible
                                              ? "#388e3c"
                                              : h.pago_completado
                                                ? "#388e3c"
                                                : "#d32f2f",
                                            marginBottom: 14,
                                            fontSize: 16,
                                            width: "100%"
                                          }}>
                                            <span>
                                              <b>Hora:</b> <span style={{ color: "#222" }}>{h.hora_inicio} - {h.hora_fin}</span>
                                            </span>
                                            {h.disponible ? (
                                              <button
                                                style={{
                                                  marginLeft: 16,
                                                  background: "#d32f2f",
                                                  color: "#fff",
                                                  border: "none",
                                                  borderRadius: 6,
                                                  padding: "8px 24px",
                                                  fontWeight: 700,
                                                  fontSize: 16,
                                                  cursor: "pointer"
                                                }}
                                                onClick={async () => {
                                                  const ok = await Swal.fire({
                                                    title: "¿Quitar este horario?",
                                                    text: "Esta acción no se puede deshacer.",
                                                    icon: "warning",
                                                    showCancelButton: true,
                                                    confirmButtonText: "Sí, quitar",
                                                    cancelButtonText: "Cancelar"
                                                  });
                                                  if (!ok.isConfirmed) return;
                                                  await fetch(`/disponibilidades/${h.id}`, {
                                                    method: "DELETE",
                                                    headers: { Authorization: `Bearer ${localStorage.getItem("token")}` }
                                                  });
                                                  window.location.reload();
                                                  Swal.fire("Horario eliminado", "", "success");
                                                }}
                                              >
                                                Quitar
                                              </button>
                                            ) : (
                                              h.pago_completado ? (
                                                <span style={{
                                                  color: "#388e3c",
                                                  fontWeight: 800,
                                                  fontSize: 17,
                                                  marginLeft: 18,
                                                  textAlign: "right"
                                                }}>
                                                  Pago completado
                                                </span>
                                              ) : (
                                                <span style={{
                                                  color: "#d32f2f",
                                                  fontWeight: 800,
                                                  fontSize: 15,
                                                  marginLeft: 18,
                                                  textAlign: "right",
                                                  display: "flex",
                                                  flexDirection: "column",
                                                  alignItems: "flex-end"
                                                }}>
                                                  <span>Reservado</span>
                                                  <span style={{ fontWeight: 600, fontSize: 14 }}>
                                                    <b>Abonó:</b> {h.nombre_abonador || "N/A"}
                                                  </span>
                                                  <span style={{ fontWeight: 600, fontSize: 14 }}>
                                                    <b>Tel:</b> {h.telefono_abonador || "N/A"}
                                                  </span>
                                                  <span style={{ fontWeight: 600, fontSize: 14 }}>
                                                    <b>Abono:</b> ${h.abono || 0}
                                                  </span>
                                                  <span style={{ fontWeight: 600, fontSize: 14 }}>
                                                    <b>Restante:</b> ${h.restante || 0}
                                                  </span>
                                                  <span style={{
                                                    color: "#d32f2f",
                                                    fontWeight: 800,
                                                    fontSize: 14,
                                                    marginTop: 2
                                                  }}>
                                                    Pago pendiente
                                                  </span>
                                                </span>
                                              )
                                            )}
                                          </li>
                                        ))
                                      ) : (
                                        <li style={{ color: "#888", textAlign: "center", padding: "12px 0" }}>
                                          No hay horarios para este día.
                                        </li>
                                      )}
                                    </ul>
                                  </div>
                                )}
                                <style>
                                  {`
                                    .calendar-has-horario {
                                      background: linear-gradient(120deg, #43e97b 60%, #38f9d7 100%) !important;
                                      color: #fff !important;
                                      border-radius: 12px !important;
                                      font-weight: 700 !important;
                                      box-shadow: 0 2px 8px #43e97b55;
                                      border: 2px solid #388e3c !important;
                                    }
                                    .calendar-selected {
                                      background: linear-gradient(120deg, #388e3c 60%, #43e97b 100%) !important;
                                      color: #fff !important;
                                      border-radius: 14px !important;
                                      font-weight: 900 !important;
                                      border: 2.5px solid #007991 !important;
                                      box-shadow: 0 4px 16px #388e3c55;
                                    }
                                    .react-calendar {
                                      border: none !important;
                                      font-family: 'Poppins', 'Segoe UI', Arial, sans-serif;
                                      margin: 0;
                                      font-size: 1.18rem;
                                      background: transparent;
                                    }
                                    .react-calendar__tile {
                                      min-height: 48px !important;
                                      min-width: 48px !important;
                                      font-size: 1.08rem;
                                      border-radius: 10px !important;
                                      transition: background 0.18s, color 0.18s, box-shadow 0.18s;
                                    }
                                    /* Elimina el color de fondo del tile activo para que solo el seleccionado tenga color */
                                    .react-calendar__tile--active {
                                      background: none !important;
                                      color: inherit !important;
                                      /* NO poner color ni background aquí */
                                    }
                                    .react-calendar__tile:enabled:hover, .react-calendar__tile:enabled:focus {
                                      background: linear-gradient(120deg, #38f9d7 60%, #43e97b 100%) !important;
                                      color: #007991 !important;
                                      border-radius: 13px !important;
                                      font-weight: 800 !important;
                                      box-shadow: 0 2px 8px #43e97b33;
                                    }
                                    .react-calendar__navigation button {
                                      color: #007991 !important;
                                      font-weight: 800;
                                      font-size: 1.3rem;
                                      border-radius: 8px;
                                      margin: 0 2px;
                                      transition: background 0.15s;
                                    }
                                    .react-calendar__navigation button:enabled:hover, .react-calendar__navigation button:enabled:focus {
                                      background: #e0f7fa !important;
                                    }
                                    .react-calendar__month-view__weekdays {
                                      font-weight: 800;
                                      color: #007991;
                                      font-size: 1.1rem;
                                      letter-spacing: 0.5px;
                                    }
                                    .react-calendar__tile--now {
                                      background: #e0f7fa !important;
                                      color: #007991 !important;
                                      border-radius: 10px !important;
                                      font-weight: 700 !important;
                                      border: 1.5px solid #43e97b !important;
                                    }
                                    .react-calendar__tile--range {
                                      background: none !important;
                                    }
                                    .react-calendar__tile--rangeStart,
                                    .react-calendar__tile--rangeEnd {
                                      background: none !important;
                                    }
                                  `}
                                </style>
                              </div>
                            )}
                          </li>
                        ))
                      ) : (
                        <li style={{ color: "#888", marginTop: 10 }}>
                          No hay canchas registradas para este establecimiento.
                        </li>
                      )}
                    </ul>
                  )}
                </div>
              </li>
            ))}
          </ul>
        </div>
      </div>
    </div>
  );
}

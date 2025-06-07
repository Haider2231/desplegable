import React, { useState, useEffect } from "react";
import "../styles/reserveCourt.css";
import { getCanchasConHorarios } from "../api/api";
import Swal from "sweetalert2";
import { useNavigate, useSearchParams } from "react-router-dom";

export default function ReserveCourt() {
  const [searchParams] = useSearchParams();
  const navigate = useNavigate();
  const establecimientoId = searchParams.get("cancha_id") || searchParams.get("establecimiento_id");
  const [canchas, setCanchas] = useState([]);
  const [fecha, setFecha] = useState("");
  const [hora, setHora] = useState(""); // <-- vuelve a agregar el estado de hora
  const [loading, setLoading] = useState(false);
  const [buscado, setBuscado] = useState(false);
  const [resultados, setResultados] = useState([]);

  // Cargar canchas y horarios del establecimiento seleccionado
  useEffect(() => {
    if (!establecimientoId) return;
    setLoading(true);
    getCanchasConHorarios(establecimientoId)
      .then(data => {
        setCanchas(Array.isArray(data) ? data : []);
      })
      .finally(() => setLoading(false));
  }, [establecimientoId]);

  // Buscar horarios disponibles según fecha y hora
  const handleBuscar = async () => {
    setBuscado(true);
    if (!fecha || !hora) {
      setResultados([]);
      return;
    }
    // No permitir buscar fechas pasadas (corrige comparación)
    const hoy = new Date();
    const [yyyy, mm, dd] = fecha.split("-");
    const fechaBuscada = new Date(Number(yyyy), Number(mm) - 1, Number(dd));
    const fechaHoy = new Date(hoy.getFullYear(), hoy.getMonth(), hoy.getDate());
    if (fechaBuscada < fechaHoy) {
      Swal.fire("Fecha inválida", "No puedes buscar horarios en fechas pasadas.", "warning");
      setResultados([]);
      return;
    }
    // Si la fecha es hoy, no permitir buscar horas pasadas
    if (
      fechaBuscada.getTime() === fechaHoy.getTime() &&
      hora <= hoy.toTimeString().slice(0, 5)
    ) {
      Swal.fire("Hora inválida", "No puedes buscar horarios en horas pasadas de hoy.", "warning");
      setResultados([]);
      return;
    }
    setLoading(true);
    try {
      const allResultados = [];
      for (const cancha of canchas) {
        let hora24 = hora;
        const res = await fetch(
          `/disponibilidades/cancha/${cancha.cancha_id || cancha.id}?fecha=${fecha}&hora=${hora24}`
        );
        const horarios = await res.json();
        // NUEVO: Trae todos los horarios de ese día para la cancha (no solo disponibles)
        // Si tu backend ya retorna todos, solo sigue. Si no, deberías ajustar el backend.
        // Aquí asumimos que horarios incluye tanto disponibles como no disponibles.
        if (Array.isArray(horarios)) {
          allResultados.push({
            ...cancha,
            horarios
          });
        }
      }
      setResultados(allResultados);
    } catch (err) {
      setResultados([]);
    }
    setLoading(false);
  };

  // Reservar y pagar con abono
  const handleReservarYPagar = async (cancha, horario) => {
    const precioCancha = cancha.precio;
    const { value: abono } = await Swal.fire({
      title: "¿Cuánto deseas abonar?",
      input: "number",
      inputLabel: `Valor de la cancha: $${precioCancha}`,
      inputPlaceholder: "Mínimo $10.000, múltiplo de $5.000",
      inputAttributes: {
        min: 10000,
        max: Math.floor(precioCancha * 0.9),
        step: 5000,
      },
      showCancelButton: true,
      confirmButtonText: "Continuar",
      cancelButtonText: "Cancelar",
      inputValidator: (value) => {
        if (!value || isNaN(value)) return "Debes ingresar un valor";
        const val = parseInt(value);
        if (val < 10000) return "El abono mínimo es $10.000";
        if (val % 5000 !== 0) return "El abono debe ser múltiplo de $5.000";
        if (val>precioCancha) return "El abono no puede ser mayor al precio de la cancha";
      },
    });
    if (!abono) return;

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
        // Mensaje de abono exitoso y guía al usuario
        await Swal.fire({
          title: "Abono realizado",
          html: `Tu abono fue registrado.<br>Dirígete a tu perfil en <b>Pagos pendientes</b> para completar el pago cuando lo desees.`,
          icon: "success",
          confirmButtonText: "Ver mis reservas"
        });
        navigate("/mis-reservas?estado=pendiente");
      } else {
        Swal.fire("Error", data.error || "No se pudo crear la reserva", "error");
      }
    } catch {
      Swal.fire("Error", "No se pudo conectar con el servidor", "error");
    }
    setLoading(false);
  };

  return (
    <div
      className="reserve-bg"
      style={{
        minHeight: "100vh",
        background: "radial-gradient(circle at 70% 30%, #43e97b 0%, #38f9d7 60%, #007991 100%)",
        display: "flex",
        flexDirection: "column",
        alignItems: "center",
        justifyContent: "flex-start",
        paddingTop: "20px", // <-- sube todo más arriba
        fontFamily: "'Poppins', 'Segoe UI', Arial, sans-serif",
        color: "#222" // <-- asegura contraste y visibilidad
      }}
    >
      {/* Mensaje superior */}
      <div
        style={{
          width: "100%",
          textAlign: "center",
          marginBottom: 32,
          position: "relative",
          zIndex: 2,
          color: "#007991"
        }}
      >
        <h1
          style={{
            color: "#007991",
            fontWeight: "bold",
            fontSize: "2.3rem",
            marginBottom: 6,
            letterSpacing: 1.5,
            textShadow: "0 2px 8px #38f9d799",
            background: "none", // <-- elimina gradiente para mejor visibilidad
            WebkitBackgroundClip: "initial",
            WebkitTextFillColor: "#007991"
          }}
        >
          Reserva tu cancha
        </h1>
        <p
          style={{
            color: "#007991",
            fontSize: "1.15rem",
            margin: 0,
            fontWeight: 500,
            letterSpacing: 0.5
          }}
        >
          Encuentra la <span style={{ color: "#43e97b", fontWeight: 700 }}>disponibilidad</span> que más se ajuste a tus necesidades
        </p>
        {fecha && (
          <div style={{
            marginTop: 14,
            color: "#388e3c",
            fontWeight: 700,
            fontSize: 18,
            background: "#e0ffe8",
            borderRadius: 8,
            display: "inline-block",
            padding: "6px 18px",
            boxShadow: "0 2px 8px #43e97b22"
          }}>
            <span>
              Fecha seleccionada:{" "}
              {(() => {
                const [yyyy, mm, dd] = fecha.split("-");
                const dateObj = new Date(Number(yyyy), Number(mm) - 1, Number(dd));
                return dateObj.toLocaleDateString("es-CO", {
                  weekday: "long",
                  day: "numeric",
                  month: "short"
                });
              })()}
            </span>
          </div>
        )}
      </div>
      <div
        className="reserve-container"
        style={{
          maxWidth: 800,
          width: "100%",
          padding: "2.2rem 2.5rem 2.5rem 2.5rem",
          background: "rgba(255,255,255,0.98)",
          borderRadius: 22,
          boxShadow: "0 8px 32px 0 #38f9d799, 0 1.5px 8px #43e97b33",
          display: "flex",
          flexDirection: "column",
          alignItems: "center",
          gap: "32px",
          marginTop: 0,
        }}
      >
        <div style={{
          width: "100%",
          marginBottom: 18,
          background: "linear-gradient(90deg, #e0ffe8 0%, #f7fff7 100%)",
          borderRadius: 14,
          boxShadow: "0 2px 8px #43e97b22",
          padding: "1.5rem 2rem"
        }}>
          <label
            className="reserve-label"
            style={{
              color: "#007991",
              fontWeight: 700,
              marginBottom: 8,
              display: "block",
              fontSize: 17
            }}
          >
            Fecha:
          </label>
          <input
            type="date"
            value={fecha}
            min={new Date().toISOString().slice(0, 10)}
            max="2025-12-31"
            onChange={e => {
              // Solo permite seleccionar fechas futuras o hoy, y no después de 2025-12-31
              const val = e.target.value;
              if (val) {
                const [yyyy, mm, dd] = val.split("-");
                const seleccionada = new Date(Number(yyyy), Number(mm) - 1, Number(dd));
                const hoy = new Date();
                const soloHoy = new Date(hoy.getFullYear(), hoy.getMonth(), hoy.getDate());
                const maxFecha = new Date(2025, 11, 31); // 2025-12-31
                if (seleccionada < soloHoy) {
                  Swal.fire("Fecha inválida", "No puedes seleccionar fechas pasadas.", "warning");
                  setFecha("");
                  return;
                }
                if (seleccionada > maxFecha) {
                  Swal.fire("Fecha inválida", "No puedes seleccionar fechas después de 2025.", "warning");
                  setFecha("");
                  return;
                }
              }
              setFecha(e.target.value);
              setHora(""); // Limpia la hora al cambiar la fecha
            }}
            className="reserve-input"
            style={{
              padding: "12px",
              borderRadius: 10,
              border: "1.5px solid #43e97b",
              fontSize: 17,
              width: "100%",
              marginBottom: 14,
              background: "#f7fff7"
            }}
          />
          <label
            className="reserve-label"
            style={{
              color: "#007991",
              fontWeight: 700,
              marginBottom: 8,
              display: "block",
              marginTop: 12,
              fontSize: 17
            }}
          >
            Hora:
          </label>
          <input
            type="time"
            value={hora}
            min={
              // Obtiene el horario de apertura del establecimiento (no de la cancha)
              (() => {
                if (!canchas.length) return "06:00";
                // Busca el establecimiento con el id del primer resultado
                const estId = canchas[0].establecimiento_id || canchas[0].id_establecimiento;
                // Busca el objeto establecimiento en canchas (puede venir repetido)
                const est = canchas.find(c => c.establecimiento_id === estId);
                return est && est.hora_apertura ? est.hora_apertura : "06:00";
              })()
            }
            max={
              (() => {
                if (!canchas.length) return "23:59";
                const estId = canchas[0].establecimiento_id || canchas[0].id_establecimiento;
                const est = canchas.find(c => c.establecimiento_id === estId);
                return est && est.hora_cierre ? est.hora_cierre : "23:59";
              })()
            }
            onChange={(e) => setHora(e.target.value)}
            className="reserve-input"
            style={{
              padding: "12px",
              borderRadius: 10,
              border: "1.5px solid #43e97b",
              fontSize: 17,
              width: "100%",
              background: "#f7fff7"
            }}
            onBlur={e => {
              const val = e.target.value;
              if (!canchas.length) return;
              const estId = canchas[0].establecimiento_id || canchas[0].id_establecimiento;
              const est = canchas.find(c => c.establecimiento_id === estId);
              const apertura = est && est.hora_apertura ? est.hora_apertura : "06:00";
              const cierre = est && est.hora_cierre ? est.hora_cierre : "23:59";
              if (val && (val < apertura || val > cierre)) {
                Swal.fire("Hora inválida", `Solo puedes reservar entre ${apertura} y ${cierre}.`, "warning");
                setHora("");
              }
            }}
          />
          <button
            className="reserve-btn"
            onClick={handleBuscar}
            style={{
              background: "linear-gradient(90deg, #43e97b 0%, #38f9d7 100%)",
              color: "#fff",
              border: "none",
              borderRadius: 10,
              padding: "12px 28px",
              fontWeight: 800,
              fontSize: 18,
              cursor: "pointer",
              display: "flex",
              alignItems: "center",
              justifyContent: "center",
              gap: 10,
              marginTop: 18,
              boxShadow: "0 2px 8px #43e97b33"
            }}
            disabled={loading}
          >
            Buscar
            <svg
              xmlns="http://www.w3.org/2000/svg"
              width="18"
              height="18"
              fill="currentColor"
              className="bi bi-search"
              viewBox="0 0 16 16"
            >
              <path d="M11.742 10.344a6.5 6.5 0 1 0-1.398 1.398l3.646 3.646a1 1 0 0 0 1.415-1.415l-3.646-3.646zm-5.657-.657a5 5 0 1 1 7.07-7.07 5 5 0 0 1-7.07 7.07z" />
            </svg>
          </button>
        </div>
        {loading && (
          <div style={{ color: "#007991", fontWeight: 700, marginTop: 18, fontSize: 18 }}>
            <span className="loader" style={{
              display: "inline-block",
              width: 22,
              height: 22,
              border: "3px solid #43e97b",
              borderTop: "3px solid #fff",
              borderRadius: "50%",
              animation: "spin 1s linear infinite",
              marginRight: 10,
              verticalAlign: "middle"
            }}></span>
            Cargando horarios disponibles...
          </div>
        )}
        {!loading && buscado && (
          resultados.length === 0 ? (
            <div style={{
              color: "#d32f2f",
              fontWeight: 700,
              marginTop: 18,
              background: "#ffe0e0",
              borderRadius: 10,
              padding: "14px 0",
              fontSize: 17,
              boxShadow: "0 2px 8px #d32f2f22"
            }}>
              No hay horarios disponibles para la fecha y hora seleccionadas.
            </div>
          ) : (
            resultados.map((cancha, idx) => (
              <div key={cancha.cancha_id || cancha.id} style={{
                marginBottom: 24,
                background: "linear-gradient(90deg, #f7fff7 0%, #e0ffe8 100%)",
                borderRadius: 16,
                boxShadow: "0 2px 8px #b2f7ef33",
                padding: 22,
                width: "100%",
                border: "2px solid #43e97b22"
              }}>
                <div style={{
                  fontWeight: 800,
                  fontSize: 20,
                  color: "#007991",
                  marginBottom: 10,
                  letterSpacing: 1
                }}>
                  {cancha.nombre || `Cancha ${idx + 1}`}
                </div>
                <ul style={{ paddingLeft: 0, listStyle: "none", margin: 0 }}>
                  {cancha.horarios.length === 0 ? (
                    <li style={{
                      marginBottom: 10,
                      background: "#ffe0e0",
                      borderRadius: 8,
                      padding: "12px 18px",
                      color: "#d32f2f",
                      fontWeight: 700,
                      fontSize: 16,
                      textAlign: "center"
                    }}>
                      Horario no disponible o reservado
                    </li>
                  ) : (
                    cancha.horarios.map(horario => (
                      <li key={horario.id} style={{
                        marginBottom: 12,
                        background: horario.disponible
                          ? "linear-gradient(90deg, #e0ffe8 0%, #f7fff7 100%)"
                          : "linear-gradient(90deg, #ffe0e0 0%, #fff7f7 100%)",
                        borderRadius: 10,
                        padding: "14px 22px",
                        display: "flex",
                        alignItems: "center",
                        justifyContent: "space-between",
                        boxShadow: "0 1px 4px #43e97b22"
                      }}>
                        <span>
                          <b style={{
                            color: horario.disponible ? "#388e3c" : "#d32f2f",
                            fontSize: 17
                          }}>
                            {horario.disponible ? "Disponible" : "Reservado"}
                          </b>
                          <br />
                          <span style={{ color: "#007991", fontWeight: 600, fontSize: 15 }}>
                            {cancha.tipo ? `Tipo: ${cancha.tipo}` : ""}
                            {cancha.descripcion ? ` - ${cancha.descripcion}` : ""}
                          </span>
                        </span>
                        {horario.disponible ? (
                          <button
                            onClick={() => handleReservarYPagar(cancha, horario)}
                            style={{
                              background: "linear-gradient(90deg, #388e3c 0%, #43e97b 100%)",
                              color: "#fff",
                              border: "none",
                              borderRadius: 8,
                              padding: "10px 28px",
                              fontWeight: 800,
                              fontSize: 17,
                              cursor: "pointer",
                              boxShadow: "0 2px 8px #43e97b33"
                            }}
                            disabled={loading}
                          >
                            Reservar
                          </button>
                        ) : (
                          <span style={{
                            background: "#ffe0e0",
                            color: "#d32f2f",
                            borderRadius: 6,
                            padding: "6px 18px",
                            fontWeight: 700,
                            fontSize: 15,
                            boxShadow: "0 1px 4px #d32f2f22"
                          }}>
                            Horario reservado
                          </span>
                        )}
                      </li>
                    ))
                  )}
                </ul>
              </div>
            ))
          )
        )}
      </div>
      {/* Loader animation keyframes */}
      <style>
        {`
          @keyframes spin {
            0% { transform: rotate(0deg);}
            100% { transform: rotate(360deg);}
          }
        `}
      </style>
    </div>
  );
}
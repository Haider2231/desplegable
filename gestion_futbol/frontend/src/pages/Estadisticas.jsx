import React, { useEffect, useState } from "react";
import { Bar, Pie, Line } from "react-chartjs-2";
import {
  Chart as ChartJS,
  CategoryScale,
  LinearScale,
  BarElement,
  ArcElement,
  PointElement,
  LineElement,
  Tooltip,
  Legend,
} from "chart.js";
import {
  getEstadisticasUsuario,
  getEstadisticasPropietario,
  getEstadisticasAdmin,
} from "../api/api";
import jsPDF from "jspdf";
import autoTable from "jspdf-autotable"; // <-- usa este import, NO 'import "jspdf-autotable"'
import "../styles/estadisticasFullWidth.css"; // <-- agrega este import

ChartJS.register(
  CategoryScale,
  LinearScale,
  BarElement,
  ArcElement,
  PointElement,
  LineElement,
  Tooltip,
  Legend
);

export default function Estadisticas({ rol: propRol }) {
  const [data, setData] = useState(null);
  const [loading, setLoading] = useState(true);
  const [rol, setRol] = useState(propRol);

  useEffect(() => {
    if (!propRol) {
      // Obtener rol del token si no viene por props
      try {
        const token = localStorage.getItem("token");
        if (token) {
          const base64Url = token.split(".")[1];
          let base64 = base64Url.replace(/-/g, "+").replace(/_/g, "/");
          while (base64.length % 4) base64 += "=";
          const payload = JSON.parse(atob(base64));
          setRol(payload.rol);
        }
      } catch {}
    }
  }, [propRol]);

  useEffect(() => {
    if (!rol) return;
    setLoading(true);

    let fetchStats;
    if (rol === "usuario") fetchStats = getEstadisticasUsuario;
    else if (rol === "propietario") fetchStats = getEstadisticasPropietario;
    else if (rol === "admin") fetchStats = getEstadisticasAdmin;
    else return;

    fetchStats()
      .then(setData)
      .catch((err) =>
        setData({
          error: "No se pudo cargar estadísticas: " + (err?.message || err),
        })
      )
      .finally(() => setLoading(false));
  }, [rol]);

  // Función para descargar PDF de estadísticas
  const handleDescargarPDF = () => {
    if (!data) {
      alert("No hay datos para descargar.");
      return;
    }
    const doc = new jsPDF();
    doc.setFontSize(20);
    doc.setTextColor(67, 160, 71);
    doc.text("Reporte de Estadísticas", 14, 18);

    doc.setDrawColor(67, 160, 71);
    doc.setLineWidth(0.5);
    doc.line(14, 22, 196, 22);

    doc.setFontSize(14);
    doc.setTextColor(44, 62, 80);

    if (rol === "usuario") {
      doc.text("Tus estadísticas personales", 14, 30);
      doc.setFontSize(12);
      doc.text(`Total reservas: ${data.total_reservas}`, 14, 40);
      doc.text(`Horas jugadas: ${data.horas_jugadas}`, 14, 48);

      if (
        Array.isArray(data.canchas_mas_reservadas) &&
        data.canchas_mas_reservadas.length > 0
      ) {
        doc.setFontSize(13);
        doc.setTextColor(67, 160, 71);
        doc.text("Canchas más reservadas:", 14, 58);
        doc.setTextColor(44, 62, 80);
        autoTable(doc, {
          startY: 62,
          head: [["Cancha", "Reservas"]],
          body: data.canchas_mas_reservadas.map((c) => [c.nombre, c.reservas]),
          styles: { fillColor: [232, 247, 250] },
          headStyles: { fillColor: [67, 160, 71], textColor: 255 },
        });
      }
    } else if (rol === "propietario") {
      doc.text("Estadísticas de tus canchas", 14, 30);
      doc.setFontSize(12);
      doc.text(`Reservas totales: ${data.total_reservas}`, 14, 40);
      doc.text(`Ingresos estimados: $${data.ingresos}`, 14, 48);

      // Agrupa canchas por establecimiento
      let canchasConIngresos = [];
      if (Array.isArray(data.canchas)) {
        canchasConIngresos = data.canchas.map((c) => {
          let ingresos = 0;
          let reservasDetalle = [];
          if (Array.isArray(c.reservas_detalle)) {
            reservasDetalle = c.reservas_detalle;
          } else if (typeof c.reservas_detalle === "string") {
            try {
              reservasDetalle = JSON.parse(c.reservas_detalle);
            } catch {
              reservasDetalle = [];
            }
          }
          ingresos = reservasDetalle.reduce(
            (acc, r) => acc + (typeof r.abono === "number" ? r.abono : 0),
            0
          );
          return { ...c, ingresos };
        });
      }
      // Agrupa por establecimiento_nombre
      const establecimientosMap = {};
      canchasConIngresos.forEach((c) => {
        const est = c.establecimiento_nombre || "Sin establecimiento";
        if (!establecimientosMap[est]) establecimientosMap[est] = [];
        establecimientosMap[est].push(c);
      });

      let y = 58;
      const establecimientosArr = Object.entries(establecimientosMap);
      establecimientosArr.forEach(([nombre, canchas], idx) => {
        if (idx > 0) {
          y = doc.lastAutoTable ? doc.lastAutoTable.finalY + 12 : y + 12;
        }
        doc.setFontSize(13);
        doc.setTextColor(67, 160, 71);
        doc.text(`Establecimiento: ${nombre}`, 14, y);
        doc.setTextColor(44, 62, 80);

        // Tabla de canchas
        autoTable(doc, {
          startY: y + 4,
          head: [["Cancha", "Reservas", "Ingresos (abonos)"]],
          body: canchas.map((c) => [
            c.nombre,
            c.reservas,
            `$${c.ingresos || 0}`,
          ]),
          styles: { fillColor: [248, 255, 254] },
          headStyles: { fillColor: [67, 160, 71], textColor: 255 },
          theme: "grid",
        });

        // Totales por establecimiento
        const totalReservas = canchas.reduce(
          (acc, c) => acc + (c.reservas || 0),
          0
        );
        const totalIngresos = canchas.reduce(
          (acc, c) => acc + (c.ingresos || 0),
          0
        );
        y = doc.lastAutoTable ? doc.lastAutoTable.finalY + 4 : y + 24;
        doc.setFontSize(12);
        doc.setTextColor(44, 62, 80);
        doc.text(
          `Total reservas: ${totalReservas}    Total ingresos: $${totalIngresos}`,
          14,
          y
        );
        y += 8;
        // (No dibujar línea aquí)
      });
      // Dibuja la línea solo al final de todos los establecimientos
      doc.setDrawColor(200, 230, 201);
      doc.line(14, y, 196, y);
      y += 6;
    } else if (rol === "admin") {
      doc.text("Estadísticas Generales", 14, 30);
      doc.setFontSize(12);
      doc.text(`Usuarios registrados: ${data.usuarios}`, 14, 40);
      doc.text(`Canchas: ${data.canchas}`, 14, 48);
      doc.text(`Reservas totales: ${data.reservas}`, 14, 56);

      if (Array.isArray(data.actividad) && data.actividad.length > 0) {
        doc.setFontSize(13);
        doc.setTextColor(67, 160, 71);
        doc.text("Reservas por día (últimos 7 días):", 14, 66);
        doc.setTextColor(44, 62, 80);
        autoTable(doc, {
          startY: 70,
          head: [["Fecha", "Reservas"]],
          body: data.actividad.map((d) => [d.fecha, d.reservas]),
          styles: { fillColor: [232, 247, 250] },
          headStyles: { fillColor: [67, 160, 71], textColor: 255 },
        });
      }
    }

    doc.save("estadisticas.pdf");
  };

  // Utilidad para formatear hora (ej: "08:00" -> "8 AM")
  const formatHour = (hora) => {
    if (!hora) return "";
    const [h, m] = hora.split(":").map(Number);
    const ampm = h < 12 ? "AM" : "PM";
    const hour12 = h % 12 === 0 ? 12 : h % 12;
    return `${hour12}${m ? ":" + String(m).padStart(2, "0") : ""} ${ampm}`;
  };

  if (loading)
    return (
      <div style={{ textAlign: "center", margin: 24 }}>
        Cargando estadísticas...
      </div>
    );
  if (!data) return null;
  if (data.error)
    return (
      <div style={{ color: "red", textAlign: "center", margin: 24 }}>
        {data.error}
      </div>
    );

  // Ejemplo de datos esperados por rol (ajusta según tu backend)
  if (rol === "usuario") {
    return (
      <div
        style={{
          maxWidth: 420,
          margin: "0 auto",
          background: "#fff",
          borderRadius: 16,
          boxShadow: "0 2px 16px #1b5e2022",
          padding: 24,
        }}
      >
        <h3 style={{ textAlign: "center" }}>Tus estadísticas</h3>
        <button
          onClick={handleDescargarPDF}
          disabled={!data}
          style={{
            marginBottom: 16,
            background: data ? "#43a047" : "#ccc",
            color: "#fff",
            border: "none",
            borderRadius: 6,
            padding: "8px 18px",
            fontWeight: "bold",
            cursor: data ? "pointer" : "not-allowed",
            float: "right",
          }}
        >
          Descargar PDF
        </button>
        {Array.isArray(data.canchas_mas_reservadas) &&
        data.canchas_mas_reservadas.length > 0 ? (
          <Bar
            data={{
              labels: data.canchas_mas_reservadas.map((c) => c.nombre),
              datasets: [
                {
                  label: "Reservas por cancha",
                  data: data.canchas_mas_reservadas.map((c) => c.reservas),
                  backgroundColor: "#43a047",
                },
              ],
            }}
          />
        ) : (
          <div>No hay datos de canchas más reservadas.</div>
        )}
        <div style={{ marginTop: 16 }}>
          <strong>Total reservas:</strong> {data.total_reservas} <br />
          <strong>Horas jugadas:</strong> {data.horas_jugadas}
        </div>
      </div>
    );
  }
  if (rol === "propietario") {
    // Agrupa canchas por establecimiento
    let canchasConIngresos = [];
    if (Array.isArray(data.canchas)) {
      canchasConIngresos = data.canchas.map((c) => {
        let ingresos = 0;
        // Asegura que reservas_detalle sea un array válido
        let reservasDetalle = [];
        if (Array.isArray(c.reservas_detalle)) {
          reservasDetalle = c.reservas_detalle;
        } else if (typeof c.reservas_detalle === "string") {
          try {
            reservasDetalle = JSON.parse(c.reservas_detalle);
          } catch {
            reservasDetalle = [];
          }
        }
        ingresos = reservasDetalle.reduce(
          (acc, r) => acc + (typeof r.abono === "number" ? r.abono : 0),
          0
        );
        return { ...c, ingresos };
      });
    }
    // Agrupa por establecimiento_nombre
    const establecimientosMap = {};
    canchasConIngresos.forEach((c) => {
      const est = c.establecimiento_nombre || "Sin establecimiento";
      if (!establecimientosMap[est]) establecimientosMap[est] = [];
      establecimientosMap[est].push(c);
    });

    // Calcula ingresos y reservas totales por establecimiento
    const establecimientosArr = Object.entries(establecimientosMap).map(
      ([nombre, canchas]) => {
        const totalIngresos = canchas.reduce(
          (acc, c) => acc + (c.ingresos || 0),
          0
        );
        const totalReservas = canchas.reduce(
          (acc, c) => acc + (c.reservas || 0),
          0
        );
        return { nombre, canchas, totalIngresos, totalReservas };
      }
    );

    // Si no hay canchas, muestra mensaje
    if (
      !establecimientosArr.length ||
      (establecimientosArr.length === 1 &&
        establecimientosArr[0].canchas.length === 0)
    ) {
      return (
        <div
          style={{
            width: "100vw",
            maxWidth: "100vw",
            margin: 0,
            background: "#fff",
            borderRadius: 0,
            boxShadow: "none",
            padding: "32px 0",
            textAlign: "left", // opcional: texto alineado a la izquierda
            minHeight: "calc(100vh - 180px)",
            boxSizing: "border-box",
            display: "flex",
            justifyContent: "flex-start",
            alignItems: "flex-start",
          }}
        >

          <div
            style={{
              width: "auto",
              margin: 0,
              padding: 0,
              textAlign: "left",
            }}
          >
            <h3>Estadísticas de tus canchas</h3>
            <div style={{ color: "#888", fontSize: 18, margin: "32px 0" }}>
              No hay datos de canchas.
            </div>
          </div>
        </div>
      );
    }

    // --- NUEVO: Calcular reservas por hora ---
    // Suponemos que data.reservas_por_hora es un array [{ hora: "08:00", reservas: 3 }, ...]
    // Si no existe, lo calculamos a partir de reservas_detalle de todas las canchas
    let reservasPorHora = [];
    if (data.reservas_por_hora && Array.isArray(data.reservas_por_hora)) {
      reservasPorHora = data.reservas_por_hora;
    } else if (Array.isArray(data.canchas)) {
      // Junta todas las reservas_detalle de todas las canchas
      const horasMap = {};
      data.canchas.forEach((c) => {
        let reservasDetalle = [];
        if (Array.isArray(c.reservas_detalle)) reservasDetalle = c.reservas_detalle;
        else if (typeof c.reservas_detalle === "string") {
          try { reservasDetalle = JSON.parse(c.reservas_detalle); } catch {}
        }
        reservasDetalle.forEach((r) => {
          const hora = r.hora_inicio ? r.hora_inicio.slice(0, 5) : null;
          if (hora) horasMap[hora] = (horasMap[hora] || 0) + 1;
        });
      });
      // --- Rellenar de 08:00 a 21:00 ---
      const horasRango = [];
      for (let h = 8; h <= 21; h++) {
        horasRango.push(`${String(h).padStart(2, "0")}:00`);
      }
      reservasPorHora = horasRango.map(hora => ({
        hora,
        reservas: horasMap[hora] || 0
      }));
    }

    // --- NUEVO: Hora más concurrida ---
    let horaMasConcurrida = "";
    let maxReservas = 0;
    if (reservasPorHora.length > 0) {
      const max = reservasPorHora.reduce((acc, cur) => cur.reservas > acc.reservas ? cur : acc, reservasPorHora[0]);
      horaMasConcurrida = max.hora;
      maxReservas = max.reservas;
    }

    return (
      <div className="estadisticas-fullwidth-bg">
        <div>
          <h3 style={{ textAlign: "center", marginBottom: 24 }}>
            Estadísticas de tus canchas
          </h3>
          <button
            onClick={handleDescargarPDF}
            disabled={!data}
            style={{
              marginBottom: 16,
              background: data ? "#43a047" : "#ccc",
              color: "#fff",
              border: "none",
              borderRadius: 6,
              padding: "8px 18px",
              fontWeight: "bold",
              cursor: data ? "pointer" : "not-allowed",
              float: "right",
              marginRight: 32,
            }}
          >
            Descargar PDF
          </button>
          {/* NUEVO: Estadística de hora más concurrida */}
          <div style={{ marginBottom: 18, fontSize: 17, color: "#007991", fontWeight: 600 }}>
            {horaMasConcurrida
              ? <>Hora más concurrida: <b>{formatHour(horaMasConcurrida)}</b> ({maxReservas} reservas)</>
              : "No hay datos de horarios más concurridos."}
          </div>
          {/* NUEVO: Gráfico de reservas por hora */}
          {reservasPorHora.length > 0 && (
            <div style={{ width: "100%", maxWidth: 700, margin: "0 auto 24px auto", background: "#fff", borderRadius: 12, boxShadow: "0 2px 8px #43e97b22", padding: 10 }}>
              <Bar
                data={{
                  labels: reservasPorHora.map(r => formatHour(r.hora)),
                  datasets: [{
                    label: "Reservas por hora",
                    data: reservasPorHora.map(r => r.reservas),
                    backgroundColor: "#007991"
                  }]
                }}
                options={{
                  plugins: { legend: { display: false } },
                  scales: { y: { beginAtZero: true } },
                  responsive: true,
                  maintainAspectRatio: false,
                }}
                height={180}
              />
            </div>
          )}
          <div
            style={{
              display: "flex",
              flexDirection: "row",
              flexWrap: "wrap",
              gap: 32,
              justifyContent: "flex-start",
              alignItems: "flex-start",
              width: "100%",
              boxSizing: "border-box",
            }}
          >
            {establecimientosArr.map((est, idx) => (
              <div
                key={est.nombre}
                style={{
                  minWidth: 420,
                  maxWidth: 600,
                  flex: "1 1 480px",
                  background: "#f8fffe",
                  borderRadius: 12,
                  boxShadow: "0 2px 8px #43e97b22",
                  padding: 18,
                  marginBottom: 32,
                  display: "flex",
                  flexDirection: "column",
                  alignItems: "center",
                }}
              >
                <h4
                  style={{
                    color: "#007991",
                    fontWeight: 800,
                    marginBottom: 18,
                    fontSize: 22,
                    borderBottom: "2px solid #43e97b",
                    paddingBottom: 4,
                    textAlign: "center",
                  }}
                >
                  {est.nombre}
                </h4>
                {/* Gráfico de barras: Reservas por cancha */}
                {est.canchas && est.canchas.length > 0 ? (
                  <>
                    <div
                      style={{
                        width: "100%",
                        minWidth: 320,
                        maxWidth: 560,
                        marginBottom: 18,
                        background: "#fff",
                        borderRadius: 12,
                        boxShadow: "0 2px 8px #43e97b22",
                        padding: 10,
                      }}
                    >
                      <Bar
                        data={{
                          labels: est.canchas.map((c) => c.nombre),
                          datasets: [
                            {
                              label: "Reservas",
                              data: est.canchas.map((c) => c.reservas),
                              backgroundColor: "#00c6fb",
                            },
                          ],
                        }}
                        options={{
                          plugins: { legend: { display: false } },
                          scales: { y: { beginAtZero: true } },
                          responsive: true,
                          maintainAspectRatio: false,
                        }}
                        height={180}
                      />
                    </div>
                    {/* Gráfico de barras: Ingresos por cancha */}
                    <div
                      style={{
                        width: "100%",
                        minWidth: 320,
                        maxWidth: 560,
                        marginBottom: 18,
                        background: "#fff",
                        borderRadius: 12,
                        boxShadow: "0 2px 8px #43e97b22",
                        padding: 10,
                      }}
                    >
                      <Bar
                        data={{
                          labels: est.canchas.map((c) => c.nombre),
                          datasets: [
                            {
                              label: "Ingresos (abonos)",
                              data: est.canchas.map((c) => c.ingresos),
                              backgroundColor: "#43a047",
                            },
                          ],
                        }}
                        options={{
                          plugins: { legend: { display: false } },
                          scales: { y: { beginAtZero: true } },
                          responsive: true,
                          maintainAspectRatio: false,
                        }}
                        height={180}
                      />
                    </div>
                    {/* Tabla de canchas */}
                    <div style={{ width: "100%", marginTop: 8 }}>
                      <table
                        style={{
                          width: "100%",
                          borderCollapse: "collapse",
                          marginBottom: 12,
                        }}
                      >
                        <thead>
                          <tr style={{ background: "#e0f7fa" }}>
                            <th
                              style={{
                                padding: 8,
                                border: "1px solid #b2f7ef",
                              }}
                            >
                              Cancha
                            </th>
                            <th
                              style={{
                                padding: 8,
                                border: "1px solid #b2f7ef",
                              }}
                            >
                              Reservas
                            </th>
                            <th
                              style={{
                                padding: 8,
                                border: "1px solid #b2f7ef",
                              }}
                            >
                              Ingresos (abonos)
                            </th>
                          </tr>
                        </thead>
                        <tbody>
                          {est.canchas.map((c, idx2) => (
                            <tr key={c.cancha_id || c.nombre || idx2}>
                              <td
                                style={{
                                  padding: 8,
                                  border: "1px solid #b2f7ef",
                                }}
                              >
                                {c.nombre}
                              </td>
                              <td
                                style={{
                                  padding: 8,
                                  border: "1px solid #b2f7ef",
                                }}
                              >
                                {c.reservas}
                              </td>
                              <td
                                style={{
                                  padding: 8,
                                  border: "1px solid #b2f7ef",
                                }}
                              >
                                ${c.ingresos || 0}
                              </td>
                            </tr>
                          ))}
                          <tr
                            style={{ background: "#f7fff7", fontWeight: 700 }}
                          >
                            <td
                              style={{
                                padding: 8,
                                border: "1px solid #b2f7ef",
                              }}
                            >
                              Total {est.nombre}
                            </td>
                            <td
                              style={{
                                padding: 8,
                                border: "1px solid #b2f7ef",
                              }}
                            >
                              {est.totalReservas}
                            </td>
                            <td
                              style={{
                                padding: 8,
                                border: "1px solid #b2f7ef",
                              }}
                            >
                              ${est.totalIngresos}
                            </td>
                          </tr>
                        </tbody>
                      </table>
                    </div>
                  </>
                ) : (
                  <div
                    style={{ color: "#888", fontSize: 15, margin: "24px 0" }}
                  >
                    No hay canchas registradas.
                  </div>
                )}
              </div>
            ))}
          </div>
          <div style={{ marginTop: 16, textAlign: "center" }}>
            <strong>Reservas totales:</strong> {data.total_reservas} <br />
            <strong>Ingresos por Mercado Pago:</strong> ${data.ingresos} <br />
          </div>
        </div>
      </div>
    );
  }
  if (rol === "admin") {
    // --- Calcular cancha más reservada y gráfico de reservas por cancha ---
    let canchaMasReservada = "";
    let maxReservas = 0;
    let reservasPorCancha = [];

    if (data.reservas_por_cancha && Array.isArray(data.reservas_por_cancha)) {
      reservasPorCancha = data.reservas_por_cancha;
    } else if (Array.isArray(data.reservas)) {
      // Fallback: calcula reservasPorCancha a partir de data.reservas si existe
      const canchaMap = {};
      data.reservas.forEach(r => {
        if (!canchaMap[r.cancha_nombre]) canchaMap[r.cancha_nombre] = 0;
        canchaMap[r.cancha_nombre]++;
      });
      reservasPorCancha = Object.entries(canchaMap).map(([nombre, reservas]) => ({
        nombre,
        reservas
      }));
    }
    if (reservasPorCancha.length > 0) {
      const max = reservasPorCancha.reduce((acc, cur) => cur.reservas > acc.reservas ? cur : acc, reservasPorCancha[0]);
      canchaMasReservada = max.nombre;
      maxReservas = max.reservas;
    }

    return (
      <div className="estadisticas-fullwidth-bg">
        <div>
          <h3
            style={{
              textAlign: "center",
              marginBottom: 16,
              fontSize: 24,
              fontWeight: "bold",
              color: "#2e7d32",
              animation: "fadeInScale 1s ease-in-out",
            }}
          >
            Estadísticas Generales
          </h3>
          <button
            onClick={handleDescargarPDF}
            disabled={!data}
            style={{
              marginBottom: 16,
              background: data ? "#43a047" : "#ccc",
              color: "#fff",
              border: "none",
              borderRadius: 6,
              padding: "8px 18px",
              fontWeight: "bold",
              cursor: data ? "pointer" : "not-allowed",
              float: "right",
            }}
          >
            Descargar PDF
          </button>
          {/* NUEVO: Cancha más reservada */}
          {canchaMasReservada && (
            <div style={{ marginBottom: 18, fontSize: 17, color: "#007991", fontWeight: 600 }}>
              Cancha más reservada: <b>{canchaMasReservada}</b> ({maxReservas} reservas)
            </div>
          )}
          {/* NUEVO: Gráfico de reservas por cancha */}
          {reservasPorCancha.length > 0 && (
            <div style={{ width: "100%", maxWidth: 700, margin: "0 auto 24px auto", background: "#fff", borderRadius: 12, boxShadow: "0 2px 8px #43e97b22", padding: 10 }}>
              <Bar
                data={{
                  labels: reservasPorCancha.map(r => r.nombre),
                  datasets: [{
                    label: "Reservas por cancha",
                    data: reservasPorCancha.map(r => r.reservas),
                    backgroundColor: "#388e3c"
                  }]
                }}
                options={{
                  plugins: { legend: { display: false } },
                  scales: { y: { beginAtZero: true } },
                  responsive: true,
                  maintainAspectRatio: false,
                }}
                height={180}
              />
            </div>
          )}
          <div
            style={{
              display: "flex",
              flexDirection: window.innerWidth > 900 ? "row" : "column",
              gap: 32,
              flexWrap: "wrap",
              justifyContent: "center",
              marginBottom: 32,
              alignItems: "flex-start",
              width: "100%",
              maxWidth: "100vw",
            }}
          >
            {/* Gráfica de barras para usuarios, canchas y reservas */}
            <div
              style={{
                flex: "1 1 420px",
                minWidth: 320,
                maxWidth: 600,
                width: "100%",
                boxSizing: "border-box",
                height: 320,
                minHeight: 260,
                background: "#f8fffe",
                borderRadius: 12,
                padding: 12,
                marginBottom: 16,
              }}
            >
              <h3 style={{ textAlign: "center", marginBottom: 12 }}>
                Estadísticas Generales
              </h3>
              <div style={{ width: "100%", height: 260 }}>
                <Bar
                  data={{
                    labels: ["Usuarios", "Canchas", "Reservas"],
                    datasets: [
                      {
                        label: "Totales del sistema",
                        data: [data.usuarios, data.canchas, data.reservas],
                        backgroundColor: ["#43a047", "#388e3c", "#00c6fb"],
                      },
                    ],
                  }}
                  options={{
                    plugins: {
                      legend: { display: false },
                    },
                    scales: {
                      y: { beginAtZero: true },
                    },
                    responsive: true,
                    maintainAspectRatio: false,
                  }}
                  height={260}
                />
              </div>
            </div>
            {/* Gráfica de líneas para actividad por día, al lado derecho */}
            <div
              style={{
                flex: "1 1 420px",
                minWidth: 320,
                maxWidth: 700,
                width: "100%",
                boxSizing: "border-box",
                height: 320,
                minHeight: 260,
                background: "#f8fffe",
                borderRadius: 12,
                padding: 12,
                marginBottom: 16,
              }}
            >
              <h3 style={{ textAlign: "center", marginBottom: 12 }}>
                Estadísticas de reservas por día
              </h3>
              <div style={{ width: "100%", height: 260 }}>
                {Array.isArray(data.actividad) && data.actividad.length > 0 ? (
                  <Line
                    data={{
                      labels: data.actividad.map((d) => d.fecha),
                      datasets: [
                        {
                          label: "Reservas por día",
                          data: data.actividad.map((d) => d.reservas),
                          borderColor: "#43a047",
                          backgroundColor: "#b9ffc6",
                        },
                      ],
                    }}
                    options={{
                      responsive: true,
                      maintainAspectRatio: false,
                    }}
                    height={260}
                  />
                ) : (
                  <div>No hay datos de actividad.</div>
                )}
              </div>
            </div>
          </div>
          <div style={{ marginTop: 16, textAlign: "center" }}>
            <strong>Usuarios registrados:</strong> {data.usuarios} <br />
            <strong>Canchas:</strong> {data.canchas} <br />
            <strong>Reservas totales:</strong> {data.reservas}
          </div>
        </div>
      </div>
    );
  }
  return null;
}

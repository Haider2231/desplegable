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
        setData({ error: "No se pudo cargar estadísticas: " + (err?.message || err) })
      )
      .finally(() => setLoading(false));
  }, [rol]);

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
        <h3 style={{ textAlign: "center" }}>Estadísticas de tus canchas</h3>
        {Array.isArray(data.canchas) && data.canchas.length > 0 ? (
          <Pie
            data={{
              labels: data.canchas.map((c) => c.nombre),
              datasets: [
                {
                  label: "Reservas",
                  data: data.canchas.map((c) => c.reservas),
                  backgroundColor: ["#43a047", "#388e3c", "#b9ffc6", "#00c6fb"],
                },
              ],
            }}
          />
        ) : (
          <div>No hay datos de canchas.</div>
        )}
        <div style={{ marginTop: 16 }}>
          <strong>Reservas totales:</strong> {data.total_reservas} <br />
          <strong>Ingresos estimados:</strong> ${data.ingresos}
        </div>
      </div>
    );
  }
  if (rol === "admin") {
    return (
      <div
        style={{
          width: "90vw",
          maxWidth: "none",
          position: "relative",
          left: "-500px",
          background: "#fff",
          borderRadius: 8,
          boxShadow: "0 2px 16px #1b5e2022",
          padding: 24,
          minHeight: 500,
        }}
      >
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

        <div
          style={{
            display: "flex",
            flexDirection: "row",
            gap: 32,
            flexWrap: "nowrap",
            justifyContent: "center",
            marginBottom: 32,
            alignItems: "flex-start",
          }}
        >
          {/* Gráfica de barras para usuarios, canchas y reservas */}
          <div style={{ flex: "1 1 420px", minWidth: 320, maxWidth: 600 }}>
            <h3 style={{ textAlign: "center", marginBottom: 12 }}>
              Estadísticas Generales
            </h3>
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
              }}
            />
          </div>
          {/* Gráfica de líneas para actividad por día, al lado derecho */}
          <div
            style={{
              flex: "1 1 600px",
              minWidth: 400,
              maxWidth: 700,
              transform: "translateY(-20px)",
            }}
          >
            <h3 style={{ textAlign: "center", marginBottom: 12 }}>
              Estadísticas de reservas por dia
            </h3>
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
              />
            ) : (
              <div>No hay datos de actividad.</div>
            )}
          </div>
        </div>
        <div style={{ marginTop: 16, textAlign: "center" }}>
          <strong>Usuarios registrados:</strong> {data.usuarios} <br />
          <strong>Canchas:</strong> {data.canchas} <br />
          <strong>Reservas totales:</strong> {data.reservas}
        </div>
      </div>
    );
  }
  return null;
}

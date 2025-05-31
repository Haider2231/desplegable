import React, { useEffect, useState } from "react";
import Swal from "sweetalert2";

export default function MisReservas() {
  const [reservas, setReservas] = useState([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    let userId = null;
    try {
      const token = localStorage.getItem("token");
      if (token) {
        const base64Url = token.split(".")[1];
        let base64 = base64Url.replace(/-/g, "+").replace(/_/g, "/");
        while (base64.length % 4) base64 += "=";
        const payload = JSON.parse(atob(base64));
        userId = payload.userId;
      }
    } catch {}
    if (!userId) {
      Swal.fire("Error", "No se pudo identificar el usuario", "error");
      setLoading(false);
      return;
    }
    fetch(`/reservas/${userId}`, {
      headers: {
        Authorization: `Bearer ${localStorage.getItem("token")}`,
      },
    })
      .then(res => res.json())
      .then(data => {
        if (Array.isArray(data)) setReservas(data);
        else setReservas([]);
      })
      .catch(() => setReservas([]))
      .finally(() => setLoading(false));
  }, []);

  return (
    <div style={{
      maxWidth: 900,
      margin: "40px auto",
      background: "linear-gradient(120deg, #e0f7fa 0%, #f7fff7 100%)",
      borderRadius: 18,
      boxShadow: "0 4px 24px #b2f7ef77",
      padding: "2.5rem 2rem",
      border: "2px solid #b2f7ef",
      color: "#007991",
      fontFamily: "inherit",
    }}>
      <h2 style={{
        textAlign: "center",
        fontWeight: 900,
        fontSize: 28,
        marginBottom: 18,
        letterSpacing: 1,
        color: "#007991",
      }}>
        🗓️ Mis reservas
      </h2>
      {loading ? (
        <div style={{ textAlign: "center", color: "#388e3c", fontWeight: 600 }}>Cargando...</div>
      ) : reservas.length === 0 ? (
        <div style={{ textAlign: "center", color: "#d32f2f", fontWeight: 600 }}>No tienes reservas registradas.</div>
      ) : (
        <table style={{
          width: "100%",
          borderCollapse: "collapse",
          background: "#fff",
          borderRadius: 10,
          overflow: "hidden",
          boxShadow: "0 2px 8px #43e97b22"
        }}>
          <thead>
            <tr style={{ background: "#e0f7fa" }}>
              <th style={{ padding: 10 }}>Fecha</th>
              <th style={{ padding: 10 }}>Hora</th>
              <th style={{ padding: 10 }}>Establecimiento</th>
              <th style={{ padding: 10 }}>Cancha</th>
              <th style={{ padding: 10 }}>Abono</th>
              <th style={{ padding: 10 }}>Restante</th>
            </tr>
          </thead>
          <tbody>
            {reservas.map((r, idx) => (
              <tr key={r.reserva_id || idx} style={{ borderBottom: "1px solid #b2f7ef" }}>
                <td style={{ padding: 8 }}>{r.fecha?.split("T")[0] || r.fecha}</td>
                <td style={{ padding: 8 }}>{r.hora_inicio} - {r.hora_fin}</td>
                <td style={{ padding: 8 }}>{r.establecimiento_nombre || r.direccion}</td>
                <td style={{ padding: 8 }}>{r.cancha_nombre}</td>
                <td style={{ padding: 8, color: "#388e3c", fontWeight: 700 }}>{r.abono ? `$${r.abono}` : "-"}</td>
                <td style={{ padding: 8, color: "#d32f2f", fontWeight: 700 }}>{r.restante ? `$${r.restante}` : "-"}</td>
              </tr>
            ))}
          </tbody>
        </table>
      )}
    </div>
  );
}

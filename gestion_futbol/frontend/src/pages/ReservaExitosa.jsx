import React from "react";
import { useLocation, useNavigate } from "react-router-dom";
import Swal from "sweetalert2";

export default function ReservaExitosa() {
  const location = useLocation();
  const navigate = useNavigate();
  const { monto, abono, restante, factura_url, fecha, hora_fin } = location.state || {};

  if (!monto || !abono || !factura_url) {
    // Si no hay datos, redirige al inicio
    navigate("/");
    return null;
  }

  // Guardar factura en localStorage hasta la hora de fin o por 1 hora si no hay fecha/hora
  React.useEffect(() => {
    if (factura_url) {
      let finReserva;
      if (fecha && hora_fin) {
        finReserva = new Date(`${fecha}T${hora_fin}`).getTime();
      } else {
        finReserva = Date.now() + 1000 * 60 * 60;
      }
      // Obtener userId del token
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
      localStorage.setItem(
        "facturaPendiente",
        JSON.stringify({
          factura_url,
          finReserva,
          userId
        })
      );
    }
  }, [factura_url, fecha, hora_fin]);

  return (
    <div style={{
      minHeight: "100vh",
      display: "flex",
      alignItems: "center",
      justifyContent: "center",
      background: "#26b69f"
    }}>
      <div style={{
        background: "#fff",
        borderRadius: 12,
        boxShadow: "0 4px 16px #b2f7ef",
        padding: "2rem",
        maxWidth: 400,
        textAlign: "center"
      }}>
        <h2 style={{ color: "#388e3c" }}>¡Reserva exitosa!</h2>
        <div style={{ margin: "18px 0", color: "#333", fontWeight: 600 }}>
          <div><b>Monto total:</b> ${monto}</div>
          <div><b>Abono pagado:</b> ${abono}</div>
          <div><b>Restante por pagar:</b> ${restante}</div>
        </div>
        {/* Quitar enlace de descarga de factura, solo mostrar mensaje */}
        <div style={{
          margin: "18px 0",
          color: "#007991",
          fontWeight: 700,
          fontSize: 17
        }}>
          Puedes verificar tu factura en el correo electrónico registrado.
        </div>
        <button
          style={{
            marginTop: 18,
            padding: "12px 36px",
            borderRadius: 10,
            background: "linear-gradient(90deg, #388e3c 0%, #43a047 100%)",
            color: "#fff",
            fontWeight: 800,
            border: "none",
            fontSize: "1.15rem",
            letterSpacing: 1,
            boxShadow: "0 2px 8px #43e97b33",
            cursor: "pointer",
            transition: "background 0.2s"
          }}
          onClick={() => navigate("/")}
        >
          <span role="img" aria-label="home" style={{ marginRight: 8 }}>🏠</span>
          Volver al inicio
        </button>
      </div>
    </div>
  );
}

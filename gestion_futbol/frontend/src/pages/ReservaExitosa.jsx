import React from "react";
import { useLocation, useNavigate } from "react-router-dom";

export default function ReservaExitosa() {
  const location = useLocation();
  const navigate = useNavigate();
  const { monto, abono, restante, factura_url } = location.state || {};

  if (!monto || !abono || !factura_url) {
    // Si no hay datos, redirige al inicio
    navigate("/");
    return null;
  }

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
        <div style={{
          margin: "18px 0",
          display: "flex",
          flexDirection: "column",
          alignItems: "center"
        }}>
          <a
            href={factura_url}
            target="_blank"
            rel="noopener noreferrer"
            style={{
              display: "inline-block",
              background: "linear-gradient(90deg, #43e97b 0%, #38f9d7 100%)",
              color: "#fff",
              fontWeight: "bold",
              textDecoration: "none",
              fontSize: "1.1rem",
              padding: "12px 28px",
              borderRadius: 8,
              boxShadow: "0 2px 8px #43e97b44",
              transition: "background 0.2s, color 0.2s",
              marginBottom: 8
            }}
            onMouseOver={e => e.currentTarget.style.background = "linear-gradient(90deg, #38f9d7 0%, #43e97b 100%)"}
            onMouseOut={e => e.currentTarget.style.background = "linear-gradient(90deg, #43e97b 0%, #38f9d7 100%)"}
          >
            <span role="img" aria-label="pdf" style={{ marginRight: 8 }}>📄</span>
            Descargar factura PDF
          </a>
          <span style={{
            color: "#888",
            fontSize: 13,
            marginTop: 2
          }}>
            (Haz clic para abrir o guardar tu comprobante)
          </span>
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

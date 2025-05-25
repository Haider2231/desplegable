import React, { useEffect, useState } from "react";
import { useNavigate, useSearchParams } from "react-router-dom";
import Swal from "sweetalert2";
import { reservar } from "../api/api";
import axios from "axios";

export default function Pagos() {
  const [params] = useSearchParams();
  const navigate = useNavigate();
  const [facturaUrl, setFacturaUrl] = useState(null);
  const [loading, setLoading] = useState(true);
  const [pagoInfo, setPagoInfo] = useState(null);

  useEffect(() => {
    // Permite redirigir aquí desde cualquier reserva exitosa con factura_url
    const paramsFactura = new URLSearchParams(window.location.search);
    const factura_url = paramsFactura.get("factura_url");
    if (factura_url) {
      setFacturaUrl(factura_url);
      setLoading(false);
      return;
    }

    const disponibilidad_id = params.get("disponibilidad_id");
    const payment_id = params.get("payment_id"); // MercadoPago lo agrega a la URL
    let abonoReal = null;

    const fetchAbono = async () => {
      if (payment_id) {
        const resp = await axios.get(
          `/pagos/obtener-abono?payment_id=${payment_id}`
        );
        abonoReal = resp.data.abono;
      }
    };

    const reservarConAbono = async () => {
      await fetchAbono();
      if (disponibilidad_id) {
        reservar(disponibilidad_id, { con_factura: true, abono: abonoReal })
          .then((data) => {
            if (data && data.factura_url) {
              setFacturaUrl(data.factura_url);
              setPagoInfo({
                abono: data.abono,
                monto: data.monto,
                restante: data.restante,
              });
            } else {
              Swal.fire(
                "Reserva realizada",
                "Tu reserva fue registrada. Puedes ver tu factura en tu perfil.",
                "success"
              );
              navigate("/");
            }
          })
          .catch(() => {
            Swal.fire("Error", "No se pudo registrar la reserva", "error");
            navigate("/");
          })
          .finally(() => setLoading(false));
      } else {
        Swal.fire("Error", "No se encontró información de la reserva", "error");
        navigate("/");
      }
    };

    reservarConAbono();
  }, [params, navigate]);

  if (loading) {
    return (
      <div
        style={{
          minHeight: "60vh",
          display: "flex",
          flexDirection: "column",
          alignItems: "center",
          justifyContent: "center",
        }}
      >
        <h2>Procesando reserva y factura...</h2>
      </div>
    );
  }

  // Si no hay facturaUrl después de cargar, muestra mensaje en vez de dejar la página en blanco
  if (!facturaUrl) {
    return (
      <div
        style={{
          minHeight: "60vh",
          display: "flex",
          flexDirection: "column",
          alignItems: "center",
          justifyContent: "center",
          color: "#d32f2f",
          fontWeight: 600,
        }}
      >
        <h2>No se pudo generar la factura.</h2>
        <button
          style={{
            marginTop: 18,
            padding: "10px 32px",
            borderRadius: 8,
            background: "linear-gradient(90deg, #388e3c 0%, #43a047 100%)",
            color: "#fff",
            fontWeight: 700,
            border: "none",
            fontSize: "1.1rem",
            cursor: "pointer",
          }}
          onClick={() => navigate("/")}
        >
          Volver al inicio
        </button>
      </div>
    );
  }

  return (
    <div
      style={{
        maxWidth: 500,
        margin: "2rem auto",
        background: "#fff",
        borderRadius: 12,
        boxShadow: "0 4px 16px #b2f7ef",
        padding: "2rem",
      }}
    >
      <h2>¡Pago realizado con éxito!</h2>
      {pagoInfo && (
        <div style={{ margin: "16px 0", textAlign: "center" }}>
          <div>
            <b>Monto total:</b> ${pagoInfo.monto}
          </div>
          <div>
            <b>Abono pagado:</b> ${pagoInfo.abono}
          </div>
          <div>
            <b>Restante por pagar:</b> ${pagoInfo.restante}
          </div>
        </div>
      )}
      <div style={{ margin: "16px 0", textAlign: "center" }}>
        <a
          href={facturaUrl}
          target="_blank"
          rel="noopener noreferrer"
          style={{
            color: "#388e3c",
            fontWeight: "bold",
            textDecoration: "underline",
          }}
        >
          Descargar factura PDF
        </a>
      </div>
      <button
        style={{
          marginTop: 18,
          padding: "10px 32px",
          borderRadius: 8,
          background: "linear-gradient(90deg, #388e3c 0%, #43a047 100%)",
          color: "#fff",
          fontWeight: 700,
          border: "none",
          fontSize: "1.1rem",
          cursor: "pointer",
        }}
        onClick={() => navigate("/")}
      >
        Continuar
      </button>
    </div>
  );
}

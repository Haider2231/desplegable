import React from "react";
import { Link } from "react-router-dom";

export default function QuieroRegistrarCancha() {
  return (
    <div style={{
      maxWidth: 500,
      margin: "2rem auto",
      background: "#fff",
      borderRadius: 12,
      boxShadow: "0 4px 16px #b2f7ef",
      padding: "2rem"
    }}>
      <h2>¿Quieres registrar tu cancha?</h2>
      <p>
        Para registrar tu cancha debes primero crear una cuenta e iniciar sesión.
        Luego podrás acceder al formulario para registrar tu establecimiento y subir los documentos requeridos.
      </p>
      <div style={{ marginBottom: 18 }}>
        <b>Documentos requeridos:</b>
        <ul style={{ marginTop: 8, marginBottom: 8 }}>
          <li>Documento de identidad (cédula de ciudadanía o extranjería).</li>
          <li>Certificado de matrícula mercantil vigente <b>o</b> contrato de arriendo/administración <b>o</b> recibo de servicio público del establecimiento.</li>
          <li>Fotos actuales de la cancha (mínimo 2).</li>
          <li>Dirección exacta y número de contacto.</li>
        </ul>
        <span style={{ color: "#007991", fontSize: 15 }}>
          Estos documentos son necesarios para validar que eres el propietario o administrador del lugar.
        </span>
      </div>
      <b>Pasos:</b>
      <ol>
        <li>Regístrate o inicia sesión.</li>
        <li>Accede a este apartado y haz clic en el botón de abajo.</li>
        <li>Llena el formulario y sube los documentos.</li>
        <li>Un validador revisará tu solicitud y te notificaremos cuando esté aprobada.</li>
      </ol>
      <Link to="/registro-cancha">
        <button style={{
          backgroundColor: "#007991",
          color: "#fff",
          border: "none",
          borderRadius: 8,
          padding: "10px 20px",
          cursor: "pointer",
          fontSize: 16,
          transition: "background-color 0.3s"
        }}>
          Registrar mi cancha
        </button>
      </Link>
    </div>
  );
}
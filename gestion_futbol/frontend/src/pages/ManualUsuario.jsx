import React from "react";
import StyledSection from "../components/Section/StyledSection";

export default function ManualUsuario() {
  return (
    <StyledSection
      maxWidth={700}
      style={{
        margin: "40px auto",
        background: "linear-gradient(120deg, #e0f7fa 0%, #f7fff7 100%)",
        borderRadius: 18,
        boxShadow: "0 4px 24px #b2f7ef77",
        padding: "2.5rem 2rem",
        border: "2px solid #b2f7ef",
        color: "#007991",
        fontFamily: "inherit",
      }}
    >
      <h2 style={{
        textAlign: "center",
        fontWeight: 900,
        fontSize: 30,
        marginBottom: 18,
        letterSpacing: 1,
        color: "#007991",
      }}>
        📖 Manual de Usuario - Fútbol Piloto
      </h2>
      <ol style={{ fontSize: 18, lineHeight: 1.7, marginBottom: 18, paddingLeft: 24 }}>
        <li>
          <b>Registro de cuenta:</b> Haz clic en "Registrarse" y completa tus datos personales, correo electrónico, teléfono y contraseña. Recibirás un correo para verificar tu cuenta.
        </li>
        <li>
          <b>Iniciar sesión:</b> Ingresa tu correo y contraseña en la página de inicio de sesión. Si olvidaste tu contraseña, usa la opción "¿Olvidaste tu contraseña?" para recuperarla.
        </li>
        <li>
          <b>Buscar canchas:</b> Desde la página principal, puedes buscar y filtrar canchas sintéticas disponibles en tu ciudad.
        </li>
        <li>
          <b>Reservar una cancha:</b> Selecciona la cancha y el horario que desees. Puedes abonar una parte del valor o pagar el total. Confirma tu reserva y descarga tu factura.
        </li>
        <li>
          <b>Consultar tus reservas:</b> Accede a "Mis reservas" en el menú para ver el historial de tus reservas, descargar facturas y ver detalles de pago.
        </li>
        <li>
          <b>Ver estadísticas:</b> En la sección "Estadísticas" puedes consultar tus canchas más reservadas y tus horas jugadas.
        </li>
        <li>
          <b>Comunidad y soporte:</b> Usa la sección "Comunidad" para interactuar con otros usuarios y la sección "Información" para resolver dudas o contactar soporte.
        </li>
        <li>
          <b>Cerrar sesión:</b> Haz clic en el botón de cerrar sesión en el menú para salir de tu cuenta de forma segura.
        </li>
      </ol>
      <div style={{
        background: "#f7fff7",
        borderRadius: 10,
        padding: "1rem 1.5rem",
        margin: "24px 0 0 0",
        boxShadow: "0 2px 8px #b2f7ef22",
        borderLeft: "5px solid #43e97b",
        fontSize: 17
      }}>
        <b>Recomendaciones:</b>
        <ul style={{ marginTop: 8, marginBottom: 0 }}>
          <li>Verifica siempre tu correo después de registrarte.</li>
          <li>Guarda tu factura después de cada reserva.</li>
          <li>Si tienes problemas, contacta al soporte desde la sección "Información".</li>
        </ul>
      </div>
      <div style={{ textAlign: "center", marginTop: 32 }}>
        <span
          style={{
            fontSize: 22,
            color: "#43e97b",
            fontWeight: 900,
            letterSpacing: 2,
            textShadow: "0 2px 8px #b2f7ef55",
          }}
        >
          ¡Disfruta tu experiencia en Fútbol Piloto!
        </span>
      </div>
    </StyledSection>
  );
}

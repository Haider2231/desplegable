import React, { useEffect, useState } from "react";

export default function Perfil() {
  const [rol, setRol] = useState(null);

  useEffect(() => {
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
  }, []);

  // Manual de usuario para cada rol
  const manualUsuario = (
    <div style={{ marginTop: 32, background: "#f7fff7", borderRadius: 12, boxShadow: "0 2px 12px #43e97b22", padding: 24 }}>
      <h2 style={{ color: "#007991", marginBottom: 18, textAlign: "center" }}>Manual de Usuario</h2>
      {rol === "admin" && (
        <div>
          <h3 style={{ color: "#d32f2f" }}>Administrador</h3>
          <ul style={{ fontSize: 16, lineHeight: 1.7 }}>
            <li><b>Gestión de usuarios:</b> Crear, editar, eliminar y buscar usuarios. Asignar roles (usuario, propietario, validador, admin).</li>
            <li><b>Gestión de establecimientos:</b> Crear establecimientos para propietarios, editar datos y aprobar directamente.</li>
            <li><b>Estadísticas:</b> Visualizar estadísticas generales de la plataforma (usuarios, reservas, canchas, actividad).</li>
            <li><b>Supervisión:</b> Acceso a todos los módulos y funcionalidades del sistema.</li>
            <li><b>Validación:</b> Puede acceder a paneles de validación y ver el estado de solicitudes.</li>
          </ul>
        </div>
      )}
      {rol === "propietario" && (
        <div>
          <h3 style={{ color: "#388e3c" }}>Propietario</h3>
          <ul style={{ fontSize: 16, lineHeight: 1.7 }}>
            <li><b>Gestión de establecimientos:</b> Registrar nuevos establecimientos, subir imágenes y documentos, editar información y reenviar solicitudes si son rechazadas.</li>
            <li><b>Gestión de canchas:</b> Visualizar y administrar las canchas asociadas a sus establecimientos.</li>
            <li><b>Gestión de reservas:</b> Ver el historial de reservas, pagos pendientes y pagos completados de sus canchas.</li>
            <li><b>Estadísticas:</b> Consultar estadísticas de reservas e ingresos por establecimiento y cancha.</li>
            <li><b>Notificaciones:</b> Recibir correos cuando un usuario realiza una reserva en sus canchas.</li>
          </ul>
        </div>
      )}
      {rol === "usuario" && (
        <div>
          <h3 style={{ color: "#007991" }}>Usuario</h3>
          <ul style={{ fontSize: 16, lineHeight: 1.7 }}>
            <li><b>Reservar canchas:</b> Buscar establecimientos y canchas, seleccionar fecha y hora, reservar y abonar.</li>
            <li><b>Pagos:</b> Realizar abonos y completar pagos pendientes desde el panel de reservas.</li>
            <li><b>Historial:</b> Consultar historial de reservas, pagos realizados y facturas descargables.</li>
            <li><b>Perfil:</b> Editar información personal y cambiar contraseña.</li>
            <li><b>Soporte:</b> Contactar al soporte en caso de dudas o problemas.</li>
          </ul>
        </div>
      )}
      {!rol && (
        <div style={{ color: "#d32f2f", textAlign: "center" }}>
          No se pudo determinar tu rol. Por favor, inicia sesión nuevamente.
        </div>
      )}
    </div>
  );

  return (
    <div style={{ maxWidth: 700, margin: "0 auto", padding: 24 }}>
      {/* ...aquí va el resto de tu perfil, datos de usuario, etc... */}
      {manualUsuario}
    </div>
  );
}

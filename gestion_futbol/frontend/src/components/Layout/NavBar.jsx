import React, { useEffect, useState } from "react";
import { NavLink, useNavigate, useLocation } from "react-router-dom";
import "../../styles/globalHeaderNav.css";

export default function NavBar() {
  const navigate = useNavigate();
  const location = useLocation();

  const [rol, setRol] = useState(null);
  const [userId, setUserId] = useState(null);

  useEffect(() => {
    let currentRol = null;
    let currentUserId = null;
    try {
      const token = localStorage.getItem("token");
      if (token) {
        const base64Url = token.split(".")[1];
        let base64 = base64Url.replace(/-/g, "+").replace(/_/g, "/");
        while (base64.length % 4) base64 += "=";
        const payload = JSON.parse(atob(base64));
        currentRol = payload.rol;
        currentUserId = payload.userId;
        if (!payload.userId) {
          currentRol = null;
          currentUserId = null;
        }
      }
    } catch {
      currentRol = null;
      currentUserId = null;
    }
    setRol(currentRol);
    setUserId(currentUserId);
  }, []);

  // Solo redirige si el pathname es "/" y el rol es admin o propietario
  useEffect(() => {
    if (rol === "admin" && location.pathname === "/") {
      navigate("/estadisticas", { replace: true });
    } else if (rol === "propietario" && location.pathname === "/") {
      navigate("/manage-courts", { replace: true });
    }
    // No redirijas a "/" si no hay rol, deja que la navegación funcione normal
  }, [rol, location.pathname, navigate]);

  const isGuest = !rol;

  // Estado para mostrar el enlace de factura pendiente
  const [facturaPendiente, setFacturaPendiente] = useState(null);

  useEffect(() => {
    const checkFactura = () => {
      const data = localStorage.getItem("facturaPendiente");
      if (data) {
        try {
          const obj = JSON.parse(data);
          // Solo mostrar si el userId coincide
          if (
            obj.factura_url &&
            obj.finReserva &&
            obj.userId &&
            userId &&
            String(obj.userId) === String(userId)
          ) {
            const ahora = Date.now();
            if (ahora < obj.finReserva) {
              setFacturaPendiente(obj.factura_url);
              return;
            } else {
              localStorage.removeItem("facturaPendiente");
            }
          }
        } catch {}
      }
      setFacturaPendiente(null);
    };
    checkFactura();
    // Opcional: revisa cada minuto si expiró
    const interval = setInterval(checkFactura, 60000);
    return () => clearInterval(interval);
  }, [userId]);

  return (
    <nav className="navbar-futbol">
      {(rol === "usuario" || isGuest) && (
        <NavLink to="/" className="nav-btn">
          Principal
        </NavLink>
      )}

      {(rol === "usuario" || isGuest) && (
        <>
          <NavLink to="/community" className="nav-btn">
            Comunidad
          </NavLink>
          <NavLink to="/info" className="nav-btn">
            Información
          </NavLink>
          <NavLink to="/about" className="nav-btn">
            Sobre nosotros
          </NavLink>
          {/* Solo usuario puede ver estadísticas */}
          {rol === "usuario" && (
            <NavLink to="/estadisticas" className="nav-btn">
              Estadísticas
            </NavLink>
          )}
        </>
      )}

      {rol === "admin" && (
        <>
          <NavLink to="/courts" className="nav-btn">
            Canchas
          </NavLink>
          <NavLink to="/estadisticas" className="nav-btn">
            Estadísticas
          </NavLink>
          <NavLink to="/admin-users" className="nav-btn">
            Panel usuarios
          </NavLink>
          <NavLink to="/admin/crear-establecimiento" className="nav-btn">
            Crear Establecimiento
          </NavLink>
        </>
      )}

      {rol === "propietario" && (
        <>
          <NavLink to="/manage-courts" className="nav-btn">
            Gestionar canchas
          </NavLink>
          <NavLink to="/estadisticas" className="nav-btn">
            Estadísticas
          </NavLink>
        </>
      )}
      {rol === "usuario" && facturaPendiente && (
        <a
          href={facturaPendiente}
          target="_blank"
          rel="noopener noreferrer"
          className="nav-btn"
          style={{ background: "#43e97b", color: "#fff", fontWeight: 700 }}
        >
          <span role="img" aria-label="pdf" style={{ marginRight: 6 }}>📄</span>
          Descargar factura
        </a>
      )}
    </nav>
  );
}

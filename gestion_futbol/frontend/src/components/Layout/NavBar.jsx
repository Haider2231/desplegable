import React, { useEffect, useState } from "react";
import { NavLink, useNavigate, useLocation } from "react-router-dom";
import "../../styles/globalHeaderNav.css";

export default function NavBar() {
  const navigate = useNavigate();
  const location = useLocation();

  const [rol, setRol] = useState(null);
  const [tieneEstablecimiento, setTieneEstablecimiento] = useState(false);

  // Nuevo: para refrescar el estado cuando se registra un establecimiento
  useEffect(() => {
    const handleStorage = (e) => {
      if (e.key === "establecimientoRegistrado") {
        // Forzar refresco de estado
        checkEstablecimientos();
      }
    };
    window.addEventListener("storage", handleStorage);
    return () => window.removeEventListener("storage", handleStorage);
    // eslint-disable-next-line
  }, []);

  function checkEstablecimientos() {
    let currentRol = null;
    let userId = null;
    try {
      const token = localStorage.getItem("token");
      if (token) {
        const base64Url = token.split(".")[1];
        let base64 = base64Url.replace(/-/g, "+").replace(/_/g, "/");
        while (base64.length % 4) base64 += "=";
        const payload = JSON.parse(atob(base64));
        currentRol = payload.rol;
        userId = payload.userId;
        if (!userId) {
          currentRol = null;
        }
      }
    } catch {
      currentRol = null;
    }
    setRol(currentRol);

    if (userId) {
      fetch(`/establecimientos/dueno/${userId}`, {
        headers: { Authorization: `Bearer ${localStorage.getItem("token")}` }
      })
        .then(res => res.json())
        .then(data => {
          // Mostrar el enlace si hay al menos un establecimiento pendiente o rechazado
          const tienePendienteORechazado = Array.isArray(data) && data.some(e => e.estado === "pendiente" || e.estado === "rechazado");
          setTieneEstablecimiento(tienePendienteORechazado);
          if (currentRol === "usuario" && Array.isArray(data) && data.some(e => e.estado === "activo")) {
            setRol("propietario");
          }
        })
        .catch(() => setTieneEstablecimiento(false));
    } else {
      setTieneEstablecimiento(false);
    }
  }

  useEffect(() => {
    checkEstablecimientos();
    // eslint-disable-next-line
  }, []);

  useEffect(() => {
    if (rol === "admin" && location.pathname === "/") {
      navigate("/estadisticas", { replace: true });
    } else if (rol === "propietario" && location.pathname === "/") {
      navigate("/manage-courts", { replace: true });
    } else if (rol === "validador" && location.pathname === "/") {
      navigate("/validador/canchas", { replace: true });
    }
  }, [rol, location.pathname, navigate]);

  const isGuest = !rol;

  const [facturaPendiente, setFacturaPendiente] = useState(null);

  useEffect(() => {
    const checkFactura = () => {
      const data = localStorage.getItem("facturaPendiente");
      if (data) {
        try {
          const obj = JSON.parse(data);
          if (obj.factura_url && obj.finReserva) {
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
    const interval = setInterval(checkFactura, 60000);
    return () => clearInterval(interval);
  }, []);

  return (
    <nav className="navbar-futbol">
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
          {rol === "usuario" && (
            <>
              <NavLink to="/estadisticas" className="nav-btn">
                Estadísticas
              </NavLink>
              <NavLink to="/registrar-establecimiento" className="nav-btn">
                Registrar establecimiento
              </NavLink>
              {tieneEstablecimiento && (
                <NavLink to="/mis-establecimientos" className="nav-btn">
                  Estado de mi establecimiento
                </NavLink>
              )}
            </>
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
          <NavLink to="/registrar-establecimiento" className="nav-btn">
            Registrar establecimiento
          </NavLink>
          <NavLink to="/mis-establecimientos" className="nav-btn">
            Mis establecimientos
          </NavLink>
        </>
      )}

      {rol === "validador" && (
        <NavLink to="/validador/canchas" className="nav-btn">
          Panel de validación
        </NavLink>
      )}

      {facturaPendiente && (
        <a
          href={facturaPendiente}
          target="_blank"
          rel="noopener noreferrer"
          className="nav-btn"
        >
          <span role="img" aria-label="pdf" style={{ marginRight: 6 }}>📄</span>
          Descargar factura
        </a>
      )}
      {location.pathname === "/quiero-registrar-cancha" && (
        <NavLink to="/quiero-registrar-cancha" className="nav-btn" style={{ background: "#ffeb3b", color: "#388e3c", fontWeight: 700 }}>
          ¿Deseas registrar tu cancha? Lee esto primero
        </NavLink>
      )}
    </nav>
  );
}

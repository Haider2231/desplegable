import React from "react";
import { NavLink, useNavigate } from "react-router-dom";
import "../../styles/globalHeaderNav.css";

export default function NavBar() {
  const navigate = useNavigate();
  // Obtener el rol desde el token (si existe)
  let rol = null;
  try {
    const token = localStorage.getItem("token");
    if (token) {
      const base64Url = token.split(".")[1];
      let base64 = base64Url.replace(/-/g, "+").replace(/_/g, "/");
      // Añadir padding correcto para base64
      while (base64.length % 4) base64 += "=";
      const payload = JSON.parse(atob(base64));
      rol = payload.rol;
      // Si necesitas validar userId:
      if (!payload.userId) {
        rol = null;
      }
    }
  } catch {
    rol = null;
  }

  return (
    <nav className="navbar-futbol">
      {(rol === "usuario" || rol === "propietario")&&(<NavLink to="/" className="nav-btn">
        Principal
      </NavLink>)}
      <NavLink to="/courts" className="nav-btn">
        Canchas
      </NavLink>
      {(rol === "usuario")&&(<NavLink to="/community" className="nav-btn">
        Comunidad
      </NavLink>)}
      {(rol === "usuario")&&(<NavLink to="/info" className="nav-btn">
        Información
      </NavLink>)}
      {(rol === "usuario")&&(<NavLink to="/about" className="nav-btn">
        Sobre nosotros
      </NavLink>)}

      <NavLink to="/estadisticas" className="nav-btn">
        Estadísticas
      </NavLink>

      {(rol === "propietario" ) && (<NavLink to="/manage-courts" className="nav-btn">
          Gestionar canchas
        </NavLink>
      )}
    </nav>
  );
}
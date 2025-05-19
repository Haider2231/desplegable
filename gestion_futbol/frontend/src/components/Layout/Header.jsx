import React from "react";
import { useNavigate } from "react-router-dom";
import "../../styles/globalHeaderNav.css";

export default function Header() {
  const navigate = useNavigate();

  // Obtener usuario del token
  let user = null;
  try {
    const token = localStorage.getItem("token");
    if (token) {
      const base64Url = token.split(".")[1];
      let base64 = base64Url.replace(/-/g, "+").replace(/_/g, "/");
      while (base64.length % 4) base64 += "=";
      const payload = JSON.parse(atob(base64));
      user = payload;
    }
  } catch {}

  const handleLogout = () => {
    localStorage.removeItem("token");
    window.location.reload();
  };

  return (
    <header
      className="football-footer-bg"
      style={{
        width: "90vw",
        minWidth: "100vw",
        left: 0,
        right: 0,
        top: 0,
        position: "relative",
        padding: "0 0 28px 0",
        boxShadow: "0 8px 30px 0 #1b5e2055",
        zIndex: 10,
        overflow: "hidden",
        borderTop: "6px solid #fff",
        fontFamily: "'Bebas Neue', Impact, Arial, sans-serif",
        marginTop: 0, // Asegura que no haya margen superior
      }}
    >
      <div
        style={{
          maxWidth: 10200,
          margin: "0 auto",
          padding: "0 0px",
          display: "flex",
          flexDirection: "column",
          alignItems: "center",
        }}
      >
        <h1
          style={{
            margin: "0",
            paddingTop: 36,
            paddingBottom: 10,
            fontSize: "2.8rem",
            fontWeight: 800,
            color: "#fff",
            letterSpacing: "2.5px",
            textShadow: "0 4px 24px #1b5e2055, 0 1px 0 #fff",
            textAlign: "center",
            userSelect: "none",
            fontFamily: "'Bebas Neue', Impact, Arial, sans-serif",
            display: "flex",
            alignItems: "center",
            gap: 2,
            position: "relative"
          }}
        >
          <span style={{
            fontSize: "2.5rem",
            filter: "drop-shadow(0 2px 2px #1b5e2055)",
            animation: "ball-bounce 1.2s infinite alternate"
          }}>⚽</span>
          Fútbol Piloto
        </h1>
        <div
          className="header-buttons"
          style={{
            display: "flex",
            alignItems: "center",
            justifyContent: "center",
            gap: 24,
            marginTop: 10,
            flexWrap: "wrap"
          }}
        >
          {!user ? (
            <>
              <button
                className="football-btn"
                style={{
                  background: "linear-gradient(90deg, #388e3c 0%, #43a047 100%)",
                  color: "#fff",
                  fontWeight: 700,
                  borderRadius: "16px",
                  padding: "12px 32px",
                  fontSize: "1.13rem",
                  boxShadow: "0 4px 16px #1b5e2055",
                  border: "2px solid #fff",
                  fontFamily: "'Bebas Neue', Impact, Arial, sans-serif",
                  letterSpacing: "1px",
                  cursor: "pointer",
                  transition: "all 0.22s cubic-bezier(.4,2,.6,1)",
                }}
                onClick={() => navigate("/login")}
              >
                Ingresar
              </button>
              <button
                className="football-btn"
                style={{
                  background: "linear-gradient(90deg, #43a047 0%, #388e3c 100%)",
                  color: "#fff",
                  fontWeight: 700,
                  borderRadius: "16px",
                  padding: "12px 32px",
                  fontSize: "1.13rem",
                  boxShadow: "0 4px 16px #1b5e2055",
                  border: "2px solid #fff",
                  fontFamily: "'Bebas Neue', Impact, Arial, sans-serif",
                  letterSpacing: "1px",
                  cursor: "pointer",
                  transition: "all 0.22s cubic-bezier(.4,2,.6,1)",
                }}
                onClick={() => navigate("/register")}
              >
                ¿Tienes una cancha? Súbela aquí
              </button>
            </>
          ) : (
            <>
              <div
                className="user-greeting-animated"
                style={{
                  display: "flex",
                  alignItems: "center",
                  marginRight: 0,
                  gap: 0,
                  position: "relative",
                  cursor: "pointer",
                  minWidth: 0,
                  background: "rgba(255,255,255,0.10)",
                  borderRadius: "32px",
                  boxShadow: "0 2px 16px 0 #1b5e2055",
                  padding: "0 0 0 0",
                  transition: "box-shadow 0.18s, background 0.18s"
                }}
                tabIndex={0}
                title={`Bienvenido, ${user.nombre.charAt(0).toUpperCase() + user.nombre.slice(1)}`}
              >
                <div
                  className="avatar-animated"
                  style={{
                    width: 48,
                    height: 48,
                    borderRadius: "50%",
                    background: "radial-gradient(circle at 60% 40%, #fff 20%, #388e3c 100%)",
                    display: "flex",
                    alignItems: "center",
                    justifyContent: "center",
                    color: "#388e3c",
                    fontWeight: "bold",
                    fontSize: "1.6rem",
                    border: "3px solid #fff",
                    boxShadow: "0 4px 18px 0 #1b5e2055",
                    position: "absolute",
                    left: -10,
                    top: "50%",
                    transform: "translateY(-50%)",
                    zIndex: 2,
                  }}
                >
                  <span
                    style={{
                      display: "inline-block",
                      marginRight: 2,
                      fontSize: "1.3rem",
                      animation: "ball-bounce 1.2s infinite alternate"
                    }}
                    role="img"
                    aria-label="balón"
                  >
                  </span>
                  {user.nombre.charAt(0).toUpperCase()}
                </div>
                <span
                  className="username-badge-combo"
                  style={{
                    fontWeight: 700,
                    fontSize: "1.18rem",
                    color: "#fff",
                    background: "rgba(56,142,60,0.95)",
                    border: "2px solid #fff",
                    fontFamily: "'Bebas Neue', Impact, Arial, sans-serif",
                    padding: "14px 32px 14px 60px",
                    borderRadius: "28px",
                    boxShadow: "0 4px 24px 0 #1b5e2055",
                    marginLeft: 32,
                    display: "inline-block",
                    minWidth: 140,
                    textOverflow: "ellipsis",
                    overflow: "hidden",
                    whiteSpace: "nowrap",
                    letterSpacing: "0.7px",
                    position: "relative",
                    zIndex: 1,
                  }}
                >
                  Bienvenido, {user.nombre.charAt(0).toUpperCase() + user.nombre.slice(1)}
                </span>
              </div>
              <button
                className="football-btn"
                style={{
                  background: "linear-gradient(90deg, #388e3c 0%, #43a047 100%)",
                  color: "#fff",
                  fontWeight: 700,
                  borderRadius: "16px",
                  padding: "12px 32px",
                  fontSize: "1.13rem",
                  boxShadow: "0 4px 16px #1b5e2055",
                  border: "2px solid #fff",
                  fontFamily: "'Bebas Neue', Impact, Arial, sans-serif",
                  letterSpacing: "1px",
                  cursor: "pointer",
                  transition: "all 0.22s cubic-bezier(.4,2,.6,1)",
                }}
                onClick={handleLogout}
              >
                Cerrar sesión
              </button>
            </>
          )}
        </div>
      </div>
    </header>
  );
}
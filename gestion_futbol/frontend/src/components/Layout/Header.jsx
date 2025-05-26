import React, { useState } from "react";
import { useNavigate } from "react-router-dom";
import "../../styles/globalHeaderNav.css";


export default function Header() {
  const navigate = useNavigate();
  const [showRegistroModal, setShowRegistroModal] = useState(false);
  const [showInstrucciones, setShowInstrucciones] = useState(false);

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
    window.location.href = "/"; // Redirige y recarga como invitado (sin token)
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
        marginTop: 0,
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
                onClick={() => navigate("/register")}
              >
                Registrarse
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
                onClick={() => setShowRegistroModal(true)}
              >
                Registra tu cancha
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

        {/* Modal lateral/flotante para requisitos de registro de cancha */}
        {showRegistroModal && (
          <div
            style={{
              position: "fixed",
              top: 0,
              right: 0,
              bottom: 0,
              left: 0,
              background: "rgba(0,0,0,0.25)",
              zIndex: 2000,
              display: "flex",
              alignItems: "center",
              justifyContent: "center"
            }}
            onClick={() => setShowRegistroModal(false)}
          >
            <div
              style={{
                background: "#fff",
                borderRadius: 18,
                boxShadow: "0 8px 32px #43e97b33",
                padding: "2.5rem 2rem",
                maxWidth: 480,
                width: "100%",
                position: "relative",
                overflowY: "auto",
                maxHeight: "90vh"
              }}
              onClick={e => e.stopPropagation()}
            >
              <button
                onClick={() => setShowRegistroModal(false)}
                style={{
                  position: "absolute",
                  top: 16,
                  right: 16,
                  background: "#ffd6d6",
                  color: "#d32f2f",
                  border: "none",
                  borderRadius: 8,
                  padding: "6px 12px",
                  fontWeight: 700,
                  cursor: "pointer"
                }}
              >Cerrar</button>
              <h2 style={{
                color: "#007991",
                fontWeight: 900,
                fontSize: 24,
                marginBottom: 18,
                textAlign: "center"
              }}>
                Registra tu cancha en nuestra plataforma
              </h2>
              <div style={{ color: "#333", fontSize: 16, marginBottom: 18 }}>
                Para comenzar el proceso y darte acceso como propietario, necesitamos verificar que gestionas una cancha sintética en funcionamiento.
              </div>
              <div style={{
                background: "#e0f7fa",
                borderRadius: 10,
                padding: "1rem 1.2rem",
                marginBottom: 18,
                fontSize: 15,
                color: "#007991"
              }}>
                <b>
                  Requisitos (envíalos al correo:{" "}
                  <a
                    href="https://mail.google.com/mail/?view=cm&fs=1&to=futbolupiloto@gmail.com&su=Documentos%20para%20registro%20de%20cancha&body=Adjunto%20los%20documentos%20requeridos%20para%20registrar%20mi%20cancha."
                    target="_blank"
                    rel="noopener noreferrer"
                    style={{ color: "#388e3c", textDecoration: "underline" }}
                  >
                    futbolupiloto@gmail.com
                  </a>
                  )
                </b>
                <ul style={{ margin: "10px 0 0 18px" }}>
                  <li>Documento de identidad (cédula de ciudadanía o extranjería).</li>
                  <li>Uno de los siguientes documentos:
                    <ul style={{ margin: "6px 0 0 18px" }}>
                      <li>Certificado de matrícula mercantil vigente.</li>
                      <li>O contrato de arriendo/administración.</li>
                      <li>Recibo de servicio público del establecimiento.</li>
                    </ul>
                  </li>
                  <li>Fotos actuales de la cancha (mínimo 2).</li>
                  <li>Dirección exacta y número de contacto.</li>
                </ul>
              </div>
              <div style={{ marginBottom: 12 }}>
                <button
                  style={{
                    background: "#43e97b",
                    color: "#fff",
                    border: "none",
                    borderRadius: 8,
                    padding: "8px 18px",
                    fontWeight: 700,
                    fontSize: 15,
                    cursor: "pointer",
                    marginBottom: 6
                  }}
                  onClick={() => setShowInstrucciones(!showInstrucciones)}
                  type="button"
                >
                  ¿Cómo obtener el certificado de matrícula mercantil? (Haz clic aquí)
                </button>
                {showInstrucciones && (
                  <div style={{
                    background: "#f7fff7",
                    border: "1.5px solid #43e97b",
                    borderRadius: 8,
                    padding: "1rem",
                    marginTop: 8,
                    fontSize: 15,
                    color: "#007991"
                  }}>
                    <b>Pasos para obtener el Certificado de Matrícula Mercantil (Colombia)</b>
                    <ul style={{ margin: "10px 0 0 18px" }}>
                      <li><b>Bogotá:</b> Ingresa a <a href="https://www.ccb.org.co" target="_blank" rel="noopener noreferrer">ccb.org.co</a> &gt; Servicios en línea &gt; Certificados &gt; Busca tu negocio por nombre o NIT &gt; Selecciona el certificado de matrícula mercantil &gt; Paga (aprox. $5.000) &gt; Descarga el PDF.</li>
                      <li><b>Medellín:</b> <a href="https://www.camaramed.org.co" target="_blank" rel="noopener noreferrer">camaramed.org.co</a></li>
                      <li><b>Cali:</b> <a href="https://www.ccc.org.co" target="_blank" rel="noopener noreferrer">ccc.org.co</a></li>
                      <li>Para otras ciudades, busca “Cámara de Comercio de [tu ciudad]” en Google.</li>
                    </ul>
                  </div>
                )}
              </div>
              <div style={{
                marginTop: 18,
                color: "#388e3c",
                fontWeight: 700,
                fontSize: 16,
                textAlign: "center"
              }}>
                ¿Ya tienes todo listo?<br />
                Envía los documentos al correo:<br />
                <a
                  href="https://mail.google.com/mail/?view=cm&fs=1&to=futbolupiloto@gmail.com&su=Documentos%20para%20registro%20de%20cancha&body=Adjunto%20los%20documentos%20requeridos%20para%20registrar%20mi%20cancha."
                  target="_blank"
                  rel="noopener noreferrer"
                  style={{ color: "#007991", textDecoration: "underline" }}
                >
                  futbolupiloto@gmail.com
                </a>
                <br />
                y te daremos acceso como propietario.
              </div>
            </div>
          </div>
        )}
      </div>
    </header>
  );
}
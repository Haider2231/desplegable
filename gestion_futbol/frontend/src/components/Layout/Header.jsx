import React, { useState, useRef, useEffect } from "react";
import { useNavigate, useLocation } from "react-router-dom";
import "../../styles/globalHeaderNav.css";


export default function Header() {
  const navigate = useNavigate();
  const location = useLocation();
  const [showRegistroModal, setShowRegistroModal] = useState(false);
  const [showInstrucciones, setShowInstrucciones] = useState(false);
  const [showProfileMenu, setShowProfileMenu] = useState(false);
  const [pendingCount, setPendingCount] = useState(0);
  const profileMenuRef = useRef(null);

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

  // Cerrar menú al hacer click fuera
  useEffect(() => {
    if (!showProfileMenu) return;
    function handleClickOutside(e) {
      if (profileMenuRef.current && !profileMenuRef.current.contains(e.target)) {
        setShowProfileMenu(false);
      }
    }
    document.addEventListener("mousedown", handleClickOutside);
    return () => document.removeEventListener("mousedown", handleClickOutside);
  }, [showProfileMenu]);

  // Consulta la cantidad de pagos pendientes del usuario
  useEffect(() => {
    async function fetchPendientes() {
      try {
        const res = await fetch("/reservas/mis-reservas", {
          headers: { Authorization: `Bearer ${localStorage.getItem("token")}` }
        });
        const data = await res.json();
        // Asegura que data sea un array y filtra por estado pendiente
        if (Array.isArray(data)) {
          setPendingCount(data.filter(r => r.estado === "pendiente").length);
        } else {
          setPendingCount(0);
        }
      } catch {
        setPendingCount(0);
      }
    }
    if (user) fetchPendientes();
  }, [user, showProfileMenu]); // <-- actualiza también al abrir/cerrar el menú

  const handleLogout = () => {
    localStorage.removeItem("token");
    window.location.href = "/"; // Redirige y recarga como invitado (sin token)
  };

  // Cambia el handler para que navegue al mapa principal SOLO si no está ya en "/"
  const handleTituloClick = () => {
    if (location.pathname !== "/") {
      navigate("/", { replace: true });
    }
    // Si ya está en "/", no hace nada (evita recarga y evita triggers de NavBar)
  };

  // Define handleRegistrarCancha para evitar el error
  const handleRegistrarCancha = () => {
    navigate("/quiero-registrar-cancha");
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
            position: "relative",
            cursor: "pointer"
          }}
          onClick={handleTituloClick}
          title="Ir al inicio"
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
                onClick={handleRegistrarCancha}
              >
                REGISTRA TU CANCHA
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
                  transition: "box-shadow 0.18s, background 0.18s",
                  zIndex: 1000
                }}
                tabIndex={0}
                title={`Bienvenido, ${user.nombre.charAt(0).toUpperCase() + user.nombre.slice(1)}`}
                onClick={() => setShowProfileMenu((v) => !v)}
                ref={profileMenuRef}
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
                    position: "relative",
                    left: 0,
                    top: "auto",
                    transform: "none",
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
                  {/* Badge de pagos pendientes */}
                  {pendingCount > 0 && (
                    <span style={{
                      position: "absolute",
                      top: -6,
                      right: -6,
                      background: "#d32f2f",
                      color: "#fff",
                      borderRadius: "50%",
                      width: 22,
                      height: 22,
                      fontSize: 13,
                      fontWeight: 800,
                      display: "flex",
                      alignItems: "center",
                      justifyContent: "center",
                      border: "2px solid #fff",
                      boxShadow: "0 2px 8px #d32f2f44"
                    }}>
                      {pendingCount}
                    </span>
                  )}
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
                    padding: "14px 24px 14px 56px",
                    borderRadius: "28px",
                    boxShadow: "0 4px 24px 0 #1b5e2055",
                    marginLeft: -18,
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
                <span
                  style={{
                    marginLeft: 8,
                    marginRight: 0,
                    fontSize: 22,
                    color: "#fff",
                    userSelect: "none",
                    pointerEvents: "none",
                    display: "flex",
                    alignItems: "center"
                  }}
                >
                  ▼
                </span>
                {showProfileMenu && (
                  <div
                    style={{
                      position: "fixed",
                      top: profileMenuRef.current
                        ? profileMenuRef.current.getBoundingClientRect().bottom + window.scrollY + 8
                        : 100,
                      left: profileMenuRef.current
                        ? profileMenuRef.current.getBoundingClientRect().left + window.scrollX
                        : "50%",
                      background: "#fff",
                      borderRadius: 14,
                      boxShadow: "0 8px 32px #43e97b33, 0 1.5px 8px #43e97b33",
                      minWidth: 240,
                      zIndex: 3000,
                      padding: "14px 0",
                      border: "2px solid #43e97b",
                      animation: "fadeInProfileMenu 0.2s"
                    }}
                  >
                    {/* Opciones para ADMIN */}
                    {user?.rol === "admin" ? (
                      <>
                        <button
                          style={profileMenuBtnStyle}
                          onClick={() => { setShowProfileMenu(false); navigate("/admin/crear-establecimiento"); }}
                        >
                          🏢 Crear establecimiento
                        </button>
                        <button
                          style={profileMenuBtnStyle}
                          onClick={() => { setShowProfileMenu(false); navigate("/admin-users"); }}
                        >
                          👤 Panel usuarios
                        </button>
                        <button
                          style={profileMenuBtnStyle}
                          onClick={() => { setShowProfileMenu(false); navigate("/estadisticas"); }}
                        >
                          📊 Estadísticas
                        </button>
                        <hr style={{ margin: "8px 0", border: "none", borderTop: "1.5px solid #e0e0e0" }} />
                        <button
                          style={{ ...profileMenuBtnStyle, color: "#d32f2f" }}
                          onClick={handleLogout}
                        >
                          Cerrar sesión
                        </button>
                      </>
                    ) : (
                      <>
                        {/* Opciones para usuario, propietario, validador */}
                        <button
                          style={profileMenuBtnStyle}
                          onClick={() => { setShowProfileMenu(false); navigate("/mis-reservas"); }}
                        >
                          📅 Ver reservas hechas
                        </button>
                        <button
                          style={profileMenuBtnStyle}
                          onClick={() => { setShowProfileMenu(false); navigate("/mis-reservas?estado=pendiente"); }}
                        >
                          💸 Pagos pendientes
                        </button>
                        <button
                          style={profileMenuBtnStyle}
                          onClick={() => { setShowProfileMenu(false); navigate("/mis-reservas?estado=confirmada"); }}
                        >
                          ✅ Pagos completados
                        </button>
                        <button
                          style={profileMenuBtnStyle}
                          onClick={() => { setShowProfileMenu(false); navigate("/registrar-establecimiento"); }}
                        >
                          🏢 Registrar establecimiento
                        </button>
                        <button
                          style={profileMenuBtnStyle}
                          onClick={() => { setShowProfileMenu(false); navigate("/estadisticas"); }}
                        >
                          📊 Estadísticas
                        </button>
                        <hr style={{ margin: "8px 0", border: "none", borderTop: "1.5px solid #e0e0e0" }} />
                        <button
                          style={{ ...profileMenuBtnStyle, color: "#d32f2f" }}
                          onClick={handleLogout}
                        >
                          Cerrar sesión
                        </button>
                      </>
                    )}
                  </div>
                )}
              </div>
              {/* <button
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
              </button> */}
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
      {/* Animación para el menú */}
      <style>
        {`
          @keyframes fadeInProfileMenu {
            from { opacity: 0; transform: translateY(-10px);}
            to { opacity: 1; transform: translateY(0);}
          }
        `}
      </style>
    </header>
  );
}

// Estilo para los botones del menú de perfil
const profileMenuBtnStyle = {
  width: "100%",
  background: "none",
  border: "none",
  color: "#007991",
  fontWeight: 700,
  fontSize: 16,
  textAlign: "left",
  padding: "10px 24px",
  cursor: "pointer",
  transition: "background 0.18s",
  outline: "none",
  borderRadius: 0,
  display: "block"
};
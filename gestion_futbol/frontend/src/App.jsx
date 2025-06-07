import React from "react";
import { BrowserRouter as Router, Routes, Route } from "react-router-dom";
import Header from "./components/Layout/Header";
import NavBar from "./components/Layout/NavBar";
import Footer from "./components/Layout/Footer"; // <-- Importa Footer
import Home from "./pages/Home";
import Courts from "./pages/Courts";
import Community from "./pages/Community";
import Info from "./pages/Info";
import About from "./pages/About";
import Login from "./components/Auth/Login";
import Register from "./components/Auth/Register";
import Verify from "./components/Auth/Verify";
import ReserveCourt from "./pages/ReserveCourt";
import ManageCourts from "./pages/ManageCourts";
import ForgotPassword from "./components/Auth/ForgotPassword";
import ResetPassword from "./components/Auth/ResetPassword";
import Estadisticas from "./pages/Estadisticas";
import AdminUsersPanel from "./components/admin/AdminUsersPanel";
import Pagos from "./pages/Pagos";
import ReservaExitosa from "./pages/ReservaExitosa";
import AdminCrearEstablecimiento from "./pages/AdminCrearEstablecimiento";
import ValidadorCanchas from "./pages/ValidadorCanchas";
import RegistrarEstablecimiento from "./pages/RegistrarEstablecimiento";
import MisEstablecimientos from "./pages/MisEstablecimientos";
import MisReservas from "./pages/MisReservas";
import { useLocation } from "react-router-dom";

import MisReservas from "./pages/MisReservas";
import ManualUsuario from "./pages/ManualUsuario";

function App() {
  return (
    <Router>
      <Routes>
        <Route
          path="/login"
          element={
            <div style={{ minHeight: "100vh", display: "flex", alignItems: "center", justifyContent: "center", background: "#f8f9fd" }}>
              <Login />
            </div>
          }
        />
        <Route
          path="/register"
          element={
            <div style={{ minHeight: "100vh", display: "flex", alignItems: "center", justifyContent: "center", background: "#f8f9fd" }}>
              <Register />
            </div>
          }
        />
        <Route
          path="/forgot-password"
          element={
            <ForgotPassword />
          }
        />
        <Route
          path="/reset-password"
          element={
            <ResetPassword />
          }
        />
        <Route
          path="*"
          element={
            <div
              style={{
                minHeight: "100vh",
                background: "linear-gradient(135deg, #e0f7fa 0%, #f8fffe 100%)",
                display: "flex",
                flexDirection: "column"
              }}
            >
              <Header />
              <NavBar />
              <div style={{ flex: 1, width: "100%", display: "flex", flexDirection: "column" }}>
                <Routes>
                  <Route path="/" element={<Home />} />
                  <Route path="/courts" element={<Courts />} />
                  <Route path="/community" element={<Community />} />
                  <Route path="/info" element={<Info />} />
                  <Route path="/about" element={<About />} />
                  <Route path="/verify" element={<Verify />} />
                  <Route path="/reservar" element={<ReserveCourt />} />
                  <Route path="/manage-courts" element={<ManageCourts />} />
                  <Route path="/estadisticas" element={
                    <div style={{ margin: "32px auto", maxWidth: 600 }}>
                      <Estadisticas />
                    </div>
                  } />
                  <Route path="/admin-users" element={<AdminUsersPanel />} />
                  <Route path="/pagos" element={<Pagos />} />
                  <Route path="/reserva-exitosa" element={<ReservaExitosa />} />
                  <Route path="/admin/crear-establecimiento" element={<AdminCrearEstablecimiento />} />
                  <Route path="/validador/canchas" element={<ValidadorCanchas />} />
                  <Route path="/quiero-registrar-cancha" element={<QuieroRegistrarCancha />} />
                  <Route path="/registrar-establecimiento" element={<RegistrarEstablecimiento />} />
                  <Route path="/mis-establecimientos" element={<MisEstablecimientos />} />
                  <Route path="/mis-reservas" element={<MisReservas />} />
                </Routes>
              </div>
              <Footer />
            </div>
          }
        />
      </Routes>
    </Router>
  );
}

function QuieroRegistrarCancha() {
  const [tieneEstablecimiento, setTieneEstablecimiento] = React.useState(false);
  const [loading, setLoading] = React.useState(true);
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

  React.useEffect(() => {
    if (!user) {
      setLoading(false);
      return;
    }
    // Consulta si el usuario ya tiene establecimientos
    fetch(`/establecimientos/dueno/${user.userId}`, {
      headers: { Authorization: `Bearer ${localStorage.getItem("token")}` }
    })
      .then(res => res.json())
      .then(data => setTieneEstablecimiento(Array.isArray(data) && data.length > 0))
      .finally(() => setLoading(false));
  }, [user]);

  if (loading) {
    return (
      <div style={{ maxWidth: 600, margin: "2rem auto", background: "#fff", borderRadius: 12, boxShadow: "0 4px 16px #b2f7ef", padding: "2rem", textAlign: "center" }}>
        Cargando...
      </div>
    );
  }

  if (user && tieneEstablecimiento) {
    // Muestra el panel de estado de establecimientos
    return <MisEstablecimientos />;
  }

  return (
    <div style={{ maxWidth: 600, margin: "2rem auto", background: "#fff", borderRadius: 12, boxShadow: "0 4px 16px #b2f7ef", padding: "2rem" }}>
      <h2>¿Quieres registrar tu cancha?</h2>
      <p>
        Para registrar tu cancha debes primero crear una cuenta e iniciar sesión.<br />
        Luego podrás acceder al formulario para registrar tu establecimiento y subir los documentos requeridos.<br /><br />
        <b>Pasos:</b>
        <ol>
          <li>Regístrate o inicia sesión.</li>
          <li>Accede a este apartado y haz clic en el botón de abajo.</li>
          <li>Llena el formulario y sube los documentos.</li>
          <li>Un validador revisará tu solicitud y te notificaremos cuando esté aprobada.</li>
        </ol>
      </p>
      {!user ? (
        <button
          onClick={() => window.location.href = "/login"}
          style={{ background: "#43a047", color: "#fff", border: "none", borderRadius: 8, padding: "12px 28px", fontWeight: 700, fontSize: 16, marginTop: 18 }}
        >
          Iniciar sesión / Registrarse
        </button>
      ) : (
        <button
          onClick={() => window.location.href = "/registrar-establecimiento"}
          style={{ background: "#388e3c", color: "#fff", border: "none", borderRadius: 8, padding: "12px 28px", fontWeight: 700, fontSize: 16, marginTop: 18 }}
        >
          Ir al formulario de registro
        </button>
      )}
    </div>
  );
}

export default App;

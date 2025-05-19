import React, { useState } from "react";
import { useNavigate } from "react-router-dom";
import axios from "axios";
import "../../styles/loginModern.css";
import Verify from "./Verify";

export default function Register({ onRegister }) {
  const [nombre, setNombre] = useState("");
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [error, setError] = useState("");
  const [loading, setLoading] = useState(false);
  const [success, setSuccess] = useState("");
  const [showVerify, setShowVerify] = useState(false);
  const navigate = useNavigate();

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError("");
    setSuccess("");
    setLoading(true);
    try {
      const res = await axios.post("/auth/usuarios", {
        nombre,
        email,
        password,
        rol: "usuario",
      });
      if (res.data && !res.data.error) {
        setSuccess("¡Registro exitoso! Revisa tu correo para verificar tu cuenta.");
        setShowVerify(true); // Mostrar el formulario de verificación
      } else {
        setError(res.data.error || "Error al registrar el usuario");
      }
    } catch (err) {
      if (err.response && err.response.data && err.response.data.error) {
        setError(err.response.data.error);
      } else {
        setError("Error de conexión con el servidor");
      }
    }
    setLoading(false);
  };

  const goToLogin = () => {
    navigate("/login");
  };

  if (showVerify) {
    return (
      <div
        style={{
          minHeight: "100vh",
          width: "100vw",
          background: "#007991",
          backgroundImage: "linear-gradient(to right, #78ffd6, #007991)",
          display: "flex",
          alignItems: "center",
          justifyContent: "center",
        }}
      >
        <Verify email={email} />
      </div>
    );
  }

  return (
    <div
      style={{
        minHeight: "100vh",
        width: "100vw",
        background: "#007991",
        backgroundImage: "linear-gradient(to right, #78ffd6, #007991)",
        display: "flex",
        alignItems: "center",
        justifyContent: "center",
      }}
    >
      <div className="container">
        <div className="heading">Sign Up</div>
        <form className="form" onSubmit={handleSubmit}>
          <input
            required
            className="input"
            type="text"
            name="nombre"
            placeholder="Name"
            value={nombre}
            onChange={(e) => setNombre(e.target.value)}
              style={{ marginLeft: "-18px" }} 
          />
          <input
            required
            className="input"
            type="email"
            name="email"
            placeholder="E-mail"
            value={email}
            onChange={(e) => setEmail(e.target.value)}
              style={{ marginLeft: "-18px" }} 
          />
          <input
            required
            className="input"
            type="password"
            name="password"
            placeholder="Password"
            value={password}
            onChange={(e) => setPassword(e.target.value)}
              style={{ marginLeft: "-18px" }} 
          />
          <input
            className="login-button"
            type="submit"
            value={loading ? "Registrando..." : "Sign Up"}
            disabled={loading}
          />
          {error && (
            <div style={{ color: "red", marginTop: 8, textAlign: "center" }}>{error}</div>
          )}
          {success && (
            <div style={{ color: "green", marginTop: 8, textAlign: "center" }}>{success}</div>
          )}
        </form>
        <div className="social-account-container">
          <span
            className="title"
            style={{ cursor: "pointer", color: "#0b8c3a", fontWeight: "bold" }}
            onClick={goToLogin}
          >
            Or Sign up with
          </span>
          <div className="social-accounts">
            <button className="social-button google" type="button" onClick={goToLogin}>
              {/* ...icono... */}
            </button>
            <button className="social-button apple" type="button" onClick={goToLogin}>
              {/* ...icono... */}
            </button>
            <button className="social-button twitter" type="button" onClick={goToLogin}>
              {/* ...icono... */}
            </button>
          </div>
        </div>
        <span className="agreement"><a href="#">Learn user licence agreement</a></span>
      </div>
    </div>
  );
}
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
    // Validación de contraseña
    const passwordRegex = /^(?=.*[a-zA-Z])(?=.*[!@#$%^&*(),.?":{}|<>_\-+=;'/\\[\]`~]).{7,}$/;
    if (!passwordRegex.test(password)) {
      setError("La contraseña debe tener al menos 7 caracteres, una letra y un signo de puntuación.");
      return;
    }
    setLoading(true);
    try {
      // Cambia el endpoint a /auth/register
      const res = await axios.post("/auth/register", {
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
            <button
              className="social-button google"
              type="button"
              onClick={goToRegister}
            >
              <svg
                className="svg"
                xmlns="http://www.w3.org/2000/svg"
                height="1em"
                viewBox="0 0 488 512"
              >
                <path d="M488 261.8C488 403.3 391.1 504 248 504 110.8 504 0 393.2 0 256S110.8 8 248 8c66.8 0 123 24.5 166.3 64.9l-67.5 64.9C258.5 52.6 94.3 116.6 94.3 256c0 86.5 69.1 156.6 153.7 156.6 98.2 0 135-70.4 140.8-106.9H248v-85.3h236.1c2.3 12.7 3.9 24.9 3.9 41.4z"></path>
              </svg>
            </button>
            <button
              className="social-button apple"
              type="button"
              onClick={goToRegister}
            >
              <svg
                className="svg"
                xmlns="http://www.w3.org/2000/svg"
                height="1em"
                viewBox="0 0 384 512"
              >
                <path d="M318.7 268.7c-.2-36.7 16.4-64.4 50-84.8-18.8-26.9-47.2-41.7-84.7-44.6-35.5-2.8-74.3 20.7-88.5 20.7-15 0-49.4-19.7-76.4-19.7C63.3 141.2 4 184.8 4 273.5q0 39.3 14.4 81.2c12.8 36.7 59 126.7 107.2 125.2 25.2-.6 43-17.9 75.8-17.9 31.8 0 48.3 17.9 76.4 17.9 48.6-.7 90.4-82.5 102.6-119.3-65.2-30.7-61.7-90-61.7-91.9zm-56.6-164.2c27.3-32.4 24.8-61.9 24-72.5-24.1 1.4-52 16.4-67.9 34.9-17.5 19.8-27.8 44.3-25.6 71.9 26.1 2 49.9-11.4 69.5-34.3z"></path>
              </svg>
            </button>
          </div>
        </div>
        <span className="agreement"><a href="#">Learn user licence agreement</a></span>
      </div>
    </div>
  );
}
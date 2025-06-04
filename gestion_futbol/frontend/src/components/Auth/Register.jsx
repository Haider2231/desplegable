import React, { useState, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import axios from "axios";
import ReCAPTCHA from "react-google-recaptcha"; // <-- Agrega esto
import "../../styles/loginModern.css";
import Verify from "./Verify";

export default function Register({ onRegister }) {
  const [nombre, setNombre] = useState("");
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [telefono, setTelefono] = useState(""); // Nuevo estado para teléfono
  const [error, setError] = useState("");
  const [loading, setLoading] = useState(false);
  const [success, setSuccess] = useState("");
  const [showVerify, setShowVerify] = useState(false);
  const [showPassword, setShowPassword] = useState(false);
  const [repeatPassword, setRepeatPassword] = useState(""); // Nuevo estado para repetir contraseña
  const [showRepeatPassword, setShowRepeatPassword] = useState(false); // Mostrar/ocultar repetir contraseña
  const [captchaToken, setCaptchaToken] = useState(null);
  const [verifyCountdown, setVerifyCountdown] = useState(1800); // 30 minutos en segundos
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
    if (password !== repeatPassword) {
      setError("Las contraseñas no coinciden.");
      return;
    }
    if (!telefono.trim()) {
      setError("El teléfono es obligatorio.");
      return;
    }
    if (!captchaToken) {
      setError("Por favor, completa el captcha.");
      return;
    }
    setLoading(true);
    try {
      const res = await axios.post("/auth/usuarios", {
        nombre,
        email,
        password,
        rol: "usuario",
        telefono,
        captcha: captchaToken // <-- Envía el token al backend
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
        <div>
          <Verify email={email} />
          {/* Elimina el cronómetro aquí */}
        </div>
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
            type="text"
            name="telefono"
            placeholder="Teléfono"
            value={telefono}
            onChange={(e) => setTelefono(e.target.value)}
            style={{ marginLeft: "-18px" }} 
          />
          <input
            required
            className="input"
            type={showPassword ? "text" : "password"}
            name="password"
            placeholder="Password"
            value={password}
            onChange={(e) => setPassword(e.target.value)}
            style={{ marginLeft: "-18px", paddingRight: "38px" }}
            autoComplete="new-password"
            onCopy={e => e.preventDefault()}
            onPaste={e => e.preventDefault()}
            onCut={e => e.preventDefault()}
          />
          <span
            onClick={() => setShowPassword((v) => !v)}
            style={{
              position: "relative",
              left: "calc(100% - 38px)",
              top: "-34px",
              cursor: "pointer",
              fontSize: 20,
              color: "#007991",
              userSelect: "none",
              zIndex: 2,
              width: 0,
              display: "inline-block"
            }}
            tabIndex={-1}
            aria-label={showPassword ? "Ocultar contraseña" : "Mostrar contraseña"}
          >
            {showPassword ? (
              // Ojito abierto
              <svg width="24" height="24" fill="none" viewBox="0 0 24 24">
                <path d="M1 12s4-7 11-7 11 7 11 7-4 7-11 7S1 12 1 12Z" stroke="#007991" strokeWidth="2"/>
                <circle cx="12" cy="12" r="3.5" stroke="#007991" strokeWidth="2"/>
              </svg>
            ) : (
              // Ojito tachado
              <svg width="24" height="24" fill="none" viewBox="0 0 24 24">
                <path d="M17.94 17.94C16.13 19.25 14.13 20 12 20c-7 0-11-8-11-8a21.8 21.8 0 0 1 5.06-6.06M9.53 9.53A3.5 3.5 0 0 1 12 8.5c1.93 0 3.5 1.57 3.5 3.5 0 .87-.32 1.67-.85 2.29M1 1l22 22" stroke="#007991" strokeWidth="2"/>
              </svg>
            )}
          </span>
          {/* Campo repetir contraseña */}
          <input
            required
            className="input"
            type={showRepeatPassword ? "text" : "password"}
            name="repeatPassword"
            placeholder="Repetir contraseña"
            value={repeatPassword}
            onChange={(e) => setRepeatPassword(e.target.value)}
            style={{ marginLeft: "-18px", paddingRight: "38px", marginTop: "-10px" }}
            autoComplete="new-password"
            onCopy={e => e.preventDefault()}
            onPaste={e => e.preventDefault()}
            onCut={e => e.preventDefault()}
          />
          <span
            onClick={() => setShowRepeatPassword((v) => !v)}
            style={{
              position: "relative",
              left: "calc(100% - 38px)",
              top: "-34px",
              cursor: "pointer",
              fontSize: 20,
              color: "#007991",
              userSelect: "none",
              zIndex: 2,
              width: 0,
              display: "inline-block"
            }}
            tabIndex={-1}
            aria-label={showRepeatPassword ? "Ocultar contraseña" : "Mostrar contraseña"}
          >
            {showRepeatPassword ? (
              // Ojito abierto
              <svg width="24" height="24" fill="none" viewBox="0 0 24 24">
                <path d="M1 12s4-7 11-7 11 7 11 7-4 7-11 7S1 12 1 12Z" stroke="#007991" strokeWidth="2"/>
                <circle cx="12" cy="12" r="3.5" stroke="#007991" strokeWidth="2"/>
              </svg>
            ) : (
              // Ojito tachado
              <svg width="24" height="24" fill="none" viewBox="0 0 24 24">
                <path d="M17.94 17.94C16.13 19.25 14.13 20 12 20c-7 0-11-8-11-8a21.8 21.8 0 0 1 5.06-6.06M9.53 9.53A3.5 3.5 0 0 1 12 8.5c1.93 0 3.5 1.57 3.5 3.5 0 .87-.32 1.67-.85 2.29M1 1l22 22" stroke="#007991" strokeWidth="2"/>
              </svg>
            )}
          </span>
          {/* Captcha */}
          <div style={{ margin: "18px 0" }}>
            <ReCAPTCHA
              sitekey="6Lez21ArAAAAAPPtiPZS6oQVeu8F7kgXRH1KRIpO" // <-- Tu clave de sitio
              onChange={token => setCaptchaToken(token)}
            />
          </div>
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
             <svg
                className="svg"
                xmlns="http://www.w3.org/2000/svg"
                height="1em"
                viewBox="0 0 488 512"
              >
                <path d="M488 261.8C488 403.3 391.1 504 248 504 110.8 504 0 393.2 0 256S110.8 8 248 8c66.8 0 123 24.5 166.3 64.9l-67.5 64.9C258.5 52.6 94.3 116.6 94.3 256c0 86.5 69.1 156.6 153.7 156.6 98.2 0 135-70.4 140.8-106.9H248v-85.3h236.1c2.3 12.7 3.9 24.9 3.9 41.4z"></path>
              </svg>
            </button>
            <button className="social-button apple" type="button" onClick={goToLogin}>
             <svg
                className="svg"
                xmlns="http://www.w3.org/2000/svg"
                height="1em"
                viewBox="0 0 384 512"
              >
                <path d="M318.7 268.7c-.2-36.7 16.4-64.4 50-84.8-18.8-26.9-47.2-41.7-84.7-44.6-35.5-2.8-74.3 20.7-88.5 20.7-15 0-49.4-19.7-76.4-19.7C63.3 141.2 4 184.8 4 273.5q0 39.3 14.4 81.2c12.8 36.7 59 126.7 107.2 125.2 25.2-.6 43-17.9 75.8-17.9 31.8 0 48.3 17.9 76.4 17.9 48.6-.7 90.4-82.5 102.6-119.3-65.2-30.7-61.7-90-61.7-91.9zm-56.6-164.2c27.3-32.4 24.8-61.9 24-72.5-24.1 1.4-52 16.4-67.9 34.9-17.5 19.8-27.8 44.3-25.6 71.9 26.1 2 49.9-11.4 69.5-34.3z"></path>
              </svg>
            </button>
            <button className="social-button twitter" type="button" onClick={goToLogin}>
             <svg
                className="svg"
                xmlns="http://www.w3.org/2000/svg"
                height="1em"
                viewBox="0 0 512 512"
              >
                <path d="M389.2 48h70.6L305.6 224.2 487 464H345L233.7 318.6 106.5 464H35.8L200.7 275.5 26.8 48H172.4L272.9 180.9 389.2 48zM364.4 421.8h39.1L151.1 88h-42L364.4 421.8z"></path>
              </svg>
            </button>
          </div>
        </div>
        <span className="agreement"><a href="#">Learn user licence agreement</a></span>
      </div>
    </div>
  );
}
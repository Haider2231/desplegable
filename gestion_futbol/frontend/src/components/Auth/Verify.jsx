import React, { useState, useRef } from "react";
import { verify as apiVerify, register as apiRegister } from "../../api/api";
import { useNavigate } from "react-router-dom";
import "../../styles/VerifyOTP.css";

const OTP_LENGTH = 6;

export default function Verify({ email }) {
  const [codigo, setCodigo] = useState(Array(OTP_LENGTH).fill(""));
  const [correo, setCorreo] = useState(email || "");
  const [error, setError] = useState("");
  const [loading, setLoading] = useState(false);
  const [countdown, setCountdown] = useState(1800); // 30 minutos en segundos
  const inputsRef = useRef([]);
  const navigate = useNavigate();

  // Permite borrar cualquier dígito y moverse entre campos
  const handleChange = (e, idx) => {
    const val = e.target.value.replace(/[^0-9]/g, "");
    const newCodigo = [...codigo];
    if (val.length === 0) {
      newCodigo[idx] = "";
      setCodigo(newCodigo);
      return;
    }
    // Si el usuario pega varios dígitos, los distribuye
    if (val.length > 1) {
      for (let i = 0; i < val.length && idx + i < OTP_LENGTH; i++) {
        newCodigo[idx + i] = val[i];
      }
      setCodigo(newCodigo);
      const nextIdx = Math.min(idx + val.length, OTP_LENGTH - 1);
      inputsRef.current[nextIdx].focus();
      return;
    }
    newCodigo[idx] = val;
    setCodigo(newCodigo);
    if (idx < OTP_LENGTH - 1 && val) {
      inputsRef.current[idx + 1].focus();
    }
  };

  const handleKeyDown = (e, idx) => {
    if (e.key === "Backspace") {
      if (codigo[idx]) {
        // Borra el dígito actual
        const newCodigo = [...codigo];
        newCodigo[idx] = "";
        setCodigo(newCodigo);
      } else if (idx > 0) {
        // Si está vacío, va al anterior
        inputsRef.current[idx - 1].focus();
      }
    } else if (e.key === "ArrowLeft" && idx > 0) {
      inputsRef.current[idx - 1].focus();
    } else if (e.key === "ArrowRight" && idx < OTP_LENGTH - 1) {
      inputsRef.current[idx + 1].focus();
    }
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError("");
    setLoading(true);
    const codeStr = codigo.join("");
    // Cambia la validación para asegurar que todos los dígitos estén completos
    if (codigo.some(d => d === "")) {
      setError("Debes ingresar el código completo.");
      setLoading(false);
      return;
    }
    try {
      const data = await apiVerify(correo, codeStr);
      if (!data.error && data.token) {
        // Guardar token y redirigir al home
        localStorage.setItem("token", data.token);
        navigate("/");
      } else {
        setError(data.error || "Error al verificar el código");
      }
    } catch (err) {
      setError("Error de conexión con el servidor");
    }
    setLoading(false);
  };

  const handleResend = async () => {
    setError("");
    setLoading(true);
    const data = await apiRegister({ nombre: "Usuario", email: correo, password: "temporal123" });
    if (!data.error) {
      alert("Código reenviado al correo.");
      setCountdown(30); // Reinicia el contador
    } else {
      setError(data.error || "No se pudo reenviar el código.");
    }
    setLoading(false);
  };

  // Formatea el tiempo del contador en minutos y segundos
  const formatCountdown = (seconds) => {
    const mins = Math.floor(seconds / 60);
    const secs = seconds % 60;
    return `${mins > 0 ? `${mins} min ` : ""}${secs} seg`;
  };

  // Efecto para manejar el conteo regresivo
  React.useEffect(() => {
    let timer;
    if (countdown > 0) {
      timer = setInterval(() => {
        setCountdown(prev => prev - 1);
      }, 1000);
    }
    return () => clearInterval(timer);
  }, [countdown]);

  return (
    <form className="otp-form" onSubmit={handleSubmit}>
      <div className="otp-content">
        <p className="otp-title" align="center">OTP Verification</p>
        <input
          type="email"
          value={correo}
          onChange={e => setCorreo(e.target.value)}
          placeholder="Correo electrónico"
          required
          className="otp-email"
        />
        <div className="otp-inp">
          {codigo.map((val, idx) => (
            <input
              key={idx}
              ref={el => (inputsRef.current[idx] = el)}
              type="text"
              className="otp-input"
              maxLength={1}
              value={val}
              onChange={e => handleChange(e, idx)}
              onKeyDown={e => handleKeyDown(e, idx)}
              style={{ background: "#fff", color: "#388e3c", borderColor: "#43a047" }}
              inputMode="numeric"
              pattern="[0-9]*"
              autoComplete="one-time-code"
            />
          ))}
        </div>
        <button
          className="otp-btn"
          type="submit"
          disabled={loading}
        >
          {loading ? "Verificando..." : "VERIFICAR"}
        </button>
        <div
          style={{
            marginTop: 10,
            textAlign: "center",
          }}
        >
          <span
            style={{
              color: "#007991",
              cursor: "pointer",
              textDecoration: "underline",
              fontWeight: 500,
            }}
            onClick={handleResend}
          >
            Reenviar código
          </span>
          {/* Cronómetro justo debajo, color verde fuerte */}
          <div style={{
            color: "#43a047",
            marginTop: 8,
            fontWeight: 700,
            fontSize: "1em"
          }}>
            {countdown > 0
              ? `Tiempo restante para usar el código: ${formatCountdown(countdown)}`
              : "El código ha expirado. Puedes solicitar uno nuevo."}
          </div>
        </div>
        {error && <div style={{ color: "#d32f2f", marginTop: 8, textAlign: "center" }}>{error}</div>}
        <svg className="otp-svg" viewBox="0 0 200 200" xmlns="http://www.w3.org/2000/svg">
          <path fill="#43a047" d="M56.8,-23.9C61.7,-3.2,45.7,18.8,26.5,31.7C7.2,44.6,-15.2,48.2,-35.5,36.5C-55.8,24.7,-73.9,-2.6,-67.6,-25.2C-61.3,-47.7,-30.6,-65.6,-2.4,-64.8C25.9,-64.1,51.8,-44.7,56.8,-23.9Z" transform="translate(100 100)" className="otp-path"></path>
        </svg>
      </div>
    </form>
  );
}
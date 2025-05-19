import React, { useState } from "react";
import axios from "axios";
import Swal from "sweetalert2";

export default function ResetPassword() {
  const params = new URLSearchParams(window.location.search);
  const token = params.get("token");
  const [password, setPassword] = useState("");
  const [password2, setPassword2] = useState("");
  const [showPass, setShowPass] = useState(false);
  const [showPass2, setShowPass2] = useState(false);
  const [msg, setMsg] = useState("");
  const [error, setError] = useState("");
  const [loading, setLoading] = useState(false);

  const handleSubmit = async e => {
    e.preventDefault();
    setMsg(""); setError("");
    if (password !== password2) {
      Swal.fire({
        icon: "error",
        title: "Las contraseñas no coinciden",
        text: "Por favor, verifica que ambas contraseñas sean iguales.",
      });
      return;
    }
    setLoading(true);
    try {
      const res = await axios.post("/auth/reset-password", { token, password });
      setMsg(res.data.message || "Contraseña restablecida correctamente.");
      Swal.fire({
        icon: "success",
        title: "¡Contraseña cambiada correctamente!",
        showConfirmButton: true,
      });
      setPassword("");
      setPassword2("");
    } catch (err) {
      setError(err.response?.data?.error || "Error al restablecer la contraseña");
    }
    setLoading(false);
  };

  if (!token) return <div style={{ color: "#d32f2f", textAlign: "center", marginTop: 40 }}>Enlace inválido</div>;

  return (
    <div style={{
      minHeight: "100vh", width: "100vw",
      background: "#007991",
      backgroundImage: "linear-gradient(to right, #78ffd6, #007991)",
      display: "flex", alignItems: "center", justifyContent: "center"
    }}>
      <form onSubmit={handleSubmit} style={{
        background: "#fff", borderRadius: 12, padding: 32, boxShadow: "0 4px 24px #1b5e2055",
        minWidth: 320, display: "flex", flexDirection: "column", gap: 18
      }}>
        <h2 style={{ color: "#388e3c", marginBottom: 8 }}>Restablecer contraseña</h2>
        <div style={{ position: "relative" }}>
          <input
            type={showPass ? "text" : "password"}
            required
            placeholder="Nueva contraseña"
            value={password}
            onChange={e => setPassword(e.target.value)}
            style={{ padding: 12, borderRadius: 8, border: "1.5px solid #43a047", width: "100%" }}
          />
          <span
            onClick={() => setShowPass(v => !v)}
            style={{
              position: "absolute",
              right: 12,
              top: "50%",
              transform: "translateY(-50%)",
              cursor: "pointer",
              color: "#43a047"
            }}
            title={showPass ? "Ocultar" : "Mostrar"}
          >
            {showPass ? (
              // Ojo abierto
              <svg width="22" height="22" fill="none" viewBox="0 0 24 24"><path stroke="#43a047" strokeWidth="2" d="M1 12s4-7 11-7 11 7 11 7-4 7-11 7S1 12 1 12Z"/><circle cx="12" cy="12" r="3" stroke="#43a047" strokeWidth="2"/></svg>
            ) : (
              // Ojo cerrado
              <svg width="22" height="22" fill="none" viewBox="0 0 24 24"><path stroke="#43a047" strokeWidth="2" d="M17.94 17.94C16.11 19.25 14.13 20 12 20c-7 0-11-8-11-8a21.8 21.8 0 0 1 5.06-6.06M9.88 9.88A3 3 0 0 0 12 15a3 3 0 0 0 2.12-5.12"/><path stroke="#43a047" strokeWidth="2" d="m1 1 22 22"/></svg>
            )}
          </span>
        </div>
        <div style={{ position: "relative" }}>
          <input
            type={showPass2 ? "text" : "password"}
            required
            placeholder="Repite la contraseña"
            value={password2}
            onChange={e => setPassword2(e.target.value)}
            style={{ padding: 12, borderRadius: 8, border: "1.5px solid #43a047", width: "100%" }}
          />
          <span
            onClick={() => setShowPass2(v => !v)}
            style={{
              position: "absolute",
              right: 12,
              top: "50%",
              transform: "translateY(-50%)",
              cursor: "pointer",
              color: "#43a047"
            }}
            title={showPass2 ? "Ocultar" : "Mostrar"}
          >
            {showPass2 ? (
              <svg width="22" height="22" fill="none" viewBox="0 0 24 24"><path stroke="#43a047" strokeWidth="2" d="M1 12s4-7 11-7 11 7 11 7-4 7-11 7S1 12 1 12Z"/><circle cx="12" cy="12" r="3" stroke="#43a047" strokeWidth="2"/></svg>
            ) : (
              <svg width="22" height="22" fill="none" viewBox="0 0 24 24"><path stroke="#43a047" strokeWidth="2" d="M17.94 17.94C16.11 19.25 14.13 20 12 20c-7 0-11-8-11-8a21.8 21.8 0 0 1 5.06-6.06M9.88 9.88A3 3 0 0 0 12 15a3 3 0 0 0 2.12-5.12"/><path stroke="#43a047" strokeWidth="2" d="m1 1 22 22"/></svg>
            )}
          </span>
        </div>
        <button type="submit" disabled={loading} style={{
          background: "linear-gradient(90deg, #388e3c 0%, #43a047 100%)",
          color: "#fff", border: "none", borderRadius: 8, padding: "12px 0", fontWeight: 700
        }}>
          {loading ? "Guardando..." : "Restablecer"}
        </button>
        {msg && <div style={{ color: "#388e3c", textAlign: "center" }}>{msg}</div>}
        {error && <div style={{ color: "#d32f2f", textAlign: "center" }}>{error}</div>}
      </form>
    </div>
  );
}

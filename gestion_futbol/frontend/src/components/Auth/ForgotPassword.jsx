import React, { useState } from "react";
import axios from "axios";
import Swal from "sweetalert2";

export default function ForgotPassword() {
  const [email, setEmail] = useState("");
  const [msg, setMsg] = useState("");
  const [error, setError] = useState("");
  const [loading, setLoading] = useState(false);

  const handleSubmit = async e => {
    e.preventDefault();
    setMsg(""); setError(""); setLoading(true);
    try {
      // Verifica si el correo existe en la base de datos
      const check = await axios.post("/auth/check-email", { email });
      if (!check.data.exists) {
        Swal.fire({
          icon: "error",
          title: "Correo no registrado",
          text: "El correo no está registrado."
        });
        setLoading(false);
        return;
      }
      // Si existe, envía el correo de recuperación
      try {
        const res = await axios.post("/auth/forgot-password", { email });
        setMsg(res.data.message || "Revisa tu correo para restablecer la contraseña.");
        Swal.fire({
          icon: "success",
          title: "Correo enviado",
          text: res.data.message || "Revisa tu correo para restablecer la contraseña."
        });
      } catch (err) {
        Swal.fire({
          icon: "error",
          title: "Error",
          text: err.response?.data?.error || "Error al enviar el correo"
        });
      }
    } catch (err) {
      Swal.fire({
        icon: "error",
        title: "Error",
        text: "Error al verificar el correo."
      });
    }
    setLoading(false);
  };

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
        <h2 style={{ color: "#388e3c", marginBottom: 8 }}>¿Olvidaste tu contraseña?</h2>
        <input
          type="email"
          required
          placeholder="Correo electrónico"
          value={email}
          onChange={e => setEmail(e.target.value)}
          style={{ padding: 12, borderRadius: 8, border: "1.5px solid #43a047" }}
        />
        <button type="submit" disabled={loading} style={{
          background: "linear-gradient(90deg, #388e3c 0%, #43a047 100%)",
          color: "#fff", border: "none", borderRadius: 8, padding: "12px 0", fontWeight: 700
        }}>
          {loading ? "Enviando..." : "Enviar enlace"}
        </button>
        {msg && <div style={{ color: "#388e3c", textAlign: "center" }}>{msg}</div>}
        {error && <div style={{ color: "#d32f2f", textAlign: "center" }}>{error}</div>}
      </form>
    </div>
  );
}

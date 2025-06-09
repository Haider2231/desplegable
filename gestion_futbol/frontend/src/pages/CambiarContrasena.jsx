import React, { useState } from "react";
import Swal from "sweetalert2";

export default function CambiarContrasena() {
  const [oldPassword, setOldPassword] = useState("");
  const [newPassword, setNewPassword] = useState("");
  const [loading, setLoading] = useState(false);

  const handleChangePassword = async (e) => {
    e.preventDefault();
    if (!oldPassword || !newPassword) {
      Swal.fire("Error", "Debes completar ambos campos.", "error");
      return;
    }
    if (newPassword.length < 7) {
      Swal.fire("Error", "La nueva contraseña debe tener al menos 7 caracteres.", "error");
      return;
    }
    setLoading(true);
    try {
      const res = await fetch("/auth/change-password", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${localStorage.getItem("token")}`,
        },
        body: JSON.stringify({ oldPassword, newPassword }),
      });
      const data = await res.json();
      if (res.ok) {
        Swal.fire("Éxito", "Contraseña cambiada correctamente.", "success");
        setOldPassword("");
        setNewPassword("");
      } else {
        Swal.fire("Error", data.error || "No se pudo cambiar la contraseña.", "error");
      }
    } catch {
      Swal.fire("Error", "No se pudo conectar con el servidor.", "error");
    }
    setLoading(false);
  };

  return (
    <div style={{
      minHeight: "100vh",
      display: "flex",
      alignItems: "center",
      justifyContent: "center",
      background: "linear-gradient(135deg, #e0f7fa 0%, #f8fffe 100%)"
    }}>
      <form onSubmit={handleChangePassword} style={{
        background: "#fff",
        borderRadius: 12,
        boxShadow: "0 4px 24px #1b5e2055",
        minWidth: 320,
        padding: 32,
        display: "flex",
        flexDirection: "column",
        gap: 18
      }}>
        <h2 style={{ color: "#388e3c", marginBottom: 8 }}>Cambiar contraseña</h2>
        <input
          type="password"
          placeholder="Contraseña actual"
          value={oldPassword}
          onChange={e => setOldPassword(e.target.value)}
          required
          style={{ padding: 12, borderRadius: 8, border: "1.5px solid #43a047" }}
        />
        <input
          type="password"
          placeholder="Nueva contraseña"
          value={newPassword}
          onChange={e => setNewPassword(e.target.value)}
          required
          style={{ padding: 12, borderRadius: 8, border: "1.5px solid #43a047" }}
        />
        <button
          type="submit"
          disabled={loading}
          style={{
            background: "linear-gradient(90deg, #388e3c 0%, #43a047 100%)",
            color: "#fff",
            border: "none",
            borderRadius: 8,
            padding: "12px 0",
            fontWeight: 700
          }}
        >
          {loading ? "Cambiando..." : "Cambiar contraseña"}
        </button>
      </form>
    </div>
  );
}

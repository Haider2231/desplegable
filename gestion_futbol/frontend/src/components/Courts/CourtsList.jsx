import React, { useEffect, useState } from "react";
import { getEstablecimientos } from "../../api/api";

export default function CourtsList() {
  const [establecimientos, setEstablecimientos] = useState([]);
  const [error, setError] = useState("");

  useEffect(() => {
    getEstablecimientos()
      .then((data) => setEstablecimientos(Array.isArray(data) ? data : []))
      .catch(() => setError("Error al cargar los establecimientos."));
  }, []);

  if (error) return <div style={{ color: "red" }}>{error}</div>;

  return (
    <div
      style={{
        maxWidth: 1200,
        margin: "0 auto",
        padding: "2.5rem 1.5rem",
        background: "linear-gradient(120deg, #e0f7fa 0%, #f7fff7 100%)",
        borderRadius: 22,
        boxShadow: "0 8px 32px #43e97b33",
        marginTop: 32,
        marginBottom: 32,
      }}
    >
      <h2
        style={{
          color: "#007991",
          fontWeight: 900,
          fontSize: 32,
          textAlign: "center",
          marginBottom: 32,
          letterSpacing: 2,
          textShadow: "0 2px 8px #43e97b33",
        }}
      >
        Establecimientos Disponibles
      </h2>
      {establecimientos.length === 0 ? (
        <div
          style={{
            color: "#888",
            fontSize: 20,
            textAlign: "center",
            marginBottom: 24,
            padding: "2rem 0",
            background: "#fff",
            borderRadius: 12,
            boxShadow: "0 2px 8px #b2f7ef33",
          }}
        >
          No hay establecimientos disponibles.
        </div>
      ) : (
        <div
          style={{
            display: "grid",
            gridTemplateColumns: "repeat(auto-fit, minmax(270px, 1fr))",
            gap: "32px",
            justifyItems: "center",
            alignItems: "stretch",
          }}
        >
          {establecimientos.map((est) => (
            <div
              key={est.id}
              style={{
                background: "linear-gradient(120deg, #fff 60%, #e0f7fa 100%)",
                borderRadius: 16,
                boxShadow: "0 2px 12px #43e97b22",
                padding: "1.5rem 1.2rem",
                display: "flex",
                flexDirection: "column",
                alignItems: "flex-start",
                border: "2px solid #43e97b33",
                transition: "box-shadow 0.2s, border 0.2s",
                minHeight: 210,
                width: "100%",
                maxWidth: 340,
                position: "relative",
                overflow: "hidden",
              }}
            >
              <div
                style={{
                  fontWeight: 800,
                  fontSize: 22,
                  color: "#007991",
                  marginBottom: 8,
                  letterSpacing: 1,
                  textShadow: "0 1px 4px #43e97b22",
                  display: "flex",
                  alignItems: "center",
                  gap: 8,
                  minHeight: 32,
                }}
              >
                <span role="img" aria-label="lugar">
                  📍
                </span>
                {est.nombre}
              </div>
              <div
                style={{
                  color: "#388e3c",
                  fontWeight: 600,
                  marginBottom: 6,
                  wordBreak: "break-word",
                }}
              >
                Dirección:{" "}
                <span style={{ color: "#222", fontWeight: 500 }}>
                  {est.direccion}
                </span>
              </div>
              <div
                style={{
                  color: "#007991",
                  fontWeight: 600,
                  marginBottom: 6,
                }}
              >
                Precio:{" "}
                <span style={{ color: "#388e3c", fontWeight: 700 }}>
                  ${est.precio}
                </span>
              </div>
              <div
                style={{
                  color: "#222",
                  fontWeight: 600,
                  marginBottom: 6,
                }}
              >
                Canchas registradas:{" "}
                <span style={{ color: "#43e97b", fontWeight: 800 }}>
                  {est.cantidad_canchas}
                </span>
              </div>
              {est.imagen_url && (
                <img
                  src={
                    est.imagen_url.startsWith("http")
                      ? est.imagen_url
                      : `https://canchassinteticas.site${est.imagen_url}`
                  }
                  alt="Establecimiento"
                  style={{
                    width: "100%",
                    height: 120,
                    objectFit: "cover",
                    borderRadius: 10,
                    marginTop: 10,
                    boxShadow: "0 2px 8px #43e97b22",
                  }}
                  onError={(e) => {
                    e.target.src = "https://via.placeholder.com/340x120?text=Sin+imagen";
                  }}
                />
              )}
            </div>
          ))}
        </div>
      )}
    </div>
  );
}

// Agrega este componente al final del archivo
function CourtOwnerInfo({ dueno_id }) {
  const [user, setUser] = React.useState(null);

  React.useEffect(() => {
    if (!dueno_id) return;
    fetch(`/auth/usuarios/${dueno_id}`, {
      headers: { Authorization: `Bearer ${localStorage.getItem("token")}` },
    })
      .then((res) => (res.ok ? res.json() : null))
      .then((data) => {
        if (data && data.nombre && data.email) setUser(data);
      });
  }, [dueno_id]);

  if (!user) return <div>Cargando propietario...</div>;
  return (
    <div style={{ marginTop: 6, marginBottom: 6 }}>
      <b>Propietario:</b> {user.nombre} <br />
      <b>Email:</b> {user.email}
    </div>
  );
}
import React from "react";
import { useNavigate } from "react-router-dom"; // ✅ Importa useNavigate

export default function MarkerPopup({ cancha }) {
  const navigate = useNavigate(); // ✅ Inicializa el hook

  if (!cancha) return null;
  const token = localStorage.getItem("token");

  return (
    <div style={{ maxWidth: 300 }}>
      {cancha.imagenes && cancha.imagenes.length > 0 && (
        <div>
          {cancha.imagenes.map((img, idx) => (
            <img
              key={idx}
              src={img}
              alt="Imagen de la cancha"
              style={{
                width: "100%",
                height: "auto",
                maxHeight: 150,
                marginBottom: 10,
              }}
            />
          ))}
        </div>
      )}
      <strong>{cancha.nombre}</strong>
      <br />
      {cancha.direccion && (
        <span>
          {cancha.direccion}
          <br />
        </span>
      )}
      <strong>Teléfono:</strong> {cancha.telefono_contacto}
      <br />
      {token ? (
        <button
          style={{
            marginTop: 10,
            padding: "5px 10px",
            backgroundColor: "#007BFF",
            color: "white",
            border: "none",
            borderRadius: 5,
            cursor: "pointer",
          }}
          onClick={() => navigate(`/reservar?cancha_id=${cancha.cancha_id}`)} // ✅ Navegación interna
        >
          Ver horarios y reservar
        </button>
      ) : (
        <button
          style={{
            marginTop: 10,
            padding: "5px 10px",
            backgroundColor: "#388e3c",
            color: "white",
            border: "none",
            borderRadius: 5,
            cursor: "pointer",
          }}
          onClick={() => navigate("/login")} // ✅ Navegación interna
        >
          Inicia sesión para reservar
        </button>
      )}
    </div>
  );
}

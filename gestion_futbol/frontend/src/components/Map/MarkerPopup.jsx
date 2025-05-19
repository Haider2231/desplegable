import React from "react";

export default function MarkerPopup({ cancha }) {
  if (!cancha) return null;
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
        onClick={() =>
          (window.location.href = `/reservecourt?cancha_id=${cancha.cancha_id}`)
        }
      >
        Ver horarios y reservar
      </button>
    </div>
  );
}
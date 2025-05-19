import React, { useEffect, useState } from "react";
import { getCanchas } from "../../api/api";

export default function CourtsList() {
  const [canchas, setCanchas] = useState([]);
  const [error, setError] = useState("");

  useEffect(() => {
    getCanchas()
      .then((data) => setCanchas(data))
      .catch(() => setError("Error al cargar las canchas."));
  }, []);

  if (error) return <div style={{ color: "red" }}>{error}</div>;

  return (
    <div>
      {canchas.length === 0 ? (
        <p>No hay canchas disponibles.</p>
      ) : (
        <ul>
          {canchas.map((cancha) => (
            <li key={cancha.cancha_id}>
              <strong>{cancha.nombre}</strong> - {cancha.direccion}
              <br />
              Tel: {cancha.telefono_contacto}
              {/* Puedes agregar botón para reservar */}
            </li>
          ))}
        </ul>
      )}
    </div>
  );
}
import React, { useEffect, useState } from "react";
import { getCanchas } from "../api/api";
import "../styles/comunidad.css";
import Footer from "../components/Layout/Footer";

export default function Comunidad() {
  const [canchas, setCanchas] = useState([]);
  const [error, setError] = useState("");

  // Obtener canchas al montar el componente
  useEffect(() => {
    getCanchas()
      .then((data) => {
        if (Array.isArray(data)) {
          setCanchas(data);
        } else if (data.error) {
          setError(data.error);
        } else {
          setError("No se pudieron cargar las canchas.");
        }
      })
      .catch(() => setError("Error al cargar las canchas."));
  }, []);

  return (
    <>
      <div className="comunidad-container">
        <h2 className="comunidad-title">Comunidad</h2>
        <p className="comunidad-desc">
          Conéctate con otros amantes del fútbol, organiza partidos y comparte
          tus experiencias.
        </p>
        <div className="canchas-list">
          {error && <p className="error-message">{error}</p>}
          {canchas.length === 0 && !error && (
            <p className="no-canchas-message">
              No hay canchas disponibles en este momento.
            </p>
          )}
          {canchas.map((cancha) => (
            <div key={cancha.id} className="cancha-card">
              <h3 className="cancha-name">{cancha.nombre}</h3>
              <p className="cancha-info">
                {cancha.ubicacion} - {cancha.deportes.join(", ")}
              </p>
            </div>
          ))}
        </div>
      </div>
      <Footer />
    </>
  );
}
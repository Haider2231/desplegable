import React, { useEffect, useState } from "react";
import MapView from "../components/Map/MapView";
import { getCanchas } from "../api/api";
import "../styles/homeModern.css";
import Footer from "../components/Layout/Footer";

export default function Home() {
  const [dbStatus, setDbStatus] = useState("");
  const [canchas, setCanchas] = useState([]);
  const [error, setError] = useState("");

  // Probar conexión backend/DB
  const testBackend = async () => {
    try {
      const res = await fetch("/test-db");
      const data = await res.json();
      if (data.db_time || data.now) {
        setDbStatus("Conexión OK: " + (data.db_time || data.now));
      } else if (data.error) {
        setDbStatus("Error backend: " + data.error);
      } else {
        setDbStatus("Sin conexión a la base de datos");
      }
    } catch (err) {
      setDbStatus("No hay conexión con el backend");
    }
  };

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
      <div className="home-futbol-bg">
        <div className="home-hero">
          <h2 className="home-title">
            ¡Bienvenido a <span>Fútbol Piloto</span>!
          </h2>
          <p className="home-desc">
            Encuentra tus canchas favoritas cerca de ti y haz tu reserva en tiempo
            real.
            <br />
            Explora, elige y juega sin complicaciones.
            <br />
            <span className="home-highlight">
              ¡Tu próxima jugada empieza aquí!
            </span>
          </p>
        </div>
        <div className="home-map-section">
          <MapView canchas={canchas} />
        </div>
      </div>
      <Footer />
    </>
  );
}
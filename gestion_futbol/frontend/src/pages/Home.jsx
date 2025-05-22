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
      <div
        className="football-home-bg"
        style={{
          minHeight: "100vh",
          width: "100%",
          paddingBottom: 0,
          margin: 0,
          position: "relative",
        }}
      >
        
        <div
          className="home-hero"
          style={{
          }}
        >
        </div>
        <div
          className="home-map-section"
          style={{ position: "relative", zIndex: 2 }}
        >
          <MapView canchas={canchas} />
        </div>
      </div>
    </>
  );
}
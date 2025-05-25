import React, { useEffect, useState } from "react";
import MapView from "../components/Map/MapView";
import "../styles/homeModern.css";
import Footer from "../components/Layout/Footer";

export default function Home() {
  const [dbStatus, setDbStatus] = useState("");
  const [establecimientos, setEstablecimientos] = useState([]);
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

  // Obtener establecimientos al montar el componente
  useEffect(() => {
    fetch("/establecimientos")
      .then((res) => res.json())
      .then((data) => {
        if (Array.isArray(data)) {
          setEstablecimientos(data);
        } else if (data.error) {
          setError(data.error);
        } else {
          setError("No se pudieron cargar los establecimientos.");
        }
      })
      .catch(() => setError("Error al cargar los establecimientos."));
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
        <div className="home-hero" style={{}}></div>
        <div className="home-map-section" style={{ position: "relative", zIndex: 2 }}>
          <MapView establecimientos={establecimientos} />
        </div>
      </div>
    </>
  );
}
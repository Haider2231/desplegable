import React, { useEffect, useState, useRef } from "react";
import { getCanchas, getDisponibilidad } from "../api/api";
import Swal from "sweetalert2";
import "../styles/manageCourts.css";

// Cargar Google Maps API dinámicamente si no está cargada
function useGoogleMapsAutocomplete(inputRef, setLat, setLng) {
  useEffect(() => {
    if (!window.google || !window.google.maps) {
      const script = document.createElement("script");
      script.src =
        "https://maps.googleapis.com/maps/api/js?key=AIzaSyAYDCSXtmUI-KR3qJ29oRdemNUpSIb-UDQ&libraries=places";
      script.async = true;
      script.onload = () => {
        if (inputRef.current) {
          const autocomplete = new window.google.maps.places.Autocomplete(inputRef.current);
          autocomplete.addListener("place_changed", () => {
            const place = autocomplete.getPlace();
            if (place.geometry) {
              setLat(place.geometry.location.lat());
              setLng(place.geometry.location.lng());
            } else {
              Swal.fire("Error", "No se pudo obtener la ubicación. Intenta nuevamente.", "error");
            }
          });
        }
      };
      document.body.appendChild(script);
    } else if (inputRef.current) {
      const autocomplete = new window.google.maps.places.Autocomplete(inputRef.current);
      autocomplete.addListener("place_changed", () => {
        const place = autocomplete.getPlace();
        if (place.geometry) {
          setLat(place.geometry.location.lat());
          setLng(place.geometry.location.lng());
        } else {
          Swal.fire("Error", "No se pudo obtener la ubicación. Intenta nuevamente.", "error");
        }
      });
    }
  }, [inputRef, setLat, setLng]);
}

export default function ManageCourts() {
  const [canchas, setCanchas] = useState([]);
  const [selectedCancha, setSelectedCancha] = useState(null);
  const [disponibilidad, setDisponibilidad] = useState([]);
  const [loading, setLoading] = useState(false);
  const [horario, setHorario] = useState({ fecha: "", hora_inicio: "", hora_fin: "" });
  const [error, setError] = useState("");
  const [lat, setLat] = useState(null);
  const [lng, setLng] = useState(null);

  // Refs para el formulario de nueva cancha
  const nombreRef = useRef();
  const direccionRef = useRef();
  const telefonoRef = useRef();
  const cantidadRef = useRef();
  const imagenesRef = useRef();

  useGoogleMapsAutocomplete(direccionRef, setLat, setLng);

  // Obtener canchas del usuario (propietario/admin)
  useEffect(() => {
    setLoading(true);
    getCanchas()
      .then(data => {
        const token = localStorage.getItem("token");
        let userId = null;
        if (token) {
          try {
            const base64Url = token.split(".")[1];
            let base64 = base64Url.replace(/-/g, "+").replace(/_/g, "/");
            while (base64.length % 4) base64 += "=";
            const payload = JSON.parse(atob(base64));
            userId = payload.userId;
          } catch {}
        }
        const filtered = data.filter(
          c => c.dueno_id === userId || (userId === 1)
        );
        setCanchas(filtered);
        setLoading(false);
      })
      .catch(() => {
        setError("Error al cargar las canchas.");
        setLoading(false);
      });
  }, []);

  // Al seleccionar una cancha, carga su disponibilidad
  const handleSelectCancha = (cancha) => {
    setSelectedCancha(cancha);
    setLoading(true);
    // Asegúrate de que getDisponibilidad traiga TODOS los horarios (reservados y disponibles) de la cancha
    getDisponibilidad(cancha.cancha_id)
      .then(data => {
        // El backend debe retornar todos los horarios de la cancha, incluyendo los reservados (disponible: false)
        setDisponibilidad(Array.isArray(data) ? data : []);
        setLoading(false);
      })
      .catch(() => {
        setDisponibilidad([]);
        setLoading(false);
      });
  };

  // Agregar horario a la cancha seleccionada
  const handleAgregarHorario = async (e) => {
    e.preventDefault();
    if (!horario.fecha || !horario.hora_inicio || !horario.hora_fin) return;
    setLoading(true);
    try {
      const res = await fetch("/disponibilidades", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${localStorage.getItem("token")}`,
        },
        body: JSON.stringify({
          cancha_id: selectedCancha.cancha_id,
          fecha: horario.fecha,
          hora_inicio: horario.hora_inicio,
          hora_fin: horario.hora_fin,
        }),
      });
      const data = await res.json();
      if (data.id) {
        setDisponibilidad([...disponibilidad, data]);
        setHorario({ fecha: "", hora_inicio: "", hora_fin: "" });
        Swal.fire("Horario agregado", "", "success");
      } else {
        Swal.fire("Error", data.error || "No se pudo agregar el horario", "error");
      }
    } catch {
      Swal.fire("Error", "No se pudo agregar el horario", "error");
    }
    setLoading(false);
  };

  // Registrar nueva cancha
  const handleRegistrarCancha = async (e) => {
    e.preventDefault();
    if (!lat || !lng) {
      Swal.fire("Ubicación requerida", "Por favor, ingresa una dirección válida.", "warning");
      return;
    }
    setLoading(true);

    const formData = new FormData();
    formData.append("nombre", nombreRef.current.value);
    formData.append("direccion", direccionRef.current.value);
    formData.append("lat", lat);
    formData.append("lng", lng);
    formData.append("telefono_contacto", telefonoRef.current.value);

    // Obtener el dueno_id del token (decodifica el JWT)
    let dueno_id = null;
    try {
      const token = localStorage.getItem("token");
      if (token) {
        const base64Url = token.split(".")[1];
        let base64 = base64Url.replace(/-/g, "+").replace(/_/g, "/");
        while (base64.length % 4) base64 += "=";
        const payload = JSON.parse(atob(base64));
        dueno_id = payload.userId;
      }
    } catch {}
    if (!dueno_id) {
      Swal.fire("Error", "No se encontró el usuario. Inicia sesión.", "error");
      setLoading(false);
      return;
    }
    formData.append("dueno_id", dueno_id);

    // Añadir imágenes
    const files = imagenesRef.current.files;
    for (let i = 0; i < files.length; i++) {
      formData.append("imagenes", files[i]);
    }

    try {
      const token = localStorage.getItem("token");
      const response = await fetch("/canchas", {
        method: "POST",
        headers: {
          Authorization: `Bearer ${token}`,
        },
        body: formData,
      });
      const data = await response.json();
      if (response.ok) {
        Swal.fire("¡Cancha registrada!", "La cancha se registró con éxito.", "success");
        nombreRef.current.value = "";
        direccionRef.current.value = "";
        telefonoRef.current.value = "";
        cantidadRef.current.value = "";
        imagenesRef.current.value = "";
        setLat(null);
        setLng(null);
        // Recargar canchas
        getCanchas().then(setCanchas);
      } else {
        Swal.fire("Error", data.error || "Error al registrar la cancha", "error");
      }
    } catch (error) {
      Swal.fire("Error", "Error al conectar con el servidor", "error");
    }
    setLoading(false);
  };

  // Mostrar canchas con al menos un horario reservado
  // NOTA: Ahora, para cada cancha, buscamos su disponibilidad y mostramos el estado
  return (
    <div className="manage-courts-bg">
      <div className="manage-courts-panel">
        <h2 className="manage-title">Gestión de canchas</h2>
        <p className="manage-desc">
          Aquí puedes ver, agregar horarios y gestionar tus canchas.
        </p>
        {error && <div className="manage-error">{error}</div>}
        {loading && <div className="manage-loading">Cargando...</div>}
        <div className="manage-flex">
          <div className="manage-list">
            <h3>Mis canchas</h3>
            <ul>
              {canchas.map((cancha) => {
                // Busca si hay algún horario reservado para esta cancha
                const horariosCancha = selectedCancha && selectedCancha.cancha_id === cancha.cancha_id
                  ? disponibilidad
                  : [];
                const tieneReservado = horariosCancha.some(d => !d.disponible);
                return (
                  <li key={cancha.cancha_id}>
                    <button
                      className={`manage-court-btn${selectedCancha?.cancha_id === cancha.cancha_id ? " selected" : ""}`}
                      onClick={() => handleSelectCancha(cancha)}
                    >
                      {cancha.nombre}
                    </button>
                    {selectedCancha && selectedCancha.cancha_id === cancha.cancha_id && (
                      <>
                        {tieneReservado ? (
                          <span style={{
                            marginLeft: 8,
                            color: "#d32f2f",
                            fontWeight: "bold",
                            fontSize: "0.95em"
                          }}>
                            (Reservada)
                          </span>
                        ) : horariosCancha.length > 0 ? (
                          <span style={{
                            marginLeft: 8,
                            color: "#43e97b",
                            fontWeight: "bold",
                            fontSize: "0.95em"
                          }}>
                            (Disponible)
                          </span>
                        ) : null}
                      </>
                    )}
                  </li>
                );
              })}
            </ul>
          </div>
          {selectedCancha && (
            <div className="manage-detail">
              <h3>{selectedCancha.nombre}</h3>
              <h4>Horarios</h4>
              <ul className="manage-horarios">
                {disponibilidad.length === 0 && (
                  <li>No hay horarios.</li>
                )}
                {/* Mostrar todos los horarios, disponibles y reservados */}
                {disponibilidad.map((d) => (
                  <li key={d.id} style={{
                    background: d.disponible ? "#e0ffe8" : "#ffd6d6",
                    borderRadius: "8px",
                    marginBottom: "8px",
                    padding: "8px 12px",
                    display: "flex",
                    alignItems: "center",
                    gap: "1rem"
                  }}>
                    <span className="manage-horario-fecha">📅 {d.fecha.split("T")[0]}</span>
                    <span className="manage-horario-hora">⏰ {d.hora_inicio} - {d.hora_fin}</span>
                    <span
                      className={`manage-horario-estado ${d.disponible ? "disponible" : "reservada"}`}
                      style={{
                        background: d.disponible ? "#c8ffd6" : "#ffd6d6",
                        color: d.disponible ? "#0b8c3a" : "#d32f2f",
                        fontWeight: "bold",
                        borderRadius: "6px",
                        padding: "2px 12px"
                      }}
                    >
                      {d.disponible ? "Disponible" : "Reservado"}
                    </span>
                  </li>
                ))}
              </ul>
              <h4>Agregar horario</h4>
              <form onSubmit={handleAgregarHorario} className="manage-form-horario">
                <input
                  type="date"
                  value={horario.fecha}
                  onChange={e => setHorario({ ...horario, fecha: e.target.value })}
                  required
                />
                <input
                  type="time"
                  value={horario.hora_inicio}
                  onChange={e => setHorario({ ...horario, hora_inicio: e.target.value })}
                  required
                />
                <input
                  type="time"
                  value={horario.hora_fin}
                  onChange={e => setHorario({ ...horario, hora_fin: e.target.value })}
                  required
                />
                <button type="submit" disabled={loading}>Agregar</button>
              </form>
            </div>
          )}
          {/* Formulario para registrar nueva cancha */}
          <div className="manage-register">
            <h3>Registrar nueva cancha</h3>
            <form onSubmit={handleRegistrarCancha} encType="multipart/form-data">
              <label>Nombre de la cancha:</label>
              <input type="text" ref={nombreRef} required />

              <label>Ubicación (Dirección):</label>
              <input type="text" ref={direccionRef} required />

              <label>Teléfono de contacto:</label>
              <input type="text" ref={telefonoRef} required />

              <label>Subir Imagen:</label>
              <input type="file" ref={imagenesRef} accept="image/*" multiple required />

              <button type="submit" disabled={loading}>
                {loading ? "Registrando..." : "Registrar Cancha"}
              </button>
            </form>
          </div>
        </div>
      </div>
    </div>
  );
}

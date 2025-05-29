import React, { useEffect, useState, useRef } from "react";
import Swal from "sweetalert2";
import { getPropietarios } from "../api/api";

export default function AdminCrearEstablecimiento() {
  const [propietarios, setPropietarios] = useState([]);
  const [selectedPropietario, setSelectedPropietario] = useState("");
  const [nuevoEstablecimiento, setNuevoEstablecimiento] = useState({
    nombre: "",
    direccion: "",
    lat: "",
    lng: "",
    telefono: "",
    precio: "",
    cantidad_canchas: ""
  });
  const [imagenEstablecimiento, setImagenEstablecimiento] = useState(null);
  const direccionEstRef = useRef();

  // Cargar lista de propietarios (solo nombre)
  useEffect(() => {
    getPropietarios()
      .then(data => {
        setPropietarios(Array.isArray(data) ? data : []);
        if (!Array.isArray(data) || data.length === 0) {
          console.warn("No hay propietarios disponibles o el endpoint no responde correctamente.", data);
        }
      })
      .catch((err) => {
        setPropietarios([]);
        console.error("Error al obtener propietarios:", err);
      });
  }, []);

  // Google Maps Autocomplete para dirección
  useEffect(() => {
    if (!window.google || !window.google.maps) {
      const script = document.createElement("script");
      script.src =
        "https://maps.googleapis.com/maps/api/js?key=AIzaSyAYDCSXtmUI-KR3qJ29oRdemNUpSIb-UDQ&libraries=places";
      script.async = true;
      script.onload = initAutocomplete;
      document.body.appendChild(script);
    } else {
      initAutocomplete();
    }
    function initAutocomplete() {
      if (
        direccionEstRef.current &&
        window.google &&
        window.google.maps &&
        !direccionEstRef.current.getAttribute("data-gmaps")
      ) {
        const autocomplete = new window.google.maps.places.Autocomplete(direccionEstRef.current, {
          types: ["geocode"],
          componentRestrictions: { country: "co" }
        });
        autocomplete.addListener("place_changed", () => {
          const place = autocomplete.getPlace();
          if (place.geometry) {
            setNuevoEstablecimiento(est => ({
              ...est,
              direccion: place.formatted_address,
              lat: place.geometry.location.lat(),
              lng: place.geometry.location.lng()
            }));
          } else {
            Swal.fire("Error", "No se pudo obtener la ubicación. Intenta nuevamente.", "error");
          }
        });
        direccionEstRef.current.setAttribute("data-gmaps", "1");
      }
    }
    return () => {
      if (direccionEstRef.current) {
        direccionEstRef.current.removeAttribute("data-gmaps");
      }
    };
  }, []);

  // Handler para crear establecimiento
  const handleAgregarEstablecimiento = async (e) => {
    e.preventDefault();
    const { nombre, direccion, lat, lng, telefono, precio, cantidad_canchas } = nuevoEstablecimiento;
    if (!selectedPropietario || !nombre || !direccion || !lat || !lng || !telefono || !precio || !cantidad_canchas || !imagenEstablecimiento) {
      Swal.fire("Faltan datos", "Completa todos los campos y sube una imagen.", "warning");
      return;
    }
    try {
      const token = localStorage.getItem("token");
      const formData = new FormData();
      formData.append("nombre", nombre);
      formData.append("direccion", direccion);
      formData.append("lat", lat);
      formData.append("lng", lng);
      formData.append("telefono", telefono);
      formData.append("precio", precio);
      formData.append("dueno_id", selectedPropietario);
      formData.append("imagen", imagenEstablecimiento);
      formData.append("cantidad_canchas", cantidad_canchas);

      const res = await fetch("/establecimientos", {
        method: "POST",
        headers: {
          Authorization: `Bearer ${token}`,
        },
        body: formData,
      });
      const data = await res.json();
      if (res.ok) {
        Swal.fire("¡Establecimiento creado!", "", "success");
        setNuevoEstablecimiento({
          nombre: "",
          direccion: "",
          lat: "",
          lng: "",
          telefono: "",
          precio: "",
          cantidad_canchas: ""
        });
        setImagenEstablecimiento(null);
        setSelectedPropietario("");
      } else {
        Swal.fire("Error", data.error || "No se pudo crear el establecimiento", "error");
      }
    } catch {
      Swal.fire("Error", "No se pudo conectar con el servidor", "error");
    }
  };

  return (
    <div style={{
      maxWidth: 500,
      margin: "2rem auto",
      background: "#fff",
      borderRadius: 16,
      boxShadow: "0 6px 24px #b2f7ef88",
      padding: "2.5rem 2rem",
      border: "2px solid #b2f7ef"
    }}>
      <h2 style={{ color: "#007991", fontWeight: 800, marginBottom: 24, textAlign: "center" }}>
        Crear nuevo establecimiento (Administrador)
      </h2>
      <form
        onSubmit={handleAgregarEstablecimiento}
        style={{ display: "flex", flexDirection: "column", gap: 14, marginTop: 10 }}
        encType="multipart/form-data"
      >
        <label style={{ fontWeight: 600, color: "#007991" }}>Propietario:</label>
        <select
          value={selectedPropietario}
          onChange={e => setSelectedPropietario(e.target.value)}
          required
          style={{
            border: "1.5px solid #43e97b",
            borderRadius: 8,
            padding: "10px",
            fontSize: 16,
            outline: "none"
          }}
        >
          <option value="">Selecciona un propietario</option>
          {propietarios.map((p) => (
            <option key={p.id} value={p.id}>
              {p.nombre}
            </option>
          ))}
        </select>
        {propietarios.length === 0 && (
          <div style={{ color: "#d32f2f", fontWeight: 600, marginTop: 4 }}>
            No hay propietarios disponibles. Verifica que existan usuarios con rol propietario y que estés autenticado como admin.
          </div>
        )}
        <label style={{ fontWeight: 600, color: "#007991" }}>Nombre:</label>
        <input
          type="text"
          value={nuevoEstablecimiento.nombre}
          onChange={e => setNuevoEstablecimiento({ ...nuevoEstablecimiento, nombre: e.target.value })}
          required
          style={{
            border: "1.5px solid #43e97b",
            borderRadius: 8,
            padding: "10px",
            fontSize: 16,
            outline: "none"
          }}
        />
        <label style={{ fontWeight: 600, color: "#007991" }}>Dirección:</label>
        <input
          type="text"
          value={nuevoEstablecimiento.direccion}
          ref={direccionEstRef}
          onChange={e => setNuevoEstablecimiento({ ...nuevoEstablecimiento, direccion: e.target.value })}
          required
          style={{
            border: "1.5px solid #43e97b",
            borderRadius: 8,
            padding: "10px",
            fontSize: 16,
            outline: "none"
          }}
          placeholder="Empieza a escribir y selecciona una dirección..."
        />
        <label style={{ fontWeight: 600, color: "#007991" }}>Teléfono:</label>
        <input
          type="text"
          value={nuevoEstablecimiento.telefono}
          onChange={e => setNuevoEstablecimiento({ ...nuevoEstablecimiento, telefono: e.target.value })}
          required
          style={{
            border: "1.5px solid #43e97b",
            borderRadius: 8,
            padding: "10px",
            fontSize: 16,
            outline: "none"
          }}
        />
        <label style={{ fontWeight: 600, color: "#007991" }}>Precio (por hora):</label>
        <input
          type="number"
          value={nuevoEstablecimiento.precio}
          onChange={e => setNuevoEstablecimiento({ ...nuevoEstablecimiento, precio: e.target.value })}
          required
          min="0"
          step="1"
          style={{
            border: "1.5px solid #43e97b",
            borderRadius: 8,
            padding: "10px",
            fontSize: 16,
            outline: "none"
          }}
        />
        <label style={{ fontWeight: 600, color: "#007991" }}>Cantidad de canchas:</label>
        <input
          type="number"
          value={nuevoEstablecimiento.cantidad_canchas}
          onChange={e => setNuevoEstablecimiento({ ...nuevoEstablecimiento, cantidad_canchas: e.target.value })}
          required
          min="1"
          step="1"
          style={{
            border: "1.5px solid #43e97b",
            borderRadius: 8,
            padding: "10px",
            fontSize: 16,
            outline: "none"
          }}
        />
        <label style={{ fontWeight: 600, color: "#007991" }}>Imagen del lugar:</label>
        <input
          type="file"
          accept="image/*"
          required
          onChange={e => setImagenEstablecimiento(e.target.files[0])}
          style={{
            border: "1.5px solid #43e97b",
            borderRadius: 8,
            padding: "10px",
            fontSize: 16,
            background: "#f7fff7"
          }}
        />
        <button
          type="submit"
          style={{
            background: "linear-gradient(90deg, #007991 0%, #43e97b 100%)",
            color: "#fff",
            fontWeight: 700,
            fontSize: 16,
            border: "none",
            borderRadius: 8,
            padding: "10px 0",
            marginTop: 10,
            cursor: "pointer"
          }}
        >
          Guardar
        </button>
      </form>
    </div>
  );
}

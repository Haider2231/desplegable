import React, { useEffect, useState, useRef } from "react";
import Swal from "sweetalert2";
import { getPropietarios } from "../api/api";

export default function AdminCrearEstablecimiento() {
  const [propietarios, setPropietarios] = useState([]);
  const [selectedPropietario, setSelectedPropietario] = useState("");
  const [lat, setLat] = useState("");
  const [lng, setLng] = useState("");
  const [direccion, setDireccion] = useState("");
  const [diasDisponibles, setDiasDisponibles] = useState([]);
  const [horaApertura, setHoraApertura] = useState("");
  const [horaCierre, setHoraCierre] = useState("");
  const [duracionTurno, setDuracionTurno] = useState(60);
  const [imagenes, setImagenes] = useState([]);
  const [documentos, setDocumentos] = useState([]);
  const [loading, setLoading] = useState(false);

  const nombreRef = useRef();
  const direccionRef = useRef();
  const telefonoRef = useRef();
  const precioRef = useRef();
  const cantidadRef = useRef();
  const imagenRef = useRef();
  const documentosRef = useRef();

  // Cargar lista de propietarios (solo nombre)
  useEffect(() => {
    getPropietarios()
      .then(data => {
        setPropietarios(Array.isArray(data) ? data : []);
      })
      .catch(() => setPropietarios([]));
  }, []);

  // Google Maps Autocomplete para dirección
  useEffect(() => {
    if (!window.google || !window.google.maps) {
      const script = document.createElement("script");
      script.src =
        "https://maps.googleapis.com/maps/api/js?key=AIzaSyAYDCSXtmUI-KR3qJ29oRdemNUpSIb-UDQ&libraries=places";
      script.async = true;
      script.defer = true;
      script.onload = initAutocomplete;
      document.body.appendChild(script);
    } else {
      initAutocomplete();
    }
    function initAutocomplete() {
      if (
        direccionRef.current &&
        window.google &&
        window.google.maps &&
        !direccionRef.current.getAttribute("data-gmaps")
      ) {
        const autocomplete = new window.google.maps.places.Autocomplete(direccionRef.current, {
          types: ["geocode"],
          componentRestrictions: { country: "co" }
        });
        autocomplete.addListener("place_changed", () => {
          const place = autocomplete.getPlace();
          if (place.geometry) {
            setLat(place.geometry.location.lat());
            setLng(place.geometry.location.lng());
            setDireccion(place.formatted_address || direccionRef.current.value);
          } else {
            Swal.fire("Error", "No se pudo obtener la ubicación. Intenta nuevamente.", "error");
          }
        });
        direccionRef.current.setAttribute("data-gmaps", "1");
      }
    }
    return () => {
      if (direccionRef.current) {
        direccionRef.current.removeAttribute("data-gmaps");
      }
    };
  }, []);

  // Manejar selección de imágenes
  const handleImagenesChange = (e) => {
    const files = Array.from(e.target.files);
    setImagenes(prev => [...prev, ...files]);
  };

  // Eliminar imagen seleccionada
  const handleRemoveImagen = (idx) => {
    setImagenes(prev => prev.filter((_, i) => i !== idx));
  };

  // Manejar selección de documentos
  const handleDocumentosChange = (e) => {
    const files = Array.from(e.target.files);
    setDocumentos(prev => [...prev, ...files]);
  };

  // Eliminar documento seleccionado
  const handleRemoveDocumento = (idx) => {
    setDocumentos(prev => prev.filter((_, i) => i !== idx));
  };

  const diasSemana = [
    { value: "1", label: "Lunes" },
    { value: "2", label: "Martes" },
    { value: "3", label: "Miércoles" },
    { value: "4", label: "Jueves" },
    { value: "5", label: "Viernes" },
    { value: "6", label: "Sábado" },
    { value: "0", label: "Domingo" }
  ];

  const handleDiaChange = (dia) => {
    setDiasDisponibles(prev =>
      prev.includes(dia)
        ? prev.filter(d => d !== dia)
        : [...prev, dia]
    );
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    // Validación de precio
    const precio = parseInt(precioRef.current.value, 10);
    if (
      isNaN(precio) ||
      precio < 10000 ||
      precio > 200000 ||
      precio % 5000 !== 0
    ) {
      Swal.fire(
        "Precio inválido",
        "El precio debe ser un número mayor o igual a $10.000, menor o igual a $200.000 y múltiplo de $5.000.",
        "warning"
      );
      return;
    }
    if (!lat || !lng) {
      Swal.fire("Ubicación requerida", "Por favor, ingresa una dirección válida.", "warning");
      return;
    }
    if (!selectedPropietario) {
      Swal.fire("Propietario requerido", "Selecciona un propietario.", "warning");
      return;
    }
    setLoading(true);

    const formData = new FormData();
    formData.append("nombre", nombreRef.current.value);
    formData.append("direccion", direccion || direccionRef.current.value);
    formData.append("lat", lat);
    formData.append("lng", lng);
    formData.append("telefono", telefonoRef.current.value);
    formData.append("precio", precio);
    formData.append("cantidad_canchas", cantidadRef.current.value);
    formData.append("dias_disponibles", diasDisponibles.join(","));
    formData.append("hora_apertura", horaApertura);
    formData.append("hora_cierre", horaCierre);
    formData.append("duracion_turno", duracionTurno);
    formData.append("dueno_id", selectedPropietario);

    // 👇 Indica al backend que el admin quiere aprobar directamente
    formData.append("estado", "activo");

    // Imagen principal (solo una)
    if (imagenes.length > 0) {
      formData.append("imagen", imagenes[0]);
    }
    // Documentos (varios)
    if (documentos.length > 0) {
      documentos.forEach(doc => formData.append("documentos", doc));
    }

    try {
      const token = localStorage.getItem("token");
      const response = await fetch("/establecimientos", {
        method: "POST",
        headers: {
          Authorization: `Bearer ${token}`,
        },
        body: formData,
      });
      let data = {};
      try {
        data = await response.json();
      } catch (err) {
        Swal.fire("Error", "Respuesta inválida del servidor", "error");
        setLoading(false);
        return;
      }
      if (response.ok) {
        Swal.fire("¡Establecimiento creado!", "El establecimiento fue creado y activado.", "success");
        // Limpia los campos
        if (nombreRef.current) nombreRef.current.value = "";
        if (direccionRef.current) direccionRef.current.value = "";
        if (telefonoRef.current) telefonoRef.current.value = "";
        if (precioRef.current) precioRef.current.value = "";
        if (cantidadRef.current) cantidadRef.current.value = "";
        if (imagenRef.current) imagenRef.current.value = "";
        if (documentosRef.current) documentosRef.current.value = "";
        setLat("");
        setLng("");
        setDireccion("");
        setDiasDisponibles([]);
        setHoraApertura("");
        setHoraCierre("");
        setDuracionTurno(60);
        setImagenes([]);
        setDocumentos([]);
        setSelectedPropietario("");
      } else {
        Swal.fire("Error", data.error || "No se pudo crear el establecimiento", "error");
      }
    } catch (error) {
      Swal.fire("Error", "No se pudo conectar con el servidor", "error");
    }
    setLoading(false);
  };

  return (
    <div style={{
      maxWidth: 700,
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
        onSubmit={handleSubmit}
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
        <label style={{ fontWeight: 600, color: "#007991" }}>Nombre:</label>
        <input
          type="text"
          ref={nombreRef}
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
          ref={direccionRef}
          value={direccion}
          onChange={e => setDireccion(e.target.value)}
          required
          placeholder="Empieza a escribir y selecciona una dirección..."
          style={{
            border: "1.5px solid #43e97b",
            borderRadius: 8,
            padding: "10px",
            fontSize: 16,
            outline: "none"
          }}
          autoComplete="off"
          spellCheck={false}
        />
        <label style={{ fontWeight: 600, color: "#007991" }}>Teléfono:</label>
        <input
          type="text"
          ref={telefonoRef}
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
          ref={precioRef}
          required
          min="10000"
          max="200000"
          step="5000"
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
          ref={cantidadRef}
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
        <label style={{ fontWeight: 600, color: "#007991" }}>Días disponibles:</label>
        <div style={{ display: "flex", flexWrap: "wrap", gap: 12, marginBottom: 12 }}>
          {diasSemana.map(dia => (
            <label key={dia.value} style={{ display: "flex", alignItems: "center", gap: 4, fontWeight: 600, color: "#388e3c" }}>
              <input
                type="checkbox"
                value={dia.value}
                checked={diasDisponibles.includes(dia.value)}
                onChange={() => handleDiaChange(dia.value)}
                style={{ accentColor: "#43e97b" }}
              />
              {dia.label}
            </label>
          ))}
        </div>
        {diasDisponibles.length > 0 && (
          <div style={{ marginBottom: 12, color: "#007991", fontWeight: 600, fontSize: 15 }}>
            Días seleccionados:&nbsp;
            {diasSemana
              .filter(d => diasDisponibles.includes(d.value))
              .map(d => d.label)
              .join(", ")
            }
          </div>
        )}
        <label style={{ fontWeight: 600, color: "#007991" }}>Horario de apertura:</label>
        <input
          type="time"
          required
          value={horaApertura}
          onChange={e => setHoraApertura(e.target.value)}
          min="00:00"
          max="23:59"
          step="900"
          style={{
            border: "1.5px solid #43e97b",
            borderRadius: 8,
            padding: "10px",
            fontSize: 16,
            outline: "none"
          }}
        />
        <label style={{ fontWeight: 600, color: "#007991" }}>Horario de cierre:</label>
        <input
          type="time"
          required
          value={horaCierre}
          onChange={e => setHoraCierre(e.target.value)}
          min="00:00"
          max="23:59"
          step="900"
          style={{
            border: "1.5px solid #43e97b",
            borderRadius: 8,
            padding: "10px",
            fontSize: 16,
            outline: "none"
          }}
        />
        <label style={{ fontWeight: 600, color: "#007991" }}>Duración por turno (minutos):</label>
        <input
          type="number"
          required
          value={duracionTurno}
          onChange={e => setDuracionTurno(e.target.value)}
          min={30}
          max={180}
          step={15}
          style={{
            border: "1.5px solid #43e97b",
            borderRadius: 8,
            padding: "10px",
            fontSize: 16,
            outline: "none"
          }}
        />
        <label style={{ fontWeight: 600, color: "#007991" }}>Imagen(es) del lugar:</label>
        <input
          type="file"
          accept="image/*"
          multiple
          onChange={handleImagenesChange}
          style={{
            border: "1.5px solid #43e97b",
            borderRadius: 8,
            padding: "10px",
            fontSize: 16,
            background: "#f7fff7"
          }}
          ref={imagenRef}
          value={undefined}
        />
        {imagenes.length > 0 && (
          <div style={{ marginBottom: 12, display: "flex", flexWrap: "wrap", gap: 8 }}>
            {imagenes.map((img, idx) => (
              <div key={idx} style={{ position: "relative", display: "inline-block" }}>
                <img
                  src={URL.createObjectURL(img)}
                  alt={`img-${idx}`}
                  style={{ width: 60, height: 60, objectFit: "cover", borderRadius: 8, border: "2px solid #43e97b" }}
                />
                <button
                  type="button"
                  onClick={() => handleRemoveImagen(idx)}
                  style={{
                    position: "absolute",
                    top: -8,
                    right: -8,
                    background: "#d32f2f",
                    color: "#fff",
                    border: "none",
                    borderRadius: "50%",
                    width: 22,
                    height: 22,
                    cursor: "pointer",
                    fontWeight: "bold",
                    fontSize: 14,
                    lineHeight: 1,
                    boxShadow: "0 2px 8px #d32f2f44"
                  }}
                  title="Quitar imagen"
                >×</button>
              </div>
            ))}
          </div>
        )}
        <label style={{ fontWeight: 600, color: "#007991" }}>Subir documentos (PDF, imágenes, etc):</label>
        <input
          type="file"
          accept="application/pdf,image/*"
          multiple
          onChange={handleDocumentosChange}
          style={{
            border: "1.5px solid #43e97b",
            borderRadius: 8,
            padding: "10px",
            fontSize: 16,
            background: "#f7fff7"
          }}
          ref={documentosRef}
          value={undefined}
        />
        {documentos.length > 0 && (
          <div style={{ marginBottom: 12 }}>
            {documentos.map((doc, idx) => (
              <div key={idx} style={{ display: "flex", alignItems: "center", gap: 8 }}>
                <span style={{ fontSize: 15 }}>{doc.name}</span>
                <button
                  type="button"
                  onClick={() => handleRemoveDocumento(idx)}
                  style={{
                    background: "#d32f2f",
                    color: "#fff",
                    border: "none",
                    borderRadius: "50%",
                    width: 22,
                    height: 22,
                    cursor: "pointer",
                    fontWeight: "bold",
                    fontSize: 14,
                    lineHeight: 1,
                    boxShadow: "0 2px 8px #d32f2f44"
                  }}
                  title="Quitar documento"
                >×</button>
              </div>
            ))}
          </div>
        )}
        <button
          type="submit"
          disabled={loading}
          style={{
            background: "linear-gradient(90deg, #007991 0%, #43e97b 100%)",
            color: "#fff",
            fontWeight: 700,
            fontSize: 16,
            border: "none",
            borderRadius: 8,
            padding: "14px 0",
            marginTop: 10,
            cursor: loading ? "not-allowed" : "pointer"
          }}
        >
          {loading ? "Guardando..." : "Guardar"}
        </button>
      </form>
    </div>
  );
}

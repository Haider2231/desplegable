import React, { useRef, useState } from "react";
import Swal from "sweetalert2";

export default function RegistrarEstablecimiento() {
  const [lat, setLat] = useState(null);
  const [lng, setLng] = useState(null);
  const [loading, setLoading] = useState(false);
  const [direccion, setDireccion] = useState("");
  const [diasDisponibles, setDiasDisponibles] = useState([]);
  const [horaApertura, setHoraApertura] = useState("");
  const [horaCierre, setHoraCierre] = useState("");
  const [duracionTurno, setDuracionTurno] = useState(60);
  const [imagenes, setImagenes] = useState([]);
  const [documentos, setDocumentos] = useState([]);

  const nombreRef = useRef();
  const direccionRef = useRef();
  const telefonoRef = useRef();
  const precioRef = useRef();
  const cantidadRef = useRef();
  const imagenRef = useRef();
  const documentosRef = useRef();

  // Google Maps Autocomplete para dirección
  React.useEffect(() => {
    // Carga el script de Google Maps si no está presente
    if (!window.google || !window.google.maps) {
      if (!document.getElementById("google-maps-script")) {
        const script = document.createElement("script");
        script.id = "google-maps-script";
        script.src =
          "https://maps.googleapis.com/maps/api/js?key=AIzaSyAYDCSXtmUI-KR3qJ29oRdemNUpSIb-UDQ&libraries=places";
        script.async = true;
        script.defer = true;
        script.onload = () => {
          if (direccionRef.current && window.google && window.google.maps) {
            const input = direccionRef.current;
            const autocomplete = new window.google.maps.places.Autocomplete(input);
            autocomplete.setFields(["formatted_address", "geometry"]);
            autocomplete.addListener("place_changed", () => {
              const place = autocomplete.getPlace();
              if (place.geometry) {
                setLat(place.geometry.location.lat());
                setLng(place.geometry.location.lng());
                setDireccion(place.formatted_address || input.value);
              }
            });
          }
        };
        document.body.appendChild(script);
      }
      return;
    }
    // Si el script ya está cargado, inicializa el autocomplete
    if (direccionRef.current && window.google && window.google.maps) {
      const input = direccionRef.current;
      const autocomplete = new window.google.maps.places.Autocomplete(input);
      autocomplete.setFields(["formatted_address", "geometry"]);
      autocomplete.addListener("place_changed", () => {
        const place = autocomplete.getPlace();
        if (place.geometry) {
          setLat(place.geometry.location.lat());
          setLng(place.geometry.location.lng());
          setDireccion(place.formatted_address || input.value);
        }
      });
    }
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

  const handleSubmit = async (e) => {
    e.preventDefault();
    // Validación de precio
    const precio = parseInt(precioRef.current.value, 10);
    if (
      isNaN(precio) ||
      precio < 10000 ||
      precio % 5000 !== 0
    ) {
      Swal.fire(
        "Precio inválido",
        "El precio debe ser un número mayor o igual a $10.000 y múltiplo de $5.000.",
        "warning"
      );
      return;
    }
    if (!lat || !lng) {
      Swal.fire("Ubicación requerida", "Por favor, ingresa una dirección válida.", "warning");
      return;
    }
    setLoading(true);

    const formData = new FormData();
    formData.append("nombre", nombreRef.current.value);
    formData.append("direccion", direccion || direccionRef.current.value);
    formData.append("lat", lat);
    formData.append("lng", lng);
    formData.append("telefono", telefonoRef.current.value);
    formData.append("precio", precio); // usa el valor validado
    formData.append("cantidad_canchas", cantidadRef.current.value);
    formData.append("dias_disponibles", diasDisponibles.join(","));
    formData.append("hora_apertura", horaApertura);
    formData.append("hora_cierre", horaCierre);
    formData.append("duracion_turno", duracionTurno);

    // Obtener el dueno_id del token
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

    // Imagen principal (solo una, el backend solo acepta una)
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
          // No pongas Content-Type aquí, el navegador lo maneja con FormData
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
        Swal.fire("¡Establecimiento registrado!", "Tu solicitud está en revisión.", "success");
        // Notifica al NavBar (en esta y otras pestañas)
        localStorage.setItem("establecimientoRegistrado", Date.now().toString());
        // Limpia los campos solo si existen las refs
        if (nombreRef.current) nombreRef.current.value = "";
        if (direccionRef.current) direccionRef.current.value = "";
        if (telefonoRef.current) telefonoRef.current.value = "";
        if (precioRef.current) precioRef.current.value = "";
        if (cantidadRef.current) cantidadRef.current.value = "";
        if (imagenRef.current) imagenRef.current.value = "";
        if (documentosRef.current) documentosRef.current.value = "";
        setLat(null);
        setLng(null);
        setDireccion("");
        setDiasDisponibles([]);
        setHoraApertura("");
        setHoraCierre("");
        setDuracionTurno(60);
        setImagenes([]);
        setDocumentos([]);
      } else {
        Swal.fire("Error", data.error || "Error al registrar el establecimiento", "error");
      }
    } catch (error) {
      // Muestra el error real en consola para depuración
      console.error("Error al conectar con el servidor:", error);
      Swal.fire("Error", "No se pudo conectar con el servidor", "error");
    }
    setLoading(false);
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

  return (
    <div
      style={{
        maxWidth: 600,
        margin: "2.5rem auto",
        background: "linear-gradient(120deg, #e0f7fa 0%, #f7fff7 100%)",
        borderRadius: 28,
        boxShadow: "0 12px 40px #43e97b55, 0 2px 8px #b2f7ef33",
        padding: "2.7rem 2.2rem 2.2rem 2.2rem",
        border: "2.5px solid #43e97b",
        fontFamily: "'Poppins', 'Segoe UI', Arial, sans-serif",
        color: "#007991",
        position: "relative",
        overflow: "hidden"
      }}
    >
      {/* Animación de ondas verdes en el fondo */}
      <div style={{
        position: "absolute",
        left: 0,
        top: 0,
        width: "100%",
        height: "100%",
        zIndex: 0,
        pointerEvents: "none",
        overflow: "hidden"
      }}>
        <svg width="100%" height="100%" viewBox="0 0 600 400" style={{ position: "absolute", left: 0, top: 0 }}>
          <path
            d="M0,320 Q150,380 300,320 T600,320 V400 H0 Z"
            fill="#43e97b"
            opacity="0.13"
          >
            <animate attributeName="d"
              dur="4s"
              repeatCount="indefinite"
              values="
                M0,320 Q150,380 300,320 T600,320 V400 H0 Z;
                M0,320 Q180,340 300,360 T600,320 V400 H0 Z;
                M0,320 Q150,380 300,320 T600,320 V400 H0 Z
              "
            />
          </path>
          <path
            d="M0,360 Q200,400 400,360 T600,360 V400 H0 Z"
            fill="#38f9d7"
            opacity="0.10"
          >
            <animate attributeName="d"
              dur="5s"
              repeatCount="indefinite"
              values="
                M0,360 Q200,400 400,360 T600,360 V400 H0 Z;
                M0,360 Q250,370 400,390 T600,360 V400 H0 Z;
                M0,360 Q200,400 400,360 T600,360 V400 H0 Z
              "
            />
          </path>
        </svg>
      </div>
      {/* Animación de entrada para el título */}
      <h2
        style={{
          textAlign: "center",
          fontWeight: 900,
          fontSize: 34,
          marginBottom: 18,
          letterSpacing: 1,
          color: "#007991",
          textShadow: "0 2px 12px #43e97b33",
          zIndex: 2,
          position: "relative",
          animation: "fadeInDown 1.2s"
        }}
      >
        <span style={{ marginRight: 8, animation: "spinIn 1.2s" }}>🏢</span>
        Registrar Establecimiento
      </h2>
      <form onSubmit={handleSubmit} encType="multipart/form-data" style={{ zIndex: 1, position: "relative", animation: "fadeInUp 1.2s" }}>
        <label style={{ fontWeight: 700, color: "#007991" }}>Nombre del establecimiento:</label>
        <input type="text" ref={nombreRef} required style={{ width: "100%", marginBottom: 12, borderRadius: 8, border: "1.5px solid #43e97b", padding: "12px", fontSize: 16, background: "#f7fff7" }} />
        <label style={{ fontWeight: 700, color: "#007991" }}>Dirección:</label>
        <input
          type="text"
          ref={direccionRef}
          value={direccion}
          onChange={e => setDireccion(e.target.value)}
          required
          placeholder="Busca tu dirección y selecciónala"
          style={{ width: "100%", marginBottom: 12, borderRadius: 8, border: "1.5px solid #43e97b", padding: "12px", fontSize: 16, background: "#f7fff7" }}
          autoComplete="off"
          spellCheck={false}
        />
        <label style={{ fontWeight: 700, color: "#007991" }}>Teléfono:</label>
        <input type="text" ref={telefonoRef} required style={{ width: "100%", marginBottom: 12, borderRadius: 8, border: "1.5px solid #43e97b", padding: "12px", fontSize: 16, background: "#f7fff7" }} />
        <label style={{ fontWeight: 700, color: "#007991" }}>Precio por hora:</label>
        <input type="number" ref={precioRef} required style={{ width: "100%", marginBottom: 12, borderRadius: 8, border: "1.5px solid #43e97b", padding: "12px", fontSize: 16, background: "#f7fff7" }} />
        <label style={{ fontWeight: 700, color: "#007991" }}>Cantidad de canchas:</label>
        <input type="number" ref={cantidadRef} required style={{ width: "100%", marginBottom: 12, borderRadius: 8, border: "1.5px solid #43e97b", padding: "12px", fontSize: 16, background: "#f7fff7" }} />
        <label style={{ fontWeight: 700, color: "#007991" }}>Días disponibles:</label>
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
        <label style={{ fontWeight: 700, color: "#007991" }}>Duración por turno (minutos):</label>
        <input type="number" required value={duracionTurno} onChange={e => setDuracionTurno(e.target.value)} min={30} max={180} step={15} style={{ width: "100%", marginBottom: 12, borderRadius: 8, border: "1.5px solid #43e97b", padding: "12px", fontSize: 16, background: "#f7fff7" }} />
        <label style={{ fontWeight: 700, color: "#007991" }}>Imagen(es) del lugar:</label>
        <input
          type="file"
          accept="image/*"
          multiple
          onChange={handleImagenesChange}
          style={{ width: "100%", marginBottom: 8, borderRadius: 8, border: "1.5px solid #43e97b", background: "#f7fff7" }}
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
        <label style={{ fontWeight: 700, color: "#007991" }}>Subir documentos (PDF, imágenes, etc):</label>
        <input
          type="file"
          accept="application/pdf,image/*"
          multiple
          onChange={handleDocumentosChange}
          style={{ width: "100%", marginBottom: 8, borderRadius: 8, border: "1.5px solid #43e97b", background: "#f7fff7" }}
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
            marginTop: 16,
            padding: "14px 0",
            borderRadius: 10,
            background: "linear-gradient(90deg, #007991 0%, #43e97b 100%)",
            color: "#fff",
            fontWeight: 800,
            fontSize: 18,
            border: "none",
            letterSpacing: 1,
            boxShadow: "0 2px 8px #43e97b33",
            cursor: loading ? "not-allowed" : "pointer",
            transition: "background 0.2s"
          }}
        >
          {loading ? "Registrando..." : "Registrar Establecimiento"}
        </button>
      </form>
      {/* Animación de barra de progreso si está cargando */}
      {loading && (
        <div style={{
          width: "100%",
          height: 6,
          background: "#e0ffe8",
          borderRadius: 6,
          margin: "18px 0 0 0",
          overflow: "hidden",
          position: "relative"
        }}>
          <div style={{
            width: "100%",
            height: "100%",
            background: "linear-gradient(90deg, #43e97b 0%, #38f9d7 100%)",
            animation: "progressBarAnim 1.2s linear infinite"
          }} />
        </div>
      )}
      <div
        style={{
          marginTop: 28,
          textAlign: "center",
          color: "#388e3c",
          fontWeight: 700,
          fontSize: 16,
          letterSpacing: 0.5,
          animation: "fadeInInfo 2s infinite alternate"
        }}
      >
        <span role="img" aria-label="info" style={{ marginRight: 6, animation: "pulseInfo 1.5s infinite alternate" }}>ℹ️</span>
        Recuerda subir imágenes y documentos claros para agilizar la validación.
      </div>
      <style>
        {`
          input[type="file"]::-webkit-file-upload-button {
            background: #43e97b;
            color: #fff;
            border: none;
            border-radius: 6px;
            padding: 6px 18px;
            font-weight: 700;
            cursor: pointer;
            margin-right: 8px;
          }
          input[type="file"]::file-selector-button {
            background: #43e97b;
            color: #fff;
            border: none;
            border-radius: 6px;
            padding: 6px 18px;
            font-weight: 700;
            cursor: pointer;
            margin-right: 8px;
          }
          @keyframes fadeInInfo {
            0% { opacity: 0.7;}
            100% { opacity: 1;}
          }
          @keyframes pulseInfo {
            0% { transform: scale(1);}
            100% { transform: scale(1.18);}
          }
          @keyframes fadeInDown {
            0% { opacity: 0; transform: translateY(-40px);}
            100% { opacity: 1; transform: translateY(0);}
          }
          @keyframes fadeInUp {
            0% { opacity: 0; transform: translateY(40px);}
            100% { opacity: 1; transform: translateY(0);}
          }
          @keyframes spinIn {
            0% { transform: rotate(-180deg) scale(0.5);}
            100% { transform: rotate(0deg) scale(1);}
          }
          @keyframes progressBarAnim {
            0% { transform: translateX(-100%);}
            100% { transform: translateX(100%);}
          }
        `}
      </style>
    </div>
  );
}

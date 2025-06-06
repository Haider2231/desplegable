import React, { useRef, useState } from "react";
import Swal from "sweetalert2";

export default function RegistrarEstablecimiento() {
  const [lat, setLat] = useState(null);
  const [lng, setLng] = useState(null);
  const [loading, setLoading] = useState(false);
  const [imagenPreview, setImagenPreview] = useState(null);
  const [selectedDocs, setSelectedDocs] = useState([]);
  const [selectedImages, setSelectedImages] = useState([]);
  const nombreRef = useRef();
  const direccionRef = useRef();
  const telefonoRef = useRef();
  const precioRef = useRef();
  const cantidadRef = useRef();
  const imagenRef = useRef();
  const documentosRef = useRef();
  const [direccion, setDireccion] = useState("");

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

  const handleDocumentosChange = (e) => {
    // Permite seleccionar varios archivos de uno en uno y acumularlos
    let nuevosArchivos = Array.from(e.target.files);
    let archivosActuales = [...selectedDocs];

    // Evita duplicados por nombre y tamaño
    nuevosArchivos.forEach((file) => {
      if (!archivosActuales.some(f => f.name === file.name && f.size === file.size)) {
        archivosActuales.push(file);
      }
    });
    setSelectedDocs(archivosActuales);

    // Limpia el input para permitir volver a seleccionar el mismo archivo si se borra
    e.target.value = "";
  };

  const handleQuitarDoc = (idx) => {
    setSelectedDocs(prev => prev.filter((_, i) => i !== idx));
  };

  const handleImagenesChange = (e) => {
    // Permite seleccionar varias imágenes de uno en uno y acumularlas
    let nuevas = Array.from(e.target.files);
    let actuales = [...selectedImages];
    nuevas.forEach((file) => {
      if (!actuales.some(f => f.name === file.name && f.size === file.size)) {
        actuales.push(file);
      }
    });
    setSelectedImages(actuales);
    e.target.value = "";
  };

  const handleQuitarImagen = (idx) => {
    setSelectedImages(prev => prev.filter((_, i) => i !== idx));
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (!lat || !lng) {
      Swal.fire("Ubicación requerida", "Por favor, ingresa una dirección válida.", "warning");
      return;
    }
    if (selectedImages.length === 0) {
      Swal.fire("Imágenes requeridas", "Debes subir al menos una imagen del lugar.", "warning");
      return;
    }
    if (selectedDocs.length === 0) {
      Swal.fire("Documentos requeridos", "Debes subir al menos un documento.", "warning");
      return;
    }
    if (parseInt(precioRef.current.value, 10) < 0) {
      Swal.fire("Precio inválido", "El precio no puede ser negativo.", "warning");
      return;
    }
    setLoading(true);

    const formData = new FormData();
    formData.append("nombre", nombreRef.current.value);
    formData.append("direccion", direccion || direccionRef.current.value);
    formData.append("lat", lat);
    formData.append("lng", lng);
    formData.append("telefono", telefonoRef.current.value);
    formData.append("precio", precioRef.current.value);
    formData.append("cantidad_canchas", cantidadRef.current.value);

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

    // Imágenes principales (varias)
    if (selectedImages.length > 0) {
      for (let i = 0; i < selectedImages.length; i++) {
        formData.append("imagenes", selectedImages[i]);
      }
    }
    // Documentos
    if (selectedDocs.length > 0) {
      for (let i = 0; i < selectedDocs.length; i++) {
        formData.append("documentos", selectedDocs[i]);
      }
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
      const data = await response.json();
      if (response.ok) {
        Swal.fire("¡Establecimiento registrado!", "Tu solicitud está en revisión.", "success");
        // Notifica al NavBar (en esta y otras pestañas)
        localStorage.setItem("establecimientoRegistrado", Date.now().toString());
        nombreRef.current.value = "";
        direccionRef.current.value = "";
        telefonoRef.current.value = "";
        precioRef.current.value = "";
        cantidadRef.current.value = "";
        if (imagenRef.current) imagenRef.current.value = "";
        if (documentosRef.current) documentosRef.current.value = "";
        setLat(null);
        setLng(null);
        setDireccion("");
        setImagenPreview(null);
        setSelectedDocs([]);
        setSelectedImages([]);
      } else {
        Swal.fire("Error", data.error || "Error al registrar el establecimiento", "error");
      }
    } catch (error) {
      Swal.fire("Error", "Error al conectar con el servidor", "error");
    }
    setLoading(false);
  };

  const handleImagenChange = (e) => {
    if (e.target.files && e.target.files.length > 0) {
      setImagenPreview(URL.createObjectURL(e.target.files[0]));
    } else {
      setImagenPreview(null);
    }
  };

  return (
    <div style={{ maxWidth: 500, margin: "2rem auto", background: "#fff", borderRadius: 12, boxShadow: "0 4px 16px #b2f7ef", padding: "2rem" }}>
      {/* Mensaje informativo sobre el tiempo de respuesta */}
      <div style={{
        background: "#e0f7fa",
        color: "#007991",
        borderRadius: 8,
        padding: "12px 18px",
        marginBottom: 18,
        fontWeight: 600,
        fontSize: 15,
        border: "1.5px solid #43e97b"
      }}>
        La respuesta a tu solicitud será enviada en un máximo de 24 horas al correo electrónico que ingresaste.
      </div>
      <h2>Registrar Establecimiento</h2>
      <form onSubmit={handleSubmit} encType="multipart/form-data">
        <label>Nombre del establecimiento:</label>
        <input type="text" ref={nombreRef} required style={{ width: "100%", marginBottom: 12 }} />
        <label>Dirección:</label>
        <input
          type="text"
          ref={direccionRef}
          value={direccion}
          onChange={e => setDireccion(e.target.value)}
          required
          placeholder="Busca tu dirección y selecciónala"
          style={{ width: "100%", marginBottom: 12 }}
          autoComplete="off"
          spellCheck={false}
        />
        <label>Teléfono:</label>
        <input type="text" ref={telefonoRef} required style={{ width: "100%", marginBottom: 12 }} />
        <label>Precio por hora:</label>
        <input
          type="number"
          ref={precioRef}
          required
          min="0"
          style={{ width: "100%", marginBottom: 12 }}
        />
        <label>Cantidad de canchas:</label>
        <input type="number" ref={cantidadRef} required style={{ width: "100%", marginBottom: 12 }} />
        <label>Imágenes del lugar:</label>
        <input
          type="file"
          ref={imagenRef}
          accept="image/*"
          multiple
          // Quita el atributo required para evitar el error de validación del input,
          // ya que la selección real se gestiona en selectedImages.
          style={{ width: "100%", marginBottom: 12 }}
          onChange={handleImagenesChange}
        />
        {/* Mostrar lista de imágenes seleccionadas con opción de quitar */}
        {selectedImages.length > 0 && (
          <ul style={{ margin: "8px 0 12px 0", paddingLeft: 18, fontSize: 14 }}>
            {selectedImages.map((file, idx) => (
              <li key={idx} style={{ display: "flex", alignItems: "center", gap: 8 }}>
                {file.name}
                <button
                  type="button"
                  onClick={() => handleQuitarImagen(idx)}
                  style={{
                    marginLeft: 6,
                    background: "#d32f2f",
                    color: "#fff",
                    border: "none",
                    borderRadius: "50%",
                    width: 22,
                    height: 22,
                    cursor: "pointer",
                    fontWeight: 700,
                    lineHeight: "18px",
                    fontSize: 16,
                    display: "inline-flex",
                    alignItems: "center",
                    justifyContent: "center"
                  }}
                  title="Quitar imagen"
                >
                  ×
                </button>
              </li>
            ))}
          </ul>
        )}
        <label>Subir documentos (PDF, imágenes, etc):</label>
        <input
          type="file"
          ref={documentosRef}
          accept="application/pdf,image/*"
          multiple
          // Quita el atributo required para evitar el error de validación del input,
          // ya que la selección real se gestiona en selectedDocs.
          style={{ width: "100%", marginBottom: 12 }}
          onChange={handleDocumentosChange}
        />
        {/* Mostrar lista de archivos seleccionados con opción de quitar */}
        {selectedDocs.length > 0 && (
          <ul style={{ margin: "8px 0 12px 0", paddingLeft: 18, fontSize: 14 }}>
            {selectedDocs.map((file, idx) => (
              <li key={idx} style={{ display: "flex", alignItems: "center", gap: 8 }}>
                {file.name}
                <button
                  type="button"
                  onClick={() => handleQuitarDoc(idx)}
                  style={{
                    marginLeft: 6,
                    background: "#d32f2f",
                    color: "#fff",
                    border: "none",
                    borderRadius: "50%",
                    width: 22,
                    height: 22,
                    cursor: "pointer",
                    fontWeight: 700,
                    lineHeight: "18px",
                    fontSize: 16,
                    display: "inline-flex",
                    alignItems: "center",
                    justifyContent: "center"
                  }}
                  title="Quitar archivo"
                >
                  ×
                </button>
              </li>
            ))}
          </ul>
        )}
        <button type="submit" disabled={loading} style={{ marginTop: 10, padding: "10px 30px", borderRadius: 8, background: "#007991", color: "#fff", fontWeight: 700, border: "none", cursor: "pointer" }}>
          {loading ? "Registrando..." : "Registrar Establecimiento"}
        </button>
      </form>
    </div>
  );
}

import React, { useRef, useState } from "react";
import Swal from "sweetalert2";

export default function RegistrarEstablecimiento() {
  const [lat, setLat] = useState(null);
  const [lng, setLng] = useState(null);
  const [loading, setLoading] = useState(false);
  const [imagenPreview, setImagenPreview] = useState(null);
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

  const handleSubmit = async (e) => {
    e.preventDefault();
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
    if (imagenRef.current && imagenRef.current.files.length > 0) {
      const files = imagenRef.current.files;
      for (let i = 0; i < files.length; i++) {
        formData.append("imagenes", files[i]);
      }
    }
    // Documentos
    if (documentosRef.current && documentosRef.current.files.length > 0) {
      const docs = documentosRef.current.files;
      for (let i = 0; i < docs.length; i++) {
        formData.append("documentos", docs[i]);
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
        setImagenPreview(null); // <-- Vacía la imagen de vista previa
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
        <input type="number" ref={precioRef} required style={{ width: "100%", marginBottom: 12 }} />
        <label>Cantidad de canchas:</label>
        <input type="number" ref={cantidadRef} required style={{ width: "100%", marginBottom: 12 }} />
        <label>Imágenes del lugar:</label>
        <input
          type="file"
          ref={imagenRef}
          accept="image/*"
          required
          multiple
          style={{ width: "100%", marginBottom: 12 }}
          onChange={handleImagenChange}
        />
        {imagenPreview && (
          <img
            src={imagenPreview}
            alt="Vista previa"
            style={{ width: "100%", maxHeight: 180, objectFit: "cover", borderRadius: 8, marginBottom: 12, border: "1px solid #43e97b" }}
          />
        )}
        <label>Subir documentos (PDF, imágenes, etc):</label>
        <input
          type="file"
          ref={documentosRef}
          accept="application/pdf,image/*"
          multiple
          required
          style={{ width: "100%", marginBottom: 12 }}
        />
        <button type="submit" disabled={loading} style={{ marginTop: 10, padding: "10px 30px", borderRadius: 8, background: "#007991", color: "#fff", fontWeight: 700, border: "none", cursor: "pointer" }}>
          {loading ? "Registrando..." : "Registrar Establecimiento"}
        </button>
      </form>
    </div>
  );
}

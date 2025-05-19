import React, { useRef, useState } from "react";
import Swal from "sweetalert2";

export default function RegisterCourt() {
  const [lat, setLat] = useState(null);
  const [lng, setLng] = useState(null);
  const [loading, setLoading] = useState(false);
  const nombreRef = useRef();
  const direccionRef = useRef();
  const telefonoRef = useRef();
  const cantidadRef = useRef();
  const imagenesRef = useRef();

  // Inicializar Google Maps Autocomplete una sola vez
  React.useEffect(() => {
    if (!window.google || !window.google.maps) return;
    const input = direccionRef.current;
    const autocomplete = new window.google.maps.places.Autocomplete(input);
    autocomplete.addListener("place_changed", () => {
      const place = autocomplete.getPlace();
      if (place.geometry) {
        setLat(place.geometry.location.lat());
        setLng(place.geometry.location.lng());
      } else {
        Swal.fire("Error", "No se pudo obtener la ubicación. Intenta nuevamente.", "error");
      }
    });
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
    formData.append("direccion", direccionRef.current.value);
    formData.append("lat", lat);
    formData.append("lng", lng);
    formData.append("telefono_contacto", telefonoRef.current.value);
    formData.append("cantidad_canchas", cantidadRef.current.value);

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
        // Limpia el formulario
        nombreRef.current.value = "";
        direccionRef.current.value = "";
        telefonoRef.current.value = "";
        cantidadRef.current.value = "";
        imagenesRef.current.value = "";
        setLat(null);
        setLng(null);
      } else {
        Swal.fire("Error", data.error || "Error al registrar la cancha", "error");
      }
    } catch (error) {
      Swal.fire("Error", "Error al conectar con el servidor", "error");
    }
    setLoading(false);
  };

  return (
    <div style={{ maxWidth: 500, margin: "2rem auto", background: "#fff", borderRadius: 12, boxShadow: "0 4px 16px #b2f7ef", padding: "2rem" }}>
      <h2>Registrar Cancha Sintética</h2>
      <form onSubmit={handleSubmit} encType="multipart/form-data">
        <label>Nombre de la cancha:</label>
        <input type="text" ref={nombreRef} required style={{ width: "100%", marginBottom: 12 }} />

        <label>Ubicación (Dirección):</label>
        <input type="text" ref={direccionRef} required style={{ width: "100%", marginBottom: 12 }} />

        <label>Teléfono de contacto:</label>
        <input type="text" ref={telefonoRef} required style={{ width: "100%", marginBottom: 12 }} />

        <label>Cantidad de canchas:</label>
        <input type="number" ref={cantidadRef} required style={{ width: "100%", marginBottom: 12 }} />

        <label>Subir Imagen:</label>
        <input type="file" ref={imagenesRef} accept="image/*" multiple required style={{ width: "100%", marginBottom: 12 }} />

        <button type="submit" disabled={loading} style={{ marginTop: 10, padding: "10px 30px", borderRadius: 8, background: "#007991", color: "#fff", fontWeight: 700, border: "none", cursor: "pointer" }}>
          {loading ? "Registrando..." : "Registrar Cancha"}
        </button>
      </form>
    </div>
  );
}

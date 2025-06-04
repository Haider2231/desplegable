import React, { useEffect, useState, useRef } from "react";
import Swal from "sweetalert2";

export default function MisEstablecimientos() {
  const [establecimientos, setEstablecimientos] = useState([]);
  const [loading, setLoading] = useState(true);
  const [rol, setRol] = useState(null);
  const [reenviandoId, setReenviandoId] = useState(null);

  // Refs para reenviar documentos
  const nombreRef = useRef();
  const direccionRef = useRef();
  const telefonoRef = useRef();
  const precioRef = useRef();
  const cantidadRef = useRef();
  const imagenRef = useRef();
  const documentosRef = useRef();

  useEffect(() => {
    let userId = null;
    let currentRol = null;
    try {
      const token = localStorage.getItem("token");
      if (token) {
        const base64Url = token.split(".")[1];
        let base64 = base64Url.replace(/-/g, "+").replace(/_/g, "/");
        while (base64.length % 4) base64 += "=";
        const payload = JSON.parse(atob(base64));
        userId = payload.userId;
        currentRol = payload.rol;
      }
    } catch {}
    setRol(currentRol);
    if (!userId) return setLoading(false);
    fetch(`/establecimientos/dueno/${userId}`, {
      headers: { Authorization: `Bearer ${localStorage.getItem("token")}` }
    })
      .then(res => res.json())
      .then(data => {
        // Mostrar SOLO los establecimientos pendientes o rechazados
        setEstablecimientos(
          Array.isArray(data)
            ? data.filter(e => e.estado === "pendiente" || e.estado === "rechazado")
            : []
        );
      })
      .finally(() => setLoading(false));
  }, []);

  const handleReenviar = (est) => {
    setReenviandoId(est.id);
    // Opcional: podrías traer los datos actuales para prellenar el formulario si lo deseas
  };

  const handleSubmitReenvio = async (e, est) => {
    e.preventDefault();
    setLoading(true);
    const formData = new FormData();
    formData.append("nombre", nombreRef.current.value);
    formData.append("direccion", direccionRef.current.value);
    formData.append("telefono", telefonoRef.current.value);
    formData.append("precio", precioRef.current.value);
    formData.append("cantidad_canchas", cantidadRef.current.value);
    if (imagenRef.current && imagenRef.current.files.length > 0) {
      formData.append("imagen", imagenRef.current.files[0]);
    }
    if (documentosRef.current && documentosRef.current.files.length > 0) {
      const docs = documentosRef.current.files;
      for (let i = 0; i < docs.length; i++) {
        formData.append("documentos", docs[i]);
      }
    }
    // Mantén lat/lng originales
    formData.append("lat", est.lat);
    formData.append("lng", est.lng);

    try {
      const token = localStorage.getItem("token");
      const response = await fetch(`/establecimientos/${est.id}/reenviar`, {
        method: "POST",
        headers: {
          Authorization: `Bearer ${token}`,
        },
        body: formData,
      });
      const data = await response.json();
      if (response.ok) {
        Swal.fire("Solicitud reenviada", "Tu establecimiento será revisado nuevamente.", "success");
        setReenviandoId(null);
        // Refresca la lista
        window.location.reload();
      } else {
        Swal.fire("Error", data.error || "No se pudo reenviar la solicitud", "error");
      }
    } catch (error) {
      Swal.fire("Error", "Error al conectar con el servidor", "error");
    }
    setLoading(false);
  };

  if (loading) return <div style={{ padding: 32 }}>Cargando...</div>;

  // Mostrar todos los establecimientos, agrupando por estado
  return (
    <div style={{ maxWidth: 700, margin: "2rem auto", background: "#fff", borderRadius: 12, boxShadow: "0 4px 16px #b2f7ef", padding: "2rem" }}>
      <h2>Mis Establecimientos</h2>
      {establecimientos.length === 0 ? (
        <div>No tienes establecimientos registrados.</div>
      ) : (
        <table style={{ width: "100%", borderCollapse: "collapse" }}>
          <thead>
            <tr>
              <th>Nombre</th>
              <th>Dirección</th>
              <th>Estado</th>
              <th>Acciones</th>
            </tr>
          </thead>
          <tbody>
            {establecimientos.map(est => (
              <tr key={est.id}>
                <td>{est.nombre}</td>
                <td>{est.direccion}</td>
                <td>
                  {est.estado === "pendiente" && <span style={{ color: "#ff9800" }}>Pendiente</span>}
                  {est.estado === "rechazado" && (
                    <span style={{ color: "#d32f2f" }}>
                      Rechazado
                      {est.motivo_rechazo && (
                        <div style={{ color: "#b71c1c", fontSize: 13, marginTop: 4 }}>
                          <b>Motivo:</b> {est.motivo_rechazo}
                        </div>
                      )}
                    </span>
                  )}
                  {est.estado === "activo" && <span style={{ color: "#388e3c" }}>Aprobado</span>}
                </td>
                <td>
                  {est.estado === "activo" && (
                    <a href="/manage-courts" style={{ color: "#007991", fontWeight: 700 }}>
                      Gestionar canchas
                    </a>
                  )}
                  {est.estado === "pendiente" && (
                    <span style={{ color: "#888" }}>En revisión</span>
                  )}
                  {est.estado === "rechazado" && (
                    <>
                      <button
                        style={{
                          marginTop: 8,
                          background: "#43a047",
                          color: "#fff",
                          border: "none",
                          borderRadius: 8,
                          padding: "8px 18px",
                          fontWeight: 700,
                          cursor: "pointer"
                        }}
                        onClick={() => handleReenviar(est)}
                      >
                        Reenviar solicitud
                      </button>
                      {reenviandoId === est.id && (
                        <form onSubmit={e => handleSubmitReenvio(e, est)} encType="multipart/form-data" style={{ marginTop: 12 }}>
                          <label>Nombre:</label>
                          <input type="text" ref={nombreRef} defaultValue={est.nombre} required style={{ width: "100%", marginBottom: 8 }} />
                          <label>Dirección:</label>
                          <input type="text" ref={direccionRef} defaultValue={est.direccion} required style={{ width: "100%", marginBottom: 8 }} />
                          <label>Teléfono:</label>
                          <input type="text" ref={telefonoRef} defaultValue={est.telefono} required style={{ width: "100%", marginBottom: 8 }} />
                          <label>Precio por hora:</label>
                          <input type="number" ref={precioRef} defaultValue={est.precio} required style={{ width: "100%", marginBottom: 8 }} />
                          <label>Cantidad de canchas:</label>
                          <input type="number" ref={cantidadRef} defaultValue={est.cantidad_canchas} required style={{ width: "100%", marginBottom: 8 }} />
                          <label>Imagen del lugar:</label>
                          <input type="file" ref={imagenRef} accept="image/*" style={{ width: "100%", marginBottom: 8 }} />
                          <label>Subir documentos (PDF, imágenes, etc):</label>
                          <input type="file" ref={documentosRef} accept="application/pdf,image/*" multiple style={{ width: "100%", marginBottom: 8 }} />
                          <button
                            type="submit"
                            style={{
                              background: "#007991",
                              color: "#fff",
                              border: "none",
                              borderRadius: 8,
                              padding: "8px 18px",
                              fontWeight: 700,
                              marginTop: 8
                            }}
                          >
                            Enviar para revisión
                          </button>
                          <button
                            type="button"
                            style={{
                              background: "#e0e0e0",
                              color: "#333",
                              border: "none",
                              borderRadius: 8,
                              padding: "8px 18px",
                              fontWeight: 700,
                              marginLeft: 8,
                              marginTop: 8
                            }}
                            onClick={() => setReenviandoId(null)}
                          >
                            Cancelar
                          </button>
                        </form>
                      )}
                    </>
                  )}
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      )}
    </div>
  );
}

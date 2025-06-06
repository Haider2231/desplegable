import React, { useEffect, useState } from "react";
import Swal from "sweetalert2";

export default function ValidadorCanchas() {
  const [establecimientos, setEstablecimientos] = useState([]);
  const [loadingEst, setLoadingEst] = useState(true);
  const [selectedEst, setSelectedEst] = useState(null);
  const [docsEst, setDocsEst] = useState([]);

  useEffect(() => {
    fetch("/establecimientos/pendientes", {
      headers: { Authorization: `Bearer ${localStorage.getItem("token")}` }
    })
      .then(res => res.json())
      .then(data => {
        // Filtra solo objetos que tengan campos de establecimiento (no canchas)
        const soloEstablecimientos = Array.isArray(data)
          ? data.filter(e =>
              e.nombre && e.direccion && e.estado === "pendiente" && !e.establecimiento_id // evita canchas
            )
          : [];
        setEstablecimientos(soloEstablecimientos);
      })
      .finally(() => setLoadingEst(false));
  }, []);

  const verDocumentosEst = async (est) => {
    setSelectedEst(est);
    setDocsEst([]);
    const res = await fetch(`/establecimientos/documentos/${est.id}`, {
      headers: { Authorization: `Bearer ${localStorage.getItem("token")}` }
    });
    const docs = await res.json();
    setDocsEst(Array.isArray(docs) ? docs : []);
  };

  const validarEstablecimiento = async (est, aprobar) => {
    const motivo = !aprobar
      ? (await Swal.fire({
          title: "Motivo de rechazo",
          input: "text",
          inputLabel: "¿Por qué rechazas el establecimiento?",
          inputPlaceholder: "Motivo...",
          showCancelButton: true,
        })).value
      : undefined;
    if (!aprobar && !motivo) return;
    const res = await fetch(`/establecimientos/${est.id}/validar`, {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        Authorization: `Bearer ${localStorage.getItem("token")}`,
      },
      body: JSON.stringify({ aprobar, motivo }),
    });
    if (res.ok) {
      Swal.fire("Listo", aprobar ? "Establecimiento aprobado" : "Establecimiento rechazado", "success");
      setEstablecimientos(establecimientos.filter(e => e.id !== est.id));
      setSelectedEst(null);
      setDocsEst([]);
    } else {
      Swal.fire("Error", "No se pudo validar el establecimiento", "error");
    }
  };

  return (
    <div style={{ maxWidth: 900, margin: "2rem auto", background: "#fff", borderRadius: 12, boxShadow: "0 4px 16px #b2f7ef", padding: "2rem" }}>
      <h2>Validación de Establecimientos Pendientes</h2>
      {loadingEst ? (
        <div>Cargando...</div>
      ) : establecimientos.length === 0 ? (
        <div style={{ color: "#388e3c" }}>No hay establecimientos pendientes de validación.</div>
      ) : (
        <div style={{ display: "flex", gap: 32 }}>
          <div style={{ flex: 1 }}>
            <h3>Lista de establecimientos</h3>
            <ul>
              {establecimientos.map(est => (
                <li key={est.id} style={{ marginBottom: 18 }}>
                  <b>{est.nombre}</b> ({est.direccion})
                  <button style={{ marginLeft: 12 }} onClick={() => verDocumentosEst(est)}>
                    Ver documentos
                  </button>
                </li>
              ))}
            </ul>
          </div>
          {selectedEst && (
            <div style={{ flex: 2, borderLeft: "2px solid #43e97b", paddingLeft: 24 }}>
              <h3>Revisión de {selectedEst.nombre}</h3>
              {/* Mostrar todos los datos del establecimiento */}
              <div style={{ marginBottom: 18, background: "#f8f9fd", borderRadius: 8, padding: 16, border: "1px solid #b2f7ef" }}>
                <b>Nombre:</b> {selectedEst.nombre} <br />
                <b>Dirección:</b> {selectedEst.direccion} <br />
                <b>Teléfono:</b> {selectedEst.telefono} <br />
                <b>Precio por hora:</b> ${selectedEst.precio} <br />
                <b>Cantidad de canchas:</b> {selectedEst.cantidad_canchas} <br />
               
                {/* Mostrar imagen principal si existe */}
                {selectedEst.imagen_url && (
                  <div style={{ marginTop: 12 }}>
                    <b>Imagen principal:</b>
                    <br />
                    <img
                      src={
                        selectedEst.imagen_url.startsWith("http")
                          ? selectedEst.imagen_url
                          : `https://canchassinteticas.site${selectedEst.imagen_url}`
                      }
                      alt="Imagen principal"
                      style={{
                        width: 220,
                        maxHeight: 180,
                        objectFit: "cover",
                        borderRadius: 8,
                        marginTop: 6,
                        border: "1.5px solid #43e97b"
                      }}
                    />
                  </div>
                )}
                {/* Mostrar galería de imágenes si existen varias */}
                {selectedEst.imagenes && Array.isArray(selectedEst.imagenes) && selectedEst.imagenes.length > 1 && (
                  <div style={{ marginTop: 12 }}>
                    <b>Galería de imágenes:</b>
                    <div style={{ display: "flex", gap: 10, flexWrap: "wrap", marginTop: 6 }}>
                      {selectedEst.imagenes.map((img, idx) => (
                        <img
                          key={idx}
                          src={
                            img.startsWith("http")
                              ? img
                              : `https://canchassinteticas.site${img}`
                          }
                          alt={`Imagen ${idx + 1}`}
                          style={{
                            width: 110,
                            maxHeight: 90,
                            objectFit: "cover",
                            borderRadius: 6,
                            border: "1px solid #43e97b"
                          }}
                        />
                      ))}
                    </div>
                  </div>
                )}
              </div>
              <h4 style={{ marginTop: 18 }}>Documentos subidos</h4>
              {docsEst.length === 0 ? (
                <div>No hay documentos.</div>
              ) : (
                <ul>
                  {docsEst.map(doc => (
                    <li key={doc.id} style={{ marginBottom: 10 }}>
                      <a
                        href={
                          doc.url.startsWith("http")
                            ? doc.url
                            : `https://canchassinteticas.site${doc.url}`
                        }
                        target="_blank"
                        rel="noopener noreferrer"
                        style={{ display: "inline-block", marginBottom: 4 }}
                      >
                        {doc.tipo.startsWith("image") ? (
                          <img
                            src={
                              doc.url.startsWith("http")
                                ? doc.url
                                : `https://canchassinteticas.site${doc.url}`
                            }
                            alt="Documento"
                            style={{
                              maxWidth: 180,
                              maxHeight: 120,
                              borderRadius: 6,
                              border: "1px solid #43e97b",
                              display: "block",
                              marginBottom: 4
                            }}
                          />
                        ) : doc.tipo === "application/pdf" ? (
                          <>
                            <span style={{ color: "#d32f2f", fontWeight: 600 }}>
                              PDF: {decodeURIComponent(doc.url.split("/").pop())}
                            </span>
                            <span style={{ marginLeft: 8, color: "#888", fontSize: 13 }}>
                              (Haz clic para abrir)
                            </span>
                          </>
                        ) : (
                          <span>
                            {decodeURIComponent(doc.url.split("/").pop())}
                            <span style={{ marginLeft: 8, color: "#888", fontSize: 13 }}>
                              ({doc.tipo})
                            </span>
                          </span>
                        )}
                      </a>
                    </li>
                  ))}
                </ul>
              )}
              <div style={{ marginTop: 18 }}>
                <button
                  style={{ background: "#43e97b", color: "#fff", border: "none", borderRadius: 8, padding: "8px 18px", fontWeight: 700, marginRight: 10 }}
                  onClick={() => validarEstablecimiento(selectedEst, true)}
                >
                  Aprobar
                </button>
                <button
                  style={{ background: "#d32f2f", color: "#fff", border: "none", borderRadius: 8, padding: "8px 18px", fontWeight: 700 }}
                  onClick={() => validarEstablecimiento(selectedEst, false)}
                >
                  Rechazar
                </button>
              </div>
            </div>
          )}
        </div>
      )}
    </div>
  );
}

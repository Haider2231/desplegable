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
      .then(data => setEstablecimientos(Array.isArray(data) ? data : []))
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
              <h3>Documentos de {selectedEst.nombre}</h3>
              {docsEst.length === 0 ? (
                <div>No hay documentos.</div>
              ) : (
                <ul>
                  {docsEst.map(doc => (
                    <li key={doc.id} style={{ marginBottom: 10 }}>
                      <a href={doc.url} target="_blank" rel="noopener noreferrer">
                        {doc.tipo.startsWith("image") ? (
                          <img src={doc.url} alt="Documento" style={{ maxWidth: 180, maxHeight: 120, borderRadius: 6, border: "1px solid #43e97b" }} />
                        ) : (
                          <span>{doc.tipo}</span>
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

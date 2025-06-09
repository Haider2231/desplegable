import React, { useEffect, useState } from "react";
import { getHistorialAbonosPropietario } from "../api/api";

export default function HistorialAbonosPropietario() {
  const [historial, setHistorial] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  useEffect(() => {
    setLoading(true);
    getHistorialAbonosPropietario()
      .then((res) => {
        if (Array.isArray(res)) setHistorial(res);
        else if (res && res.error)
          setError(res.error + (res.detalle ? ": " + res.detalle : ""));
        else setError("No se pudo cargar el historial de abonos.");
      })
      .catch((err) =>
        setError(
          err?.response?.data?.detalle ||
            err?.message ||
            "No se pudo cargar el historial de abonos."
        )
      )
      .finally(() => setLoading(false));
  }, []);

  const pendientes = historial.filter((h) =>
    h.estado?.toLowerCase().includes("pendiente")
  );
  const pagados = historial.filter((h) =>
    h.estado?.toLowerCase().includes("pagado")
  );

  return (
    <div
      style={{
        maxWidth: 1500, // más ancho
        margin: "32px auto",
        background: "#fff",
        borderRadius: 12,
        boxShadow: "0 2px 12px #43a04722",
        padding: 26,
      }}
    >
      <h2 style={{ textAlign: "center", marginBottom: 24 }}>
        Historial de abonos y pagos (Propietario)
      </h2>
      {loading ? (
        <div style={{ textAlign: "center" }}>Cargando...</div>
      ) : error ? (
        <div style={{ color: "red", textAlign: "center" }}>{error}</div>
      ) : (
        <>
          {pendientes.length > 0 && (
            <>
              <h3
                style={{
                  marginTop: 24,
                  marginBottom: 12,
                  color: "#fbc02d",
                  textAlign: "center",
                }}
              >
                Pagos pendientes
              </h3>
              <div style={{ overflowX: "auto", marginBottom: 32 }}>
                <table style={{ width: "100%", borderCollapse: "collapse" }}>
                  <thead>
                    <tr style={{ background: "#fffde7" }}>
                      <th style={{ padding: 8, border: "1px solid #b2f7ef" }}>
                        Fecha reserva
                      </th>
                      <th style={{ padding: 8, border: "1px solid #b2f7ef" }}>
                        Cancha
                      </th>
                      <th style={{ padding: 8, border: "1px solid #b2f7ef" }}>
                        Horario
                      </th>
                      <th style={{ padding: 8, border: "1px solid #b2f7ef" }}>
                        Usuario
                      </th>
                      <th style={{ padding: 8, border: "1px solid #b2f7ef" }}>
                        Email
                      </th>
                      <th style={{ padding: 8, border: "1px solid #b2f7ef" }}>
                        Teléfono
                      </th>
                      <th style={{ padding: 8, border: "1px solid #b2f7ef" }}>
                        Abono
                      </th>
                      <th style={{ padding: 8, border: "1px solid #b2f7ef" }}>
                        Restante
                      </th>
                      <th style={{ padding: 8, border: "1px solid #b2f7ef" }}>
                        Total
                      </th>
                      <th style={{ padding: 8, border: "1px solid #b2f7ef" }}>
                        Estado
                      </th>
                    </tr>
                  </thead>
                  <tbody>
                    {pendientes.map((h, idx) => (
                      <tr
                        key={idx}
                        style={{
                          background: idx % 2 === 0 ? "#f8fffe" : "#fff",
                        }}
                      >
                        <td style={{ padding: 8, border: "1px solid #b2f7ef" }}>
                          {new Date(h.fecha_reserva).toLocaleDateString()}
                        </td>
                        <td style={{ padding: 8, border: "1px solid #b2f7ef" }}>
                          {h.cancha}
                        </td>
                        <td style={{ padding: 8, border: "1px solid #b2f7ef" }}>
                          {h.hora_inicio && h.hora_fin
                            ? `${h.hora_inicio} - ${h.hora_fin}`
                            : "-"}
                        </td>
                        <td style={{ padding: 8, border: "1px solid #b2f7ef" }}>
                          {h.usuario}
                        </td>
                        <td style={{ padding: 8, border: "1px solid #b2f7ef" }}>
                          {h.email}
                        </td>
                        <td style={{ padding: 8, border: "1px solid #b2f7ef" }}>
                          {h.telefono || "-"}
                        </td>
                        <td style={{ padding: 8, border: "1px solid #b2f7ef" }}>
                          {h.abono && h.abono > 0
                            ? `$${h.abono}`
                            : "-"}
                        </td>
                        <td style={{ padding: 8, border: "1px solid #b2f7ef" }}>
                          {h.restante !== undefined &&
                          h.restante !== null &&
                          h.restante !== ""
                            ? `$${h.restante}`
                            : "-"}
                        </td>
                        <td style={{ padding: 8, border: "1px solid #b2f7ef" }}>
                          {/* Total = abono + restante */}
                          {h.abono && h.restante
                            ? `$${Number(h.abono) + Number(h.restante)}`
                            : "-"}
                        </td>
                        <td
                          style={{
                            padding: 8,
                            border: "1px solid #b2f7ef",
                            color: "#fbc02d",
                            fontWeight: 600,
                          }}
                        >
                          {h.estado}
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </>
          )}
          {pagados.length > 0 && (
            <>
              <h3
                style={{
                  marginTop: 24,
                  marginBottom: 12,
                  color: "#43a047",
                  textAlign: "center",
                }}
              >
                Pagos completados
              </h3>
              <div style={{ overflowX: "auto" }}>
                <table style={{ width: "100%", borderCollapse: "collapse" }}>
                  <thead>
                    <tr style={{ background: "#e0f7fa" }}>
                      <th style={{ padding: 8, border: "1px solid #b2f7ef" }}>
                        Fecha reserva
                      </th>
                      <th style={{ padding: 8, border: "1px solid #b2f7ef" }}>
                        Cancha
                      </th>
                      <th style={{ padding: 8, border: "1px solid #b2f7ef" }}>
                        Horario
                      </th>
                      <th style={{ padding: 8, border: "1px solid #b2f7ef" }}>
                        Usuario
                      </th>
                      <th style={{ padding: 8, border: "1px solid #b2f7ef" }}>
                        Email
                      </th>
                      <th style={{ padding: 8, border: "1px solid #b2f7ef" }}>
                        Teléfono
                      </th>
                      <th style={{ padding: 8, border: "1px solid #b2f7ef" }}>
                        Abono
                      </th>
                      <th style={{ padding: 8, border: "1px solid #b2f7ef" }}>
                        Valor restante pagado
                      </th>
                      <th style={{ padding: 8, border: "1px solid #b2f7ef" }}>
                        Total
                      </th>
                      <th style={{ padding: 8, border: "1px solid #b2f7ef" }}>
                        Estado
                      </th>
                    </tr>
                  </thead>
                  <tbody>
                    {pagados.map((h, idx) => (
                      <tr
                        key={idx}
                        style={{
                          background: idx % 2 === 0 ? "#f8fffe" : "#fff",
                        }}
                      >
                        <td style={{ padding: 8, border: "1px solid #b2f7ef" }}>
                          {new Date(h.fecha_reserva).toLocaleDateString()}
                        </td>
                        <td style={{ padding: 8, border: "1px solid #b2f7ef" }}>
                          {h.cancha}
                        </td>
                        <td style={{ padding: 8, border: "1px solid #b2f7ef" }}>
                          {h.hora_inicio && h.hora_fin
                            ? `${h.hora_inicio} - ${h.hora_fin}`
                            : "-"}
                        </td>
                        <td style={{ padding: 8, border: "1px solid #b2f7ef" }}>
                          {h.usuario}
                        </td>
                        <td style={{ padding: 8, border: "1px solid #b2f7ef" }}>
                          {h.email}
                        </td>
                        <td style={{ padding: 8, border: "1px solid #b2f7ef" }}>
                          {h.telefono || "-"}
                        </td>
                        <td style={{ padding: 8, border: "1px solid #b2f7ef" }}>
                          {h.abono && h.abono > 0
                            ? `$${h.abono}`
                            : "-"}
                        </td>
                        <td style={{ padding: 8, border: "1px solid #b2f7ef" }}>
                          {h.valor_restante_pagado !== undefined &&
                          h.valor_restante_pagado !== null &&
                          h.valor_restante_pagado !== ""
                            ? `$${h.valor_restante_pagado}`
                            : "-"}
                        </td>
                        <td style={{ padding: 8, border: "1px solid #b2f7ef" }}>
                          {/* Total = abono + valor_restante_pagado */}
                          {h.abono && h.valor_restante_pagado
                            ? `$${Number(h.abono) + Number(h.valor_restante_pagado)}`
                            : "-"}
                        </td>
                        <td
                          style={{
                            padding: 8,
                            border: "1px solid #b2f7ef",
                            color: "#43a047",
                            fontWeight: 600,
                          }}
                        >
                          {h.estado}
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </>
          )}
          {historial.length === 0 && (
            <div style={{ textAlign: "center", color: "#888" }}>
              No hay abonos ni pagos registrados.
            </div>
          )}
        </>
      )}
    </div>
  );
}

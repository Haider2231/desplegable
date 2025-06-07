import React, { useEffect, useState } from "react";
import Swal from "sweetalert2";
import { useNavigate, useSearchParams } from "react-router-dom";
import { getReservasByUsuario, pagarSaldoReserva, cancelarReserva } from "../api/api";

export default function MisReservas() {
  const [reservas, setReservas] = useState([]);
  const [loading, setLoading] = useState(true);
  const navigate = useNavigate();
  const [searchParams] = useSearchParams();

  // Nuevo: lee el filtro de estado de la query (?estado=pendiente o ?estado=confirmada)
  const estadoFiltro = searchParams.get("estado");
  const completarId = searchParams.get("completar"); // <-- lee el id de reserva a completar

  // Título y descripción dinámicos según el filtro
  let titulo = "Mis Reservas";
  let descripcion = "";
  if (estadoFiltro === "pendiente") {
    titulo = "Pagos pendientes";
    descripcion = "Aquí puedes ver tus reservas con pagos pendientes. Haz clic en el botón para ir a completar el pago.";
  } else if (estadoFiltro === "confirmada") {
    titulo = "Pagos completados";
    descripcion = "Aquí puedes ver tus reservas pagadas. La factura fue enviada a tu correo.";
  } else if (!estadoFiltro) {
    // Historial simple
    titulo = "Historial de reservas";
    descripcion = "Aquí puedes ver todas las reservas que has realizado.";
  }

  useEffect(() => {
    const fetchReservas = async () => {
      try {
        const response = await getReservasByUsuario();
        let reservasArray = Array.isArray(response) ? response : [];
        if (estadoFiltro) {
          reservasArray = reservasArray.filter(r => r.estado === estadoFiltro);
        }
        setReservas(reservasArray);
      } catch (error) {
        console.error("Error al obtener reservas:", error);
        Swal.fire("Error", "No se pudo cargar tus reservas", "error");
        setReservas([]);
      } finally {
        setLoading(false);
      }
    };

    fetchReservas();
  }, [estadoFiltro, loading]);

  // Nueva función para ir a completar el pago
  const irACompletarPago = (reservaId) => {
    navigate(`/mis-reservas?estado=pendiente&completar=${reservaId}`);
  };

  // Nueva función para completar el pago real
  const handleCompletarPago = async (reservaId) => {
    try {
      await pagarSaldoReserva(reservaId);
      await Swal.fire("Pago realizado", "El saldo ha sido pagado. Recibirás tu factura por correo.", "success");
      navigate("/mis-reservas?estado=confirmada");
    } catch (error) {
      console.error("Error al pagar saldo:", error);
      Swal.fire("Error", "No se pudo realizar el pago", "error");
    }
  };

  if (loading) {
    return <div style={{ textAlign: "center", margin: 24 }}>Cargando reservas...</div>;
  }

  // Si hay completarId en la query, muestra el apartado especial para completar el pago
  if (estadoFiltro === "pendiente" && completarId) {
    const reserva = reservas.find(r => String(r.id) === String(completarId));
    if (!reserva) {
      return (
        <div style={{ maxWidth: 600, margin: "2rem auto", background: "#fff", borderRadius: 12, boxShadow: "0 4px 16px #b2f7ef", padding: "2rem", textAlign: "center" }}>
          <h2 style={{ color: "#d32f2f" }}>Reserva no encontrada</h2>
          <button
            style={{
              marginTop: 18,
              padding: "10px 32px",
              borderRadius: 8,
              background: "linear-gradient(90deg, #388e3c 0%, #43a047 100%)",
              color: "#fff",
              fontWeight: 700,
              border: "none",
              fontSize: "1.1rem",
              cursor: "pointer",
            }}
            onClick={() => navigate("/mis-reservas?estado=pendiente")}
          >
            Volver a pagos pendientes
          </button>
        </div>
      );
    }
    return (
      <div style={{ maxWidth: 600, margin: "2rem auto", background: "#fff", borderRadius: 12, boxShadow: "0 4px 16px #b2f7ef", padding: "2rem" }}>
        <h2 style={{ color: "#007991" }}>Completar pago</h2>
        <div style={{ marginBottom: 18 }}>
          <div><b>Establecimiento:</b> {reserva.establecimiento_nombre}</div>
          <div><b>Reserva ID:</b> {reserva.id}</div>
          <div><b>Cancha:</b> {reserva.cancha_nombre}</div>
          <div><b>Fecha:</b> {new Date(reserva.fecha).toLocaleDateString("es-CO")}</div>
          <div><b>Hora:</b> {reserva.hora_inicio} - {reserva.hora_fin}</div>
          <div><b>Abono realizado:</b> ${reserva.abono}</div>
          <div><b>Restante por pagar:</b> <span style={{ color: "#d32f2f", fontWeight: 700 }}>${reserva.restante}</span></div>
        </div>
        <div style={{
          background: "#fffbe6",
          border: "1.5px solid #ff9800",
          borderRadius: 8,
          padding: "12px 18px",
          marginBottom: 8,
          marginTop: 8
        }}>
          <div style={{ color: "#ff9800", fontWeight: 700, marginBottom: 8 }}>
            Para completar tu pago, haz clic en el botón.
          </div>
          <button
            onClick={() => handleCompletarPago(reserva.id)}
            style={{
              background: "linear-gradient(90deg, #388e3c 0%, #43a047 100%)",
              color: "#fff",
              border: "none",
              borderRadius: 8,
              padding: "12px 32px",
              fontWeight: 800,
              fontSize: 18,
              cursor: "pointer",
              boxShadow: "0 2px 8px #43e97b33",
              transition: "background 0.2s"
            }}
          >
            Pagar y recibir factura
          </button>
          <div style={{ color: "#888", fontSize: 14, marginTop: 8 }}>
            Al completar el pago, recibirás la factura por correo.
          </div>
        </div>
        <button
          style={{
            marginTop: 18,
            padding: "10px 32px",
            borderRadius: 8,
            background: "#e0e0e0",
            color: "#007991",
            fontWeight: 700,
            border: "none",
            fontSize: "1.1rem",
            cursor: "pointer",
          }}
          onClick={() => navigate("/mis-reservas?estado=pendiente")}
        >
          Volver a pagos pendientes
        </button>
      </div>
    );
  }

  return (
    <div style={{ maxWidth: 800, margin: "0 auto", padding: "2rem", background: "#fff", borderRadius: 12, boxShadow: "0 4px 16px #b2f7ef" }}>
      <h2 style={{ color: "#007991", marginBottom: 8 }}>{titulo}</h2>
      {descripcion && (
        <div style={{ color: "#007991", marginBottom: 18, fontSize: 16, fontWeight: 500 }}>
          {descripcion}
        </div>
      )}
      {reservas.length === 0 ? (
        <div style={{ textAlign: "center", color: "#888", fontSize: 18, padding: "2rem" }}>
          No tienes reservas realizadas.
        </div>
      ) : (
        <div>
          {reservas.map(reserva => (
            <div key={reserva.id} style={{ marginBottom: 20, padding: 16, borderRadius: 8, background: "#f9f9f9", boxShadow: "0 2px 8px #b2f7ef" }}>
              {/* Historial: NO mostrar Reserva ID, pero sí el nombre del establecimiento */}
              {!estadoFiltro && (
                <>
                  <div style={{ marginBottom: 8 }}>
                    <strong>Establecimiento:</strong> {reserva.establecimiento_nombre}
                  </div>
                  <div style={{ marginBottom: 8 }}>
                    <strong>Cancha:</strong> {reserva.cancha_nombre}
                  </div>
                  <div style={{ marginBottom: 8 }}>
                    <strong>Fecha:</strong> {new Date(reserva.fecha).toLocaleDateString("es-CO")}
                  </div>
                  <div style={{ marginBottom: 8 }}>
                    <strong>Hora:</strong> {reserva.hora_inicio} - {reserva.hora_fin}
                  </div>
                </>
              )}
              {/* Pagos pendientes: mostrar nombre del establecimiento y detalles, INCLUYE Reserva ID */}
              {estadoFiltro === "pendiente" && (
                <>
                  <div style={{ marginBottom: 8 }}>
                    <strong>Establecimiento:</strong> {reserva.establecimiento_nombre}
                  </div>
                  <div style={{ marginBottom: 8 }}>
                    <strong>Reserva ID:</strong> {reserva.id}
                  </div>
                  <div style={{ marginBottom: 8 }}>
                    <strong>Cancha:</strong> {reserva.cancha_nombre}
                  </div>
                  <div style={{ marginBottom: 8 }}>
                    <strong>Fecha:</strong> {new Date(reserva.fecha).toLocaleDateString("es-CO")}
                  </div>
                  <div style={{ marginBottom: 8 }}>
                    <strong>Hora:</strong> {reserva.hora_inicio} - {reserva.hora_fin}
                  </div>
                  <div style={{ marginBottom: 8 }}>
                    <strong>Abono realizado:</strong> ${reserva.abono}
                  </div>
                  <div style={{ marginBottom: 8 }}>
                    <strong>Restante por pagar:</strong> ${reserva.restante}
                  </div>
                  <div style={{
                    background: "#fffbe6",
                    border: "1.5px solid #ff9800",
                    borderRadius: 8,
                    padding: "12px 18px",
                    marginBottom: 8,
                    marginTop: 8
                  }}>
                    <div style={{ color: "#ff9800", fontWeight: 700, marginBottom: 8 }}>
                      Tienes un pago pendiente.
                    </div>
                    <button
                      onClick={() => irACompletarPago(reserva.id)}
                      style={{
                        background: "linear-gradient(90deg, #388e3c 0%, #43a047 100%)",
                        color: "#fff",
                        border: "none",
                        borderRadius: 8,
                        padding: "10px 28px",
                        fontWeight: 800,
                        fontSize: 16,
                        cursor: "pointer",
                        boxShadow: "0 2px 8px #43e97b33",
                        transition: "background 0.2s"
                      }}
                    >
                      Ir a completar pago
                    </button>
                    <div style={{ color: "#888", fontSize: 14, marginTop: 8 }}>
                      Al completar el pago, recibirás la factura por correo.
                    </div>
                  </div>
                </>
              )}
              {/* Pagos completados: puedes mostrar también el establecimiento si lo deseas */}
              {estadoFiltro === "confirmada" && (
                <>
                  <div style={{ marginBottom: 8 }}>
                    <strong>Establecimiento:</strong> {reserva.establecimiento_nombre}
                  </div>
                  <div style={{ marginBottom: 8 }}>
                    <strong>Cancha:</strong> {reserva.cancha_nombre}
                  </div>
                  <div style={{ marginBottom: 8 }}>
                    <strong>Fecha:</strong> {new Date(reserva.fecha).toLocaleDateString("es-CO")}
                  </div>
                  <div style={{ marginBottom: 8 }}>
                    <strong>Hora:</strong> {reserva.hora_inicio} - {reserva.hora_fin}
                  </div>
                  <div style={{ marginBottom: 8 }}>
                    <span style={{ color: "#388e3c", marginLeft: 0 }}>
                      Pagada
                      <div style={{ color: "#888", fontSize: 14, marginTop: 6 }}>
                        ¡Pago completado! La factura fue enviada a tu correo.
                      </div>
                    </span>
                  </div>
                </>
              )}
            </div>
          ))}
        </div>
      )}
    </div>
  );
}
import React, { useEffect, useState, useRef } from "react";
  import { getCanchasConHorarios, getCanchas } from "../api/api";
  import Swal from "sweetalert2";
  import "../styles/manageCourts.css";
  import { useState as useReactState } from "react";

  export default function ManageCourts() {
    const [establecimientos, setEstablecimientos] = useState([]);
    const [selectedEstablecimiento, setSelectedEstablecimiento] = useState(null);
    const [canchasConHorarios, setCanchasConHorarios] = useState([]);
    const [activePanel, setActivePanel] = useState("establecimientos"); // "establecimientos" | "agregar_horario"
    const [selectedEstForHorario, setSelectedEstForHorario] = useState(null);
    const [canchasForHorario, setCanchasForHorario] = useState([]);
    const [selectedCanchaForHorario, setSelectedCanchaForHorario] = useState(null);
    const [horarioForm, setHorarioForm] = useState({ fecha: "", hora_inicio: "" }); // Elimina hora_fin del estado
    const [loading, setLoading] = useState(false);
    const [nuevoEstablecimiento, setNuevoEstablecimiento] = useState({
      nombre: "",
      direccion: "",
      lat: "",
      lng: "",
      telefono: "",
      precio: "",
      cantidad_canchas: "" // <--- nuevo campo
    });
    const direccionEstRef = useRef();

    // Refs para el formulario de nueva cancha
    const nombreRef = useRef();
    const direccionRef = useRef();
    const telefonoRef = useRef();
    const cantidadRef = useRef();
    const imagenesRef = useRef();
    const precioRef = useRef(); // Nuevo campo para el precio

    // Estado para expandir/cerrar listas de horarios
    const [showReservados, setShowReservados] = useReactState(true);
    const [showDisponibles, setShowDisponibles] = useReactState(true);

    // Nuevo estado para la imagen del establecimiento
    const [imagenEstablecimiento, setImagenEstablecimiento] = useState(null);

    // Estado para controlar qué cancha está expandida
    const [expandedCanchaId, setExpandedCanchaId] = useState(null);

    // Nuevo: para saber qué establecimiento está expandido
    const [expandedEstId, setExpandedEstId] = useState(null);

    // Nuevo: estado para el panel de formulario de establecimiento
    const [showEstFormPanel, setShowEstFormPanel] = useState(false);

    // Obtener establecimientos del usuario al montar
    useEffect(() => {
      const token = localStorage.getItem("token");
      let userId = null;
      if (token) {
        try {
          const base64Url = token.split(".")[1];
          let base64 = base64Url.replace(/-/g, "+").replace(/_/g, "/");
          while (base64.length % 4) base64 += "=";
          const payload = JSON.parse(atob(base64));
          userId = payload.userId;
        } catch {}
      }
      if (userId) {
        fetch(`/establecimientos/dueno/${userId}`, {
          headers: { Authorization: `Bearer ${localStorage.getItem("token")}` }
        })
          .then(res => res.json())
          .then(data => setEstablecimientos(Array.isArray(data) ? data : []));
      }
    }, []);

    // Cuando selecciona un establecimiento para ver canchas y horarios
    useEffect(() => {
      if (expandedEstId) {
        getCanchasConHorarios(expandedEstId)
          .then(data => {
            // Normaliza para que cada cancha tenga cancha_id
            const normalizadas = Array.isArray(data)
              ? data.map(c => ({
                  ...c,
                  cancha_id: c.cancha_id || c.id // asegúrate de que siempre haya cancha_id
                }))
              : [];
            setCanchasConHorarios(normalizadas);
          });
      } else {
        setCanchasConHorarios([]);
      }
    }, [expandedEstId]);

    // Cuando selecciona un establecimiento en el panel de agregar horario
    useEffect(() => {
      if (selectedEstForHorario) {
        getCanchas({ establecimiento_id: selectedEstForHorario.id })
          .then(data => {
            const filtered = Array.isArray(data)
              ? data
                  .filter(c => String(c.establecimiento_id) === String(selectedEstForHorario.id))
                  .map(c => ({
                    ...c,
                    cancha_id: c.cancha_id || c.id // normaliza aquí también
                  }))
              : [];
            setCanchasForHorario(filtered);
          });
        setSelectedCanchaForHorario(null);
      } else {
        setCanchasForHorario([]);
        setSelectedCanchaForHorario(null);
      }
    }, [selectedEstForHorario]);

    // Calcula la hora fin sumando 1 hora a la hora de inicio
    function calcularHoraFin(horaInicio) {
      if (!horaInicio) return "";
      const [h, m] = horaInicio.split(":").map(Number);
      let finH = h + 1;
      let finM = m;
      if (finH > 23) finH = 23; // No pasar de las 11pm
      return `${String(finH).padStart(2, "0")}:${String(finM).padStart(2, "0")}`;
    }

    // Handler para agregar horario a una cancha específica (desde el panel izquierdo)
    const handleAgregarHorarioCancha = async (e) => {
      e.preventDefault();
      if (!selectedEstForHorario || !selectedCanchaForHorario) {
        Swal.fire("Selecciona establecimiento y cancha", "", "warning");
        return;
      }
      const { fecha, hora_inicio } = horarioForm;
      const hora_fin = calcularHoraFin(hora_inicio);
      if (!fecha || !hora_inicio) {
        Swal.fire("Faltan datos", "Completa todos los campos.", "warning");
        return;
      }
      // Validación: solo horas exactas (minutos "00")
      const [hInicio, mInicio] = hora_inicio.split(":");
      if (mInicio !== "00") {
        Swal.fire("Horario inválido", "Solo puedes seleccionar horas exactas (por ejemplo, 09:00, 10:00, etc).", "warning");
        return;
      }
      // Validación extra para horario fuera de rango
      if (hora_inicio < "09:00" || hora_inicio > "22:00" || hora_fin > "23:00") {
        Swal.fire("Horario inválido", "Solo se permiten horarios entre 9:00 am y 10:00 pm (fin máximo 11:00 pm).", "warning");
        return;
      }
      try {
        const res = await fetch("/disponibilidades", {
          method: "POST",
          headers: {
            "Content-Type": "application/json",
            Authorization: `Bearer ${localStorage.getItem("token")}`,
          },
          body: JSON.stringify({
            cancha_id: selectedCanchaForHorario.cancha_id || selectedCanchaForHorario.id,
            fecha,
            hora_inicio,
            hora_fin,
          }),
        });
        const data = await res.json();
        if (data.id) {
          Swal.fire("Horario agregado", "", "success");
          setHorarioForm({ fecha: "", hora_inicio: "" }); // Limpia los campos
          setSelectedEstForHorario(null);
          setSelectedCanchaForHorario(null);
          // Refresca la lista de canchas con horarios si corresponde
          if (expandedEstId === selectedEstForHorario.id) {
            getCanchasConHorarios(expandedEstId)
              .then(data => setCanchasConHorarios(Array.isArray(data) ? data : []));
          }
          // Refresca la lista de canchas para el formulario
          getCanchasConHorarios(selectedEstForHorario.id)
            .then(data => setCanchasForHorario(Array.isArray(data) ? data : []));
        } else {
          Swal.fire("Error", data.error || "No se pudo agregar el horario", "error");
        }
      } catch {
        Swal.fire("Error", "No se pudo agregar el horario", "error");
      }
    };

    // Registrar nueva cancha
    const handleRegistrarCancha = async (e) => {
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
      formData.append("precio", precioRef.current.value); // Cambia 'valor' por 'precio'
      formData.append("establecimiento_id", selectedEstablecimiento.id); // Agregar establecimiento_id

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
        let data;
        try {
          data = await response.json();
        } catch (jsonErr) {
          console.error("Error al parsear JSON:", jsonErr);
          data = {};
        }
        if (response.ok) {
          Swal.fire("¡Cancha registrada!", "La cancha se registró con éxito.", "success");
          if (nombreRef.current) nombreRef.current.value = "";
          if (direccionRef.current) direccionRef.current.value = "";
          if (telefonoRef.current) telefonoRef.current.value = "";
          if (cantidadRef.current) cantidadRef.current.value = "";
          if (imagenesRef.current) imagenesRef.current.value = "";
          if (precioRef.current) precioRef.current.value = "";
          setLat(null);
          setLng(null);
          // Recargar canchas
          getCanchas().then(setCanchas);
        } else {
          console.error("Error al registrar cancha (backend):", data);
          Swal.fire("Error", data.error || "Error al registrar la cancha", "error");
        }
      } catch (error) {
        console.error("Error de red o fetch:", error);
        Swal.fire("Error", "Error al conectar con el servidor", "error");
      }
      setLoading(false);
    };

    // Google Maps Autocomplete para dirección de establecimiento
    useEffect(() => {
      if (showEstFormPanel) {
        if (!window.google || !window.google.maps) {
          const script = document.createElement("script");
          script.src =
            "https://maps.googleapis.com/maps/api/js?key=AIzaSyAYDCSXtmUI-KR3qJ29oRdemNUpSIb-UDQ&libraries=places";
          script.async = true;
          script.onload = initAutocomplete;
          document.body.appendChild(script);
        } else {
          initAutocomplete();
        }
      }
      function initAutocomplete() {
        if (
          direccionEstRef.current &&
          window.google &&
          window.google.maps &&
          !direccionEstRef.current.getAttribute("data-gmaps")
        ) {
          const autocomplete = new window.google.maps.places.Autocomplete(direccionEstRef.current, {
            types: ["geocode"],
            componentRestrictions: { country: "co" }
          });
          autocomplete.addListener("place_changed", () => {
            const place = autocomplete.getPlace();
            if (place.geometry) {
              setNuevoEstablecimiento(est => ({
                ...est,
                direccion: place.formatted_address,
                lat: place.geometry.location.lat(),
                lng: place.geometry.location.lng()
              }));
            } else {
              Swal.fire("Error", "No se pudo obtener la ubicación. Intenta nuevamente.", "error");
            }
          });
          direccionEstRef.current.setAttribute("data-gmaps", "1");
        }
      }
      return () => {
        if (direccionEstRef.current) {
          direccionEstRef.current.removeAttribute("data-gmaps");
        }
      };
    }, [showEstFormPanel]);

    // Función para agregar un establecimiento
    const handleAgregarEstablecimiento = async (e) => {
      e.preventDefault();
      const { nombre, direccion, lat, lng, telefono, precio, cantidad_canchas } = nuevoEstablecimiento;
      if (!nombre || !direccion || !lat || !lng || !telefono || !precio || !cantidad_canchas || !imagenEstablecimiento) {
        Swal.fire("Faltan datos", "Completa todos los campos y sube una imagen.", "warning");
        return;
      }
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
        return;
      }
      try {
        const token = localStorage.getItem("token");
        const formData = new FormData();
        formData.append("nombre", nombre);
        formData.append("direccion", direccion);
        formData.append("lat", lat);
        formData.append("lng", lng);
        formData.append("telefono", telefono);
        formData.append("precio", precio);
        formData.append("dueno_id", dueno_id);
        formData.append("imagen", imagenEstablecimiento);
        formData.append("cantidad_canchas", cantidad_canchas);

        const res = await fetch("/establecimientos", {
          method: "POST",
          headers: {
            Authorization: `Bearer ${token}`,
          },
          body: formData,
        });
        const data = await res.json();
        if (res.ok) {
          // NO crear canchas aquí, solo recargar canchas del establecimiento
          fetch(`/canchas?establecimiento_id=${data.id}`, {
            headers: { Authorization: `Bearer ${localStorage.getItem("token")}` }
          })
            .then(res => res.json())
            .then(canchasData => setCanchas(Array.isArray(canchasData) ? canchasData : []));
          Swal.fire("¡Establecimiento y canchas creados!", "", "success");
          setEstablecimientos((prev) => [...prev, data]);
          setShowEstFormPanel(false);
          setNuevoEstablecimiento({
            nombre: "",
            direccion: "",
            lat: "",
            lng: "",
            telefono: "",
            precio: "",
            cantidad_canchas: ""
          });
          setImagenEstablecimiento(null);
        } else {
          Swal.fire("Error", data.error || "No se pudo crear el establecimiento", "error");
        }
      } catch {
        Swal.fire("Error", "No se pudo conectar con el servidor", "error");
      }
    };

    // Obtener fecha mínima (hoy)
    const today = new Date();
    const yyyy = today.getFullYear();
    const mm = String(today.getMonth() + 1).padStart(2, "0");
    const dd = String(today.getDate()).padStart(2, "0");
    const minDate = `${yyyy}-${mm}-${dd}`;

    // --- Google Maps Autocomplete SOLO para el panel de registro ---
    useEffect(() => {
      if (activePanel === "registrar") {
        // Cargar Google Maps script si no está cargado
        if (!window.google || !window.google.maps) {
          const script = document.createElement("script");
          script.src =
            "https://maps.googleapis.com/maps/api/js?key=AIzaSyAYDCSXtmUI-KR3qJ29oRdemNUpSIb-UDQ&libraries=places";
          script.async = true;
          script.onload = initAutocomplete;
          document.body.appendChild(script);
        } else {
          initAutocomplete();
        }
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
            componentRestrictions: { country: "co" } // Cambia el país si lo necesitas
          });
          autocomplete.addListener("place_changed", () => {
            const place = autocomplete.getPlace();
            if (place.geometry) {
              setLat(place.geometry.location.lat());
              setLng(place.geometry.location.lng());
            } else {
              Swal.fire("Error", "No se pudo obtener la ubicación. Intenta nuevamente.", "error");
            }
          });
          direccionRef.current.setAttribute("data-gmaps", "1");
        }
      }
      // Limpia el atributo al salir del panel de registro
      return () => {
        if (direccionRef.current) {
          direccionRef.current.removeAttribute("data-gmaps");
        }
      };
      // eslint-disable-next-line
    }, [activePanel]);

    // Mostrar canchas con al menos un horario reservado
    // NOTA: Ahora, para cada cancha, buscamos su disponibilidad y mostramos el estado
    return (
      <div className="manage-courts-bg">
        <div className="manage-courts-panel" style={{ display: "flex", minHeight: 600 }}>
          {/* Menú lateral izquierdo */}
          <div style={{
            width: 220,
            background: "#f7f7f7",
            borderRight: "2px solid #b2f7ef",
            padding: "2rem 1rem 2rem 1.5rem",
            display: "flex",
            flexDirection: "column",
            gap: 18
          }}>
            <button
              className={`manage-menu-btn${activePanel === "establecimientos" ? " active" : ""}`}
              onClick={() => setActivePanel("establecimientos")}
              style={{
                background: activePanel === "establecimientos" ? "#43e97b" : "#fff",
                color: activePanel === "establecimientos" ? "#fff" : "#007991",
                border: "none",
                borderRadius: 8,
                padding: "12px 18px",
                fontWeight: 700,
                fontSize: 16,
                marginBottom: 8,
                cursor: "pointer"
              }}
            >
              🏢 Establecimientos
            </button>
            <button
              className={`manage-menu-btn${activePanel === "agregar_horario" ? " active" : ""}`}
              onClick={() => setActivePanel("agregar_horario")}
              style={{
                background: activePanel === "agregar_horario" ? "#43e97b" : "#fff",
                color: activePanel === "agregar_horario" ? "#fff" : "#007991",
                border: "none",
                borderRadius: 8,
                padding: "12px 18px",
                fontWeight: 700,
                fontSize: 16,
                marginBottom: 8,
                cursor: "pointer"
              }}
            >
              ⏰ Agregar horarios
            </button>
          </div>
          {/* Panel central dinámico */}
          <div style={{ flex: 1, padding: "2rem" }}>
            {/* Panel: Establecimientos */}
            {activePanel === "establecimientos" && (
              <div>
                <h3 style={{ color: "#007991", fontWeight: 700, marginBottom: 12 }}>Mis establecimientos</h3>
                <ul>
                  {establecimientos.map(est => (
                    <li key={est.id} style={{
                      background: "#fff",
                      borderRadius: 10,
                      boxShadow: "0 2px 8px #b2f7ef33",
                      marginBottom: 18,
                      padding: 18,
                      display: "flex",
                      alignItems: "flex-start",
                      gap: 18
                    }}>
                      {est.imagen_url && (
                        <img src={est.imagen_url} alt="Establecimiento" style={{ width: 90, height: 90, objectFit: "cover", borderRadius: 8 }} />
                      )}
                      <div style={{ flex: 1 }}>
                        <div style={{ fontWeight: 700, fontSize: 18, color: "#007991" }}>{est.nombre}</div>
                        <div style={{ color: "#388e3c" }}>{est.direccion}</div>
                        <div>Teléfono: <b>{est.telefono}</b></div>
                        <div>Precio: <b>${est.precio}</b></div>
                        <div>
                          Canchas registradas: <b>{expandedEstId === est.id ? canchasConHorarios.length : "..."}</b>
                        </div>
                        <button
                          style={{
                            marginTop: 10,
                            background: "#43e97b",
                            color: "#fff",
                            border: "none",
                            borderRadius: 6,
                            padding: "6px 18px",
                            fontWeight: 600,
                            cursor: "pointer"
                          }}
                          onClick={() => setExpandedEstId(expandedEstId === est.id ? null : est.id)}
                        >
                          {expandedEstId === est.id ? "Ocultar canchas" : "Ver canchas"}
                        </button>
                        {expandedEstId === est.id && (
                          <ul style={{ marginTop: 14 }}>
                            {canchasConHorarios.length > 0 ? (
                              canchasConHorarios.map((cancha, idx) => (
                                <li key={cancha.cancha_id || cancha.id} style={{ marginBottom: 18 }}>
                                  <div style={{ fontWeight: 700, fontSize: 17, color: "#007991", marginBottom: 4 }}>
                                    {getCanchaDisplayName(cancha, idx)}
                                  </div>
                                  {/* Horarios de la cancha */}
                                  <div style={{ margin: "8px 0" }}>
                                    <b style={{ color: "#388e3c" }}>Horarios:</b>
                                    <ul style={{
                                      paddingLeft: 0,
                                      listStyle: "none",
                                      margin: 0,
                                      display: "flex",
                                      flexDirection: "column",
                                      gap: "10px"
                                    }}>
                                      {/* Filtra horarios futuros y elimina duplicados */}
                                      {(() => {
                                        const hoy = new Date();
                                        hoy.setHours(0,0,0,0);
                                        const vistos = new Set();
                                        const horariosFiltrados = (cancha.horarios || [])
                                          .filter(h => {
                                            if (!h.fecha) return false;
                                            const fechaHorario = new Date(h.fecha.split("T")[0]);
                                            if (fechaHorario < hoy) return false;
                                            // Solo mostrar horarios con minutos en 00
                                            const [hInicio, mInicio] = h.hora_inicio.split(":");
                                            const [hFin, mFin] = h.hora_fin.split(":");
                                            if (mInicio !== "00" || mFin !== "00") return false;
                                            // Genera una clave única por fecha, hora_inicio y hora_fin
                                            const clave = `${h.fecha?.split("T")[0]}_${h.hora_inicio}_${h.hora_fin}`;
                                            if (vistos.has(clave)) return false;
                                            vistos.add(clave);
                                            return true;
                                          });
                                        return horariosFiltrados.length > 0 ? (
                                          horariosFiltrados.map(h => (
                                            <li key={h.id} style={{
                                              background: h.disponible ? "#e6fbe6" : "#ffeaea",
                                              border: `2px solid ${h.disponible ? "#43e97b" : "#d32f2f"}`,
                                              borderRadius: 10,
                                              padding: "10px 16px",
                                              display: "flex",
                                              alignItems: "center",
                                              justifyContent: "space-between",
                                              boxShadow: h.disponible ? "0 1px 4px #43e97b33" : "0 1px 4px #d32f2f22",
                                              fontWeight: 600,
                                              color: h.disponible ? "#388e3c" : "#d32f2f"
                                            }}>
                                              <span>
                                                <b>Fecha:</b> <span style={{ color: "#222" }}>{h.fecha?.split("T")[0] || h.fecha}</span>
                                                {" | "}
                                                <b>Hora:</b> <span style={{ color: "#222" }}>{h.hora_inicio} - {h.hora_fin}</span>
                                              </span>
                                              {h.disponible ? (
                                                <span style={{
                                                  color: "#388e3c",
                                                  fontWeight: 800,
                                                  fontSize: 15,
                                                  marginLeft: 18
                                                }}>
                                                  Disponible
                                                </span>
                                              ) : (
                                                <span style={{
                                                  color: "#d32f2f",
                                                  fontWeight: 800,
                                                  fontSize: 15,
                                                  marginLeft: 18,
                                                  textAlign: "right"
                                                }}>
                                                  Reservado
                                                  {/* Siempre mostrar info de usuario y abono/restante usando FetchFacturaInfo */}
                                                  <FetchFacturaInfo disponibilidadId={h.id} />
                                                </span>
                                              )}
                                            </li>
                                          ))
                                        ) : (
                                          <li style={{ color: "#888", fontWeight: 500, fontSize: 15, padding: "8px 0" }}>
                                            No hay horarios registrados.
                                          </li>
                                        );
                                      })()}
                                    </ul>
                                  </div>
                                </li>
                              ))
                            ) : (
                              <li style={{ color: "#888", marginTop: 10 }}>
                                No hay canchas registradas para este establecimiento.
                              </li>
                            )}
                          </ul>
                        )}
                      </div>
                    </li>
                  ))}
                </ul>
              </div>
            )}
            {/* Panel: Agregar horarios */}
            {activePanel === "agregar_horario" && (
              <div
                style={{
                  maxWidth: 500,
                  margin: "2rem auto",
                  background: "linear-gradient(120deg, #e0f7fa 0%, #f7fff7 100%)",
                  borderRadius: 16,
                  boxShadow: "0 6px 24px #b2f7ef88",
                  padding: "2.5rem 2rem",
                  border: "2px solid #b2f7ef",
                  display: "flex",
                  flexDirection: "column",
                  alignItems: "center"
                }}
              >
                <h2 style={{
                  color: "#007991",
                  fontWeight: 800,
                  marginBottom: 24,
                  letterSpacing: 1
                }}>
                  Agregar horario a una cancha
                </h2>
                <form
                  onSubmit={handleAgregarHorarioCancha}
                  style={{
                    width: "100%",
                    display: "flex",
                    flexDirection: "column",
                    gap: 18
                  }}
                >
                  <label style={{ fontWeight: 600, color: "#007991" }}>Establecimiento:</label>
                  <select
                    value={selectedEstForHorario?.id || ""}
                    onChange={e => {
                      const est = establecimientos.find(est => String(est.id) === e.target.value);
                      setSelectedEstForHorario(est || null);
                    }}
                    required
                    style={{
                      border: "1.5px solid #43e97b",
                      borderRadius: 8,
                      padding: "10px",
                      fontSize: 16,
                      outline: "none"
                    }}
                  >
                    <option value="">Selecciona un establecimiento</option>
                    {establecimientos.map(est => (
                      <option key={est.id} value={est.id}>{est.nombre}</option>
                    ))}
                  </select>
                  <label style={{ fontWeight: 600, color: "#007991" }}>Cancha:</label>
                  <select
                    value={selectedCanchaForHorario?.cancha_id || selectedCanchaForHorario?.id || ""}
                    onChange={e => {
                      const cancha = canchasForHorario.find(
                        c => String(c.cancha_id || c.id) === e.target.value
                      );
                      setSelectedCanchaForHorario(cancha || null);
                    }}
                    required
                    disabled={!selectedEstForHorario}
                    style={{
                      border: "1.5px solid #43e97b",
                      borderRadius: 8,
                      padding: "10px",
                      fontSize: 16,
                      outline: "none"
                    }}
                  >
                    <option value="">Selecciona una cancha</option>
                    {canchasForHorario.map((cancha, idx) => (
                      <option key={cancha.cancha_id || cancha.id} value={cancha.cancha_id || cancha.id}>
                        {getCanchaDisplayName(cancha, idx)}
                      </option>
                    ))}
                  </select>
                  <label style={{ fontWeight: 600, color: "#007991" }}>Fecha:</label>
                  <input
                    type="date"
                    value={horarioForm.fecha}
                    min={minDate}
                    onChange={e => setHorarioForm({ ...horarioForm, fecha: e.target.value })}
                    required
                    style={{
                      border: "1.5px solid #43e97b",
                      borderRadius: 8,
                      padding: "10px",
                      fontSize: 16,
                      outline: "none"
                    }}
                  />
                  <label style={{ fontWeight: 600, color: "#007991" }}>Hora inicio:</label>
                  <select
                    value={horarioForm.hora_inicio}
                    onChange={e => setHorarioForm({ ...horarioForm, hora_inicio: e.target.value })}
                    required
                    style={{
                      border: "1.5px solid #43e97b",
                      borderRadius: 8,
                      padding: "10px",
                      fontSize: 16,
                      outline: "none"
                    }}
                  >
                    <option value="">Selecciona la hora de inicio</option>
                    {Array.from({ length: 14 }).map((_, i) => {
                      // Horas de 09:00 a 22:00
                      const hour = 9 + i;
                      const value = `${hour.toString().padStart(2, "0")}:00`;
                      return (
                        <option key={value} value={value}>{value}</option>
                      );
                    })}
                  </select>
                  <label style={{ fontWeight: 600, color: "#007991" }}>Hora fin :</label>
                  <input
                    type="time"
                    value={calcularHoraFin(horarioForm.hora_inicio)}
                    readOnly
                    disabled
                    style={{
                      border: "1.5px solid #43e97b",
                      borderRadius: 8,
                      padding: "10px",
                      fontSize: 16,
                      outline: "none",
                      background: "#f0f0f0"
                    }}
                  />
                  <button
                    type="submit"
                    style={{
                      background: "#43e97b",
                      color: "#fff",
                      border: "none",
                      borderRadius: 8,
                      padding: "6px 18px",
                      fontWeight: 700,
                      cursor: "pointer"
                    }}
                  >
                    Agregar horario
                  </button>
                </form>
              </div>
            )}
          </div>
        </div>
      </div>
    );

    // Agrega esta función dentro del componente
    function getCanchaDisplayName(cancha, idx) {
      return cancha.nombre?.trim()
        ? cancha.nombre
        : `Cancha ${idx + 1}`;
    }

  }

  function FetchFacturaInfo({ disponibilidadId }) {
    const [factura, setFactura] = React.useState(null);
    const [usuario, setUsuario] = React.useState(null);

    React.useEffect(() => {
      if (!disponibilidadId) return;
      fetch(`/facturas/disponibilidad/${disponibilidadId}`)
        .then(res => res.ok ? res.json() : null)
        .then(data => {
          if (data && data.abono !== undefined && data.restante !== undefined) {
            setFactura(data);
            // Buscar usuario solo si hay user_id
            if (data.user_id) {
              // CORREGIDO: usa el endpoint correcto
              fetch(`/auth/usuarios/${data.user_id}`)
                .then(res => res.ok ? res.json() : null)
                .then(userData => {
                  if (userData && userData.nombre && userData.telefono) {
                    setUsuario(userData);
                  }
                });
            }
          }
        });
    }, [disponibilidadId]);

    if (!factura) return null;
    return (
      <span style={{
        display: "block",
        color: "#007991",
        fontWeight: 600,
        fontSize: 14,
        marginTop: 2
      }}>
        <br />
        {/* Mostrar datos del usuario si están disponibles */}
        {usuario && (
          <>
            <span style={{ color: "#222" }}>
              <b>Reservado por:</b> {usuario.nombre}
              <br />
              <b>Teléfono:</b> {usuario.telefono}
              <br />
            </span>
          </>
        )}
        Abono: <span style={{ color: "#388e3c" }}>${factura.abono}</span>
        <br />
        Restante: <span style={{ color: "#d32f2f" }}>${factura.restante}</span>
      </span>
    );
  }

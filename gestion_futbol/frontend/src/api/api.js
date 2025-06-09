import axios from "axios";
import Swal from "sweetalert2";

const api = axios.create({
  baseURL: "/", // Vite proxy se encarga de redirigir
  headers: {
    "Content-Type": "application/json",
  },
});

api.interceptors.request.use((config) => {
  const token = localStorage.getItem("token");
  if (token) {
    config.headers.Authorization = `Bearer ${token}`;
  }
  return config;
});



// --- NUEVO: Interceptor de respuesta para token vencido ---
api.interceptors.response.use(
  (response) => response,
  (error) => {
    // Si el backend responde 401 o 403, asume token vencido/no válido
    if (
      error.response &&
      (error.response.status === 401 || error.response.status === 403)
    ) {
      localStorage.removeItem("token");
      if (
        typeof window !== "undefined" &&
        !window.location.pathname.startsWith("/login") &&
        !window.location.pathname.startsWith("/register")
      ) {
        Swal.fire({
          icon: "warning",
          title: "Sesión expirada",
          text: "Tu sesión ha expirado. Por favor, inicia sesión nuevamente.",
          confirmButtonText: "Aceptar",
          confirmButtonColor: "#3f51b5",
          background: "#222",
          color: "#fff",
        });
      }
    }
    return Promise.reject(error);
  }
);

export const login = (email, password) =>
  api.post("/auth/login", { email, password }).then((res) => res.data);

export const register = ({ nombre, email, password, rol = "usuario" ,telefono}) =>
  api.post("/auth/usuarios", { nombre, email, password, rol,telefono }).then((res) => res.data);

export const verify = (email, codigo) =>
  api.post("/auth/verificar", { email, codigo }).then((res) => res.data);

// Permite filtrar por establecimiento_id o dueno_id
export const getCanchas = (filtros = {}) => {
  let url = "/canchas";
  const params = [];
  if (filtros.establecimiento_id) params.push(`establecimiento_id=${filtros.establecimiento_id}`);
  if (filtros.dueno_id) params.push(`dueno_id=${filtros.dueno_id}`);
  if (params.length) url += "?" + params.join("&");
  return api.get(url).then((res) => res.data);
};

// Trae canchas con horarios para un establecimiento
export const getCanchasConHorarios = (establecimiento_id) =>
  api.get(`/establecimientos/${establecimiento_id}/canchas-con-horarios`).then((res) => res.data);

export const getDisponibilidad = (canchaId) =>
  api.get(`/disponibilidades/cancha/${canchaId}`).then((res) => res.data);

export const reservar = (disponibilidad_id, opciones = {}) =>
  api.post("/reservas", { disponibilidad_id, ...opciones }).then((res) => res.data);

export const getEstadisticasUsuario = () =>
  api.get("/estadisticas/usuario").then((res) => res.data);

export const getEstadisticasPropietario = () =>
  api.get("/estadisticas/propietario").then((res) => res.data);

export const getEstadisticasAdmin = () =>
  api.get("/estadisticas/admin").then((res) => res.data);

export const getUsuarios = () =>
  api.get("/auth/usuarios").then((res) => res.data);

export const deleteUsuario = (id) =>
  api.delete(`/auth/usuarios/${id}`).then((res) => res.data);

export const updateUsuario = (id, data) =>
  api.put(`/auth/usuarios/${id}`, data).then((res) => res.data);

export const createUsuario = (data) =>
  api.post("/auth/usuarios/admin", data).then((res) => res.data);

export const getEstablecimientos = () =>
  // Obtener todos los establecimientos
  api.get("/establecimientos").then((res) => res.data);

// Obtener todos los propietarios (usuarios con rol propietario, solo admin)
export const getPropietarios = () =>
 api.get("/auth/usuarios/propietarios").then((res) => res.data);

export const pagarSaldoReserva = (reserva_id) =>
  api.post(`/reservas/${reserva_id}/pagar-saldo`).then((res) => res.data);

export const cancelarReserva = (reserva_id) =>
  api.post(`/reservas/${reserva_id}/cancelar`).then((res) => res.data);

// Obtener reservas del usuario autenticado (token)
export const getReservasByUsuario = () =>
  api.get("/reservas/mis-reservas").then((res) => res.data);


// Obtener historial de abonos y pagos del usuario
export const getHistorialAbonos = async () => {
  const res = await api.get("/reservas/historial-abonos");
  return res.data;
};

// Obtener historial de abonos y pagos de reservas de todas las canchas del propietario
export const getHistorialAbonosPropietario = async () => {
  const res = await api.get("/reservas/historial-abonos-propietario");
  return res.data;
};
// ...agrega más métodos según tus endpoints...

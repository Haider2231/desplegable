import axios from "axios";

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

export const login = (email, password) =>
  api.post("/auth/login", { email, password }).then((res) => res.data);

export const register = ({ nombre, email, password, rol = "usuario" }) =>
  api.post("/auth/usuarios", { nombre, email, password, rol }).then((res) => res.data);

export const verify = (email, codigo) =>
  api.post("/auth/verificar", { email, codigo }).then((res) => res.data);

export const getCanchas = () => api.get("/canchas").then((res) => res.data);

export const getDisponibilidad = (canchaId) =>
  api.get(`/disponibilidades/cancha/${canchaId}`).then((res) => res.data);

export const reservar = (disponibilidad_id) =>
  api.post("/reservas", { disponibilidad_id }).then((res) => res.data);

export const getEstadisticasUsuario = () =>
  api.get("/estadisticas/usuario").then((res) => res.data);

export const getEstadisticasPropietario = () =>
  api.get("/estadisticas/propietario").then((res) => res.data);

export const getEstadisticasAdmin = () =>
  api.get("/estadisticas/admin").then((res) => res.data);


export const getUsuarios = () =>
  api.get("/authRoutes/usuarios").then((res) => res.data);

export const deleteUsuario = (id) =>
  api.delete(`/authRoutes/usuarios/${id}`).then((res) => res.data);

export const updateUsuario = (id, data) =>
  api.put(`/authRoutes/usuarios/${id}`, data).then((res) => res.data);

export const createUsuario = (data) =>
  api.post("/authRoutes/usuarios", data).then((res) => res.data);


// ...agrega más métodos según tus endpoints...

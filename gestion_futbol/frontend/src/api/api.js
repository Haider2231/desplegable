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
  api.post("/auth/register", { nombre, email, password, rol }).then((res) => res.data);

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
  api.get("/establecimientos").then((res) => res.data);


// ...agrega más métodos según tus endpoints...

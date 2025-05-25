import React, { useEffect, useState } from "react";
import Swal from "sweetalert2";
import "../../styles/adminUsersPanel.css";
import { getUsuarios, deleteUsuario, updateUsuario, createUsuario } from "../../api/api";

export default function AdminUsersPanel() {
  const [usuarios, setUsuarios] = useState([]);
  const [loading, setLoading] = useState(true);
  const [editingUser, setEditingUser] = useState(null);
  const [editData, setEditData] = useState({ nombre: "", email: "", rol: "" });
  const [search, setSearch] = useState("");
  const [currentPage, setCurrentPage] = useState(1);
  const usersPerPage = 10;

  // Obtener todos los usuarios
  useEffect(() => {
    setLoading(true);
    getUsuarios()
      .then(data => {
        if (Array.isArray(data)) {
          setUsuarios(data);
        } else if (data.usuarios && Array.isArray(data.usuarios)) {
          setUsuarios(data.usuarios);
        } else {
          setUsuarios([]);
        }
      })
      .catch(() => setUsuarios([]))
      .finally(() => setLoading(false));
  }, []);

  // Eliminar usuario
  const handleDelete = async (id) => {
    const result = await Swal.fire({
      title: "¿Eliminar usuario?",
      text: "Esta acción no se puede deshacer.",
      icon: "warning",
      showCancelButton: true,
      confirmButtonText: "Eliminar",
      cancelButtonText: "Cancelar",
      confirmButtonColor: "#d33",
    });
    if (!result.isConfirmed) return;
    try {
      await deleteUsuario(id);
      setUsuarios(usuarios.filter(u => u.id !== id));
      Swal.fire("Eliminado", "Usuario eliminado correctamente", "success");
    } catch {
      Swal.fire("Error", "No se pudo eliminar el usuario", "error");
    }
  };

  // Editar usuario
  const handleEdit = (user) => {
    setEditingUser(user.id);
    setEditData({ nombre: user.nombre, email: user.email, rol: user.rol });
  };

  const handleEditChange = (e) => {
    setEditData({ ...editData, [e.target.name]: e.target.value });
  };

  const handleEditSave = async (id) => {
    try {
      await updateUsuario(id, editData);
      setUsuarios(usuarios.map(u => u.id === id ? { ...u, ...editData } : u));
      setEditingUser(null);
      Swal.fire("Actualizado", "Usuario actualizado correctamente", "success");
    } catch {
      Swal.fire("Error", "No se pudo actualizar el usuario", "error");
    }
  };

  // Crear usuario
  const handleCreate = async () => {
    const { value: formValues } = await Swal.fire({
      title: "Crear nuevo usuario",
      html:
        '<input id="swal-nombre" class="swal2-input" placeholder="Nombre">' +
        '<input id="swal-email" class="swal2-input" placeholder="Email">' +
        '<input id="swal-password" class="swal2-input" placeholder="Contraseña" type="password">' +
        '<select id="swal-rol" class="swal2-input"><option value="usuario">Usuario</option><option value="propietario">Propietario</option><option value="admin">Admin</option></select>',
      focusConfirm: false,
      preConfirm: () => {
        return {
          nombre: document.getElementById("swal-nombre").value,
          email: document.getElementById("swal-email").value,
          password: document.getElementById("swal-password").value,
          rol: document.getElementById("swal-rol").value,
        };
      },
      confirmButtonText: "Crear",
      showCancelButton: true,
      cancelButtonText: "Cancelar",
    });
    if (!formValues) return;
    try {
      const data = await createUsuario(formValues);
      setUsuarios([...usuarios, data]);
      Swal.fire("Creado", "Usuario creado correctamente", "success");
    } catch (err) {
      Swal.fire("Error", err?.response?.data?.error || "No se pudo crear el usuario", "error");
    }
  };

  // Filtro de búsqueda
  const filteredUsuarios = usuarios.filter(
    u =>
      u.nombre.toLowerCase().includes(search.toLowerCase()) ||
      u.email.toLowerCase().includes(search.toLowerCase()) ||
      u.rol.toLowerCase().includes(search.toLowerCase())
  );

  // Paginación
  const totalPages = Math.ceil(filteredUsuarios.length / usersPerPage);
  const paginatedUsuarios = filteredUsuarios.slice(
    (currentPage - 1) * usersPerPage,
    currentPage * usersPerPage
  );

  const handlePageChange = (page) => {
    if (page < 1 || page > totalPages) return;
    setCurrentPage(page);
  };

  // Barra de paginación
  const Pagination = () => (
    <div style={{ display: "flex", justifyContent: "center", alignItems: "center", margin: "18px 0" }}>
      <button
        onClick={() => handlePageChange(currentPage - 1)}
        disabled={currentPage === 1}
        style={{
          background: "none",
          border: "none",
          color: "#888",
          fontSize: 22,
          cursor: currentPage === 1 ? "not-allowed" : "pointer",
          marginRight: 8
        }}
      >
        &#60;
      </button>
      {[...Array(totalPages)].map((_, idx) => (
        <button
          key={idx + 1}
          onClick={() => handlePageChange(idx + 1)}
          style={{
            background: currentPage === idx + 1 ? "#2962ff" : "none",
            color: currentPage === idx + 1 ? "#fff" : "#aaa",
            border: "none",
            borderRadius: 6,
            fontWeight: 700,
            fontSize: 18,
            width: 36,
            height: 36,
            margin: "0 4px",
            cursor: currentPage === idx + 1 ? "default" : "pointer"
          }}
          disabled={currentPage === idx + 1}
        >
          {idx + 1}
        </button>
      ))}
      <button
        onClick={() => handlePageChange(currentPage + 1)}
        disabled={currentPage === totalPages}
        style={{
          background: "none",
          border: "none",
          color: "#888",
          fontSize: 22,
          cursor: currentPage === totalPages ? "not-allowed" : "pointer",
          marginLeft: 8
        }}
      >
        &#62;
      </button>
    </div>
  );

  // Animación para filas (fade-in con delay)
  const rowAnimation = idx => ({
    animation: `fadeInRow 0.7s ${idx * 0.07}s both`,
    WebkitAnimation: `fadeInRow 0.7s ${idx * 0.07}s both`
  });

  // Animación para tabla (slide-down y blur)
  const tableAnimation = {
    animation: "slideDownTable 0.8s cubic-bezier(.4,2,.6,1)",
    WebkitAnimation: "slideDownTable 0.8s cubic-bezier(.4,2,.6,1)"
  };

  return (
    <div className="admin-users-panel">
      <h2 className="admin-users-title">
        <span role="img" aria-label="admin" style={{ marginRight: 8 }}>
          🛡️
        </span>
        Panel de Usuarios (Admin)
      </h2>
      <div className="admin-users-header">
        <input
          type="text"
          placeholder="Buscar usuario, email o rol..."
          value={search}
          onChange={e => setSearch(e.target.value)}
          className="admin-users-search"
        />
        <button
          className="admin-users-btn"
          onClick={handleCreate}
        >
          <span style={{ fontWeight: 900, fontSize: "1.2em", marginRight: 6 }}>+</span>
          Crear usuario
        </button>
      </div>
      {/* Paginación arriba */}
      {filteredUsuarios.length > usersPerPage && <Pagination />}
      {loading ? (
        <div style={{ textAlign: "center", color: "#388e3c", fontWeight: 600, fontSize: "1.2rem" }}>
          <span style={{ animation: "spin 1.2s linear infinite", display: "inline-block" }}>⚽</span> Cargando usuarios...
          <style>
            {`@keyframes spin { 100% { transform: rotate(360deg); } }`}
          </style>
        </div>
      ) : filteredUsuarios.length === 0 ? (
        <div style={{ textAlign: "center", color: "#d32f2f", fontWeight: 600, fontSize: "1.1rem" }}>
          <span role="img" aria-label="sad" style={{ fontSize: 28, marginRight: 8 }}>😕</span>
          No hay usuarios registrados.
        </div>
      ) : (
        <>
          <table className="admin-users-table" style={tableAnimation}>
            <thead>
              <tr>
                <th>Nombre</th>
                <th>Email</th>
                <th>Rol</th>
                <th>Acciones</th>
              </tr>
            </thead>
            <tbody>
              {paginatedUsuarios.map((u, idx) => (
                <tr
                  key={u.id}
                  className={
                    "admin-users-row" +
                    (editingUser === u.id ? " row-highlight" : "")
                  }
                  style={rowAnimation(idx)}
                >
                  <td>
                    {editingUser === u.id ? (
                      <input
                        name="nombre"
                        value={editData.nombre}
                        onChange={handleEditChange}
                        className="admin-users-input"
                      />
                    ) : (
                      <span style={{ fontWeight: 600 }}>{u.nombre}</span>
                    )}
                  </td>
                  <td>
                    {editingUser === u.id ? (
                      <input
                        name="email"
                        value={editData.email}
                        onChange={handleEditChange}
                        className="admin-users-input"
                      />
                    ) : (
                      <span style={{ color: "#388e3c" }}>{u.email}</span>
                    )}
                  </td>
                  <td>
                    {editingUser === u.id ? (
                      <select
                        name="rol"
                        value={editData.rol}
                        onChange={handleEditChange}
                        className="admin-users-select"
                      >
                        <option value="usuario">Usuario</option>
                        <option value="propietario">Propietario</option>
                        <option value="admin">Admin</option>
                      </select>
                    ) : (
                      <span
                        style={{
                          color:
                            u.rol === "admin"
                              ? "#d32f2f"
                              : u.rol === "propietario"
                              ? "#007991"
                              : "#388e3c",
                          fontWeight: 700,
                          textTransform: "capitalize"
                        }}
                      >
                        {u.rol}
                      </span>
                    )}
                  </td>
                  <td>
                    {editingUser === u.id ? (
                      <>
                        <button
                          className="admin-users-action-btn save"
                          onClick={() => handleEditSave(u.id)}
                        >
                          Guardar
                        </button>
                        <button
                          className="admin-users-action-btn cancel"
                          onClick={() => setEditingUser(null)}
                        >
                          Cancelar
                        </button>
                      </>
                    ) : (
                      <>
                        <button
                          className="admin-users-action-btn edit"
                          onClick={() => handleEdit(u)}
                        >
                          <span role="img" aria-label="edit"></span> Editar
                        </button>
                        <button
                          className="admin-users-action-btn delete"
                          onClick={() => handleDelete(u.id)}
                        >
                          <span role="img" aria-label="delete"></span> Eliminar
                        </button>
                      </>
                    )}
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
          {/* Paginación abajo */}
          {filteredUsuarios.length > usersPerPage && <Pagination />}
        </>
      )}
    </div>
  );
}

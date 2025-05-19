import React from "react";

export default function Footer() {
  return (
    <footer
      className="football-footer-bg"
      style={{
        width: "100vw",
        left: 0,
        position: "relative",
        color: "#fff",
        textAlign: "center",
        fontWeight: 500,
        fontSize: "1.08rem",
        padding: "32px 0 18px 0",
        marginTop: "auto",
        boxShadow: "0 -2px 16px 0 #1b5e2033",
        borderTop: "6px solid #fff",
        zIndex: 10,
        letterSpacing: "0.5px",
        fontFamily: "'Bebas Neue', Impact, Arial, sans-serif",
        minWidth: "100vw",
      }}
    >
      <span style={{ fontSize: "1.3rem", marginRight: 8 }}>🏟️</span>
      © 2025 Universidad Piloto de Colombia. Todos los derechos reservados.
      <br />
      <span
        className="home-footer-small"
        style={{
          color: "#b9ffc6",
          fontSize: "0.98rem",
          fontWeight: 400,
          display: "block",
          marginTop: 6,
          opacity: 0.95,
        }}
      >
        Somos estudiantes de la Universidad Piloto de Colombia, trabajando en
        este proyecto como parte de nuestra formación académica.
      </span>
    </footer>
  );
}

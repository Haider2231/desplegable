import React from "react";
import StyledSection from "../components/Section/StyledSection";

export default function Info() {
  return (
    <StyledSection
      maxWidth={650}
      style={{
        margin: "40px auto",
        background: "linear-gradient(120deg, #e0f7fa 0%, #f7fff7 100%)",
        borderRadius: 18,
        boxShadow: "0 4px 24px #b2f7ef77",
        padding: "2.5rem 2rem",
        border: "2px solid #b2f7ef",
        color: "#007991",
        fontFamily: "inherit",
      }}
    >
      <h2
        style={{
          textAlign: "center",
          fontWeight: 900,
          fontSize: 30,
          marginBottom: 18,
          letterSpacing: 1,
          color: "#007991",
        }}
      >
        ℹ️ ¿Qué es Fútbol Piloto?
      </h2>
      <p style={{ fontSize: 18, lineHeight: 1.7, marginBottom: 18 }}>
        <span style={{ color: "#43a047", fontWeight: 700 }}>Fútbol Piloto</span> es
        una plataforma innovadora creada para facilitar la búsqueda y reserva de
        canchas sintéticas en tu ciudad. Nuestro objetivo es conectar a futboleros
        apasionados, haciendo que la experiencia de jugar sea más accesible,
        divertida y organizada.
      </p>
      <div
        style={{
          background: "#fff",
          borderRadius: 12,
          padding: "1.2rem 1.5rem",
          margin: "24px 0",
          boxShadow: "0 2px 8px #b2f7ef44",
          borderLeft: "6px solid #43e97b",
        }}
      >
        <p style={{ fontSize: 17, margin: 0 }}>
          Ya sea que busques una cancha cercana para jugar con amigos o desees
          organizar un partido, nuestra plataforma está diseñada para hacer todo
          más sencillo, con información actualizada y opciones en tiempo real.
        </p>
      </div>

       <div style={{ textAlign: "center", marginTop: 36 }}>
        <span style={{ fontSize: 18, color: "#007991", fontWeight: 600 }}>
          ¿Quieres ver el manual de usuario?
        </span>
        <br />
        <a
          href="/manual-usuario"
          style={{
            display: "inline-block",
            marginTop: 12,
            padding: "12px 28px",
            background: "linear-gradient(90deg, #43e97b 0%, #38f9d7 100%)",
            color: "#fff",
            fontWeight: 700,
            borderRadius: 8,
            textDecoration: "none",
            fontSize: 17,
            boxShadow: "0 2px 8px #43e97b44",
            transition: "background 0.2s, color 0.2s",
            letterSpacing: 1,
          }}
        >
          📖 Ver Manual de Usuario
        </a>
      </div>
      <p style={{ fontSize: 18, lineHeight: 1.7 }}>
        ¿Tienes alguna pregunta, sugerencia o deseas obtener más información?{" "}
        <br />
        <span style={{ color: "#388e3c", fontWeight: 700 }}>
          ¡Estamos aquí para ayudarte!
        </span>
      </p>
      <div
        style={{
          background: "#f7fff7",
          borderRadius: 10,
          padding: "1rem 1.5rem",
          margin: "24px 0 0 0",
          boxShadow: "0 2px 8px #b2f7ef22",
          borderLeft: "5px solid #43e97b",
        }}
      >
        <p style={{ fontSize: 17, margin: 0 }}>
          <b>Contacto:</b>
          <br />
          Correo electrónico:{" "}
          <a
            href="mailto:santiago-chavez@upc.edu.co"
            style={{
              color: "#007991",
              fontWeight: 600,
            }}
          >
            santiago-chavez@upc.edu.co
          </a>
          <br />
          Teléfono:{" "}
          <a
            href="tel:+573223691238"
            style={{
              color: "#007991",
              fontWeight: 600,
            }}
          >
            +57 322 369 1238
          </a>
        </p>
      </div>



      <div style={{ textAlign: "center", marginTop: 32 }}>
        <span
          style={{
            fontSize: 32,
            color: "#43e97b",
            fontWeight: 900,
            letterSpacing: 2,
            textShadow: "0 2px 8px #b2f7ef55",
          }}
        >
          #ReservaTuCancha #FútbolPiloto
        </span>
      </div>
     
    </StyledSection>
  );
}
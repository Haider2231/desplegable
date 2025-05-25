import React from "react";
import StyledSection from "../components/Section/StyledSection";

// Diseño motivacional y visual para la comunidad
export default function Community() {
  return (
    <StyledSection>
      <h2 className="styled-section-title">
        🤝 ¡Únete a la Comunidad Fútbol Piloto!
      </h2>
      <p className="styled-section-p">
        En{" "}
        <span className="styled-section-highlight">Fútbol Piloto</span>
        {""} creemos que el fútbol es mucho más que un deporte: es una pasión que
        une, inspira y crea lazos de amistad.
      </p>
      <div className="styled-section-box">
        <p>
          ¿Buscas un equipo para jugar? ¿Quieres conocer nuevos amigos futboleros?
          ¿Te gustaría organizar partidos y compartir tu pasión? <br />
          <b>¡Este es tu espacio!</b> Aquí puedes encontrar compañeros de juego,
          organizar partidos y compartir experiencias, anécdotas y consejos.
        </p>
      </div>
      <p className="styled-section-p">
        <span className="styled-section-success">
          ¡Juntos somos más fuertes!
        </span>{" "}
        Comparte, conecta y vive el fútbol como nunca antes. <br />
        Pronto podrás participar en nuestro foro y dejar tus mensajes para la
        comunidad.
      </p>
      <div className="styled-section-footer">
        <span className="styled-section-hashtag">
          #ComunidadFútbolPiloto
        </span>
      </div>
      {/* Aquí puedes agregar un foro o lista de mensajes */}
    </StyledSection>
  );
}
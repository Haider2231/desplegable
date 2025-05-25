import React from "react";
import StyledSection from "../components/Section/StyledSection";

// Mejora visual y motivacional para la sección "Sobre nosotros"
export default function About() {
  return (
    <StyledSection>
      <h2 className="styled-section-title">
        ⚽ Sobre nosotros
      </h2>
      <p className="styled-section-p">
        Somos estudiantes de sexto semestre de{" "}
        <b>Ingeniería de Sistemas</b> en la <b>Universidad Piloto de Colombia</b>,
        apasionados por la tecnología, el trabajo en equipo y, por supuesto, el
        fútbol.
      </p>
      <p className="styled-section-p">
        <span className="styled-section-highlight">
          Fútbol Piloto
        </span>{" "}
        nace como parte de nuestro proceso de aprendizaje en la materia de{" "}
        <b>Desarrollo Web</b>, con el propósito de crear una plataforma funcional,
        atractiva e interactiva que facilite la búsqueda y reserva de canchas
        sintéticas.
      </p>
      <div className="styled-section-box">
        <p>
          <b>¿Por qué lo hacemos?</b> <br />
          Porque creemos que la tecnología puede unir comunidades, fomentar el
          deporte y hacer la vida más fácil. Queremos que más personas vivan la
          pasión del fútbol, encuentren amigos y creen recuerdos inolvidables en
          la cancha.
        </p>
      </div>
      <p className="styled-section-p">
        Este proyecto refleja nuestro compromiso con la innovación y nuestra
        motivación por seguir aprendiendo y creando soluciones útiles para las
        personas. <br />
        <span className="styled-section-success">
          ¡Gracias por ser parte de esta comunidad futbolera digital!
        </span>
      </p>
      <div className="styled-section-footer">
        <span className="styled-section-hashtag">
          #ViveElFútbol #FútbolPiloto
        </span>
      </div>
    </StyledSection>
  );
}
import React from "react";
import "../../styles/styledSection.css"; // Corrige la ruta al archivo CSS

export default function StyledSection({ children, maxWidth = 700 }) {
  return (
    <div className="styled-section" style={{ maxWidth }}>
      {children}
    </div>
  );
}

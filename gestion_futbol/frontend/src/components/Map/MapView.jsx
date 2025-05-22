import React, { useEffect, useRef } from "react";

export default function MapView({ canchas }) {
  const mapRef = useRef(null);
  const infoWindowRef = useRef(null);

  useEffect(() => {
    // Mensaje de depuración claro
    if (!Array.isArray(canchas) || canchas.length === 0) {
      console.warn("No se recibieron canchas para mostrar en el mapa.");
    } else {
      console.log("Canchas recibidas en MapView:", canchas);
    }

    // Cargar Google Maps solo una vez
    if (!window.google || !window.google.maps) {
      if (!document.getElementById("google-maps-script")) {
        const script = document.createElement("script");
        script.id = "google-maps-script";
        script.src =
          "https://maps.googleapis.com/maps/api/js?key=AIzaSyAYDCSXtmUI-KR3qJ29oRdemNUpSIb-UDQ&libraries=places";
        script.async = true;
        script.onload = initMap;
        document.body.appendChild(script);
      } else {
        document.getElementById("google-maps-script").addEventListener("load", initMap);
      }
    } else {
      initMap();
    }

    function markerPopupHtml(cancha) {
      const token = localStorage.getItem("token");
      let content = `<div style="max-width: 300px;">`;
      if (cancha.imagenes && cancha.imagenes.length > 0) {
        content += `<div>`;
        cancha.imagenes.forEach((img) => {
          content += `<img src="${img}" alt="Imagen de la cancha" style="width:100%; height:auto; max-height:150px; margin-bottom:10px;">`;
        });
        content += `</div>`;
      }
      content += `<strong>${cancha.nombre}</strong><br>`;
      content += cancha.direccion ? `${cancha.direccion}<br>` : "";
      content += `<strong>Teléfono:</strong> ${cancha.telefono_contacto}<br>`;
      if (token) {
        content += `<button onclick="window.location.href='/reservar?cancha_id=${cancha.cancha_id}'"
          style="margin-top: 10px; padding: 5px 10px; background-color: #007BFF; color: white; border: none; border-radius: 5px; cursor: pointer;">
          Reservar
        </button>`;
      } else {
        content += `<button onclick="window.location.href='/login'"
          style="margin-top: 10px; padding: 5px 10px; background-color: #388e3c; color: white; border: none; border-radius: 5px; cursor: pointer;">
          Inicia sesión para reservar
        </button>`;
      }
      content += `</div>`;
      return content;
    }

    function initMap() {
      if (!window.google || !window.google.maps) return;
      const ubicacion = { lat: 4.6482837, lng: -74.2478946 };
      const map = new window.google.maps.Map(mapRef.current, {
        center: ubicacion,
        zoom: 14,
      });
      infoWindowRef.current = new window.google.maps.InfoWindow();

      if (Array.isArray(canchas) && canchas.length > 0) {
        let markerCount = 0;
        canchas.forEach((cancha) => {
          if (!cancha.lat || !cancha.lng) return;
          markerCount++;
          const marker = new window.google.maps.Marker({
            map,
            position: { lat: parseFloat(cancha.lat), lng: parseFloat(cancha.lng) },
          });
          marker.addListener("click", () => {
            infoWindowRef.current.setContent(markerPopupHtml(cancha));
            infoWindowRef.current.open(map, marker);
          });
        });
        if (markerCount === 0) {
          console.warn("No se pudo crear ningún marcador: las canchas no tienen lat/lng válidos.");
        } else {
          console.log(`Se crearon ${markerCount} marcadores en el mapa.`);
        }
      } else {
        console.warn("No hay canchas para mostrar en el mapa.");
      }
    }
    // eslint-disable-next-line
  }, [canchas]);

  return (
    <div>
      {/* Mensaje visible solo si realmente no hay canchas */}
      {Array.isArray(canchas) && canchas.length === 0 && (
        <div style={{ color: "red", margin: 10 }}>
          No hay canchas para mostrar en el mapa.
        </div>
      )}
      <div ref={mapRef} style={{ height: 500, width: "100%" }} />
    </div>
  );
}
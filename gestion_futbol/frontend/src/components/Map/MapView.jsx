import React, { useEffect, useRef } from "react";

// Agrega esta función fuera del componente MapView
function markerPopupHtml(cancha) {
  const token = localStorage.getItem("token");
  let content = `<div style="max-width: 300px;">`;

  // Mostrar solo los campos relevantes para depuración

  // Mostrar imagen del establecimiento si existe
  if (cancha.imagen_url) {
    // Quita doble slash si existe
    let imgUrl = cancha.imagen_url.replace('https://canchassinteticas.site//', 'https://canchassinteticas.site/');
    content += `<img src="${imgUrl}" alt="Imagen del establecimiento" style="width:100%; height:auto; max-height:150px; margin-bottom:10px; border-radius:8px;" onerror="this.onerror=null;this.src='https://via.placeholder.com/300x150?text=Sin+imagen';">`;
  }

  // Mostrar imágenes de la cancha si existen
  if (cancha.imagenes && Array.isArray(cancha.imagenes) && cancha.imagenes.length > 0 && cancha.imagenes[0]) {
    content += `<div>`;
    cancha.imagenes.forEach((img) => {
      if (img) {
        content += `<img src="${img}" alt="Imagen de la cancha" style="width:100%; height:auto; max-height:150px; margin-bottom:10px;">`;
      }
    });
    content += `</div>`;
  }

  content += `<strong>${cancha.nombre}</strong><br>`;
  // Mostrar dirección del establecimiento si existe, si no, la de la cancha
  if (cancha.direccion) {
    content += `${cancha.direccion}<br>`;
  } else if (cancha.establecimiento_direccion) {
    content += `${cancha.establecimiento_direccion}<br>`;
  }
  content += `<strong>Teléfono:</strong> ${cancha.telefono_contacto || cancha.telefono || ""}<br>`;
  // Asegúrate de pasar el id del establecimiento como string y que no sea undefined
  const establecimientoId =
    (cancha.establecimiento_id !== undefined && cancha.establecimiento_id !== null)
      ? String(cancha.establecimiento_id)
      : "";

  // Usar cancha.id si existe, si no, cancha.cancha_id, si no, establecimiento_id
  let reservaHref = "/reservar";
  if (cancha.id) {
    reservaHref = `/reservar?cancha_id=${cancha.id}`;
  } else if (cancha.cancha_id) {
    reservaHref = `/reservar?cancha_id=${cancha.cancha_id}`;
  } else if (cancha.establecimiento_id) {
    reservaHref = `/reservar?establecimiento_id=${cancha.establecimiento_id}`;
  }

  // Depuración: muestra el href de reserva
  
  if (token) {
    content += `<button onclick="window.location.href='${reservaHref}'"
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

export default function MapView({ establecimientos }) {
  const mapRef = useRef(null);
  const infoWindowRef = useRef(null);

  // Cargar Google Maps solo una vez globalmente
  useEffect(() => {
    // Solo carga el script si no existe
    if (!window.google || !window.google.maps) {
      if (!document.getElementById("google-maps-script")) {
        const script = document.createElement("script");
        script.id = "google-maps-script";
        script.src =
          "https://maps.googleapis.com/maps/api/js?key=AIzaSyAYDCSXtmUI-KR3qJ29oRdemNUpSIb-UDQ&libraries=places";
        script.async = true;
        document.body.appendChild(script);
      }
    }
  }, []);

  // Inicializa el mapa y los marcadores cuando Google Maps esté listo y cambien los establecimientos
  useEffect(() => {
    if (!Array.isArray(establecimientos) || establecimientos.length === 0) return;

    function waitForGoogleMaps(cb) {
      if (window.google && window.google.maps) {
        cb();
      } else {
        setTimeout(() => waitForGoogleMaps(cb), 200);
      }
    }

    waitForGoogleMaps(() => {
      if (mapRef.current && mapRef.current._google_map_instance) {
        mapRef.current.innerHTML = "";
        delete mapRef.current._google_map_instance;
      }

      let center = { lat: 4.6482837, lng: -74.2478946 };
      const firstWithCoords = establecimientos.find(e => e.lat && e.lng);
      if (firstWithCoords) {
        center = { lat: parseFloat(firstWithCoords.lat), lng: parseFloat(firstWithCoords.lng) };
      }

      const map = new window.google.maps.Map(mapRef.current, {
        center,
        zoom: 13,
      });
      mapRef.current._google_map_instance = map;
      infoWindowRef.current = new window.google.maps.InfoWindow();

      establecimientos.forEach((est) => {
        if (!est.lat || !est.lng) return;
        if (est.canchas && Array.isArray(est.canchas)) {
          est.canchas.forEach((cancha) => {
            const canchaWithEst = {
              ...cancha,
              imagen_url: est.imagen_url,
              establecimiento_direccion: est.direccion,
              telefono: est.telefono,
              establecimiento_id: est.id, // <-- asegúrate de incluir esto SIEMPRE
            };
            // Agrega este log para depuración:
            console.log("canchaWithEst:", canchaWithEst);
            const marker = new window.google.maps.Marker({
              map,
              position: { lat: parseFloat(est.lat), lng: parseFloat(est.lng) },
              title: cancha.nombre
            });
            marker.addListener("click", () => {
              infoWindowRef.current.setContent(markerPopupHtml(canchaWithEst));
              infoWindowRef.current.open(map, marker);
            });
          });
        } else {
          // Si no, muestra el popup del establecimiento
          const marker = new window.google.maps.Marker({
            map,
            position: { lat: parseFloat(est.lat), lng: parseFloat(est.lng) },
            title: est.nombre
          });
          marker.addListener("click", () => {
            infoWindowRef.current.setContent(markerPopupHtml(est));
            infoWindowRef.current.open(map, marker);
          });
        }
      });
    });
    // eslint-disable-next-line
  }, [establecimientos]);

  return (
    <div>
      <div ref={mapRef} style={{ height: 500, width: "100%", background: "#e0f7fa" }} />
      {/* No mostrar panel debajo del mapa */}
    </div>
  );
}
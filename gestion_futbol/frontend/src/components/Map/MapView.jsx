import React, { useEffect, useRef } from "react";

// Agrega esta función fuera del componente MapView
function markerPopupHtml(cancha) {
  const token = localStorage.getItem("token");
  let rol = null;
  if (token) {
    try {
      const base64Url = token.split(".")[1];
      let base64 = base64Url.replace(/-/g, "+").replace(/_/g, "/");
      while (base64.length % 4) base64 += "=";
      const payload = JSON.parse(atob(base64));
      rol = payload.rol;
    } catch {}
  }

  let content = `<div style="max-width:340px;background:linear-gradient(120deg,#e0ffe8 0%,#f7fff7 100%);border-radius:18px;box-shadow:0 6px 24px #43e97b44,0 1.5px 8px #43e97b33;padding:20px 18px 14px 18px;font-family:'Poppins',Arial,sans-serif;color:#222;position:relative;border:2px solid #43e97b55;">`;

  // Imagen de la cancha si existe, si no, imagen del establecimiento si existe, si no, placeholder
  if (cancha.imagenes && Array.isArray(cancha.imagenes) && cancha.imagenes.length > 0 && cancha.imagenes[0]) {
    content += `<div style="width:100%;margin-bottom:12px;border-radius:14px;overflow:hidden;background:#fff;box-shadow:0 2px 8px #43e97b22;display:flex;align-items:center;justify-content:center;min-height:90px;">
      <img src="${cancha.imagenes[0].startsWith("http") ? cancha.imagenes[0] : `https://canchassinteticas.site${cancha.imagenes[0]}`}" alt="Imagen de la cancha" style="width:100%;height:auto;max-height:120px;object-fit:cover;border-radius:14px;background:#f7fff7;" onerror="this.src='https://cdn-icons-png.flaticon.com/512/861/861512.png';"/>
    </div>`;
  } else if (cancha.imagen_url) {
    content += `<div style="width:100%;margin-bottom:12px;border-radius:14px;overflow:hidden;background:#fff;box-shadow:0 2px 8px #43e97b22;display:flex;align-items:center;justify-content:center;min-height:90px;">
      <img src="${cancha.imagen_url}" alt="Imagen del establecimiento" style="width:100%;height:auto;max-height:120px;object-fit:cover;border-radius:14px;background:#f7fff7;" onerror="this.src='https://cdn-icons-png.flaticon.com/512/861/861512.png';"/>
    </div>`;
  } else {
    content += `<div style="width:100%;margin-bottom:12px;border-radius:14px;background:#f7fff7;min-height:90px;display:flex;align-items:center;justify-content:center;box-shadow:0 2px 8px #43e97b22;">
      <img src="https://cdn-icons-png.flaticon.com/512/861/861512.png" alt="Sin imagen" style="width:80px;height:80px;opacity:0.5;object-fit:contain;"/>
    </div>`;
  }

  // Nombre y dirección
  content += `<div style="margin-bottom:8px;">
    <span style="font-weight:900;font-size:20px;color:#007991;letter-spacing:0.5px;display:block;margin-bottom:2px;text-shadow:0 1px 4px #43e97b22;">${cancha.nombre}</span>`;
  if (cancha.direccion) {
    content += `<span style="color:#388e3c;font-size:15px;font-weight:500;display:block;margin-bottom:2px;">${cancha.direccion}</span>`;
  }
  if (cancha.hora_apertura && cancha.hora_cierre) {
    // Formatea la hora a AM/PM
    function toAmPm(hora) {
      if (!hora) return "";
      const [h, m] = hora.split(":");
      let hour = parseInt(h, 10);
      const min = m || "00";
      const ampm = hour >= 12 ? "PM" : "AM";
      hour = hour % 12 || 12;
      return `${hour}:${min} ${ampm}`;
    }
    content += `<div style="display:flex;align-items:center;gap:8px;margin:8px 0 2px 0;background:#e0ffe8;border-radius:8px;padding:5px 12px;font-size:15px;font-weight:600;color:#007991;box-shadow:0 1px 4px #43e97b22;">
      <span style="font-weight:700;color:#388e3c;">🕒 Horario:</span>
      <span>${toAmPm(cancha.hora_apertura)} - ${toAmPm(cancha.hora_cierre)}</span>
    </div>`;
  }
  content += `</div>`;

  // Teléfono
  content += `<div style="font-size:15px;color:#555;margin-bottom:8px;display:flex;align-items:center;gap:6px;">
    <span style="font-weight:700;color:#007991;">📞 Teléfono:</span>
    <a href="tel:${cancha.telefono_contacto || cancha.telefono || ""}" style="color:#388e3c;text-decoration:underline;font-weight:600;">
      ${cancha.telefono_contacto || cancha.telefono || ""}
    </a>
  </div>`;

  // Botón solo si NO es admin
  if (rol !== "admin") {
    // Usar cancha.id si existe, si no, cancha.cancha_id, si no, establecimiento_id
    let reservaHref = "/reservar";
    if (cancha.id) {
      reservaHref = `/reservar?cancha_id=${cancha.id}`;
    } else if (cancha.cancha_id) {
      reservaHref = `/reservar?cancha_id=${cancha.cancha_id}`;
    } else if (cancha.establecimiento_id) {
      reservaHref = `/reservar?establecimiento_id=${cancha.establecimiento_id}`;
    }
    if (token) {
      content += `<div style="margin-top:14px;text-align:center;">
        <button onclick="window.location.href='${reservaHref}'"
          style="margin-top:0;padding:10px 28px;background:linear-gradient(90deg,#388e3c 0%,#43a047 100%);color:#fff;border:none;border-radius:10px;font-weight:800;font-size:16px;cursor:pointer;box-shadow:0 2px 8px #43e97b33;transition:background 0.18s;letter-spacing:0.5px;">
          <span style="margin-right:7px;">🗓️</span>Ver horarios y reservar
        </button>
      </div>`;
    } else {
      content += `<div style="margin-top:14px;text-align:center;">
        <button onclick="window.location.href='/login'"
          style="margin-top:0;padding:10px 28px;background:linear-gradient(90deg,#43a047 0%,#388e3c 100%);color:#fff;border:none;border-radius:10px;font-weight:800;font-size:16px;cursor:pointer;box-shadow:0 2px 8px #43e97b33;transition:background 0.18s;letter-spacing:0.5px;">
          <span style="margin-right:7px;">🔑</span>Inicia sesión para reservar
        </button>
      </div>`;
    }
  }

  content += `</div>`;

  // Animación CSS para el popup
  content = `
    <style>
      @keyframes popupFadeIn {
        0% { opacity: 0; transform: scale(0.85) translateY(30px);}
        100% { opacity: 1; transform: scale(1) translateY(0);}
      }
      .popup-animated {
        animation: popupFadeIn 0.5s cubic-bezier(.23,1.12,.62,1.01) both;
        transition: box-shadow 0.2s;
        box-shadow: 0 8px 32px #43e97b55, 0 2px 8px #43e97b33;
      }
      .popup-animated:hover {
        box-shadow: 0 12px 40px #43e97b77, 0 4px 16px #43e97b44;
      }
      .popup-img-anim {
        animation: popupFadeIn 0.7s cubic-bezier(.23,1.12,.62,1.01) both;
      }
    </style>
  ` + content;

  // Agrega la clase animada al contenedor principal
  content = content.replace(
    /^<div /,
    `<div class="popup-animated" `
  );
  // Agrega la clase animada a la imagen principal si existe
  content = content.replace(
    /<img /,
    `<img class="popup-img-anim" `
  );

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
        script.defer = true;
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
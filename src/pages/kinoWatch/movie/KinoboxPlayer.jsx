import React, { useEffect, useRef } from "react";
import styles from "./movie.module.scss";
function KinoboxPlayer({ kpId, posterUrl }) {
  const containerRef = useRef(null);
  const iframeRef = useRef(null);

  // ИНИЦИАЛИЗАЦИЯ ПЛЕЕРА
  useEffect(() => {
    const script = document.createElement("script");
    script.src = "https://kinobox.tv/kinobox.min.js";
    script.async = true;
    document.body.appendChild(script);

    script.onload = () => {
      if (containerRef.current) {
        window.kbox(containerRef.current, {
          search: { kinopoisk: kpId },
          menu: { enabled: false },
          players: {
            alloha: {
              enable: true,
              position: 1,
            },
          },
          params: {
            all: { poster: posterUrl, hide_selectors: true, autoplay: 0 },
          },
        });

        const iframe = containerRef.current.querySelector("iframe");
        iframeRef.current = iframe;
      }
    };

    return () => {
      try {
        document.body.removeChild(script);
      } catch (e) {}
    };
  }, [kpId]);


  return <div ref={containerRef} className={styles.kinobox_player}></div>;
}

export default KinoboxPlayer;

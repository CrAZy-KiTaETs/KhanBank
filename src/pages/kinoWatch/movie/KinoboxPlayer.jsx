import React, { useEffect, useRef } from "react";
import styles from "./movie.module.scss"
function KinoboxPlayer({ kpId, posterUrl, host }) {
  const containerRef = useRef(null);
  const iframeRef = useRef(null);

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
                position: 1
            },
        },
          params: {
            all: { poster: posterUrl, hide_selectors: true, autoplay: 0 },
          },
        });

        // Найти iframe после загрузки плеера
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

  // Функция для постановки на паузу
  const pausePlayer = () => {
    if (iframeRef.current) {
      iframeRef.current.contentWindow.postMessage(
        JSON.stringify({ event: "pause" }),
        "*"
      );
    }
  };

  return (
      <div ref={containerRef} className={styles.kinobox_player}></div>
  );
}

export default KinoboxPlayer;

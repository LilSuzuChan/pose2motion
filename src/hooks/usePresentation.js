import { useEffect, useState } from 'react';

export function usePresentation() {
  const [presenting, setPresenting] = useState(false);

  async function exitPresentation() {
    setPresenting(false);
    if (document.fullscreenElement) await document.exitFullscreen();
  }

  async function enterPresentation() {
    setPresenting(true);
    try {
      await document.documentElement.requestFullscreen();
    } catch {}
  }

  useEffect(() => {
    const onFullscreenChange = () => {
      if (!document.fullscreenElement) setPresenting(false);
    };
    const onKeyDown = (event) => {
      if (event.key === 'Escape') setPresenting(false);
    };
    document.addEventListener('fullscreenchange', onFullscreenChange);
    document.addEventListener('keydown', onKeyDown);
    return () => {
      document.removeEventListener('fullscreenchange', onFullscreenChange);
      document.removeEventListener('keydown', onKeyDown);
    };
  }, []);

  return { presenting, enterPresentation, exitPresentation };
}

export function bindPresentation({ stage, button, isRecording }) {
  async function exit() {
    document.body.classList.remove('presenting');
    if (document.fullscreenElement) await document.exitFullscreen();
  }

  button.addEventListener('click', async () => {
    document.body.classList.add('presenting');
    try {
      await document.documentElement.requestFullscreen();
    } catch {
      // Keep the CSS presentation mode when native fullscreen is unavailable.
    }
  });

  document.addEventListener('fullscreenchange', () => {
    if (!document.fullscreenElement) document.body.classList.remove('presenting');
  });
  document.addEventListener('keydown', (event) => {
    if (event.key === 'Escape') exit();
  });
  stage.addEventListener('click', () => {
    if (document.body.classList.contains('presenting') && !isRecording()) exit();
  });
}

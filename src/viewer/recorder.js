const WIDTH = 1280;
const HEIGHT = 720;
const DURATION_MS = 10_000;
const MIME_TYPES = ['video/webm;codecs=vp9', 'video/webm;codecs=vp8', 'video/webm'];

export function drawRecordingFrame(context, source, mirror) {
  const scale = Math.min(WIDTH / source.width, HEIGHT / source.height);
  const width = source.width * scale;
  const height = source.height * scale;

  context.fillStyle = '#000';
  context.fillRect(0, 0, WIDTH, HEIGHT);
  context.save();
  if (mirror) {
    context.translate(WIDTH, 0);
    context.scale(-1, 1);
  }
  context.drawImage(source, (WIDTH - width) / 2, (HEIGHT - height) / 2, width, height);
  context.restore();
}

function downloadVideo(chunks, type) {
  const url = URL.createObjectURL(new Blob(chunks, { type }));
  const link = document.createElement('a');
  link.href = url;
  link.download = 'dome-motion.webm';
  link.click();
  setTimeout(() => URL.revokeObjectURL(url), 60_000);
}

export function createVideoRecorder({
  canvas,
  isMirrored,
  onStateChange,
  onProgress,
  onComplete,
  onError,
}) {
  let recording = false;
  let disposed = false;
  let cancelRecording = () => {};
  const supported =
    typeof MediaRecorder !== 'undefined' && typeof canvas.captureStream === 'function';

  function start() {
    if (recording || disposed) return;
    const type = supported && MIME_TYPES.find((type) => MediaRecorder.isTypeSupported(type));
    if (!type) {
      onError('このブラウザではWebM保存に対応していません');
      return;
    }

    const output = document.createElement('canvas');
    output.width = WIDTH;
    output.height = HEIGHT;
    const context = output.getContext('2d');
    if (!context) {
      onError('録画用の描画領域を作成できません。');
      return;
    }

    let stream;
    let recorder;
    let frame;
    let timer;
    const chunks = [];
    let failed = false;

    function cleanup() {
      clearTimeout(timer);
      cancelAnimationFrame(frame);
      stream?.getTracks().forEach((track) => track.stop());
      recording = false;
      cancelRecording = () => {};
      if (!disposed) onStateChange(false);
    }

    function copyFrame(startedAt) {
      drawRecordingFrame(context, canvas, isMirrored());
      onProgress(Math.min(10, Math.floor((performance.now() - startedAt) / 1000)));
      frame = requestAnimationFrame(() => copyFrame(startedAt));
    }

    try {
      stream = output.captureStream(30);
      recorder = new MediaRecorder(stream, { mimeType: type, videoBitsPerSecond: 6_000_000 });
      recorder.ondataavailable = (event) => {
        if (event.data.size) chunks.push(event.data);
      };
      recorder.onerror = () => {
        failed = true;
        cleanup();
        if (!disposed) onError('録画に失敗しました。');
      };
      recorder.onstop = () => {
        cleanup();
        if (failed || disposed) return;
        downloadVideo(chunks, type);
        onComplete();
      };
      recorder.start();
      cancelRecording = () => {
        failed = true;
        if (recorder.state === 'recording') recorder.stop();
        cleanup();
      };
      recording = true;
      onStateChange(true);
      copyFrame(performance.now());
      timer = setTimeout(() => {
        if (recorder.state === 'recording') recorder.stop();
      }, DURATION_MS);
    } catch (error) {
      failed = true;
      if (recorder?.state === 'recording') recorder.stop();
      cleanup();
      onError(`録画を開始できません: ${error.message}`);
    }
  }

  return {
    supported,
    get recording() {
      return recording;
    },
    start,
    dispose() {
      disposed = true;
      cancelRecording();
    },
  };
}

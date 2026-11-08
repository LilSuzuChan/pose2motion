import { loadRobotExpressive } from './characters/robot-expressive.js';
import { loadHadaly } from './characters/hadaly.js';
import { createViewer } from './viewer/scene.js';
import { createCharacterPlayer, REST_MOTION } from './viewer/character-player.js';
import { createVideoRecorder } from './viewer/recorder.js';
import { bindPresentation } from './viewer/presentation.js';

const controls = Object.fromEntries(
  [
    'stage',
    'status',
    'character',
    'characterNote',
    'motion',
    'speed',
    'speedValue',
    'size',
    'angle',
    'height',
    'mirror',
    'pause',
    'reset',
    'present',
    'record',
  ].map((id) => [id, document.getElementById(id)]),
);

let viewer;
try {
  viewer = createViewer(controls.stage);
} catch (error) {
  controls.status.textContent =
    'WebGLを開始できません。ブラウザのハードウェアアクセラレーションを確認してください。';
  throw error;
}

const player = createCharacterPlayer(viewer.pivot, {
  'robot-expressive': loadRobotExpressive,
  hadaly: loadHadaly,
});
let paused = false;
let loading = false;

function setStatus(message) {
  controls.status.textContent = message;
}

function updateAvailability() {
  controls.character.disabled = loading || recorder.recording;
  controls.record.disabled =
    loading || recorder.recording || !player.character || !recorder.supported;
  controls.motion.disabled = controls.pause.disabled = !player.character;
}

const recorder = createVideoRecorder({
  canvas: viewer.canvas,
  isMirrored: () => controls.mirror.checked,
  onStateChange: (recording) => {
    if (!recording) controls.record.textContent = '10秒の動画を保存（WebM）';
    updateAvailability();
  },
  onProgress: (seconds) => {
    controls.record.textContent = `録画中… ${seconds} / 10秒`;
  },
  onComplete: () => setStatus('動画を保存しました · 1280×720 / 黒背景'),
  onError: setStatus,
});

function applySettings() {
  viewer.setDisplay({
    size: Number(controls.size.value),
    angle: Number(controls.angle.value),
    height: Number(controls.height.value),
    mirror: controls.mirror.checked,
  });

  const speed = Number(controls.speed.value);
  player.setPlayback({ speed, paused });
  controls.speedValue.value = `${speed.toFixed(1)}×`;
}

async function selectCharacter() {
  if (recorder.recording) return;
  loading = true;
  updateAvailability();
  setStatus('キャラクターを読み込み中…');

  try {
    const character = await player.select(controls.character.value);
    if (!character) return;
    controls.motion.replaceChildren(new Option('静止（外見確認）', REST_MOTION));

    for (const clip of character.animations) {
      controls.mot
      ion.add(new Option(clip.name, clip.name));
    }

    controls.motion.value = character.defaultMotion;
    controls.characterNote.textContent = character.description;

    setStatus(`${character.label} · ${character.animations.length}種類のモーション`);
    applySettings();
  } catch (error) {
    console.error(error);
    setStatus('モデルの読込に失敗しました。READMEの起動方法を確認してください。');

    if (player.character) controls.character.value = player.character.id;
  } finally {
    loading = false;
    updateAvailability();
  }
}

controls.character.addEventListener('change', selectCharacter);
controls.motion.addEventListener('change', () => player.play(controls.motion.value));

for (const id of ['speed', 'size', 'angle', 'height', 'mirror']) {
  controls[id].addEventListener('input', applySettings);
}

controls.pause.addEventListener('click', () => {
  paused = !paused;
  controls.pause.textContent = paused ? '再生' : '一時停止';
  applySettings();
});

controls.reset.addEventListener('click', () => {
  for (const [id, value] of Object.entries({ speed: 1, size: 1, angle: 0, height: 0 })) {
    controls[id].value = value;
  }
  controls.mirror.checked = false;
  applySettings();
});

controls.record.addEventListener('click', recorder.start);
bindPresentation({
  stage: controls.stage,
  button: controls.present,
  isRecording: () => recorder.recording,
});

viewer.start(player.update);
selectCharacter();

import { useEffect, useRef, useState } from 'react';
import { characterLoaders } from '../characters/index.js';
import { createViewer } from '../viewer/scene.js';
import { createCharacterPlayer } from '../viewer/character-player.js';
import { createVideoRecorder } from '../viewer/recorder.js';

const DEFAULT_SETTINGS = { speed: 1, size: 1, angle: 0, height: 0, mirror: false };

export function useDomeViewer(stageRef) {
  const runtime = useRef(null);
  const settingsRef = useRef(DEFAULT_SETTINGS);
  const [ready, setReady] = useState(false);
  const [characterId, setCharacterId] = useState('robot-expressive');
  const [character, setCharacter] = useState(null);
  const [motion, setMotion] = useState('');
  const [settings, setSettings] = useState(DEFAULT_SETTINGS);
  const [paused, setPaused] = useState(false);
  const [loading, setLoading] = useState(true);
  const [recording, setRecording] = useState(false);
  const [recordingSeconds, setRecordingSeconds] = useState(0);
  const [canRecord, setCanRecord] = useState(false);
  const [status, setStatus] = useState('モデルを読み込み中…');

  useEffect(() => {
    let viewer;
    try {
      viewer = createViewer(stageRef.current);
    } catch (error) {
      console.error(error);
      setLoading(false);
      setStatus(
        'WebGLを開始できません',
      );
      return;
    }

    let disposed = false;
    const player = createCharacterPlayer(viewer.pivot, characterLoaders);
    const recorder = createVideoRecorder({
      canvas: viewer.canvas,
      isMirrored: () => settingsRef.current.mirror,
      onStateChange: (value) => {
        if (!disposed) setRecording(value);
      },
      onProgress: (seconds) => {
        if (!disposed) setRecordingSeconds(seconds);
      },
      onComplete: () => {
        if (!disposed) setStatus('動画を保存しました');
      },
      onError: (message) => {
        if (!disposed) setStatus(message);
      },
    });
    runtime.current = { viewer, player, recorder };
    viewer.start(player.update);
    setCanRecord(recorder.supported);
    setReady(true);

    return () => {
      disposed = true;
      recorder.dispose();
      viewer.dispose();
      player.dispose();
      runtime.current = null;
    };
  }, [stageRef]);

  useEffect(() => {
    if (!ready || !runtime.current) return;
    const { player } = runtime.current;
    let cancelled = false;
    setLoading(true);
    setStatus('キャラクターを読み込み中…');

    player
      .select(characterId)
      .then((next) => {
        if (cancelled || !next) return;
        setCharacter(next);
        setMotion(next.defaultMotion);
        setStatus(`${next.label} · ${next.animations.length}種類のモーション`);
      })
      .catch((error) => {
        if (cancelled) return;
        console.error(error);
        setStatus('モデルの読込に失敗しました。');
        if (player.character) setCharacterId(player.character.id);
      })
      .finally(() => {
        if (!cancelled) setLoading(false);
      });

    return () => {
      cancelled = true;
    };
  }, [characterId, ready]);

  useEffect(() => {
    settingsRef.current = settings;
    if (!ready || !runtime.current) return;
    runtime.current.viewer.setDisplay(settings);
    runtime.current.player.setPlayback({ speed: settings.speed, paused });
  }, [settings, paused, ready]);

  return {
    characterId,
    character,
    motion,
    settings,
    paused,
    loading,
    recording,
    recordingSeconds,
    canRecord,
    status,
    selectCharacter(id) {
      if (!recording && !loading) setCharacterId(id);
    },
    playMotion(name) {
      runtime.current?.player.play(name);
      setMotion(name);
    },
    changeSetting(name, value) {
      setSettings((current) => ({ ...current, [name]: value }));
    },
    togglePause() {
      setPaused((current) => !current);
    },
    resetSettings() {
      setSettings({ ...DEFAULT_SETTINGS });
    },
    startRecording() {
      if (!loading && character) runtime.current?.recorder.start();
    },
  };
}

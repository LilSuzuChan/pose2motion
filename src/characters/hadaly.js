import * as THREE from 'three';
import { loadRobotExpressive } from './robot-expressive.js';
import { createHadalyAppearance } from './hadaly/appearance.js';
import { createHadalyMotion } from './hadaly/motion.js';

export function createHadaly(source) {
  const scene = new THREE.Group();
  scene.name = 'HadalyStudy';
  const motionSource = source.scene;
  motionSource.traverse((object) => {
    if (object.isMesh) object.visible = false;
  });

  const appearance = createHadalyAppearance();
  scene.add(motionSource, appearance.body);
  const update = createHadalyMotion(scene, motionSource, appearance);
  update();

  return {
    id: 'hadaly',
    label: 'ハダリ / 造形スタディ',
    scene,
    animationRoot: motionSource,
    animations: source.animations,
    defaultMotion: 'Idle',
    update,
    description: '簡易造形 · 動きはRobotExpressiveから流用（映画の再現ではありません）',
  };
}

export async function loadHadaly() {
  return createHadaly(await loadRobotExpressive());
}

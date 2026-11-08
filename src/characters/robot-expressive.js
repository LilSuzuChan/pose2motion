import { GLTFLoader } from 'three/addons/loaders/GLTFLoader.js';

export async function loadRobotExpressive() {
  const gltf = await new GLTFLoader().loadAsync(
    `${import.meta.env?.BASE_URL ?? '/'}assets/RobotExpressive.glb`,
  );
  return {
    id: 'robot-expressive',
    label: 'RobotExpressive',
    scene: gltf.scene,
    animations: gltf.animations,
    defaultMotion: 'Dance',
    description: '既存モデル・収録済みモーション',
  };
}

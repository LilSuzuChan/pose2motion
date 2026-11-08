import { test } from 'node:test';
import assert from 'node:assert/strict';
import { readFileSync } from 'node:fs';

const THREE = await import('three');
const { GLTFLoader } = await import('three/addons/loaders/GLTFLoader.js');
const { createHadaly } = await import('../src/characters/hadaly.js');

async function source() {
  const bytes = readFileSync(new URL('../public/assets/RobotExpressive.glb', import.meta.url));
  return new GLTFLoader().parseAsync(
    bytes.buffer.slice(bytes.byteOffset, bytes.byteOffset + bytes.byteLength),
    '',
  );
}

test('Hadaly preserves all source clips and isolates the original appearance', async () => {
  const original = await source();
  const model = createHadaly(await source());

  assert.equal(model.animations.length, 14);
  assert.equal(model.defaultMotion, 'Idle');
  assert.ok(model.scene.getObjectByName('HadalyAppearance'));

  let originalMeshes = 0,
    hiddenMeshes = 0;

  original.scene.traverse((o) => {
    if (o.isMesh) {
      assert.equal(o.visible, true);
      originalMeshes++;
    }
  });

  model.animationRoot.traverse((o) => {
    if (o.isMesh) {
      assert.equal(o.visible, false);
      hiddenMeshes++;
    }
  });

  assert.equal(hiddenMeshes, originalMeshes);
});

test('all 14 existing motions drive finite joints without changing limb lengths', async () => {
  const model = createHadaly(await source());
  const mixer = new THREE.AnimationMixer(model.animationRoot);
  const shoulder = model.scene.getObjectByName('Upper arm L');
  const elbow = model.scene.getObjectByName('Forearm L');
  const wrist = model.scene.getObjectByName('Hand L');
  const poses = [];

  for (const clip of model.animations) {
    mixer.stopAllAction();
    mixer.clipAction(clip).play();
    for (const t of [0, clip.duration / 3, clip.duration * 0.9]) {
      mixer.setTime(t);
      model.update();

      model.scene.traverse((o) =>
        assert.ok(o.matrixWorld.elements.every(Number.isFinite), `${clip.name}: ${o.name}`),
      );

      assert.ok(Math.abs(shoulder.position.distanceTo(elbow.position) - 0.57) < 1e-6);
      assert.ok(Math.abs(elbow.position.distanceTo(wrist.position) - 0.53) < 1e-6);
      poses.push(elbow.position.toArray().join(','));
    }
  }
  assert.ok(new Set(poses).size > 14, 'source animation must change the visible joints');
});

test('display pivot rotation, scale and position do not distort the retargeted pose', async () => {
  const model = createHadaly(await source());
  const pivot = new THREE.Group();

  pivot.add(model.scene);

  const mixer = new THREE.AnimationMixer(model.animationRoot);

  mixer.clipAction(model.animations.find((c) => c.name === 'Walking')).play();
  mixer.setTime(0.3);
  model.update();

  const names = ['Head', 'Pelvis', 'Forearm L', 'Shin R'];
  const before = names.map((name) =>
    model.scene.getObjectByName('HadalyAppearance').getObjectByName(name).position.clone(),
  );

  pivot.rotation.y = 1.2;
  pivot.scale.setScalar(1.5);
  pivot.position.set(0, 0.7, 0);
  model.update();
  names.forEach((name, i) => {
    const joint = model.scene.getObjectByName('HadalyAppearance').getObjectByName(name);
    assert.ok(joint.position.distanceTo(before[i]) < 1e-6, name);
  });
});

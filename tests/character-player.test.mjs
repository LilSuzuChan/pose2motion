import { test } from 'node:test';
import assert from 'node:assert/strict';
import './three-loader.mjs';

const THREE = await import('../web/vendor/three.module.js');
const { createCharacterPlayer, REST_MOTION } = await import('../web/viewer/character-player.js');

function makeCharacter(id) {
  const scene = new THREE.Group();
  const joint = new THREE.Object3D();
  joint.name = 'joint';
  scene.add(joint);
  return {
    id,
    scene,
    defaultMotion: 'Move',
    animations: [
      new THREE.AnimationClip('Move', 2, [
        new THREE.NumberKeyframeTrack('joint.position[x]', [0, 2], [0, 2]),
      ]),
    ],
  };
}

test('switching characters reuses loaded models and restores the default motion', async () => {
  const pivot = new THREE.Group();
  let loads = 0;
  const player = createCharacterPlayer(pivot, {
    first: async () => {
      loads++;
      return makeCharacter('first');
    },
    second: async () => makeCharacter('second'),
  });
  const first = await player.select('first');
  player.update(0.5);
  assert.equal(first.scene.getObjectByName('joint').position.x, 0.5);
  await player.select('second');
  assert.equal(pivot.children.length, 1);
  await player.select('first');
  assert.equal(loads, 1);
  assert.equal(player.character, first);
  player.update(0.25);
  assert.equal(first.scene.getObjectByName('joint').position.x, 0.25);
});

test('pause, playback speed and rest pose are retained across character changes', async () => {
  const player = createCharacterPlayer(new THREE.Group(), {
    first: async () => makeCharacter('first'),
    second: async () => makeCharacter('second'),
  });
  const first = await player.select('first');
  const joint = first.scene.getObjectByName('joint');
  player.setPlayback({ paused: false, speed: 2 });
  player.update(0.25);
  assert.equal(joint.position.x, 0.5);
  player.setPlayback({ paused: true, speed: 2 });
  player.update(0.25);
  assert.equal(joint.position.x, 0.5);
  const second = await player.select('second');
  player.update(0.25);
  assert.equal(second.scene.getObjectByName('joint').position.x, 0);
  player.setPlayback({ paused: false, speed: 2 });
  player.update(0.25);
  player.play(REST_MOTION);
  assert.equal(second.scene.getObjectByName('joint').position.x, 0);
});

test('a slower load cannot replace the most recently selected character', async () => {
  let finishSlowLoad;
  const player = createCharacterPlayer(new THREE.Group(), {
    slow: () =>
      new Promise((resolve) => {
        finishSlowLoad = resolve;
      }),
    fast: async () => makeCharacter('fast'),
  });
  const pending = player.select('slow');
  await player.select('fast');
  finishSlowLoad(makeCharacter('slow'));
  assert.equal(await pending, null);
  assert.equal(player.character.id, 'fast');
  await assert.rejects(player.select('missing'), /Unknown character/);
  assert.equal(player.character.id, 'fast');
});

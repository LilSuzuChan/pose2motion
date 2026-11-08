import * as THREE from 'three';

export const REST_MOTION = 'rest';

function disposeCharacter(character) {
  const resources = new Set();
  character.scene.traverse((object) => {
    if (object.geometry) resources.add(object.geometry);
    const materials = Array.isArray(object.material) ? object.material : [object.material];
    for (const material of materials) {
      if (!material) continue;
      resources.add(material);
      for (const value of Object.values(material)) {
        if (value?.isTexture) resources.add(value);
      }
    }
  });
  for (const resource of resources) resource.dispose();
}

export function createCharacterPlayer(pivot, loaders) {
  const cache = new Map();
  let character;
  let mixer;
  let activeAction;
  let actions = new Map();
  let loadVersion = 0;
  let speed = 1;
  let paused = false;
  let disposed = false;

  function play(name) {
    if (!mixer) return;
    if (name === REST_MOTION) {
      mixer.stopAllAction();
      activeAction = undefined;
      character.update?.();
      return;
    }

    const nextAction = actions.get(name);
    if (!nextAction || nextAction === activeAction) return;
    nextAction.reset().setLoop(THREE.LoopRepeat, Infinity).play();
    activeAction?.crossFadeTo(nextAction, 0.25, false);
    activeAction = nextAction;
  }

  async function select(id) {
    if (disposed) return null;
    const version = ++loadVersion;
    let next = cache.get(id);
    if (!next) {
      const load = loaders[id];
      if (!load) throw new Error(`Unknown character: ${id}`);
      next = await load();
      if (disposed) {
        disposeCharacter(next);
        return null;
      }
      cache.set(id, next);
    }
    if (version !== loadVersion) return null;

    if (mixer) {
      mixer.stopAllAction();
      mixer.uncacheRoot(character.animationRoot || character.scene);
    }
    pivot.clear();
    character = next;
    pivot.add(character.scene);
    mixer = new THREE.AnimationMixer(character.animationRoot || character.scene);
    mixer.timeScale = paused ? 0 : speed;
    actions = new Map(character.animations.map((clip) => [clip.name, mixer.clipAction(clip)]));
    activeAction = undefined;
    play(character.defaultMotion);
    character.update?.();
    return character;
  }

  return {
    get character() {
      return character;
    },
    select,
    play,
    setPlayback(playback) {
      ({ speed, paused } = playback);
      if (mixer) mixer.timeScale = paused ? 0 : speed;
    },
    update(delta) {
      mixer?.update(delta);
      character?.update?.();
    },
    dispose() {
      disposed = true;
      loadVersion++;
      mixer?.stopAllAction();
      if (character) mixer?.uncacheRoot(character.animationRoot || character.scene);
      pivot.clear();
      for (const cached of cache.values()) disposeCharacter(cached);
      cache.clear();
      mixer = undefined;
      character = undefined;
      actions.clear();
    },
  };
}

import * as THREE from 'three';

export function createHadalyMotion(scene, motionSource, appearance) {
  const { body, pelvis, abdomen, chest, neck, head, limbs } = appearance;
  const yAxis = new THREE.Vector3(0, 1, 0);
  const downAxis = new THREE.Vector3(0, -1, 0);
  motionSource.updateMatrixWorld(true);
  const bones = {};
  motionSource.traverse((object) => {
    if (object.isBone) bones[object.name] = object;
  });
  const required = [
    'Body',
    'Hips',
    'Head',
    'Neck',
    'UpperArmL',
    'LowerArmL',
    'Palm2L',
    'UpperArmR',
    'LowerArmR',
    'Palm2R',
    'UpperLegL',
    'LowerLegL',
    'FootL',
    'UpperLegR',
    'LowerLegR',
    'FootR',
  ];
  for (const name of required) {
    if (!bones[name]) throw new Error(`Motion source is missing ${name}`);
  }

  const inverseScene = new THREE.Matrix4();
  const bodyRotation = new THREE.Quaternion();
  const headRotation = new THREE.Quaternion();
  const positions = Object.fromEntries(required.map((name) => [name, new THREE.Vector3()]));
  const inverseRestHeadRotation = bones.Head.getWorldQuaternion(new THREE.Quaternion()).invert();
  const inverseRestBodyRotation = bones.Body.getWorldQuaternion(new THREE.Quaternion()).invert();
  const origin = bones.Body.getWorldPosition(new THREE.Vector3());
  const direction = new THREE.Vector3();
  const localMatrix = new THREE.Matrix4();

  function readRotation(bone, rotation, inverseRestRotation) {
    localMatrix.multiplyMatrices(inverseScene, bone.matrixWorld);
    localMatrix.decompose(new THREE.Vector3(), rotation, new THREE.Vector3());
    rotation.multiply(inverseRestRotation);
  }

  function place(part, position, rotation) {
    part.position.copy(position);
    part.quaternion.copy(rotation);
  }

  function endpoint(from, sourceStart, sourceEnd, length) {
    return from
      .clone()
      .add(
        direction
          .subVectors(positions[sourceEnd], positions[sourceStart])
          .normalize()
          .multiplyScalar(length),
      );
  }

  function segment(part, start, end) {
    part.position.copy(start);
    part.quaternion.setFromUnitVectors(yAxis, direction.subVectors(end, start).normalize());
  }

  function offset(base, x, y, z) {
    return new THREE.Vector3(x, y, z).applyQuaternion(bodyRotation).add(base);
  }

  function update() {
    scene.updateWorldMatrix(true, true);
    inverseScene.copy(scene.matrixWorld).invert();
    for (const name of required) {
      positions[name].setFromMatrixPosition(bones[name].matrixWorld).applyMatrix4(inverseScene);
    }
    readRotation(bones.Body, bodyRotation, inverseRestBodyRotation);
    readRotation(bones.Head, headRotation, inverseRestHeadRotation);
    const hip = positions.Body.clone()
      .sub(origin)
      .multiplyScalar(0.85)
      .add(new THREE.Vector3(0, 1.64, 0));
    place(pelvis, hip, bodyRotation);
    place(abdomen, offset(hip, 0, 0.12, 0), bodyRotation);
    place(chest, offset(hip, 0, 0.39, 0), bodyRotation);
    const neckPosition = offset(hip, 0, 1.01, 0);
    place(neck, neckPosition, bodyRotation);
    place(head, offset(neckPosition, 0, 0.24, 0), headRotation);
    for (const parts of limbs) {
      const { side } = parts;
      const sign = side === 'L' ? 1 : -1;
      const shoulder = offset(hip, sign * 0.39, 0.84, 0);
      const elbow = endpoint(shoulder, `UpperArm${side}`, `LowerArm${side}`, 0.57);
      const wrist = endpoint(elbow, `LowerArm${side}`, `Palm2${side}`, 0.53);
      segment(parts.upperArm, shoulder, elbow);
      segment(parts.forearm, elbow, wrist);
      // Hands follow the forearm; source finger rotations are not transferred.
      parts.hand.position.copy(wrist);
      parts.hand.quaternion.setFromUnitVectors(
        downAxis,
        direction.subVectors(wrist, elbow).normalize(),
      );
      const thighTop = offset(hip, sign * 0.21, -0.04, 0);
      const knee = endpoint(thighTop, `UpperLeg${side}`, `LowerLeg${side}`, 0.76);
      const ankle = endpoint(knee, `LowerLeg${side}`, `Foot${side}`, 0.73);
      segment(parts.thigh, thighTop, knee);
      segment(parts.shin, knee, ankle);
      place(parts.foot, ankle, bodyRotation);
    }
    body.updateMatrixWorld(true);
  }

  return update;
}

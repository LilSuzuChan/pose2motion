import * as THREE from 'three';

export function createHadalyAppearance() {
  const body = new THREE.Group();
  body.name = 'HadalyAppearance';

  const materials = {
    porcelain: new THREE.MeshStandardMaterial({
      color: 0xe8e1ce,
      roughness: 0.32,
      metalness: 0.08,
    }),
    pale: new THREE.MeshStandardMaterial({ color: 0xf4ead8, roughness: 0.4 }),
    joint: new THREE.MeshStandardMaterial({ color: 0x494c4a, roughness: 0.5, metalness: 0.6 }),
    seam: new THREE.MeshStandardMaterial({ color: 0x8f8b7b, roughness: 0.6 }),
    hair: new THREE.MeshStandardMaterial({ color: 0x10191c, roughness: 0.34, metalness: 0.12 }),
    eye: new THREE.MeshStandardMaterial({ color: 0x111418, roughness: 0.25 }),
    iris: new THREE.MeshStandardMaterial({ color: 0x596859, roughness: 0.25 }),
    lip: new THREE.MeshStandardMaterial({ color: 0x8b5b52, roughness: 0.55 }),
  };

  const sphere = new THREE.SphereGeometry(1, 28, 20);

  function addEllipsoid(parent, name, position, scale, material = materials.porcelain) {
    const mesh = new THREE.Mesh(sphere, material);
    mesh.name = name;
    mesh.position.set(...position);
    mesh.scale.set(...scale);
    parent.add(mesh);
    return mesh;
  }

  function createPartGroup(name) {
    const part = new THREE.Group();
    part.name = name;
    body.add(part);
    return part;
  }

  function addLathedShell(parent, name, profile) {
    const geometry = new THREE.LatheGeometry(
      profile.map(([r, y]) => new THREE.Vector2(r, y)),
      40,
    );

    const mesh = new THREE.Mesh(geometry, materials.porcelain);
    mesh.name = name;
    parent.add(mesh);
    return mesh;
  }

  const pelvis = createPartGroup('Pelvis');
  addEllipsoid(pelvis, 'Hip shell', [0, 0, 0], [0.34, 0.23, 0.22]);
  const abdomen = createPartGroup('Abdomen');
  addLathedShell(abdomen, 'Waist shell', [
    [0, -0.02],
    [0.23, 0],
    [0.235, 0.06],
    [0.19, 0.2],
    [0.205, 0.34],
    [0, 0.35],
  ]).scale.z = 0.78;

  for (const y of [0.08, 0.14])
    addEllipsoid(abdomen, 'Waist articulation', [0, y, 0], [0.236, 0.014, 0.187], materials.seam);

  const chest = createPartGroup('Chest');
  addLathedShell(chest, 'Torso shell', [
    [0, -0.04],
    [0.205, 0],
    [0.28, 0.16],
    [0.335, 0.36],
    [0.29, 0.49],
    [0.13, 0.55],
    [0, 0.56],
  ]).scale.z = 0.67;
  addEllipsoid(chest, 'Sternum seam', [0, 0.29, 0.215], [0.006, 0.19, 0.005], materials.seam);

  for (const side of [-1, 1]) {
    const collar = addEllipsoid(
      chest,
      'Collar seam',
      [side * 0.16, 0.48, 0.15],
      [0.13, 0.009, 0.008],
      materials.seam,
    );
    collar.rotation.z = side * -0.16;
  }

  const neck = createPartGroup('Neck');
  addEllipsoid(neck, 'Neck articulation', [0, 0, 0], [0.1, 0.125, 0.1], materials.joint);
  addEllipsoid(neck, 'Neck shell', [0, 0.08, 0], [0.105, 0.11, 0.095]);
  const head = createPartGroup('Head');
  addEllipsoid(head, 'Cranium', [0, 0.2, -0.015], [0.28, 0.355, 0.245], materials.pale);
  addEllipsoid(head, 'Lower face', [0, 0.045, 0.065], [0.215, 0.225, 0.19], materials.pale);
  addEllipsoid(head, 'Chin', [0, -0.09, 0.115], [0.11, 0.065, 0.105], materials.pale);
  addEllipsoid(head, 'Nose bridge', [0, 0.105, 0.247], [0.031, 0.081, 0.028], materials.pale);
  addEllipsoid(head, 'Nose tip', [0, 0.052, 0.27], [0.04, 0.027, 0.039], materials.pale);
  addEllipsoid(head, 'Upper lip', [0, -0.03, 0.246], [0.07, 0.01, 0.009], materials.lip);
  addEllipsoid(head, 'Lower lip', [0, -0.045, 0.245], [0.057, 0.009, 0.008], materials.lip);

  for (const side of [-1, 1]) {
    const eye = addEllipsoid(
      head,
      'Eye socket',
      [side * 0.104, 0.15, 0.22],
      [0.073, 0.03, 0.024],
      materials.eye,
    );
    eye.rotation.z = -side * 0.1;
    addEllipsoid(head, 'Iris', [side * 0.101, 0.15, 0.242], [0.021, 0.024, 0.006], materials.iris);
    addEllipsoid(head, 'Pupil', [side * 0.101, 0.15, 0.248], [0.01, 0.018, 0.003], materials.eye);
    addEllipsoid(
      head,
      'Catchlight',
      [side * 0.101 - 0.005, 0.159, 0.251],
      [0.004, 0.005, 0.002],
      materials.pale,
    );
    const brow = addEllipsoid(
      head,
      'Eyebrow',
      [side * 0.107, 0.21, 0.229],
      [0.075, 0.009, 0.009],
      materials.hair,
    );
    brow.rotation.z = -side * 0.13;
    addEllipsoid(head, 'Ear', [side * 0.263, 0.135, 0], [0.043, 0.075, 0.038], materials.pale);
    addEllipsoid(
      head,
      'Temple joint',
      [side * 0.264, 0.125, -0.01],
      [0.016, 0.045, 0.045],
      materials.seam,
    );
    const cheek = addEllipsoid(
      head,
      'Face plate seam',
      [side * 0.202, 0.04, 0.177],
      [0.004, 0.1, 0.004],
      materials.seam,
    );
    cheek.rotation.z = -side * 0.15;
  }
  const cap = new THREE.Mesh(
    new THREE.SphereGeometry(1, 40, 24, 0, Math.PI * 2, 0, 1.45),
    materials.hair,
  );
  cap.name = 'Hair cap';
  cap.position.set(0, 0.21, -0.025);
  cap.scale.set(0.298, 0.365, 0.264);
  head.add(cap);
  const curtain = new THREE.Mesh(
    new THREE.CylinderGeometry(0.29, 0.3, 0.44, 36, 1, true, Math.PI / 2, Math.PI),
    materials.hair,
  );
  curtain.name = 'Bob back';
  curtain.position.set(0, 0.1, -0.018);
  curtain.scale.z = 0.91;
  curtain.material.side = THREE.DoubleSide;
  head.add(curtain);
  for (const side of [-1, 1])
    addEllipsoid(
      head,
      'Bob side',
      [side * 0.258, 0.12, 0.03],
      [0.066, 0.252, 0.19],
      materials.hair,
    );
  for (let i = 0; i < 11; i++) {
    const x = (i - 5) * 0.044;
    addEllipsoid(
      head,
      'Fringe',
      [x, 0.315 + Math.abs(x) * 0.06, 0.215 - Math.pow(x, 2) * 0.9],
      [0.029, 0.09, 0.039],
      materials.hair,
    );
  }

  const limbs = [];
  function createLimb(name, length, top, bottom) {
    const part = createPartGroup(name);
    const shell = addLathedShell(part, `${name} shell`, [
      [0, 0.035],
      [top * 0.8, 0.055],
      [top, 0.16 * length],
      [bottom, 0.8 * length],
      [bottom * 0.7, length - 0.045],
      [0, length - 0.03],
    ]);
    shell.scale.z = 0.86;
    addEllipsoid(
      part,
      `${name} ball`,
      [0, 0, 0],
      [top * 0.95, top * 0.95, top * 0.95],
      materials.joint,
    );
    const ring = new THREE.Mesh(new THREE.TorusGeometry(top * 0.97, 0.009, 8, 28), materials.seam);
    ring.rotation.x = Math.PI / 2;
    ring.position.y = top * 0.35;
    part.add(ring);
    return part;
  }
  for (const side of ['L', 'R']) {
    const upperArm = createLimb(`Upper arm ${side}`, 0.57, 0.125, 0.085);
    const forearm = createLimb(`Forearm ${side}`, 0.53, 0.1, 0.065);
    const thigh = createLimb(`Thigh ${side}`, 0.76, 0.18, 0.11);
    const shin = createLimb(`Shin ${side}`, 0.73, 0.12, 0.072);
    const hand = createPartGroup(`Hand ${side}`);
    addEllipsoid(hand, 'Wrist', [0, 0, 0], [0.065, 0.065, 0.065], materials.joint);
    addEllipsoid(hand, 'Palm', [0, -0.105, 0], [0.08, 0.12, 0.035]);
    for (let i = 0; i < 4; i++) {
      const x = (i - 1.5) * 0.039;
      addEllipsoid(
        hand,
        'Finger',
        [x, -0.24 + Math.abs(i - 1) * 0.012, 0],
        [0.017, 0.075 - Math.abs(i - 1) * 0.009, 0.019],
      );
      addEllipsoid(hand, 'Finger joint', [x, -0.205, 0.004], [0.018, 0.012, 0.02], materials.seam);
    }
    const thumb = addEllipsoid(
      hand,
      'Thumb',
      [side === 'L' ? -0.095 : 0.095, -0.13, 0.015],
      [0.025, 0.073, 0.025],
    );
    thumb.rotation.z = side === 'L' ? -0.5 : 0.5;
    const foot = createPartGroup(`Foot ${side}`);
    addEllipsoid(foot, 'Ankle', [0, 0, 0], [0.075, 0.085, 0.075], materials.joint);
    addEllipsoid(foot, 'Foot shell', [0, -0.055, 0.1], [0.105, 0.075, 0.22]);
    addEllipsoid(foot, 'Toe seam', [0, -0.04, 0.23], [0.094, 0.004, 0.007], materials.seam);
    limbs.push({ side, upperArm, forearm, thigh, shin, hand, foot });
  }

  return { body, pelvis, abdomen, chest, neck, head, limbs };
}

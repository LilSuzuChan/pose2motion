import * as THREE from 'three';

export function createViewer(container) {
  const renderer = new THREE.WebGLRenderer({
    antialias: true,
    preserveDrawingBuffer: true,
  });
  renderer.setPixelRatio(Math.min(devicePixelRatio, 2));
  renderer.setClearColor(0x000000);
  renderer.outputColorSpace = THREE.SRGBColorSpace;
  container.appendChild(renderer.domElement);

  const scene = new THREE.Scene();
  const camera = new THREE.PerspectiveCamera(35, 1, 0.1, 100);
  camera.position.set(0, 2.4, 10);
  camera.lookAt(0, 1.9, 0);

  scene.add(new THREE.HemisphereLight(0xffffff, 0x6c7183, 2.5));
  const light = new THREE.DirectionalLight(0xffffff, 3);
  light.position.set(3, 6, 5);
  scene.add(light);

  const pivot = new THREE.Group();
  scene.add(pivot);

  function resize() {
    const { width, height } = container.getBoundingClientRect();
    if (!width || !height) return;
    renderer.setSize(width, height);
    camera.aspect = width / height;
    camera.updateProjectionMatrix();
  }

  const observer = new ResizeObserver(resize);
  observer.observe(container);
  resize();

  return {
    canvas: renderer.domElement,
    pivot,
    setDisplay({ size, angle, height, mirror }) {
      pivot.scale.setScalar(size);
      pivot.rotation.y = THREE.MathUtils.degToRad(angle);
      pivot.position.y = height;
      renderer.domElement.style.transform = mirror ? 'scaleX(-1)' : '';
    },
    start(update) {
      const clock = new THREE.Clock();
      renderer.setAnimationLoop(() => {
        update(Math.min(clock.getDelta(), 0.1));
        renderer.render(scene, camera);
      });
    },
    dispose() {
      observer.disconnect();
      renderer.setAnimationLoop(null);
      renderer.dispose();
      renderer.domElement.remove();
    },
  };
}

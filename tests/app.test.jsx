import { StrictMode } from 'react';
import { afterEach, expect, test, vi } from 'vitest';
import { cleanup, fireEvent, render, screen, waitFor, within } from '@testing-library/react';
import { App } from '../src/App.jsx';

const viewers = vi.hoisted(() => []);
vi.mock('../src/viewer/scene.js', async () => {
  const THREE = await import('three');
  return {
    createViewer: vi.fn(() => {
      const viewer = {
        canvas: {},
        pivot: new THREE.Group(),
        setDisplay: vi.fn(),
        start: vi.fn(),
        dispose: vi.fn(),
      };
      viewers.push(viewer);
      return viewer;
    }),
  };
});
vi.mock('../src/characters/robot-expressive.js', async () => {
  const { readFileSync } = await import('node:fs');
  const { GLTFLoader } = await import('three/addons/loaders/GLTFLoader.js');
  return {
    loadRobotExpressive: async () => {
      const bytes = readFileSync(`${process.cwd()}/public/assets/RobotExpressive.glb`);
      const gltf = await new GLTFLoader().parseAsync(Uint8Array.from(bytes).buffer, '');
      return {
        id: 'robot-expressive',
        label: 'RobotExpressive',
        scene: gltf.scene,
        animations: gltf.animations,
        defaultMotion: 'Dance',
        description: '既存モデル',
      };
    },
  };
});

afterEach(() => {
  cleanup();
  viewers.length = 0;
});

test('both characters show all motions and keep display and playback controls', async () => {
  render(<App />);
  const motion = screen.getByRole('combobox', { name: 'モーション' });
  await waitFor(() => expect(motion.options).toHaveLength(15));
  expect(motion.value).toBe('Dance');
  expect(within(motion).getByRole('option', { name: 'Walking' })).toBeTruthy();

  fireEvent.change(screen.getByRole('combobox', { name: 'キャラクター' }), {
    target: { value: 'hadaly' },
  });
  await waitFor(() => expect(motion.value).toBe('Idle'));
  expect(motion.options).toHaveLength(15);
  expect(screen.getByRole('status', { name: 'モデルの状態' }).textContent).toMatch(/ハダリ/);
  fireEvent.change(motion, { target: { value: 'Walking' } });
  expect(motion.value).toBe('Walking');
  fireEvent.click(screen.getByRole('button', { name: '一時停止' }));
  expect(screen.getByRole('button', { name: '再生' })).toBeTruthy();
  fireEvent.click(screen.getByRole('checkbox', { name: '左右反転（反射用）' }));
  expect(viewers[0].setDisplay).toHaveBeenLastCalledWith(expect.objectContaining({ mirror: true }));
  fireEvent.click(screen.getByRole('button', { name: '設定を戻す' }));
  expect(viewers[0].setDisplay).toHaveBeenLastCalledWith(
    expect.objectContaining({ mirror: false, speed: 1 }),
  );
});

test('StrictMode remount and unmount release the viewer', async () => {
  const { unmount } = render(
    <StrictMode>
      <App />
    </StrictMode>,
  );
  await waitFor(() =>
    expect(screen.getByRole('combobox', { name: 'モーション' }).options).toHaveLength(15),
  );
  expect(viewers).toHaveLength(2);
  expect(viewers[0].dispose).toHaveBeenCalledOnce();
  expect(viewers[1].dispose).not.toHaveBeenCalled();
  unmount();
  expect(viewers[1].dispose).toHaveBeenCalledOnce();
});

test('presentation mode works without native fullscreen and Escape restores controls', async () => {
  const { container } = render(<App />);
  await waitFor(() =>
    expect(screen.getByRole('combobox', { name: 'モーション' }).disabled).toBe(false),
  );
  fireEvent.click(screen.getByRole('button', { name: '表示モード / 全画面' }));
  expect(container.firstChild.classList.contains('presenting')).toBe(true);
  fireEvent.keyDown(document, { key: 'Escape' });
  expect(container.firstChild.classList.contains('presenting')).toBe(false);
});

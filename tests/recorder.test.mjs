import { test } from 'node:test';
import assert from 'node:assert/strict';
import { drawRecordingFrame, createVideoRecorder } from '../src/viewer/recorder.js';

test('recording preserves the source aspect ratio and mirrors actual pixels', () => {
  const operations = [];
  const context = Object.fromEntries(
    ['fillRect', 'save', 'translate', 'scale', 'drawImage', 'restore'].map((name) => [
      name,
      (...args) => operations.push([name, ...args]),
    ]),
  );

  const source = { width: 600, height: 800 };

  drawRecordingFrame(context, source, true);
  assert.equal(context.fillStyle, '#000');
  assert.deepEqual(operations, [
    ['fillRect', 0, 0, 1280, 720],
    ['save'],
    ['translate', 1280, 0],
    ['scale', -1, 1],
    ['drawImage', source, 370, 0, 540, 720],
    ['restore'],
  ]);

  operations.length = 0;

  drawRecordingFrame(context, { width: 1920, height: 1080 }, false);
  assert.equal(
    operations.some(([name]) => name === 'scale'),
    false,
  );
  assert.deepEqual(operations.find(([name]) => name === 'drawImage').slice(2), [0, 0, 1280, 720]);
});

test('an unsupported recording browser reports an error without starting', () => {
  let message;
  const recorder = createVideoRecorder({
    canvas: {},
    onError: (error) => {
      message = error;
    },
  });

  assert.equal(recorder.supported, false);
  recorder.start();
  assert.match(message, /WebM/);
  assert.equal(recorder.recording, false);
});

test('recording setup failure releases the stream and resets the recording state', (t) => {
  const original = Object.fromEntries(
    ['document', 'MediaRecorder', 'cancelAnimationFrame'].map((name) => [
      name,
      Object.getOwnPropertyDescriptor(globalThis, name),
    ]),
  );

  t.after(() => {
    for (const [name, descriptor] of Object.entries(original)) {
      if (descriptor) Object.defineProperty(globalThis, name, descriptor);
      else delete globalThis[name];
    }
  });

  let stopped = false;
  const stream = {
    getTracks: () => [
      {
        stop: () => {
          stopped = true;
        },
      },
    ],
  };

  globalThis.document = {
    createElement: () => ({
      getContext: () => ({}),
      captureStream: () => stream,
    }),
  };

  globalThis.MediaRecorder = class {
    static isTypeSupported() {
      return true;
    }
    constructor() {
      throw new Error('encoder unavailable');
    }
  };

  globalThis.cancelAnimationFrame = () => {};
  const states = [];
  let message;
  const recorder = createVideoRecorder({
    canvas: { captureStream() {} },
    onStateChange: (recording) => states.push(recording),
    onError: (error) => {
      message = error;
    },
  });

  recorder.start();
  assert.equal(stopped, true);
  assert.equal(recorder.recording, false);
  assert.deepEqual(states, [false]);
  assert.match(message, /encoder unavailable/);
});

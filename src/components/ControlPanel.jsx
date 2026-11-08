import { characters } from '../characters/index.js';
import { REST_MOTION } from '../viewer/character-player.js';

function Slider({ label, value, onChange, min, max, step, output }) {
  return (
    <label>
      {label}
      {output && <output>{output}</output>}
      <input
        type="range"
        min={min}
        max={max}
        step={step}
        value={value}
        onChange={(event) => onChange(Number(event.target.value))}
      />
    </label>
  );
}

export function ControlPanel({ viewer, onPresent }) {
  const { character, settings, loading, recording } = viewer;
  const slider = (name) => ({
    value: settings[name],
    onChange: (value) => viewer.changeSetting(name, value),
  });

  return (
    <aside id="panel">
      <div className="eyebrow">POSE2MOTION / LOCAL LAB</div>
      <h1>Dome Motion</h1>
      <p>ふぃ動きを灯す。</p>
      <div id="status" role="status" aria-label="モデルの状態">
        {viewer.status}
      </div>
      <label>
        キャラクター
        <select
          value={viewer.characterId}
          disabled={loading || recording}
          onChange={(event) => viewer.selectCharacter(event.target.value)}
        >
          {characters.map(({ id, label }) => (
            <option key={id} value={id}>
              {label}
            </option>
          ))}
        </select>
      </label>
      <p className="hint">{character?.description}</p>
      <label>
        モーション
        <select
          value={viewer.motion}
          disabled={!character || loading}
          onChange={(event) => viewer.playMotion(event.target.value)}
        >
          <option value={REST_MOTION}>静止（外見確認）</option>
          {character?.animations.map((clip) => (
            <option key={clip.name} value={clip.name}>
              {clip.name}
            </option>
          ))}
        </select>
      </label>
      <Slider
        label="再生速度"
        min={0.2}
        max={2}
        step={0.1}
        output={`${settings.speed.toFixed(1)}×`}
        {...slider('speed')}
      />
      <Slider label="表示サイズ" min={0.5} max={1.6} step={0.05} {...slider('size')} />
      <Slider label="向き" min={-180} max={180} step={1} {...slider('angle')} />
      <Slider label="上下位置" min={-1} max={1} step={0.05} {...slider('height')} />
      <label className="check">
        <input
          type="checkbox"
          checked={settings.mirror}
          onChange={(event) => viewer.changeSetting('mirror', event.target.checked)}
        />
        左右反転（反射用）
      </label>
      <div className="buttons">
        <button disabled={!character || loading} onClick={viewer.togglePause}>
          {viewer.paused ? '再生' : '一時停止'}
        </button>
        <button onClick={viewer.resetSettings}>設定を戻す</button>
      </div>
      <button className="primary" onClick={onPresent}>
        表示モード / 全画面
      </button>
      <button
        disabled={loading || recording || !character || !viewer.canRecord}
        onClick={viewer.startRecording}
      >
        {recording ? `録画中… ${viewer.recordingSeconds} / 10秒` : '10秒の動画を保存（WebM）'}
      </button>
      <p className="hint">
        表示モードから戻る：Esc または画面タップ
        <br />
        1方向の反射用です。実物の板で向きを調整してください。
      </p>
      <footer>
        Motion: RobotExpressive · CC0 / Three.js · MIT
        <br />
        <a href={`${import.meta.env.BASE_URL}assets/RobotExpressive-LICENSE.md`}>モデルの出典</a>
      </footer>
    </aside>
  );
}

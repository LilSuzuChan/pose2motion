import { useRef } from 'react';
import { ControlPanel } from './components/ControlPanel.jsx';
import { useDomeViewer } from './hooks/useDomeViewer.js';
import { usePresentation } from './hooks/usePresentation.js';

export function App() {
  const stage = useRef(null);
  const viewer = useDomeViewer(stage);
  const { presenting, enterPresentation, exitPresentation } = usePresentation();

  return (
    <div className={presenting ? 'presenting' : undefined}>
      <main
        id="stage"
        ref={stage}
        aria-label="キャラクターの表示領域"
        onClick={() => {
          if (presenting && !viewer.recording) exitPresentation();
        }}
      />
      <ControlPanel viewer={viewer} onPresent={enterPresentation} />
    </div>
  );
}

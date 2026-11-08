import { loadRobotExpressive } from './robot-expressive.js';
import { loadHadaly } from './hadaly.js';

export const characters = [
  { id: 'robot-expressive', label: 'RobotExpressive（既存）', load: loadRobotExpressive },
  { id: 'hadaly', label: 'ハダリ / 造形スタディ', load: loadHadaly },
];

export const characterLoaders = Object.fromEntries(characters.map(({ id, load }) => [id, load]));

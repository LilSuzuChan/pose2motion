ハダリの3Dモデルをjsで作ったけど残念になったので、別の方法でちゃんと作る。軌跡としてこれは残す


https://github.com/user-attachments/assets/f126047a-4c99-438b-bc08-626ef6fa213e





- 起動

Node.js 22.15以降とnpmを使います。リポジトリのルートで実行します

```sh
npm ci
npm run dev
```

（残念すぎる）ハダリの動きはRobotExpressiveから流用。



## 引用元
- モデル・モーション: [Three.jsのRobotExpressiveサンプル](https://github.com/mrdoob/three.js/tree/r180/examples/models/gltf/RobotExpressive)（CC0）
- 描画ライブラリ: [mrdoob/three.js](https://github.com/mrdoob/three.js/tree/r180)（MIT）
- モデルのライセンスは `public/assets/RobotExpressive-LICENSE.md` に同梱
- React / ViteはMIT。ライブラリのライセンスは各npmパッケージに含まれる

# 概要
ハダリの3Dモデルをjsで作ったけど残念になったので、別の方法でちゃんと作る。軌跡としてこれは残す

## 起動

リポジトリのルートで実行します

```sh
python3 -m http.server 8000 --bind 127.0.0.1 --directory web
```

ブラウザで http://127.0.0.1:8000 を開いてください。終了はターミナルで Ctrl+C。

（残念すぎる）ハダリの外見は `web/characters/hadaly/appearance.js`、動きの転送は `web/characters/hadaly/motion.js` に分離しています。
ハダリの動きはRobotExpressiveから流用します。


## 引用元
- モデル・モーション: [Three.jsのRobotExpressiveサンプル](https://github.com/mrdoob/three.js/tree/r180/examples/models/gltf/RobotExpressive)（CC0）
- 描画ライブラリ: [mrdoob/three.js](https://github.com/mrdoob/three.js/tree/r180)（MIT）
- ライセンスは各ディレクトリに同梱しています。

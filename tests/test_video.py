"""Exercise video decoding and JSONL export using a deterministic fake model."""

import json
import sys
from types import SimpleNamespace

import cv2
import numpy as np
import pytest

from pose2motion.cli import extract


def test_video_export(tmp_path, monkeypatch):
    video = tmp_path / "synthetic.avi"
    writer = cv2.VideoWriter(str(video), cv2.VideoWriter_fourcc(*"MJPG"), 25, (32, 32))
    assert writer.isOpened()
    for _ in range(3):
        writer.write(np.zeros((32, 32, 3), dtype=np.uint8))
    writer.release()
    model = tmp_path / "fake.task"
    model.touch()
    timestamps = []

    class Detector:
        def __enter__(self):
            return self

        def __exit__(self, *args):
            pass

        def detect_for_video(self, image, timestamp):
            assert image.data.shape == (32, 32, 3)
            timestamps.append(timestamp)
            points = [SimpleNamespace(x=0.5, y=0.5, z=0, visibility=1, presence=1)] * 33
            poses = [points] if len(timestamps) == 1 else []
            return SimpleNamespace(pose_landmarks=poses, pose_world_landmarks=poses)

    fake = SimpleNamespace(
        Image=lambda **kwargs: SimpleNamespace(**kwargs),
        ImageFormat=SimpleNamespace(SRGB=1),
        tasks=SimpleNamespace(
            BaseOptions=lambda **kwargs: kwargs,
            vision=SimpleNamespace(
                PoseLandmarkerOptions=lambda **kwargs: kwargs,
                RunningMode=SimpleNamespace(VIDEO=1),
                PoseLandmarker=SimpleNamespace(create_from_options=lambda options: Detector()),
            ),
        ),
    )
    monkeypatch.setitem(sys.modules, "mediapipe", fake)
    output = tmp_path / "result.jsonl"
    assert extract(video, model, output, max_frames=2) == 2
    records = [json.loads(line) for line in output.read_text().splitlines()]
    assert timestamps == [0, 40]
    assert len(records[0]["world_landmarks"][0]) == 33
    assert records[1]["landmarks"] == []
    assert records[1]["frame_index"] == 1
    assert records[0]["image_size"] == {"width": 32, "height": 32}


@pytest.mark.parametrize("fps", [0, float("nan")])
def test_invalid_video_fps(tmp_path, fps):
    video, model = tmp_path / "empty.avi", tmp_path / "fake.task"
    video.touch()
    model.touch()
    with pytest.raises(ValueError):
        extract(video, model, tmp_path / "out.jsonl", fps_override=fps)
    assert not (tmp_path / "out.jsonl").exists()

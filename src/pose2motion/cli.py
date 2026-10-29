"""Extract single-person MediaPipe landmarks to streaming JSON Lines."""

import argparse
import json
import math
import sys
from pathlib import Path


def timestamp_ms(frame_index: int, fps: float, previous: int) -> int:
    """Generate strictly increasing timestamps, including for high frame rates."""
    if not math.isfinite(fps) or fps <= 0:
        raise ValueError("FPS must be finite and positive; specify --fps for this video")
    return max(previous + 1, round(frame_index * 1000 / fps))


def serialize_landmarks(poses):
    return [
        [
            {key: getattr(point, key, None) for key in ("x", "y", "z", "visibility", "presence")}
            for point in pose
        ]
        for pose in poses
    ]


def extract(video: Path, model: Path, output: Path, fps_override=None, max_frames=None) -> int:
    """Process video without retaining all frames in memory; never overwrite output."""
    if not video.is_file():
        raise ValueError(f"Input video not found: {video}")
    if not model.is_file():
        raise ValueError(f"Model not found: {model}; see README for download instructions")
    if video.resolve() == output.resolve() or model.resolve() == output.resolve():
        raise ValueError("Output must differ from input and model")
    if output.exists():
        raise FileExistsError(f"Output already exists: {output}")
    if max_frames is not None and max_frames <= 0:
        raise ValueError("--max-frames must be positive")

    import cv2
    import mediapipe as mp

    capture = cv2.VideoCapture(str(video))
    count = 0
    try:
        if not capture.isOpened():
            raise ValueError(f"Cannot open video: {video}")
        fps = fps_override if fps_override is not None else capture.get(cv2.CAP_PROP_FPS)
        timestamp_ms(0, fps, -1)
        ok, frame = capture.read()
        if not ok:
            raise ValueError("Video has no decodable frames")
        options = mp.tasks.vision.PoseLandmarkerOptions(
            base_options=mp.tasks.BaseOptions(model_asset_path=str(model)),
            running_mode=mp.tasks.vision.RunningMode.VIDEO,
            num_poses=1,
        )
        with mp.tasks.vision.PoseLandmarker.create_from_options(options) as detector:
            output.parent.mkdir(parents=True, exist_ok=True)
            with output.open("x", encoding="utf-8") as stream:
                previous = -1
                while ok and (max_frames is None or count < max_frames):
                    timestamp = timestamp_ms(count, fps, previous)
                    rgb = cv2.cvtColor(frame, cv2.COLOR_BGR2RGB)
                    result = detector.detect_for_video(
                        mp.Image(image_format=mp.ImageFormat.SRGB, data=rgb), timestamp
                    )
                    record = {
                        "schema_version": 1,
                        "frame_index": count,
                        "timestamp_ms": timestamp,
                        "fps": fps,
                        "image_size": {"width": frame.shape[1], "height": frame.shape[0]},
                        "landmarks": serialize_landmarks(result.pose_landmarks),
                        "world_landmarks": serialize_landmarks(result.pose_world_landmarks),
                    }
                    stream.write(json.dumps(record, allow_nan=False) + "\n")
                    count += 1
                    previous = timestamp
                    ok, frame = capture.read()
    finally:
        capture.release()
    return count


def main(argv=None) -> int:
    parser = argparse.ArgumentParser(description=__doc__)
    parser.add_argument("video", type=Path)
    parser.add_argument("--model", type=Path, default=Path("models/pose_landmarker_lite.task"))
    parser.add_argument("--output", type=Path, required=True)
    parser.add_argument("--fps", type=float, help="Override missing/incorrect constant frame rate")
    parser.add_argument("--max-frames", type=int)
    args = parser.parse_args(argv)
    try:
        count = extract(args.video, args.model, args.output, args.fps, args.max_frames)
    except (OSError, ValueError, RuntimeError) as exc:
        print(f"Error: {exc}", file=sys.stderr)
        return 1
    print(f"Saved {count} frames to {args.output}")
    return 0


if __name__ == "__main__":
    raise SystemExit(main())

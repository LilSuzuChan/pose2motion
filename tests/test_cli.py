from types import SimpleNamespace

import pytest

from pose2motion.cli import extract, main, serialize_landmarks, timestamp_ms


@pytest.mark.parametrize("fps", [0, -1, float("nan"), float("inf")])
def test_invalid_fps(fps):
    with pytest.raises(ValueError, match="FPS"):
        timestamp_ms(0, fps, -1)


def test_timestamps():
    assert [timestamp_ms(i, 30, -1) for i in range(3)] == [0, 33, 67]
    assert timestamp_ms(1, 2000, 0) == 1


def test_serialization():
    point = SimpleNamespace(x=0.1, y=0.2, z=-0.3, visibility=0.9, presence=0.8)
    assert serialize_landmarks([[point]]) == [[vars(point)]]
    assert serialize_landmarks([]) == []


def test_missing_input(tmp_path, capsys):
    assert main([str(tmp_path / "missing.mp4"), "--output", str(tmp_path / "out")]) == 1
    assert "Input video not found" in capsys.readouterr().err
    assert not (tmp_path / "out").exists()


def test_existing_output_preserved(tmp_path):
    video, model, output = [tmp_path / name for name in ("video", "model", "output")]
    for path in (video, model, output):
        path.write_text("original")
    with pytest.raises(FileExistsError):
        extract(video, model, output)
    assert output.read_text() == "original"


def test_help():
    with pytest.raises(SystemExit) as exc:
        main(["--help"])
    assert exc.value.code == 0

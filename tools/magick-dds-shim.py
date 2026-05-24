import io
import os
import sys

from PIL import Image


def main() -> int:
    output_path = find_output_path(sys.argv[1:])
    if output_path is None:
        print("magick DDS shim could not find an output path", file=sys.stderr)
        return 2

    data = sys.stdin.buffer.read()
    if not data:
        print("magick DDS shim received no DDS input", file=sys.stderr)
        return 1

    image = Image.open(io.BytesIO(data))
    if image.mode not in ("RGB", "RGBA"):
        image = image.convert("RGBA")

    output_dir = os.path.dirname(output_path)
    if output_dir:
        os.makedirs(output_dir, exist_ok=True)
    image.save(output_path, "PNG")
    return 0


def find_output_path(args: list[str]) -> str | None:
    for arg in reversed(args):
        if arg.startswith("-") or arg == "dds:-" or arg == "100%":
            continue
        if arg.lower().startswith("png:"):
            return arg[4:]
        return arg
    return None


if __name__ == "__main__":
    raise SystemExit(main())

#!/usr/bin/env python3
"""Compose honest, captioned CourseGraph films from actual UI screenshots.

No network, paid service, generated screen, synthetic click, or narration is used.
The resulting films are motion presentations of captured application states.

Examples:
  python3 scripts/render_demo.py --check
  python3 scripts/render_demo.py --preview --output-dir /tmp/coursegraph-preview
  python3 scripts/render_demo.py --url https://coursegraph.my
"""
from __future__ import annotations

import argparse
import json
import hashlib
import shutil
import subprocess
import sys
import time
from dataclasses import dataclass
from pathlib import Path

try:
    from PIL import Image, ImageDraw, ImageFont, ImageFilter
except ImportError:
    raise SystemExit("Pillow is required. Use the bundled workspace Python runtime.")

ROOT = Path(__file__).resolve().parents[1]
BG = "#F6F5EF"
INK = "#263844"
MUTED = "#64747D"
CYAN = "#008B99"
VIOLET = "#7653B1"
AMBER = "#A4721B"
LINE = "#DBE1E3"
FONT = Path("/System/Library/Fonts/Avenir Next.ttc")
BOLD_FONT = Path("/System/Library/Fonts/Supplemental/Arial Bold.ttf")
# This explicit set excludes superseded QA screens left in the media directory.
STATES = ("overview", "prerequisites", "missing", "resolved", "paths", "timeline")


@dataclass(frozen=True)
class Scene:
    kind: str
    title: str
    caption: str
    seconds: float
    state: str | None = None
    accent: str = CYAN


def font(size: int, bold: bool = False) -> ImageFont.FreeTypeFont:
    candidates = [BOLD_FONT if bold else FONT, Path("/usr/share/fonts/truetype/dejavu/DejaVuSans.ttf")]
    for candidate in candidates:
        if candidate.exists():
            return ImageFont.truetype(str(candidate), size)
    raise SystemExit("No suitable font found. Install Avenir Next or DejaVu Sans.")


def fit_text(draw: ImageDraw.ImageDraw, text: str, maximum: int, width: int, bold: bool = False):
    size = maximum
    while size > 16:
        candidate = font(size, bold)
        if draw.textbbox((0, 0), text, font=candidate)[2] <= width:
            return candidate
        size -= 1
    return font(size, bold)


def wrapped(draw: ImageDraw.ImageDraw, text: str, face, max_width: int):
    lines, current = [], ""
    for word in text.split():
        proposal = f"{current} {word}".strip()
        if current and draw.textbbox((0, 0), proposal, font=face)[2] > max_width:
            lines.append(current)
            current = word
        else:
            current = proposal
    if current:
        lines.append(current)
    return lines


def mark(draw: ImageDraw.ImageDraw, x: int, y: int, scale: float = 1):
    points = [(x, y + 21 * scale), (x + 24 * scale, y), (x + 48 * scale, y + 21 * scale)]
    draw.line(points, fill=INK, width=max(1, round(3 * scale)))
    for px, py in points:
        r = 5 * scale
        draw.ellipse((px-r, py-r, px+r, py+r), fill=INK)


def rounded_image(base: Image.Image, source: Image.Image, box, radius=16, shadow=True):
    x, y, width, height = box
    source = source.convert("RGB")
    scale = min(width / source.width, height / source.height)
    source = source.resize((round(source.width * scale), round(source.height * scale)), Image.Resampling.LANCZOS)
    px, py = x + (width-source.width)//2, y + (height-source.height)//2
    if shadow:
        layer = Image.new("RGBA", base.size)
        draw = ImageDraw.Draw(layer)
        draw.rounded_rectangle((px-1, py+5, px+source.width+1, py+source.height+12), radius, fill=(28, 48, 38, 24))
        base.alpha_composite(layer.filter(ImageFilter.GaussianBlur(18)))
    mask = Image.new("L", source.size)
    ImageDraw.Draw(mask).rounded_rectangle((0, 0, source.width-1, source.height-1), radius, fill=255)
    base.paste(source, (px, py), mask)
    ImageDraw.Draw(base).rounded_rectangle((px, py, px+source.width-1, py+source.height-1), radius, outline=LINE, width=1)


def render_frame(scene: Scene, assets: dict[str, Path], destination: Path, size, number: int, count: int, url: str):
    # Design at native 1080p, then downsample in preview. This keeps layouts identical.
    image = Image.new("RGBA", (1920, 1080), BG)
    draw = ImageDraw.Draw(image)
    if scene.kind in ("screen", "loop"):
        mark(draw, 61, 39, .65)
        draw.text((112, 27), "CourseGraph", font=font(26, True), fill=INK)
        draw.text((1860, 25), "MIT DATA · LOCAL BROWSER SAVES · NO SIGN-IN", font=font(17), fill=MUTED, anchor="ra")
        draw.text((1860, 51), "Partial catalog · No degree certification", font=font(14), fill=MUTED, anchor="ra")
        draw.line((60, 72, 1860, 72), fill=LINE, width=1)
        draw.text((60, 91), scene.title, font=fit_text(draw, scene.title, 39, 1770, True), fill=INK)
        with Image.open(assets[scene.state]) as screenshot:
            rounded_image(image, screenshot, (40, 150, 1840, 835), radius=13)
        draw = ImageDraw.Draw(image)
        draw.line((60, 1003, 1860, 1003), fill=LINE, width=1)
        draw.rounded_rectangle((61, 1026, 69, 1050), radius=4, fill=scene.accent)
        draw.text((86, 1020), scene.caption, font=fit_text(draw, scene.caption, 26, 1640), fill=INK)
        draw.text((1858, 1024), f"{number:02d} / {count:02d}", font=font(20), fill=MUTED, anchor="ra")
    else:
        # A graphic title card, clearly distinct from captured application UI.
        mark(draw, 82, 70, .8)
        draw.text((145, 57), "CourseGraph", font=font(31, True), fill=INK)
        draw.text((1840, 65), "EXPLORE YOUR POSSIBILITIES", font=font(21), fill=MUTED, anchor="ra")
        if scene.kind == "intro":
            draw.text((83, 220), "A clearer way to", font=font(70), fill=INK)
            draw.text((80, 307), "see your future.", font=font(86, True), fill=INK)
            y = 451
            for line in wrapped(draw, scene.caption, font(31), 830):
                draw.text((85, y), line, font=font(31), fill=MUTED)
                y += 46
            with Image.open(assets["overview"]) as screenshot:
                rounded_image(image, screenshot, (955, 201, 891, 660), radius=18)
            draw.text((85, 931), "One foundation. More than one possible path.", font=font(27), fill=INK)
            draw.line((85, 990, 1835, 990), fill=LINE, width=1)
        else:
            draw.text((960, 270), "Keep more than", font=font(77), fill=INK, anchor="mt")
            draw.text((960, 375), "one future.", font=font(99, True), fill=INK, anchor="mt")
            draw.text((960, 564), scene.caption, font=fit_text(draw, scene.caption, 31, 1630), fill=MUTED, anchor="mt")
            draw.rounded_rectangle((420, 674, 1500, 778), radius=20, fill=INK)
            display_url = url.removeprefix("https://").removeprefix("http://").rstrip("/")
            draw.text((960, 697), display_url, font=fit_text(draw, display_url, 39, 1000, True), fill="white", anchor="mt")
            draw.text((960, 870), "Saved in your browser · No sign-in or cloud sync", font=font(23), fill=MUTED, anchor="mt")
            draw.text((960, 911), "Partial MIT data · No degree certification", font=font(24), fill=MUTED, anchor="mt")
            draw.text((960, 958), "Edited from actual prototype screenshots · No simulated clicks", font=font(19), fill=MUTED, anchor="mt")
    if size != (1920, 1080):
        image = image.resize(size, Image.Resampling.LANCZOS)
    image.convert("RGB").save(destination)


def make_scenes(assets: dict[str, Path]):
    descriptions = {
        "overview": ("See where your foundations can lead.", "Follow connected MIT subjects toward a program goal.", CYAN),
        "prerequisites": ("See the steps behind the next step.", "Prerequisites point inward. Later possibilities branch outward.", CYAN),
        "missing": ("Make a missing step visible.", "A course warning connects the missing requirement to your plan.", AMBER),
        "resolved": ("Turn a missing step into a plan.", "Place the prerequisite in an earlier term and review what changes.", CYAN),
        "paths": ("Compare possible futures.", "Keep several named paths in this browser. Export a backup to take them with you.", VIOLET),
        "timeline": ("Bring possibilities into a semester plan.", "Plan course order. Meeting-time conflicts remain unknown without section data.", CYAN),
    }
    # Give warnings and their repair time to read; normalize if a capture is absent.
    keys = [key for key in STATES if key in assets]
    weights = {"overview": 5.5, "prerequisites": 7, "missing": 7, "resolved": 7.5, "paths": 7, "timeline": 7}
    scale = 41 / sum(weights[key] for key in keys)
    explainer = [Scene("intro", "A clearer way to see your future.", "Make course relationships visible. Help students explore their next possibility.", 5)]
    explainer += [Scene("screen", *descriptions[key][:2], weights[key] * scale, key, descriptions[key][2]) for key in keys]
    explainer += [Scene("outro", "Keep more than one future.", "An academic path explorer for students and the schools that guide them.", 6)]
    # A verified repair screenshot strengthens cause-and-effect; without one, never fake it.
    loop_keys = [key for key in ("prerequisites", "missing", "resolved", "paths") if key in assets]
    if len(loop_keys) < 3:
        loop_keys = list(dict.fromkeys(["overview", *loop_keys, *keys]))[:3]
    loop_keys = loop_keys[:4]
    quick = {
        "prerequisites": ("See what opens next.", "Prerequisites in cyan. Later possibilities in violet."),
        "missing": ("Spot the missing step.", "See which requirement your course still needs."),
        "resolved": ("Connect the next step.", "Plan the missing prerequisite in an earlier term."),
        "paths": ("Keep another future.", "Save named alternatives in this browser."),
    }
    loop = [Scene("loop", *quick.get(key, descriptions[key][:2]), 10.8 / len(loop_keys), key, descriptions[key][2]) for key in loop_keys]
    return explainer, loop


def run(command: list[str]):
    subprocess.run(command, check=True)


def compose_video(ffmpeg: str, frames: list[Path], scenes: list[Scene], output: Path, fps: int, size, preview: bool):
    transition = .3
    # Each input includes overlap, keeping each scene's readable duration and the
    # aggregate film at the storyboard's nominal length.
    command = [ffmpeg, "-hide_banner", "-loglevel", "warning", "-y", "-filter_complex_threads", "1"]
    durations = [s.seconds + (transition if i < len(scenes)-1 else 0) for i, s in enumerate(scenes)]
    for path, duration in zip(frames, durations):
        command += ["-loop", "1", "-framerate", str(fps), "-t", f"{duration:.4f}", "-i", str(path)]
    filters = []
    for i, duration in enumerate(durations):
        # The explainer has a gentle presentation push-in. The short loop holds
        # each screen still for readability and efficient GIF compression.
        frames_count = max(1, round(duration * fps))
        zoom = "1" if scenes[i].kind == "loop" else f"1+0.004*on/{frames_count}"
        filters.append(f"[{i}:v]zoompan=z='{zoom}':x='iw/2-iw/zoom/2':y='ih/2-ih/zoom/2':d=1:s={size[0]}x{size[1]}:fps={fps},format=yuv420p,settb=AVTB,setpts=PTS-STARTPTS[v{i}]")
    previous = "v0"
    elapsed = durations[0]
    for i in range(1, len(scenes)):
        name = f"f{i}"
        offset = elapsed-transition
        filters.append(f"[{previous}][v{i}]xfade=transition=fade:duration={transition}:offset={offset:.4f}[{name}]")
        elapsed += durations[i]-transition
        previous = name
    command += ["-filter_complex", ";".join(filters), "-map", f"[{previous}]", "-t", f"{sum(s.seconds for s in scenes):.3f}", "-an", "-c:v", "libx264", "-preset", "veryfast" if preview else "medium", "-crf", "23" if preview else "19", "-pix_fmt", "yuv420p", "-threads", "2", "-movflags", "+faststart", str(output)]
    run(command)


def vtt_time(seconds: float):
    milliseconds = round(seconds * 1000)
    hours, milliseconds = divmod(milliseconds, 3600000)
    minutes, milliseconds = divmod(milliseconds, 60000)
    secs, milliseconds = divmod(milliseconds, 1000)
    return f"{hours:02}:{minutes:02}:{secs:02}.{milliseconds:03}"


def write_captions(path: Path, scenes: list[Scene]):
    result, start = ["WEBVTT", ""], 0.0
    for i, scene in enumerate(scenes, 1):
        end = start + scene.seconds
        result += [str(i), f"{vtt_time(start)} --> {vtt_time(end)}", f"{scene.title} {scene.caption}", ""]
        start = end
    path.write_text("\n".join(result), encoding="utf-8")


def inspect_assets(directory: Path):
    assets = {}
    for key in STATES:
        for suffix in (".jpg", ".jpeg", ".png"):
            candidate = directory / f"{key}{suffix}"
            if candidate.is_file():
                assets[key] = candidate
                break
    if "overview" not in assets:
        raise SystemExit(f"Missing overview.jpg (or .png) in {directory}: capture the actual app first.")
    if len(assets) < 3:
        raise SystemExit("At least three distinct actual UI screenshot states are required; overview plus two named states.")
    fingerprints: dict[str, str] = {}
    for key, path in assets.items():
        digest = hashlib.sha256(path.read_bytes()).hexdigest()
        if digest in fingerprints:
            raise SystemExit(f"{path.name} duplicates {fingerprints[digest]}. Capture distinct actual UI states.")
        fingerprints[digest] = path.name
        try:
            with Image.open(path) as image:
                image.verify()
            with Image.open(path) as image:
                width, height = image.size
            if width < 1000 or height < 500:
                raise SystemExit(f"{path.name} is {width}×{height}; use a readable desktop capture of at least 1000×500.")
        except OSError as exc:
            raise SystemExit(f"Unreadable screenshot {path}: {exc}")
    return assets


def main():
    started = time.perf_counter()
    parser = argparse.ArgumentParser(description=__doc__, formatter_class=argparse.RawDescriptionHelpFormatter)
    parser.add_argument("--assets", type=Path, default=ROOT / "docs/media")
    parser.add_argument("--output-dir", type=Path, default=ROOT / "docs/media")
    parser.add_argument("--url", default="https://coursegraph.my")
    parser.add_argument("--fps", type=int, default=30)
    parser.add_argument("--gif-width", type=int, default=1200)
    parser.add_argument("--ffmpeg", default=shutil.which("ffmpeg") or "/opt/homebrew/bin/ffmpeg")
    parser.add_argument("--preview", action="store_true", help="Use 960×540 at 12 fps, quick encoding, and a 720 px GIF.")
    parser.add_argument("--check", action="store_true", help="Validate assets and print storyboard; do not write media.")
    parser.add_argument("--stills-only", action="store_true", help="Write designed frames and captions without encoding video.")
    parser.add_argument("--build-label", default="", help="Captured app build identifier for the media manifest.")
    args = parser.parse_args()
    if not 10 <= args.fps <= 60:
        parser.error("--fps must be between 10 and 60")
    if not 600 <= args.gif_width <= 1920:
        parser.error("--gif-width must be between 600 and 1920")
    if not args.url.startswith(("https://", "http://")):
        parser.error("--url must be an http(s) public URL")
    assets = inspect_assets(args.assets)
    explainer, loop = make_scenes(assets)
    evidence = {}
    for key, path in assets.items():
        with Image.open(path) as screenshot:
            dimensions = list(screenshot.size)
        evidence[key] = {"file": str(path), "sha256": hashlib.sha256(path.read_bytes()).hexdigest(), "dimensions": dimensions}
    report = {"assets": evidence, "captured_build": args.build_label or None, "explainer_seconds": round(sum(s.seconds for s in explainer), 2), "loop_seconds": round(sum(s.seconds for s in loop), 2), "explainer_states": [s.state or s.kind for s in explainer], "loop_states": [s.state for s in loop], "url": args.url, "presentation": "Composited from actual screenshots; no live screen recording is implied."}
    print(json.dumps(report, indent=2), flush=True)
    if args.check:
        return
    if not Path(args.ffmpeg).is_file() and not shutil.which(args.ffmpeg):
        raise SystemExit(f"FFmpeg not found: {args.ffmpeg}")
    args.output_dir.mkdir(parents=True, exist_ok=True)
    frame_dir = args.output_dir / "compositor-frames"
    frame_dir.mkdir(exist_ok=True)
    size = (960, 540) if args.preview else (1920, 1080)
    fps = 12 if args.preview else args.fps
    for name, scenes in (("explainer", explainer), ("wow", loop)):
        frames = []
        for i, scene in enumerate(scenes):
            destination = frame_dir / f"{name}-{i+1:02}.png"
            render_frame(scene, assets, destination, size, i+1, len(scenes), args.url)
            frames.append(destination)
        write_captions(args.output_dir / f"coursegraph-{name}.vtt", scenes)
        if name == "wow":
            shutil.copyfile(frames[0], args.output_dir / "coursegraph-poster.png")
        if not args.stills_only:
            print(f"Rendering {name} ({sum(s.seconds for s in scenes):.1f}s)…", flush=True)
            compose_video(args.ffmpeg, frames, scenes, args.output_dir / f"coursegraph-{name}.mp4", fps, size, args.preview)
    if not args.stills_only:
        width = 720 if args.preview else args.gif_width
        gif_fps = 10 if args.preview else min(15, fps)
        palette = frame_dir / "gif-palette.png"
        wow_path = args.output_dir / "coursegraph-wow.mp4"
        run([args.ffmpeg, "-hide_banner", "-loglevel", "warning", "-y", "-i", str(wow_path), "-vf", f"fps={gif_fps},scale={width}:-1:flags=lanczos,palettegen=stats_mode=diff:max_colors=192", "-frames:v", "1", "-update", "1", str(palette)])
        run([args.ffmpeg, "-hide_banner", "-loglevel", "warning", "-y", "-i", str(wow_path), "-i", str(palette), "-filter_complex_threads", "1", "-filter_complex", f"[0:v]fps={gif_fps},scale={width}:-1:flags=lanczos[v];[v][1:v]paletteuse=dither=sierra2_4a:diff_mode=rectangle", "-loop", "0", str(args.output_dir / "coursegraph-wow.gif")])
        gif_size = (args.output_dir / "coursegraph-wow.gif").stat().st_size
        print(f"GIF size: {gif_size/1024/1024:.1f} MiB", flush=True)
        if gif_size > 18 * 1024 * 1024:
            print("Consider --gif-width 1000 or a shorter state sequence before embedding in README.", file=sys.stderr)
    report["render_wall_seconds"] = round(time.perf_counter() - started, 2)
    (args.output_dir / "media-manifest.json").write_text(json.dumps(report, indent=2) + "\n", encoding="utf-8")
    print(f"Finished: {args.output_dir}", flush=True)


if __name__ == "__main__":
    main()

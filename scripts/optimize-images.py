"""One-off conversion: uploads/ (raw PNG/JPEG) -> assets/img/ (renamed, WebP).
Run once from the project root: python scripts/optimize-images.py
"""
from pathlib import Path
from PIL import Image

ROOT = Path(__file__).resolve().parent.parent
SRC = ROOT / "uploads"
DST = ROOT / "assets" / "img"
DST.mkdir(parents=True, exist_ok=True)

# (source filename, output filename, webp quality, alpha)
JOBS = [
    ("hero zone.png", "hero-zone.webp", 80, False),
    ("hero_person.png", "hero-person.webp", 90, True),
    ("cardio_zone.png", "cardio-zone.webp", 80, False),
    ("T_cube.png", "cube-t.webp", 90, True),
    ("E_cube.png", "cube-e.webp", 90, True),
    ("O_cube.png", "cube-o.webp", 90, True),
    ("teo_gimnasio.jpeg", "training.webp", 80, False),
    ("antes_hombre.jpeg", "before-man.webp", 80, False),
    ("despues_hombre.jpeg", "after-man.webp", 80, False),
    ("antes_mujer.jpeg", "before-woman.webp", 80, False),
    ("despues_mujer.jpeg", "after-woman.webp", 80, False),
    ("free_weigth_zone.png", "free-weight-zone.webp", 80, False),
    ("CTA_zone.png", "cta-zone.webp", 80, False),
]

total_before = 0
total_after = 0

for src_name, dst_name, quality, alpha in JOBS:
    src_path = SRC / src_name
    dst_path = DST / dst_name
    im = Image.open(src_path)
    im = im.convert("RGBA" if alpha else "RGB")
    im.save(dst_path, "WEBP", quality=quality, method=6)
    before = src_path.stat().st_size
    after = dst_path.stat().st_size
    total_before += before
    total_after += after
    print(f"{src_name:26s} {before/1024:8.1f}KB -> {dst_name:22s} {after/1024:8.1f}KB")

# Favicon: downscale teo_icono.png to a small PNG (kept as PNG for broad favicon support)
icon_src = SRC / "teo_icono.png"
icon_dst = ROOT / "assets" / "img" / "favicon.png"
icon = Image.open(icon_src).convert("RGBA")
icon.thumbnail((256, 256))
icon.save(icon_dst, "PNG", optimize=True)
print(f"{'teo_icono.png':26s} {icon_src.stat().st_size/1024:8.1f}KB -> favicon.png (256px)  {icon_dst.stat().st_size/1024:8.1f}KB")

print(f"\nTotal: {total_before/1024:.0f}KB -> {total_after/1024:.0f}KB ({100 - total_after/total_before*100:.0f}% smaller)")

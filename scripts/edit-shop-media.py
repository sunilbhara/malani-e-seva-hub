"""Usage: python scripts/edit-shop-media.py (needs Pillow).
Edit the shop's real photos for the website: crop, gentle colour/contrast correction,
light sharpening, then responsive WebP sizes in public/shop/."""
import os
from PIL import Image, ImageEnhance, ImageFilter, ImageOps

SRC = "assets/originals/"
OUT = "public/shop/"


def load(name):
    return ImageOps.exif_transpose(Image.open(SRC + name)).convert("RGB")


def grade(im, warmth=1.0, color=1.08, contrast=1.06, bright=1.02):
    im = ImageOps.autocontrast(im, cutoff=(0.5, 0.5))
    im = ImageEnhance.Color(im).enhance(color)
    im = ImageEnhance.Contrast(im).enhance(contrast)
    im = ImageEnhance.Brightness(im).enhance(bright)
    if warmth != 1.0:
        r, g, b = im.split()
        r = r.point(lambda v: min(255, int(v * warmth)))
        b = b.point(lambda v: int(v / warmth))
        im = Image.merge("RGB", (r, g, b))
    return im.filter(ImageFilter.UnsharpMask(radius=1.2, percent=60, threshold=2))


def crop_ratio(im, ratio, fx=0.5, fy=0.5):
    """Crop to width/height = ratio around focus point (fx, fy in 0..1)."""
    w, h = im.size
    if w / h > ratio:
        nw = int(h * ratio)
        x = int(min(max(fx * w - nw / 2, 0), w - nw))
        return im.crop((x, 0, x + nw, h))
    nh = int(w / ratio)
    y = int(min(max(fy * h - nh / 2, 0), h - nh))
    return im.crop((0, y, w, y + nh))


def save(im, name, widths):
    for w in widths:
        if w > im.width * 1.05:
            continue
        out = im.resize((w, round(w * im.height / im.width)), Image.LANCZOS)
        path = f"{OUT}{name}-{w}.webp"
        out.save(path, "WEBP", quality=74, method=6)
        print(path, out.size, os.path.getsize(path) // 1024, "KB")


# Tiles (4:3)
save(crop_ratio(grade(load("shop-photo-04.jpeg")), 4 / 3, fx=0.55), "emitra", [480, 800])
save(crop_ratio(grade(load("shop-photo-08.jpeg")), 4 / 3), "mobile", [480, 800])
# Owner at the counter (4:3) — trust photo for About / Mobile page
save(crop_ratio(grade(load("shop-photo-03.jpeg"), warmth=1.02), 4 / 3, fx=0.3), "owner", [480, 800])
# Storefront, daytime (16:10) — home header and About
save(crop_ratio(grade(load("shop-photo-09.jpeg"), color=1.12), 16 / 10, fy=0.45), "storefront", [480, 800, 1200])
# Storefront at night (16:9) — Contact / visit us
save(crop_ratio(grade(load("shop-photo-10.jpeg"), contrast=1.04, bright=1.05), 16 / 9, fx=0.45), "storefront-night", [480, 800, 1200])
# Wide interior (16:9) — Mobile page / about
save(crop_ratio(grade(load("shop-photo-01.jpeg")), 16 / 9), "interior", [480, 800, 1200])
# Mataji Studio tile (4:3) from the studio's own wedding photo
save(crop_ratio(grade(load("studio-couple.jpg"), color=1.0, contrast=1.02), 4 / 3, fx=0.44), "studio", [480, 800])

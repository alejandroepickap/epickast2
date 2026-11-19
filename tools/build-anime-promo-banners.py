#!/usr/bin/env python3
"""
Builds 8 original Anime Game Promo / Convention Event Key-Visual profile banners (1280x400, 16:5 WebP)
in app/assets/banners/ with FULL-BLEED PURE ARTWORK (no giant baked-in text that gets clipped in thumbnails
or collides with UI labels/avatars).
"""
import os
import random
from PIL import Image, ImageDraw, ImageEnhance, ImageFilter, ImageOps

ROOT = os.path.dirname(os.path.dirname(os.path.abspath(__file__)))
BANNERS_DIR = os.path.join(ROOT, "app", "assets", "banners")
BOSSES_DIR = os.path.join(ROOT, "app", "assets", "bosses")
CARDS_DIR = os.path.join(ROOT, "app", "assets", "cards")
ARTIFACTS_DIR = r"C:\Users\puma1\.gemini\antigravity\brain\bf8150e0-4a95-4cd2-8c9a-c923ce2853c7"

W, H = 1280, 400


def crop_16_5(img, y_bias=0.22, contrast=1.10, saturation=1.16):
    img = img.convert("RGB")
    iw, ih = img.size
    target_ratio = W / H
    cur_ratio = iw / ih
    if cur_ratio > target_ratio:
        new_w = int(ih * target_ratio)
        left = (iw - new_w) // 2
        img = img.crop((left, 0, left + new_w, ih))
    else:
        new_h = int(iw / target_ratio)
        max_top = max(0, ih - new_h)
        top = int(max_top * y_bias)
        img = img.crop((0, top, iw, top + new_h))
    img = img.resize((W, H), Image.Resampling.LANCZOS)
    if contrast != 1.0:
        img = ImageEnhance.Contrast(img).enhance(contrast)
    if saturation != 1.0:
        img = ImageEnhance.Color(img).enhance(saturation)
    return img


def add_subtle_poster_trim(img, accent=(56, 189, 248), secondary=(244, 63, 94)):
    """Adds subtle corner framing and a delicate top/bottom cinematic border without baked text."""
    canvas = img.convert("RGBA")
    overlay = Image.new("RGBA", (W, H), (0, 0, 0, 0))
    d = ImageDraw.Draw(overlay)

    # Subtle glowing top & bottom accent lines
    d.line([(20, 14), (160, 14)], fill=(*accent, 180), width=2)
    d.line([(W - 160, 14), (W - 20, 14)], fill=(*secondary, 180), width=2)
    d.line([(W - 20, 14), (W - 20, 52)], fill=(*secondary, 180), width=2)
    d.line([(W - 160, H - 14), (W - 20, H - 14)], fill=(*accent, 160), width=2)
    d.line([(W - 20, H - 52), (W - 20, H - 14)], fill=(*accent, 160), width=2)

    return Image.alpha_composite(canvas, overlay)


def add_glow_particles(img, color1=(251, 113, 133), color2=(56, 189, 248), count=28, seed=42):
    rng = random.Random(seed)
    canvas = img.convert("RGBA")
    glow = Image.new("RGBA", (W, H), (0, 0, 0, 0))
    d = ImageDraw.Draw(glow)
    for i in range(count):
        px = rng.randint(30, W - 30)
        py = rng.randint(20, H - 20)
        r = rng.uniform(1.8, 4.5)
        col = color1 if i % 2 == 0 else color2
        alpha = rng.randint(100, 210)
        d.ellipse([px - r * 2, py - r * 2, px + r * 2, py + r * 2], fill=(*col, alpha // 3))
        d.ellipse([px - r, py - r, px + r, py + r], fill=(255, 255, 255, alpha))
    glow = glow.filter(ImageFilter.GaussianBlur(0.8))
    return Image.alpha_composite(canvas, glow)


def save_webp(img, filename):
    out_path = os.path.join(BANNERS_DIR, filename)
    rgb = img.convert("RGB")
    rgb.save(out_path, "WEBP", quality=90, method=6)
    kb = os.path.getsize(out_path) / 1024.0
    print(f"  [OK] {filename} ({kb:.1f} KB)")
    return out_path


def build_all():
    os.makedirs(BANNERS_DIR, exist_ok=True)
    print("Generando 8 Banners Anime & Eventos 16:5 Full-Bleed Art (sin texto incrustado que se corte)...")

    # 1. CRIMSON MOON SHINOBI (Kurogane + Red Moon over Neo-Tokyo full bleed)
    p1 = os.path.join(BANNERS_DIR, "banner_anime_samurai.jpg")
    im1 = crop_16_5(Image.open(p1), y_bias=0.20, contrast=1.12, saturation=1.18)
    im1 = add_glow_particles(im1, (251, 113, 133), (244, 63, 94), count=24, seed=101)
    im1 = add_subtle_poster_trim(im1, (251, 113, 133), (244, 63, 94))
    save_webp(im1, "promo_crimson_shinobi.webp")

    # 2. NEO-SHIBUYA DRIFT GP (Renji + JDM GT-R in Neon Tokyo full bleed)
    p2 = os.path.join(BANNERS_DIR, "banner_cyber_drift.jpg")
    im2 = crop_16_5(Image.open(p2), y_bias=0.16, contrast=1.10, saturation=1.18)
    im2 = add_glow_particles(im2, (56, 189, 248), (192, 132, 252), count=24, seed=202)
    im2 = add_subtle_poster_trim(im2, (56, 189, 248), (168, 85, 247))
    save_webp(im2, "promo_neotokyo_drift_gp.webp")

    # 3. CYBER SOUND MATSURI (Akira in Neon Alley full bleed, mirrored so character is on right-center)
    p3 = os.path.join(BANNERS_DIR, "banner_urban_streetwear.jpg")
    raw3 = ImageOps.mirror(Image.open(p3).convert("RGB"))
    im3 = crop_16_5(raw3, y_bias=0.14, contrast=1.10, saturation=1.20)
    im3 = add_glow_particles(im3, (34, 211, 238), (236, 72, 153), count=26, seed=303)
    im3 = add_subtle_poster_trim(im3, (34, 211, 238), (236, 72, 153))
    save_webp(im3, "promo_cyber_idol_matsuri.webp")

    # 4. GRAND DOJO TOURNAMENT · ELEMENTAL CLASH (Full-width 3-character diagonal split: Ignis + Ryujin + Torrent)
    bg4 = Image.new("RGBA", (W, H), (14, 18, 34, 255))
    ignis = Image.open(os.path.join(BOSSES_DIR, "ignis.jpg")).convert("RGB")
    sensei = Image.open(os.path.join(CARDS_DIR, "dojo_sensei_hero.jpg")).convert("RGB")
    torrent = Image.open(os.path.join(BOSSES_DIR, "torrent.jpg")).convert("RGB")

    panels = [
        (ignis, -60, 445, (249, 115, 22), False),
        (sensei, 415, 875, (250, 204, 21), True),
        (torrent, 845, 1340, (56, 189, 248), True),
    ]
    skew = 44
    for char_im, x0, x1, border_col, draw_left_line in panels:
        pw = (x1 - x0) + skew * 2
        c_resized = ImageOps.fit(char_im, (pw, H), method=Image.Resampling.LANCZOS, centering=(0.5, 0.20))
        c_resized = ImageEnhance.Contrast(c_resized).enhance(1.10)
        c_resized = ImageEnhance.Color(c_resized).enhance(1.15)
        mask = Image.new("L", (W, H), 0)
        md = ImageDraw.Draw(mask)
        poly = [(x0 + skew, 0), (x1 + skew, 0), (x1 - skew, H), (x0 - skew, H)]
        md.polygon(poly, fill=255)
        panel_layer = Image.new("RGBA", (W, H), (0, 0, 0, 0))
        panel_layer.paste(c_resized.convert("RGBA"), (x0 - skew, 0))
        bg4 = Image.composite(panel_layer, bg4, mask)
        if draw_left_line:
            d4 = ImageDraw.Draw(bg4)
            d4.line([(x0 + skew, 0), (x0 - skew, H)], fill=(*border_col, 250), width=6)
            d4.line([(x0 + skew + 3, 0), (x0 - skew + 3, H)], fill=(255, 255, 255, 225), width=2)

    bg4 = add_glow_particles(bg4, (251, 191, 36), (56, 189, 248), count=28, seed=404)
    bg4 = add_subtle_poster_trim(bg4, (251, 191, 36), (56, 189, 248))
    save_webp(bg4, "promo_elemental_clash_tournament.webp")

    # 5. CHRONICLES OF AETHER · KAELEN DUAL-SOUL (Torch-lit Dojo + Dual-element anime ninja Kaelen)
    p5_art = os.path.join(ARTIFACTS_DIR, "concept_dojo_ninja_1795109628642.jpg")
    dojo_bg_path = os.path.join(ROOT, "app", "assets", "dojo-arena.jpg")
    bg5 = crop_16_5(Image.open(dojo_bg_path), y_bias=0.35, contrast=1.12, saturation=1.18).convert("RGBA")
    if os.path.exists(p5_art):
        kaelen = Image.open(p5_art).convert("RGB")
        k_fit = ImageOps.fit(kaelen, (820, H), method=Image.Resampling.LANCZOS, centering=(0.5, 0.22))
        k_fit = ImageEnhance.Contrast(k_fit).enhance(1.14)
        k_fit = ImageEnhance.Color(k_fit).enhance(1.22)
        mask5 = Image.new("L", (820, H), 0)
        m5px = mask5.load()
        for y in range(H):
            for x in range(820):
                fade = min(1.0, x / 240.0)
                m5px[x, y] = int(255 * (fade * fade * (3 - 2 * fade)))
        bg5.paste(k_fit.convert("RGBA"), (460, 0), mask5)
    bg5 = add_glow_particles(bg5, (251, 146, 60), (192, 132, 252), count=36, seed=505)
    bg5 = add_subtle_poster_trim(bg5, (251, 146, 60), (168, 85, 247))
    save_webp(bg5, "promo_shadow_flame_chronicles.webp")

    # 6. RIVAL SHOWDOWN · IGNIS VS. ZERO-FROST (Full-width 50/50 Diagonal Anime Versus Key Visual)
    bg6 = Image.new("RGBA", (W, H), (14, 12, 24, 255))
    frost = Image.open(os.path.join(BOSSES_DIR, "frost.jpg")).convert("RGB")
    vs_panels = [
        (ignis, -60, 660, (249, 115, 22), False),
        (frost, 620, 1340, (56, 189, 248), True),
    ]
    for char_im, x0, x1, border_col, draw_line in vs_panels:
        pw = (x1 - x0) + 100
        c_resized = ImageOps.fit(char_im, (pw, H), method=Image.Resampling.LANCZOS, centering=(0.5, 0.18))
        c_resized = ImageEnhance.Contrast(c_resized).enhance(1.12)
        c_resized = ImageEnhance.Color(c_resized).enhance(1.16)
        mask = Image.new("L", (W, H), 0)
        md = ImageDraw.Draw(mask)
        poly = [(x0 + 48, 0), (x1 + 48, 0), (x1 - 48, H), (x0 - 48, H)]
        md.polygon(poly, fill=255)
        layer = Image.new("RGBA", (W, H), (0, 0, 0, 0))
        layer.paste(c_resized.convert("RGBA"), (x0 - 48, 0))
        bg6 = Image.composite(layer, bg6, mask)
        if draw_line:
            d6 = ImageDraw.Draw(bg6)
            d6.line([(x0 + 48, 0), (x0 - 48, H)], fill=(249, 115, 22, 255), width=8)
            d6.line([(x0 + 54, 0), (x0 - 42, H)], fill=(56, 189, 248, 255), width=6)
            d6.line([(x0 + 51, 0), (x0 - 45, H)], fill=(255, 255, 255, 245), width=3)

    bg6 = add_glow_particles(bg6, (249, 115, 22), (56, 189, 248), count=34, seed=606)
    bg6 = add_subtle_poster_trim(bg6, (249, 115, 22), (56, 189, 248))
    save_webp(bg6, "promo_frost_vs_ignis_rivals.webp")

    # 7. WORLD BOSS RAID · DESPERTAR DEL COLOSO (Full-bleed Colossus artwork)
    p7 = os.path.join(BANNERS_DIR, "banner_colossus_lava.jpg")
    im7 = crop_16_5(Image.open(p7), y_bias=0.16, contrast=1.12, saturation=1.16)
    im7 = add_glow_particles(im7, (251, 146, 60), (250, 204, 21), count=30, seed=707)
    im7 = add_subtle_poster_trim(im7, (251, 191, 36), (239, 68, 68))
    save_webp(im7, "promo_colossus_raid_event.webp")

    # 8. CELESTIAL AURORA · WINTER CONVENTION (Full-bleed Aurora Crystal Temple artwork)
    p8 = os.path.join(BANNERS_DIR, "banner_glacial_aurora.jpg")
    im8 = crop_16_5(Image.open(p8), y_bias=0.32, contrast=1.10, saturation=1.20)
    im8 = add_glow_particles(im8, (52, 211, 153), (168, 85, 247), count=28, seed=808)
    im8 = add_subtle_poster_trim(im8, (52, 211, 153), (168, 85, 247))
    save_webp(im8, "promo_aurora_sanctuary_fest.webp")


if __name__ == "__main__":
    build_all()

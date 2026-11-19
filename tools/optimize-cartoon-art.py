#!/usr/bin/env python3
"""
Optimiza las ilustraciones aprobadas estilo caricatura Club Penguin a .webp livianos
para empaquetar dentro de app/assets/cartoon/ sin cargar el tamaño de la app.
"""
from pathlib import Path
from PIL import Image, ImageOps

ART_DIR = Path(r"C:\Users\puma1\.gemini\antigravity\brain\bf8150e0-4a95-4cd2-8c9a-c923ce2853c7")
OUT_DIR = Path(__file__).resolve().parent.parent / "app" / "assets" / "cartoon"

ASSETS = [
    ("dojo_hero.webp", "dojo_courtyard_banner_1795111273391.jpg", (960, 360), (0.5, 0.5)),
    ("racer_hero.webp", "epickap_kart_concept_art_1795111272835.jpg", (960, 360), (0.5, 0.55)),
    ("ninja_emblem.webp", "ninja_mascot_concept_1795111279935.jpg", (320, 320), (0.5, 0.45)),
    ("card_fire_dragon.webp", "baby_fire_dragon_card_art_1795111268596.jpg", (420, 420), (0.5, 0.5)),
    ("card_fire_phoenix.webp", "firebird_cartoon_illustration_1795111620731.jpg", (420, 420), (0.5, 0.5)),
    ("card_water_splash.webp", "baby_blue_otter_dolphin_wave_1795111615844.jpg", (420, 420), (0.5, 0.5)),
    ("card_snow_yeti.webp", "baby_yeti_penguin_snowball_v2_1795111630028.jpg", (420, 420), (0.5, 0.5)),
    ("banner_dojo_courtyard.webp", "dojo_courtyard_banner_1795111273391.jpg", (960, 300), (0.5, 0.52)),
    ("banner_sunny_valley.webp", "club_penguin_style_landscape_banner_1795111622774.jpg", (960, 300), (0.5, 0.55)),
    ("banner_snow_track.webp", "epickap_kart_concept_art_1795111272835.jpg", (960, 300), (0.5, 0.48)),
]


def main():
    OUT_DIR.mkdir(parents=True, exist_ok=True)
    total_bytes = 0
    for out_name, src_name, size, centering in ASSETS:
        src_path = ART_DIR / src_name
        if not src_path.exists():
            raise FileNotFoundError(f"Falta imagen fuente: {src_path}")
        with Image.open(src_path) as img:
            rgb = img.convert("RGB")
            fitted = ImageOps.fit(rgb, size, method=Image.Resampling.LANCZOS, centering=centering)
            out_path = OUT_DIR / out_name
            fitted.save(out_path, format="WEBP", quality=82, method=6)
            kb = out_path.stat().st_size / 1024
            total_bytes += out_path.stat().st_size
            print(f"OK {out_name}: {size[0]}x{size[1]} -> {kb:.1f} KB")
    print(f"TOTAL: {len(ASSETS)} archivos, {total_bytes / 1024:.1f} KB")


if __name__ == "__main__":
    main()

"""
NeoScan Brand Identity & Asset Generator
=========================================
Generates complete vector SVG suite, raster PNG icons, and favicon.ico in
the Deep Plum & Violet design system (#4C2365, #7F5D99, #9E7EB5, #C4A4DA).
"""

import os
import json
from PIL import Image, ImageDraw

PROJECT_ROOT = os.path.abspath(os.path.join(os.path.dirname(__file__), ".."))
ASSETS_DIR = os.path.join(PROJECT_ROOT, "frontend", "assets")
FRONTEND_DIR = os.path.join(PROJECT_ROOT, "frontend")
os.makedirs(ASSETS_DIR, exist_ok=True)

# 1. Generate logo-mark.svg
LOGO_MARK_SVG = '''<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 48 48" width="48" height="48" fill="none" role="img" aria-label="NeoScan Logo Mark">
  <defs>
    <linearGradient id="shieldGrad" x1="4" y1="4" x2="44" y2="44" gradientUnits="userSpaceOnUse">
      <stop offset="0%" stop-color="#4C2365"/>
      <stop offset="50%" stop-color="#6B3A8B"/>
      <stop offset="100%" stop-color="#7F5D99"/>
    </linearGradient>
    <linearGradient id="irisGrad" x1="14" y1="14" x2="34" y2="34" gradientUnits="userSpaceOnUse">
      <stop offset="0%" stop-color="#C4A4DA"/>
      <stop offset="100%" stop-color="#9E7EB5"/>
    </linearGradient>
    <radialGradient id="amberCore" cx="24" cy="24" r="6" gradientUnits="userSpaceOnUse">
      <stop offset="0%" stop-color="#FDE047"/>
      <stop offset="60%" stop-color="#F59E0B"/>
      <stop offset="100%" stop-color="#D97706"/>
    </radialGradient>
  </defs>
  <rect x="4" y="4" width="40" height="40" rx="14" fill="url(#shieldGrad)"/>
  <rect x="4.5" y="4.5" width="39" height="39" rx="13.5" stroke="#C4A4DA" stroke-opacity="0.3" stroke-width="1"/>
  <circle cx="24" cy="24" r="12" stroke="url(#irisGrad)" stroke-width="2.5" stroke-dasharray="14 4" stroke-linecap="round"/>
  <line x1="24" y1="7" x2="24" y2="10" stroke="#C4A4DA" stroke-width="2" stroke-linecap="round"/>
  <line x1="24" y1="38" x2="24" y2="41" stroke="#C4A4DA" stroke-width="2" stroke-linecap="round"/>
  <line x1="7" y1="24" x2="10" y2="24" stroke="#C4A4DA" stroke-width="2" stroke-linecap="round"/>
  <line x1="38" y1="24" x2="41" y2="24" stroke="#C4A4DA" stroke-width="2" stroke-linecap="round"/>
  <circle cx="24" cy="24" r="5.5" fill="url(#amberCore)"/>
  <path d="M21.5 24.5C21.5 22.8 24 21.2 24 21.2C24 21.2 26.5 22.8 26.5 24.5C26.5 25.8 25.4 26.8 24 26.8C22.6 26.8 21.5 25.8 21.5 24.5Z" fill="#FFFFFF" fill-opacity="0.95"/>
</svg>'''

with open(os.path.join(ASSETS_DIR, "logo-mark.svg"), "w", encoding="utf-8") as f:
    f.write(LOGO_MARK_SVG)

# Favicon SVG (identical mark)
with open(os.path.join(FRONTEND_DIR, "favicon.svg"), "w", encoding="utf-8") as f:
    f.write(LOGO_MARK_SVG)

# 2. Generate logo.svg (horizontal logo with wordmark)
LOGO_HORIZONTAL_SVG = '''<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 200 48" width="200" height="48" fill="none" role="img" aria-label="NeoScan Pediatric Screening Logo">
  <defs>
    <linearGradient id="shieldGradH" x1="4" y1="4" x2="44" y2="44" gradientUnits="userSpaceOnUse">
      <stop offset="0%" stop-color="#4C2365"/>
      <stop offset="50%" stop-color="#6B3A8B"/>
      <stop offset="100%" stop-color="#7F5D99"/>
    </linearGradient>
    <linearGradient id="irisGradH" x1="14" y1="14" x2="34" y2="34" gradientUnits="userSpaceOnUse">
      <stop offset="0%" stop-color="#C4A4DA"/>
      <stop offset="100%" stop-color="#9E7EB5"/>
    </linearGradient>
    <radialGradient id="amberCoreH" cx="24" cy="24" r="6" gradientUnits="userSpaceOnUse">
      <stop offset="0%" stop-color="#FDE047"/>
      <stop offset="60%" stop-color="#F59E0B"/>
      <stop offset="100%" stop-color="#D97706"/>
    </radialGradient>
  </defs>
  <g transform="translate(0, 0)">
    <rect x="4" y="4" width="40" height="40" rx="14" fill="url(#shieldGradH)"/>
    <rect x="4.5" y="4.5" width="39" height="39" rx="13.5" stroke="#C4A4DA" stroke-opacity="0.3" stroke-width="1"/>
    <circle cx="24" cy="24" r="12" stroke="url(#irisGradH)" stroke-width="2.5" stroke-dasharray="14 4" stroke-linecap="round"/>
    <line x1="24" y1="7" x2="24" y2="10" stroke="#C4A4DA" stroke-width="2" stroke-linecap="round"/>
    <line x1="24" y1="38" x2="24" y2="41" stroke="#C4A4DA" stroke-width="2" stroke-linecap="round"/>
    <line x1="7" y1="24" x2="10" y2="24" stroke="#C4A4DA" stroke-width="2" stroke-linecap="round"/>
    <line x1="38" y1="24" x2="41" y2="24" stroke="#C4A4DA" stroke-width="2" stroke-linecap="round"/>
    <circle cx="24" cy="24" r="5.5" fill="url(#amberCoreH)"/>
    <path d="M21.5 24.5C21.5 22.8 24 21.2 24 21.2C24 21.2 26.5 22.8 26.5 24.5C26.5 25.8 25.4 26.8 24 26.8C22.6 26.8 21.5 25.8 21.5 24.5Z" fill="#FFFFFF" fill-opacity="0.95"/>
  </g>
  <text x="56" y="27" font-family="-apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, Helvetica, Arial, sans-serif" font-size="22" font-weight="800" fill="#2A1138" letter-spacing="-0.02em">NeoScan</text>
  <rect x="146" y="14" width="48" height="17" rx="8.5" fill="#EFE8F5" stroke="#D4C2E3" stroke-width="0.8"/>
  <text x="170" y="26" font-family="-apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, Helvetica, Arial, sans-serif" font-size="8.5" font-weight="700" fill="#4C2365" letter-spacing="0.05em" text-anchor="middle">PEDIATRIC</text>
  <text x="56" y="41" font-family="-apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, Helvetica, Arial, sans-serif" font-size="10.5" font-weight="500" fill="#725B7E">Neonatal Screening</text>
</svg>'''

with open(os.path.join(ASSETS_DIR, "logo.svg"), "w", encoding="utf-8") as f:
    f.write(LOGO_HORIZONTAL_SVG)

# 3. Generate logo-light.svg (for dark backgrounds)
LOGO_LIGHT_SVG = LOGO_HORIZONTAL_SVG.replace('fill="#2A1138"', 'fill="#FFFFFF"').replace('fill="#725B7E"', 'fill="#C4A4DA"').replace('fill="#EFE8F5"', 'fill="rgba(255,255,255,0.15)"').replace('fill="#4C2365"', 'fill="#FFFFFF"')

with open(os.path.join(ASSETS_DIR, "logo-light.svg"), "w", encoding="utf-8") as f:
    f.write(LOGO_LIGHT_SVG)

# 4. Generate high-resolution PNG raster assets via Pillow
def render_brand_icon(size: int) -> Image.Image:
    """Renders pixel-crisp brand icon at target square size."""
    img = Image.new("RGBA", (size, size), (0, 0, 0, 0))
    draw = ImageDraw.Draw(img)
    
    pad = int(size * 0.08)
    radius = int(size * 0.28)
    # Deep Plum rounded base
    draw.rounded_rectangle([pad, pad, size - pad, size - pad], radius=radius, fill=(76, 35, 101, 255))
    
    # Outer subtle stroke
    stroke_w = max(1, int(size * 0.02))
    draw.rounded_rectangle([pad, pad, size - pad, size - pad], radius=radius, outline=(196, 164, 218, 90), width=stroke_w)
    
    # Optical circle ring
    center = size // 2
    ring_r = int(size * 0.25)
    ring_w = max(2, int(size * 0.05))
    draw.ellipse([center - ring_r, center - ring_r, center + ring_r, center + ring_r], outline=(158, 126, 181, 220), width=ring_w)
    
    # Amber-gold center core
    core_r = int(size * 0.12)
    draw.ellipse([center - core_r, center - core_r, center + core_r, center + core_r], fill=(245, 158, 11, 255))
    
    # Inner white dot / beacon
    dot_r = max(2, int(size * 0.04))
    draw.ellipse([center - dot_r, center - dot_r, center + dot_r, center + dot_r], fill=(255, 255, 255, 250))
    return img

# Apple Touch Icon (180x180)
apple_touch_icon = render_brand_icon(180)
apple_touch_icon.save(os.path.join(FRONTEND_DIR, "apple-touch-icon.png"), "PNG")
apple_touch_icon.save(os.path.join(ASSETS_DIR, "apple-touch-icon.png"), "PNG")

# PWA icons
icon_192 = render_brand_icon(192)
icon_192.save(os.path.join(FRONTEND_DIR, "icon-192.png"), "PNG")
icon_192.save(os.path.join(ASSETS_DIR, "icon-192.png"), "PNG")

icon_512 = render_brand_icon(512)
icon_512.save(os.path.join(FRONTEND_DIR, "icon-512.png"), "PNG")
icon_512.save(os.path.join(ASSETS_DIR, "icon-512.png"), "PNG")

# Favicon ICO (multi-size: 16, 32, 48)
ico_16 = render_brand_icon(16)
ico_32 = render_brand_icon(32)
ico_48 = render_brand_icon(48)
ico_48.save(
    os.path.join(FRONTEND_DIR, "favicon.ico"),
    format="ICO",
    sizes=[(16, 16), (32, 32), (48, 48)]
)
ico_48.save(
    os.path.join(ASSETS_DIR, "favicon.ico"),
    format="ICO",
    sizes=[(16, 16), (32, 32), (48, 48)]
)

# 5. Generate PWA manifest.json
MANIFEST = {
    "name": "NeoScan — Neonatal Jaundice Screening",
    "short_name": "NeoScan",
    "description": "Lighting-robust clinical screening for neonatal jaundice with physiological color calibration.",
    "start_url": "/",
    "display": "standalone",
    "background_color": "#F7F3FA",
    "theme_color": "#4C2365",
    "icons": [
        {
            "src": "/app/icon-192.png",
            "sizes": "192x192",
            "type": "image/png",
            "purpose": "any maskable"
        },
        {
            "src": "/app/icon-512.png",
            "sizes": "512x512",
            "type": "image/png",
            "purpose": "any maskable"
        },
        {
            "src": "/app/favicon.svg",
            "sizes": "any",
            "type": "image/svg+xml"
        }
    ]
}

with open(os.path.join(FRONTEND_DIR, "manifest.json"), "w", encoding="utf-8") as f:
    json.dump(MANIFEST, f, indent=2)

print("Brand assets successfully generated:")
print(f"- {os.path.join(ASSETS_DIR, 'logo.svg')} (200x48)")
print(f"- {os.path.join(ASSETS_DIR, 'logo-mark.svg')} (48x48)")
print(f"- {os.path.join(FRONTEND_DIR, 'favicon.svg')} (SVG favicon)")
print(f"- {os.path.join(FRONTEND_DIR, 'favicon.ico')} (Multi-size ICO)")
print(f"- {os.path.join(FRONTEND_DIR, 'apple-touch-icon.png')} (180x180)")
print(f"- {os.path.join(FRONTEND_DIR, 'icon-192.png')} (192x192)")
print(f"- {os.path.join(FRONTEND_DIR, 'icon-512.png')} (512x512)")
print(f"- {os.path.join(FRONTEND_DIR, 'manifest.json')} (PWA Web App Manifest)")

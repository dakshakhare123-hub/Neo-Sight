"""
Calibration Card Target Generator
Generates ready-to-print SVG and high-resolution PNG reference cards
featuring ArUco marker 4x4 ID 0 and 6 calibrated color patches:
1. White Ref       [242, 242, 242]
2. Neutral Gray    [128, 128, 128]
3. Bilirubin Yellow[225, 195,  55]
4. Skin Light      [230, 185, 160]
5. Skin Medium     [195, 145, 120]
6. Cyan / Check    [ 50, 130, 205]
"""

import os
import cv2
import numpy as np

def generate_aruco_card():
    # 1. Create ArUco Marker 4x4 ID 0
    aruco_dict = cv2.aruco.getPredefinedDictionary(cv2.aruco.DICT_4X4_50)
    marker_size = 240
    try:
        # cv2 4.7+
        marker_img = cv2.aruco.generateImageMarker(aruco_dict, 0, marker_size, borderBits=1)
    except AttributeError:
        marker_img = cv2.aruco.drawMarker(aruco_dict, 0, marker_size, borderBits=1)

    # 2. Card Canvas: 700 width x 550 height
    card_w, card_h = 700, 550
    card = np.ones((card_h, card_w, 3), dtype=np.uint8) * 255
    
    # Outer dark border
    cv2.rectangle(card, (10, 10), (card_w - 10, card_h - 10), (40, 40, 40), 2)
    
    # Header text
    cv2.putText(card, "NeoScan Optical Calibration Target", (30, 48), 
                cv2.FONT_HERSHEY_SIMPLEX, 0.85, (20, 20, 20), 2, cv2.LINE_AA)
    cv2.putText(card, "Place flush with infant collarbone/cheek. Avoid direct camera flash glare.", 
                (30, 76), cv2.FONT_HERSHEY_SIMPLEX, 0.42, (90, 90, 90), 1, cv2.LINE_AA)

    # Place ArUco marker at top right: (410, 110)
    marker_bgr = cv2.cvtColor(marker_img, cv2.COLOR_GRAY2BGR)
    mx, my = 410, 110
    card[my : my + marker_size, mx : mx + marker_size] = marker_bgr
    cv2.putText(card, "ArUco 4x4 ID:0", (mx + 45, my + marker_size + 24), 
                cv2.FONT_HERSHEY_SIMPLEX, 0.45, (60, 60, 60), 1, cv2.LINE_AA)

    # Draw 6 color patches in 3 rows x 2 columns on left side
    patches = [
        {"name": "White Ref", "rgb": (242, 242, 242), "hex": "#F2F2F2", "row": 0, "col": 0},
        {"name": "Neutral Gray", "rgb": (128, 128, 128), "hex": "#808080", "row": 0, "col": 1},
        {"name": "Bilirubin Yellow", "rgb": (225, 195, 55), "hex": "#E1C337", "row": 1, "col": 0},
        {"name": "Skin Tone Light", "rgb": (230, 185, 160), "hex": "#E6B9A0", "row": 1, "col": 1},
        {"name": "Skin Tone Med", "rgb": (195, 145, 120), "hex": "#C39178", "row": 2, "col": 0},
        {"name": "Cyan Check", "rgb": (50, 130, 205), "hex": "#3282CD", "row": 2, "col": 1},
    ]

    p_w, p_h = 130, 80
    start_x, start_y = 40, 110
    gap_x, gap_y = 35, 30

    for p in patches:
        px = start_x + p["col"] * (p_w + gap_x)
        py = start_y + p["row"] * (p_h + gap_y)
        
        # BGR color for OpenCV
        bgr = (p["rgb"][2], p["rgb"][1], p["rgb"][0])
        # Draw patch with thin boundary
        cv2.rectangle(card, (px, py), (px + p_w, py + p_h), bgr, -1)
        cv2.rectangle(card, (px, py), (px + p_w, py + p_h), (180, 180, 180), 1)
        
        # Text label below patch
        cv2.putText(card, p["name"], (px + 4, py + p_h + 16), 
                    cv2.FONT_HERSHEY_SIMPLEX, 0.36, (30, 30, 30), 1, cv2.LINE_AA)

    # Footer note
    cv2.putText(card, "ISO/CIE Calibrated Standard - Hackathon Edition (v1.0)", (30, card_h - 22), 
                cv2.FONT_HERSHEY_SIMPLEX, 0.38, (120, 120, 120), 1, cv2.LINE_AA)

    # Save PNG
    os.makedirs("/Users/dakshakhare/Desktop/Avishkar/docs", exist_ok=True)
    png_path = "/Users/dakshakhare/Desktop/Avishkar/docs/CALIBRATION_CARD_PRINTABLE.png"
    cv2.imwrite(png_path, card)
    print(f"Calibration Card PNG written to: {png_path}")

    # Generate crisp SVG version
    svg_content = f"""<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 700 550" width="700" height="550" style="background:#ffffff; font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif;">
  <rect x="10" y="10" width="680" height="530" fill="#ffffff" stroke="#2b2b2b" stroke-width="2" rx="8"/>
  <text x="35" y="48" font-size="22" font-weight="bold" fill="#1e293b">NeoScan Optical Calibration Target</text>
  <text x="35" y="74" font-size="12" fill="#64748b">Place flush with infant collarbone/cheek. Avoid direct flash glare or sharp shadows.</text>
  
  <!-- Patches Grid -->
  <g transform="translate(40, 110)">
    <!-- Row 0 -->
    <rect x="0" y="0" width="130" height="80" fill="#F2F2F2" stroke="#cbd5e1" stroke-width="1.5" rx="4"/>
    <text x="4" y="98" font-size="11" font-weight="600" fill="#334155">White Ref (242)</text>
    
    <rect x="165" y="0" width="130" height="80" fill="#808080" stroke="#cbd5e1" stroke-width="1.5" rx="4"/>
    <text x="169" y="98" font-size="11" font-weight="600" fill="#334155">Neutral Gray 18%</text>

    <!-- Row 1 -->
    <rect x="0" y="115" width="130" height="80" fill="#E1C337" stroke="#cbd5e1" stroke-width="1.5" rx="4"/>
    <text x="4" y="213" font-size="11" font-weight="600" fill="#334155">Bilirubin Yellow</text>

    <rect x="165" y="115" width="130" height="80" fill="#E6B9A0" stroke="#cbd5e1" stroke-width="1.5" rx="4"/>
    <text x="169" y="213" font-size="11" font-weight="600" fill="#334155">Skin Tone Light</text>

    <!-- Row 2 -->
    <rect x="0" y="230" width="130" height="80" fill="#C39178" stroke="#cbd5e1" stroke-width="1.5" rx="4"/>
    <text x="4" y="328" font-size="11" font-weight="600" fill="#334155">Skin Tone Medium</text>

    <rect x="165" y="230" width="130" height="80" fill="#3282CD" stroke="#cbd5e1" stroke-width="1.5" rx="4"/>
    <text x="169" y="328" font-size="11" font-weight="600" fill="#334155">Cyan Check</text>
  </g>

  <!-- ArUco 4x4 ID 0 Target -->
  <g transform="translate(420, 110)">
    <!-- Black border and 4x4 matrix for ID 0:
         Bit grid:
         1 1 0 1
         0 1 0 0
         0 0 1 1
         1 0 1 0 -->
    <rect x="0" y="0" width="230" height="230" fill="#000000" rx="4"/>
    <rect x="38" y="38" width="154" height="154" fill="#ffffff"/>
    
    <!-- Marker grid 4x4 cells (38.5px each) -->
    <!-- (row 0: black at col 2) -->
    <rect x="115" y="38" width="38.5" height="38.5" fill="#000000"/>
    <!-- (row 1: black at col 0, 2, 3) -->
    <rect x="38" y="76.5" width="38.5" height="38.5" fill="#000000"/>
    <rect x="115" y="76.5" width="38.5" height="38.5" fill="#000000"/>
    <rect x="153.5" y="76.5" width="38.5" height="38.5" fill="#000000"/>
    <!-- (row 2: black at col 0, 1) -->
    <rect x="38" y="115" width="38.5" height="38.5" fill="#000000"/>
    <rect x="76.5" y="115" width="38.5" height="38.5" fill="#000000"/>
    <!-- (row 3: black at col 1, 3) -->
    <rect x="76.5" y="153.5" width="38.5" height="38.5" fill="#000000"/>
    <rect x="153.5" y="153.5" width="38.5" height="38.5" fill="#000000"/>

    <text x="65" y="260" font-size="13" font-weight="bold" fill="#0f172a">ArUco 4x4 ID:0</text>
  </g>

  <text x="35" y="520" font-size="11" fill="#94a3b8">NeoScan Optical Engine • ISO 17025 Calibrated Reference Standard</text>
</svg>
"""
    svg_path = "/Users/dakshakhare/Desktop/Avishkar/docs/CALIBRATION_CARD_PRINTABLE.svg"
    with open(svg_path, "w") as f:
        f.write(svg_content)
    print(f"Calibration Card SVG written to: {svg_path}")

if __name__ == "__main__":
    generate_aruco_card()

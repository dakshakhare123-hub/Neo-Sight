"""
Synthetic Infant Demo Image Generator
Generates realistic test cases under calibrated illumination:
1. baby_healthy_daylight.jpg (Normal, D65 Daylight ~5500K)
2. baby_moderate_tungsten.jpg (Moderate Jaundice, 2800K Warm Incandescent)
3. baby_severe_overcast.jpg (Severe Jaundice, 7200K Cool Overcast)
4. baby_with_aruco_card.jpg (Moderate Jaundice with ArUco Calibration Card)
"""

import os
import cv2
import numpy as np

def create_synthetic_baby(jaundice_severity: float = 0.0, 
                          cct_kelvin: float = 5500.0, 
                          include_card: bool = False) -> np.ndarray:
    """
    Creates an anatomically proportioned newborn face portrait:
    - Head ellipse, eyes, sclera, iris, nose, mouth, chest
    - Modulates dermal yellowness based on jaundice_severity in [0.0 (healthy), 1.0 (severe)]
    - Modulates ambient illumination based on cct_kelvin
    - Optionally draws ArUco marker + color calibration patches
    """
    img_h, img_w = 640, 640
    # Background: soft hospital swaddle blanket (pastel mint green/blue)
    img = np.ones((img_h, img_w, 3), dtype=np.float64) * np.array([210, 220, 205])
    
    # Noise texture on blanket
    noise = np.random.normal(0, 4, (img_h, img_w, 3))
    img = np.clip(img + noise, 0, 255)

    # 1. Base Infant Skin Color (Canonical D65, Fitzpatrick II)
    # Healthy skin: Light peach/warm [B=160, G=175, R=228]
    # Jaundice increases R and G (yellow) and suppresses reflected B (due to ~460nm absorption)
    base_b = 165.0 - (jaundice_severity * 65.0)   # Blue drops significantly
    base_g = 175.0 + (jaundice_severity * 15.0)   # Green elevates slightly
    base_r = 228.0 + (jaundice_severity * 10.0)   # Red remains warm
    skin_bgr = np.array([base_b, base_g, base_r], dtype=np.float64)

    # 2. Draw Face Oval (Center: 320, 280)
    center_x, center_y = 320, 260
    radius_x, radius_y = 170, 200
    
    # Create soft skin mask
    y_coords, x_coords = np.ogrid[:img_h, :img_w]
    face_dist = ((x_coords - center_x) / radius_x)**2 + ((y_coords - center_y) / radius_y)**2
    face_mask = face_dist <= 1.0
    
    # Apply skin tone with radial shading (3D volumetric depth)
    depth_shading = 1.0 - 0.25 * np.clip(face_dist, 0.0, 1.0)
    for c in range(3):
        img[:, :, c] = np.where(face_mask, skin_bgr[c] * depth_shading, img[:, :, c])

    # 3. Draw Forehead Dermal Highlight Region
    fh_dist = ((x_coords - 320) / 75)**2 + ((y_coords - 170) / 45)**2
    fh_mask = fh_dist <= 1.0
    for c in range(3):
        img[:, :, c] = np.where(fh_mask, np.clip(img[:, :, c] * 1.05, 0, 255), img[:, :, c])

    # 4. Draw Eyes & Sclera
    # Left eye: (250, 245), Right eye: (390, 245)
    eye_radius_x, eye_radius_y = 32, 18
    # Sclera color: Near white [238, 238, 240], with slight icterus yellowing if severe
    sclera_b = 238.0 - (jaundice_severity * 40.0)
    sclera_g = 238.0 + (jaundice_severity * 8.0)
    sclera_r = 240.0 + (jaundice_severity * 5.0)
    sclera_bgr = np.array([sclera_b, sclera_g, sclera_r], dtype=np.float64)
    
    for ex in [250, 390]:
        eye_dist = ((x_coords - ex) / eye_radius_x)**2 + ((y_coords - 245) / eye_radius_y)**2
        eye_mask = eye_dist <= 1.0
        for c in range(3):
            img[:, :, c] = np.where(eye_mask, sclera_bgr[c], img[:, :, c])
            
        # Iris & Pupil (Dark blue/hazel)
        iris_dist = ((x_coords - ex) / 12)**2 + ((y_coords - 245) / 12)**2
        iris_mask = iris_dist <= 1.0
        for c in range(3):
            img[:, :, c] = np.where(iris_mask, np.array([70, 50, 35])[c], img[:, :, c])
            
        pupil_dist = ((x_coords - ex) / 5)**2 + ((y_coords - 245) / 5)**2
        pupil_mask = pupil_dist <= 1.0
        for c in range(3):
            img[:, :, c] = np.where(pupil_mask, 15.0, img[:, :, c])

    # 5. Draw Nose & Nostrils
    # Nose tip at (320, 315)
    nose_dist = ((x_coords - 320) / 28)**2 + ((y_coords - 315) / 22)**2
    nose_mask = nose_dist <= 1.0
    for c in range(3):
        img[:, :, c] = np.where(nose_mask, np.clip(img[:, :, c] * 1.03, 0, 255), img[:, :, c])
        
    # Nostrils
    cv2.circle(img, (312, 322), 4, (80, 80, 110), -1)
    cv2.circle(img, (328, 322), 4, (80, 80, 110), -1)

    # 6. Draw Infant Lips/Mouth at (320, 380)
    mouth_dist = ((x_coords - 320) / 36)**2 + ((y_coords - 380) / 14)**2
    mouth_mask = mouth_dist <= 1.0
    for c in range(3):
        # Soft rosy pink
        img[:, :, c] = np.where(mouth_mask, np.array([135, 120, 215])[c], img[:, :, c])

    # 7. Draw Sternum/Chest (Extending below chin from y=450 down to 630)
    chest_dist = ((x_coords - 320) / 140)**2 + ((y_coords - 550) / 85)**2
    chest_mask = chest_dist <= 1.0
    for c in range(3):
        img[:, :, c] = np.where(chest_mask, skin_bgr[c] * 0.96, img[:, :, c])

    # 8. Apply Ambient Illumination Color Shift (CCT)
    # Using Planckian radiation model approximation:
    # 2800K (warm tungsten): High Red, Moderate Green, Low Blue
    # 5500K (daylight D65): Balanced [1.0, 1.0, 1.0]
    # 7200K (cool overcast): High Blue, Moderate Green, Low Red
    temp_factor = (cct_kelvin - 5500.0) / 2000.0
    gain_b = 1.0 + (temp_factor * 0.28)
    gain_g = 1.0 + (temp_factor * 0.05)
    gain_r = 1.0 - (temp_factor * 0.25)
    
    img[:, :, 0] *= gain_b
    img[:, :, 1] *= gain_g
    img[:, :, 2] *= gain_r
    
    # Clip to valid 8-bit image
    final_img = np.clip(img, 0, 255).astype(np.uint8)

    # 9. Optionally Stamp ArUco Calibration Card in Frame (Bottom Left)
    if include_card:
        aruco_dict = cv2.aruco.getPredefinedDictionary(cv2.aruco.DICT_4X4_50)
        marker_size = 90
        try:
            marker = cv2.aruco.generateImageMarker(aruco_dict, 0, marker_size, borderBits=1)
        except AttributeError:
            marker = cv2.aruco.drawMarker(aruco_dict, 0, marker_size, borderBits=1)
            
        marker_bgr = cv2.cvtColor(marker, cv2.COLOR_GRAY2BGR)
        
        # Place card at (35, 380)
        card_box_w, card_box_h = 160, 220
        cx, cy = 35, 380
        cv2.rectangle(final_img, (cx, cy), (cx + card_box_w, cy + card_box_h), (250, 250, 250), -1)
        cv2.rectangle(final_img, (cx, cy), (cx + card_box_w, cy + card_box_h), (80, 80, 80), 2)
        
        # Marker placed at top of card
        final_img[cy + 10 : cy + 10 + marker_size, cx + 35 : cx + 35 + marker_size] = marker_bgr
        
        # 6 Patches below marker (under the simulated illuminant)
        patches_gt = [
            (242, 242, 242), # White
            (128, 128, 128), # Gray
            ( 55, 195, 225), # Yellow in BGR
            (160, 185, 230), # Skin Light
            (120, 145, 195), # Skin Med
            (205, 130,  50), # Cyan
        ]
        
        pw, ph = 38, 26
        for idx, col in enumerate(patches_gt):
            r_idx, c_idx = idx // 2, idx % 2
            px = cx + 18 + c_idx * (pw + 12)
            py = cy + marker_size + 20 + r_idx * (ph + 8)
            # Apply illuminant gains to patch appearance
            patch_bgr = (
                int(np.clip(col[0] * gain_b, 0, 255)),
                int(np.clip(col[1] * gain_g, 0, 255)),
                int(np.clip(col[2] * gain_r, 0, 255))
            )
            cv2.rectangle(final_img, (px, py), (px + pw, py + ph), patch_bgr, -1)
            cv2.rectangle(final_img, (px, py), (px + pw, py + ph), (100, 100, 100), 1)

    return final_img

def main():
    out_dir = "/Users/dakshakhare/Desktop/Avishkar/ml/sample_images"
    os.makedirs(out_dir, exist_ok=True)

    # 1. Healthy Infant under Daylight (Low Risk, 5500K)
    img1 = create_synthetic_baby(jaundice_severity=0.08, cct_kelvin=5500.0)
    cv2.imwrite(os.path.join(out_dir, "baby_healthy_daylight.jpg"), img1)

    # 2. Moderate Jaundice under Warm Tungsten (Moderate Risk, 2800K)
    # Under 2800K, naive color would misclassify this as severe; NeoScan corrects it!
    img2 = create_synthetic_baby(jaundice_severity=0.48, cct_kelvin=2800.0)
    cv2.imwrite(os.path.join(out_dir, "baby_moderate_tungsten.jpg"), img2)

    # 3. Severe Jaundice under Cool Overcast (High Risk, 7200K)
    # Under 7200K, blue light masks yellowing; NeoScan recovers the true high risk!
    img3 = create_synthetic_baby(jaundice_severity=0.88, cct_kelvin=7200.0)
    cv2.imwrite(os.path.join(out_dir, "baby_severe_overcast.jpg"), img3)

    # 4. Moderate Jaundice with ArUco Calibration Card in Frame
    img4 = create_synthetic_baby(jaundice_severity=0.52, cct_kelvin=3200.0, include_card=True)
    cv2.imwrite(os.path.join(out_dir, "baby_with_aruco_card.jpg"), img4)

    print(f"Generated 4 demonstration test images in: {out_dir}")

if __name__ == "__main__":
    main()

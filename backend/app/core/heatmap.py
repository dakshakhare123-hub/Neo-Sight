import cv2
import numpy as np

def generate_yellowness_heatmap(img_bgr: np.ndarray, skin_mask_2d: np.ndarray) -> np.ndarray:
    """
    Computes genuine cutaneous b* yellowness heatmap over segmented skin.
    Non-skin pixels are rendered in dimmed grayscale for spatial context.
    Scale: 0 to 30 b* mapped to Yellow -> Amber -> Red colormap.
    """
    H, W = img_bgr.shape[:2]
    
    # Compute Lab float b*
    f = (img_bgr.astype(np.float32) / 255.0)
    lab = cv2.cvtColor(f, cv2.COLOR_BGR2LAB)
    b_star = lab[:, :, 2]  # float b*
    
    # Build 256-entry Yellow -> Orange -> Red lookup table (BGR)
    lut = np.zeros((256, 1, 3), dtype=np.uint8)
    for i in range(256):
        b_val = (i / 255.0) * 30.0  # 0 to 30
        if b_val < 14.0:
            # 0 to 14: Light Yellow (254, 240, 138) -> Golden Yellow (234, 179, 8)
            t = b_val / 14.0
            b = int(138 * (1 - t) + 8 * t)
            g = int(240 * (1 - t) + 179 * t)
            r = int(254 * (1 - t) + 234 * t)
        elif b_val < 20.0:
            # 14 to 20: Golden Yellow -> Deep Orange (234, 88, 12)
            t = (b_val - 14.0) / 6.0
            b = int(8 * (1 - t) + 12 * t)
            g = int(179 * (1 - t) + 88 * t)
            r = int(234 * (1 - t) + 234 * t)
        else:
            # 20 to 30: Deep Orange -> Crimson Red (153, 27, 27)
            t = min(1.0, (b_val - 20.0) / 10.0)
            b = int(12 * (1 - t) + 27 * t)
            g = int(88 * (1 - t) + 27 * t)
            r = int(234 * (1 - t) + 153 * t)
        lut[i, 0] = [b, g, r]  # OpenCV uses BGR
    
    # Map b_star to 0-255 uint8
    b_norm = np.clip((b_star / 30.0) * 255.0, 0, 255).astype(np.uint8)
    colored_heat = cv2.LUT(cv2.cvtColor(b_norm, cv2.COLOR_GRAY2BGR), lut)
    
    # Grayscale background (dimmed to 45% for high-contrast presentation)
    gray = cv2.cvtColor(img_bgr, cv2.COLOR_BGR2GRAY)
    dimmed_bg = cv2.cvtColor((gray * 0.45).astype(np.uint8), cv2.COLOR_GRAY2BGR)
    
    # Blend: skin pixels get colored_heat, non-skin gets dimmed_bg
    is_skin = (skin_mask_2d > 0)[:, :, np.newaxis]
    composite = np.where(is_skin, colored_heat, dimmed_bg)
    return composite

# Quick sanity check
test_img = np.full((100, 100, 3), 128, dtype=np.uint8)
test_mask = np.zeros((100, 100), dtype=np.uint8)
test_mask[20:80, 20:80] = 255
heat = generate_yellowness_heatmap(test_img, test_mask)
assert heat.shape == (100, 100, 3)
print("Sanity check passed! Heatmap generated successfully.")

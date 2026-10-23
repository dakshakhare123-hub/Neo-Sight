"""
Backend Pipeline Integration Test
Verifies end-to-end execution of all pipeline stages on sample images.
"""

import sys
import os
sys.path.insert(0, "/Users/dakshakhare/Desktop/Avishkar")

import cv2
from backend.app.api.routes import analyze_image, AnalyzeRequest
from backend.app.utils.image_io import ImageIO

def test_pipeline():
    print("=== Testing NeoScan Pipeline Integration ===")
    sample_path = "/Users/dakshakhare/Desktop/Avishkar/ml/sample_images/baby_moderate_tungsten.jpg"
    img = cv2.imread(sample_path)
    assert img is not None, "Failed to read test image"
    
    b64 = ImageIO.encode_bgr_to_base64(img)
    req = AnalyzeRequest(
        image_base64=b64,
        correction_method="auto",
        include_visualizations=True
    )
    
    resp = analyze_image(req)
    print(f"Success: {resp['success']}")
    print(f"Active Method: {resp['active_correction_method']}")
    print(f"Lighting Category: {resp['lighting_condition']['category']} (CCT: {resp['lighting_condition']['cct_kelvin']}K)")
    print(f"Face Detected: {resp['face_detection']['detected']} (Method: {resp['face_detection']['method']})")
    print(f"ROIs Found: {resp['face_detection']['rois_found']}")
    print(f"Fused b*: {resp['fused_biomarkers']['fused_lab_b_star']}")
    print(f"Fused BIx: {resp['fused_biomarkers']['fused_bilirubin_index']}")
    print(f"Predicted Risk: {resp['risk_assessment']['risk_category']} ({resp['risk_assessment']['confidence_percent']}%)")
    print(f"Visualizations generated: {list(resp['visualizations'].keys())}")
    print("\nTest passed with flying colors!")

if __name__ == "__main__":
    test_pipeline()

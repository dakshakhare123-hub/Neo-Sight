"""
NeoScan Pipeline Configuration
Contains mathematical and threshold constants for image quality,
color constancy, ROI detection, and clinical classification.
"""

from pydantic import BaseModel
from typing import Dict, Tuple

class QualityThresholds:
    # Pixel intensity bounds: discard clipped specular highlights & deep shadows
    MIN_VALID_INTENSITY: int = 15       # Pixels < 15 are underexposed sensor noise
    MAX_VALID_INTENSITY: int = 242      # Pixels > 242 are saturated specular reflections
    
    # Sharpness: variance of Laplacian below this indicates excessive camera motion
    MIN_SHARPNESS_LAPLACIAN_VAR: float = 40.0
    
    # Skin purity: minimum fraction of valid skin pixels required inside an ROI
    MIN_ROI_SKIN_PURITY: float = 0.35

class LightingClassification:
    # Correlated Color Temperature (CCT) thresholds in Kelvin
    CCT_WARM_THRESHOLD: float = 3300.0     # Incandescent / Warm Halogen
    CCT_NEUTRAL_LOWER: float = 3300.0
    CCT_NEUTRAL_UPPER: float = 5200.0     # Neutral White / Office LED
    CCT_DAYLIGHT_UPPER: float = 6800.0    # D50 - D65 Daylight
    # Above 6800K is Cool / Overcast / Blue tint

class ROIFusionWeights:
    # Clinical weights based on Kramer's Cephalo-Caudal rule & physiological sensitivity
    FOREHEAD_WEIGHT: float = 0.40   # Earliest manifestation of dermal jaundice
    NOSE_WEIGHT: float = 0.25       # Cartilaginous tissue backing, less erythema variance
    STERNUM_WEIGHT: float = 0.20    # Confirmatory progression to trunk (moderate-severe)
    SCLERA_WEIGHT: float = 0.15     # Biological baseline white reference

class CalibrationCardPatches:
    """
    Standard ground truth sRGB values for the 6-patch ArUco calibration target.
    Patch layout around ArUco 4x4 ID 0:
    [0]: White Ref       (242, 242, 242)
    [1]: Neutral Gray    (128, 128, 128)
    [2]: Bilirubin Yellow(225, 195,  55)
    [3]: Skin Tone Light (230, 185, 160)
    [4]: Skin Tone Medium(195, 145, 120)
    [5]: Cyan/Blue Check ( 50, 130, 205)
    """
    GROUND_TRUTH_RGB: Dict[str, Tuple[int, int, int]] = {
        "white": (242, 242, 242),
        "gray": (128, 128, 128),
        "yellow": (225, 195, 55),
        "skin_light": (230, 185, 160),
        "skin_medium": (195, 145, 120),
        "cyan": (50, 130, 205),
    }

class ClinicalRiskCategories:
    LOW_RISK = "LOW_RISK"            # Equivalent TSB < 8 mg/dL (Physiological / Safe)
    MODERATE_RISK = "MODERATE_RISK"  # Equivalent TSB 8-14 mg/dL (Repeat screen in 24h)
    HIGH_RISK = "HIGH_RISK"          # Equivalent TSB > 14 mg/dL (Immediate serum bilirubin test)

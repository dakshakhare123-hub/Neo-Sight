"""
NeoScan Feature Extraction Pipeline (Phase 4 Prep)
==================================================
Processes all images from data/manifest.csv through the UnifiedPreprocessor:
1. Validates and segments dermal skin pixels.
2. Extracts 20 standardized colorimetric & optical biomarkers.
3. Computes quality gating status (with min_sharpness=20.0 for clinical photos).
4. Caches structured results to data/extracted_features.joblib for instantaneous,
   reproducible training and evaluation.
"""

import os
import sys
import time
import joblib
import pandas as pd
import numpy as np
from typing import Dict, Any

# Ensure project root in sys.path
current_dir = os.path.dirname(os.path.abspath(__file__))
project_root = os.path.abspath(os.path.join(current_dir, ".."))
if project_root not in sys.path:
    sys.path.insert(0, project_root)

from ml.preprocessing import UnifiedPreprocessor, FEATURE_NAMES

MANIFEST_PATH = os.path.join(project_root, "data", "manifest.csv")
OUTPUT_PATH = os.path.join(project_root, "data", "extracted_features.joblib")


def extract_all_features():
    print(f"Loading manifest from: {MANIFEST_PATH}")
    df = pd.read_csv(MANIFEST_PATH)
    total_images = len(df)
    print(f"Total manifest entries: {total_images}")

    preprocessor = UnifiedPreprocessor(min_sharpness=20.0)

    features_list = []
    labels_list = []
    paths_list = []
    dataset_list = []
    body_site_list = []
    infant_id_list = []
    quality_passed_list = []
    error_code_list = []
    skin_pixel_counts = []
    b_star_means = []
    bix_values = []

    start_time = time.time()
    passed_count = 0

    for idx, row in df.iterrows():
        img_path = row["image_path"]
        source_dataset = row["source_dataset"]
        infant_id = row["infant_id"]
        body_site = row["body_site"]
        label = row["label_binary"]

        # Run unified preprocessing
        res = preprocessor.process(img_path, enforce_quality=False)

        quality_passed = res.get("passed", False)
        if quality_passed:
            passed_count += 1
            feat = res["features"]
            err = None
            skin_px = res["skin_pixel_count"]
            b_star = res["b_star_mean"]
            bix = res["bix"]
        else:
            # Fallback zero-vector if unprocessable
            feat = np.zeros(len(FEATURE_NAMES), dtype=np.float32)
            err = res.get("error_code", "UNKNOWN_ERROR")
            skin_px = 0
            b_star = 0.0
            bix = 0.0

        features_list.append(feat)
        labels_list.append(label)
        paths_list.append(img_path)
        dataset_list.append(source_dataset)
        body_site_list.append(body_site)
        infant_id_list.append(infant_id)
        quality_passed_list.append(quality_passed)
        error_code_list.append(err)
        skin_pixel_counts.append(skin_px)
        b_star_means.append(b_star)
        bix_values.append(bix)

        if (idx + 1) % 100 == 0 or (idx + 1) == total_images:
            elapsed = time.time() - start_time
            print(f"[{idx + 1}/{total_images}] Processed in {elapsed:.1f}s (Passed: {passed_count}/{idx + 1})")

    features_arr = np.array(features_list, dtype=np.float32)
    labels_arr = np.array(labels_list, dtype=np.float32)
    quality_passed_arr = np.array(quality_passed_list, dtype=bool)

    payload = {
        "features": features_arr,
        "feature_names": FEATURE_NAMES,
        "labels": labels_arr,
        "image_paths": paths_list,
        "datasets": dataset_list,
        "body_sites": body_site_list,
        "infant_ids": infant_id_list,
        "quality_passed": quality_passed_arr,
        "error_codes": error_code_list,
        "skin_pixel_counts": np.array(skin_pixel_counts, dtype=np.int32),
        "b_star_means": np.array(b_star_means, dtype=np.float32),
        "bix_values": np.array(bix_values, dtype=np.float32),
        "timestamp": time.time(),
        "summary": {
            "total_images": total_images,
            "passed_images": passed_count,
            "failed_images": total_images - passed_count
        }
    }

    print(f"\nSaving extracted features to {OUTPUT_PATH}...")
    joblib.dump(payload, OUTPUT_PATH)
    file_size_mb = os.path.getsize(OUTPUT_PATH) / (1024 * 1024)
    print(f"Done! Successfully cached {features_arr.shape[0]} feature vectors ({file_size_mb:.2f} MB).")


if __name__ == "__main__":
    extract_all_features()

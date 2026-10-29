"""
NeoScan Leakage-Free Dataset Split Generator
============================================
Splits datasets strictly by infant / cluster group to prevent data leakage:
- Mendeley: Grouped by infant_id (Forehead and Sternum pairs stay together).
- NJN: Grouped by connected perceptual hash components (duplicates/multi-views stay together).
- Folds: 5-Fold Stratified Group Split on 80% development set, plus 20% strictly held-out test set.
- Deterministic reproducibility: Fixed seed 42.
- Exports: data/splits/splits.json with hard assertions of zero group leakage.
"""

import os
import csv
import json
import numpy as np
from collections import defaultdict
from sklearn.model_selection import StratifiedGroupKFold, GroupShuffleSplit


def create_splits():
    print("=" * 70)
    print("       NEOSCAN LEAKAGE-FREE SPLIT GENERATION (PHASE 2)        ")
    print("=" * 70)

    base_dir = os.path.abspath(os.path.join(os.path.dirname(__file__), ".."))
    manifest_path = os.path.join(base_dir, "data", "manifest.csv")
    splits_dir = os.path.join(base_dir, "data", "splits")
    os.makedirs(splits_dir, exist_ok=True)

    with open(manifest_path, encoding="utf-8") as f:
        rows = list(csv.DictReader(f))

    print(f"Total manifest records loaded: {len(rows)}")

    # 1. Cluster NJN duplicates / near-duplicates into unified group_ids
    # Using dHash distance <= 4 as a graph component
    njn_rows = [r for r in rows if r["source_dataset"] == "njn_iraq"]
    mendeley_rows = [r for r in rows if r["source_dataset"] == "mendeley_ghaem"]

    print(f"  • NJN dataset rows: {len(njn_rows)}")
    print(f"  • Mendeley dataset rows: {len(mendeley_rows)}")

    # Build connected components for NJN using dHash
    njn_hashes = [(r["image_path"], int(r["dhash"], 16), r["infant_id"]) for r in njn_rows]
    parent = {item[0]: item[0] for item in njn_hashes}

    def find(i):
        if parent[i] == i:
            return i
        parent[i] = find(parent[i])
        return parent[i]

    def union(i, j):
        root_i = find(i)
        root_j = find(j)
        if root_i != root_j:
            parent[root_i] = root_j

    # Connect frames with Hamming distance <= 4
    for i in range(len(njn_hashes)):
        p1, h1, _ = njn_hashes[i]
        for j in range(i + 1, len(njn_hashes)):
            p2, h2, _ = njn_hashes[j]
            dist = bin(h1 ^ h2).count("1")
            if dist <= 4:
                union(p1, p2)

    # Assign group IDs for NJN
    group_map = {}
    for p, _, _ in njn_hashes:
        group_map[p] = f"njn_cluster_{find(p)}"

    for r in njn_rows:
        r["group_id"] = group_map[r["image_path"]]

    # For Mendeley, group_id is infant_id (forehead and sternum share infant_id)
    for r in mendeley_rows:
        r["group_id"] = r["infant_id"]

    unique_njn_groups = len(set(r["group_id"] for r in njn_rows))
    unique_mendeley_groups = len(set(r["group_id"] for r in mendeley_rows))
    print(f"  • NJN independent cluster groups: {unique_njn_groups} (across {len(njn_rows)} images)")
    print(f"  • Mendeley independent infant groups: {unique_mendeley_groups} (across {len(mendeley_rows)} images)")

    # 2. Split NJN (Labeled Binary Dataset)
    # 20% Held-out Test Set (by group)
    njn_paths = np.array([r["image_path"] for r in njn_rows])
    njn_labels = np.array([int(r["label_binary"]) for r in njn_rows])
    njn_groups = np.array([r["group_id"] for r in njn_rows])

    gss = GroupShuffleSplit(n_splits=1, test_size=0.20, random_state=42)
    dev_idx, test_idx = next(gss.split(njn_paths, njn_labels, njn_groups))

    njn_dev_paths = njn_paths[dev_idx]
    njn_dev_labels = njn_labels[dev_idx]
    njn_dev_groups = njn_groups[dev_idx]

    njn_test_paths = njn_paths[test_idx]
    njn_test_labels = njn_labels[test_idx]
    njn_test_groups = njn_groups[test_idx]

    # Verify zero leakage between Dev and Test
    dev_groups_set = set(njn_dev_groups)
    test_groups_set = set(njn_test_groups)
    overlap = dev_groups_set.intersection(test_groups_set)
    assert len(overlap) == 0, f"DATA LEAKAGE DETECTED! Overlapping groups: {overlap}"
    print(f"\n  ✓ NJN Held-Out Test Split: {len(njn_test_paths)} images ({len(test_groups_set)} groups)")
    print(f"    - Jaundiced: {np.sum(njn_test_labels == 1)}, Normal: {np.sum(njn_test_labels == 0)}")
    print(f"  ✓ NJN Development Split: {len(njn_dev_paths)} images ({len(dev_groups_set)} groups)")
    print(f"    - Jaundiced: {np.sum(njn_dev_labels == 1)}, Normal: {np.sum(njn_dev_labels == 0)}")
    print("  ✓ ZERO GROUP OVERLAP CONFIRMED between Dev and Test.")

    # 3. 5-Fold Stratified Group K-Fold on NJN Development Set
    sgkf = StratifiedGroupKFold(n_splits=5, shuffle=True, random_state=42)
    njn_folds = []

    for fold, (train_idx, val_idx) in enumerate(sgkf.split(njn_dev_paths, njn_dev_labels, njn_dev_groups)):
        train_p = njn_dev_paths[train_idx].tolist()
        val_p = njn_dev_paths[val_idx].tolist()
        train_g = set(njn_dev_groups[train_idx])
        val_g = set(njn_dev_groups[val_idx])
        fold_overlap = train_g.intersection(val_g)
        assert len(fold_overlap) == 0, f"Fold {fold} leakage: {fold_overlap}"

        njn_folds.append({
            "fold": fold,
            "train_images": train_p,
            "val_images": val_p,
            "train_size": len(train_p),
            "val_size": len(val_p),
            "val_jaundice_count": int(np.sum(njn_dev_labels[val_idx] == 1)),
            "val_normal_count": int(np.sum(njn_dev_labels[val_idx] == 0))
        })
        print(f"    - Fold {fold}: Train={len(train_p)}, Val={len(val_p)} (Jaundice={np.sum(njn_dev_labels[val_idx] == 1)}, Normal={np.sum(njn_dev_labels[val_idx] == 0)})")

    # 4. Split Mendeley Dataset (Grouped by infant_id)
    m_paths = np.array([r["image_path"] for r in mendeley_rows])
    m_groups = np.array([r["group_id"] for r in mendeley_rows])

    gss_m = GroupShuffleSplit(n_splits=1, test_size=0.20, random_state=42)
    m_dev_idx, m_test_idx = next(gss_m.split(m_paths, groups=m_groups))

    m_dev_paths = m_paths[m_dev_idx].tolist()
    m_test_paths = m_paths[m_test_idx].tolist()

    m_dev_g = set(m_groups[m_dev_idx])
    m_test_g = set(m_groups[m_test_idx])
    assert len(m_dev_g.intersection(m_test_g)) == 0, "Mendeley split leakage!"

    print(f"\n  ✓ Mendeley Held-Out Test: {len(m_test_paths)} images across {len(m_test_g)} infants")
    print(f"  ✓ Mendeley Development: {len(m_dev_paths)} images across {len(m_dev_g)} infants")
    print("  ✓ ZERO INFANT OVERLAP CONFIRMED in Mendeley splits.")

    # 5. Export Splits Definition
    splits_export = {
        "random_seed": 42,
        "strategy": "StratifiedGroupKFold_and_GroupShuffleSplit",
        "njn": {
            "held_out_test": njn_test_paths.tolist(),
            "development_folds": njn_folds
        },
        "mendeley": {
            "held_out_test": m_test_paths,
            "development_images": m_dev_paths
        }
    }

    splits_file = os.path.join(splits_dir, "splits.json")
    with open(splits_file, "w", encoding="utf-8") as f:
        json.dump(splits_export, f, indent=2)

    print(f"\n  ✓ Splits specification saved cleanly to: {splits_file}")
    print("=" * 70)


if __name__ == "__main__":
    create_splits()

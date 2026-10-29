"""Build a training manifest from folders of labelled images.

Usage:
  python prepare_manifest.py --normal-dir data/raw/njn/normal --jaundiced-dir data/raw/njn/jaundiced \
      --source njn --out data/manifest.csv [--append]

Public datasets such as NJN do not give an infant ID, so near-duplicate images (same
baby, similar shot) are grouped with a perceptual hash. This is an APPROXIMATION: different
angles of one baby can still land in different groups, which makes your test scores
optimistic. If real infant IDs exist, put them in the 'group_id' column yourself.
Images found in BOTH classes (label conflict) are dropped and listed.
"""
import argparse
from pathlib import Path

import cv2
import pandas as pd

EXT = {".jpg", ".jpeg", ".png", ".bmp"}


def dhash(path: Path) -> int:
    g = cv2.imread(str(path), cv2.IMREAD_GRAYSCALE)
    if g is None:
        return -1
    s = cv2.resize(g, (9, 8), interpolation=cv2.INTER_AREA)
    bits = (s[:, 1:] > s[:, :-1]).flatten()
    return int("".join("1" if b else "0" for b in bits), 2)


def main():
    ap = argparse.ArgumentParser()
    ap.add_argument("--normal-dir", required=True)
    ap.add_argument("--jaundiced-dir", required=True)
    ap.add_argument("--source", required=True)
    ap.add_argument("--out", default="data/manifest.csv")
    ap.add_argument("--hamming", type=int, default=6)
    ap.add_argument("--append", action="store_true")
    a = ap.parse_args()

    rows = []
    for label, d in ((0, a.normal_dir), (1, a.jaundiced_dir)):
        files = sorted(p for p in Path(d).rglob("*") if p.suffix.lower() in EXT)
        if not files:
            raise SystemExit(f"No images found in {d}. Download the dataset first (see README).")
        for p in files:
            h = dhash(p)
            if h < 0:
                print(f"unreadable, skipped: {p}")
                continue
            rows.append({"image_path": str(p), "label": label, "source": a.source, "hash": h})
    n = len(rows)
    parent = list(range(n))

    def find(i):
        while parent[i] != i:
            parent[i] = parent[parent[i]]
            i = parent[i]
        return i

    for i in range(n):
        for j in range(i + 1, n):
            if (rows[i]["hash"] ^ rows[j]["hash"]).bit_count() <= a.hamming:
                parent[find(i)] = find(j)
    for i, r in enumerate(rows):
        r["group_id"] = f"{a.source}_g{find(i)}"
    df = pd.DataFrame(rows)

    conflict = df.groupby("group_id")["label"].nunique()
    bad = set(conflict[conflict > 1].index)
    if bad:
        print(f"Dropping {int(df.group_id.isin(bad).sum())} images in {len(bad)} groups that appear in BOTH classes:")
        print(df[df.group_id.isin(bad)][["image_path", "label"]].to_string(index=False))
        df = df[~df.group_id.isin(bad)]
    df = df.drop(columns="hash")
    if a.append and Path(a.out).exists():
        df = pd.concat([pd.read_csv(a.out), df], ignore_index=True)
    Path(a.out).parent.mkdir(parents=True, exist_ok=True)
    df.to_csv(a.out, index=False)
    print(f"Wrote {len(df)} rows, {df.group_id.nunique()} groups -> {a.out}")
    print(df.groupby(["source", "label"]).size())


if __name__ == "__main__":
    main()

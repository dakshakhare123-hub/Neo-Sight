# NeoScan ML: face-gated neonatal jaundice screening

Screening aid only. Not a diagnosis, not a bilirubin measurement.

## What changed vs. the broken version
- **Face gate**: images without a real human face (Haar cascade + skin-pixel check inside the face box) raise `NO_FACE_DETECTED`. No score is ever produced.
- **Quality gate**: dark / blown-out / blurry / tiny images raise typed errors.
- **Lighting correction** uses only background pixels (correcting from skin would erase the yellow signal). If there is not enough background, the result is marked `reliability: reduced`.
- **Out-of-distribution guard**: images unlike the training data raise `OUT_OF_DISTRIBUTION`.
- **Three outcomes**: `no_visible_signs`, `possible_jaundice_signs`, `inconclusive` (treat inconclusive as "refer").
- Training uses **infant-level splits**, a **held-out test set used once**, bootstrap CIs and a **label-shuffle control**.

## Setup
```
pip install -r requirements.txt
```
## Get data (see the dataset notes; download manually if the licence needs a click-through)
```
data/raw/njn/normal/*.jpg
data/raw/njn/jaundiced/*.jpg
```
## Build manifest, train, test
```
python prepare_manifest.py --normal-dir data/raw/njn/normal --jaundiced-dir data/raw/njn/jaundiced --source njn --out data/manifest.csv
python train.py --manifest data/manifest.csv --out models
python -m unittest discover -s tests -v
uvicorn api:app --reload      # POST an image to /analyze
```
If you have real infant IDs, put them in the manifest's `group_id` column instead of the hash-based groups.

## Honest limits
- Face detection uses OpenCV Haar cascades, which can miss newborn faces at odd angles. Check `rejected_images.csv` after training; if many real faces are rejected, swap `detect_face` for MediaPipe or a DNN detector.
- Forehead/cheek analysis only. Sternum and sclera need their own detectors and training data.
- Thresholds in `vision.py` are starting values; tune them on your own photos.
- The NJN dataset has no bilirubin values and no infant IDs, so reported accuracy will be optimistic. Validate on a second source before trusting any number.
- Skin-tone fairness is unverified unless your data includes skin-tone labels.
- Set the 0.90 / 0.97 sensitivity targets with a clinician.

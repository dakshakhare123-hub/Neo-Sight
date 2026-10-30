# Pre-Retheme Baseline Report (`BASELINE.md`)

**Date:** October 30, 2026  
**Branch:** `feat/purple-theme`  
**Engineer:** Senior Front-End Engineer & UI Designer  
**Runtime:** Node v20.18.0 (`.tools/node-v20.18.0-darwin-arm64/bin/node`), Python 3.13.15  
**Web Server:** FastAPI / Uvicorn running on `http://127.0.0.1:8000`  

---

## 1. Automated Test Execution Baseline

| Test Suite | Command | Result | Pass Rate | Notes |
| :--- | :--- | :---: | :---: | :--- |
| **Non-Analysis Characterisation** | `python3 -m unittest discover -s tests -p "test_characterisation.py"` | **PASS** | 6 / 6 | Frontend assets, health check, demo samples catalog, quality gate, color transforms, and patient schema. |
| **NeoScan ML Integration Suite** | `python3 -m unittest discover -s tests -p "test_neoscan_integration.py"` | **PASS** | 10 / 10 | Oversized payload, tiny images, blur gate, non-face rejection, missing model 503, valid inference, multipart upload, concurrency. |
| **Module Pipeline Unit Tests** | `python3 -m unittest discover -s neoscan_ml/tests` | **PASS** | 7 / 7 (1 skipped) | Blank, dark, noise, tiny, yellow wall rejection. Real face test skipped (optional `scikit-image` not installed). |

---

## 2. Frontend Build Baseline

```bash
$ .tools/node-v20.18.0-darwin-arm64/bin/node frontend/build.cjs
[NeoScan Build] Compiled App.jsx -> app.js (106188 bytes) successfully!
```
- **Syntax / Compilation:** 100% clean, 0 syntax errors, 0 runtime warnings.
- **Bundle Size:** 106,188 bytes (`frontend/app.js`).

---

## 3. UI Chrome & Element Inventory Baseline

- **Current Styling Framework:** Tailwind CSS via standalone bundle `frontend/vendor/tailwind.min.js`.
- **Existing Dominant Color Families:**
  * `slate-*`: 246 occurrences (backgrounds, borders, text neutrals).
  * `teal-*`: 105 occurrences (primary buttons, active tabs, brand accents).
  * `amber-*`: 31 occurrences (quality gate notifications, warning cards).
  * `emerald-*`: 7 occurrences (low-risk badges, status pulse).
  * `cyan-*`: 6 occurrences (loading modal gradient).
  * `rose-*`: 2 occurrences (high-risk emergency notice).
- **Target Badge for Removal (Task 2):**
  * Location: `frontend/src/App.jsx` lines 1144–1149:
    ```jsx
    <div className="flex items-center space-x-3">
      <div className="flex items-center space-x-2 px-3 py-1.5 rounded-full bg-slate-100/90 border border-slate-200/80 text-xs text-slate-600">
        <span className="w-2 h-2 rounded-full bg-emerald-500 animate-pulse"></span>
        <span className="hidden sm:inline font-medium">Optical Heuristic Active</span>
        <span className="sm:hidden font-medium">Online</span>
      </div>
    </div>
    ```
  * Dependency Audit: Confirmed 0 functional dependencies. Removing this element leaves no orphaned state, broken props, or layout shifts.

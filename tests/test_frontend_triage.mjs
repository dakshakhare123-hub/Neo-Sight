import assert from "node:assert";
import { computeTriage } from "../frontend/src/triage.js";

console.log("Running Frontend Triage Unit Tests...");

// 1. Error state -> no recommendation
{
  const res = computeTriage({ error: { message: "Face not detected", action: "Position front-on" } });
  assert.strictEqual(res.level, "none");
  assert.strictEqual(res.headline, "Assessment Unavailable (Quality Alert)");
  assert.strictEqual(res.badge, "RETAKE PHOTO");
  assert.strictEqual(res.isActionable, false);
}

// 2. Pending / missing -> awaiting screening
{
  const res = computeTriage({ analysisResult: null });
  assert.strictEqual(res.level, "none");
  assert.strictEqual(res.headline, "Awaiting Screening Capture");
  assert.strictEqual(res.isActionable, false);
}

// 3. Normal infant, no red flags -> Routine observation
{
  const res = computeTriage({
    analysisResult: { category: "no_visible_signs", model_score: 0.12, features: { fh_b: 11.2 } },
    patient: { ageHours: 48, gestation: "full-term", feeding: "breastfeeding" }
  });
  assert.strictEqual(res.level, "normal");
  assert.strictEqual(res.badge, "ROUTINE OBSERVATION");
  assert.strictEqual(res.color, "#1E6F43");
  assert(res.headline.includes("No Visible Signs Detected"));
}

// 4. Normal image BUT early onset (<24h) -> Escalated to URGENT
{
  const res = computeTriage({
    analysisResult: { category: "no_visible_signs", model_score: 0.15 },
    patient: { ageHours: 18, gestation: "full-term" }
  });
  assert.strictEqual(res.level, "urgent");
  assert.strictEqual(res.badge, "EARLY ONSET REVIEW");
  assert.strictEqual(res.color, "#8F1D40");
  assert(res.reasons.some(r => r.includes("< 24 hours")));
}

// 5. Possible jaundice signs -> Pediatric Consultation
{
  const res = computeTriage({
    analysisResult: { category: "possible_jaundice_signs", model_score: 0.78, features: { fh_b: 22.4 } },
    patient: { ageHours: 72, gestation: "full-term", feeding: "breastfeeding" }
  });
  assert.strictEqual(res.level, "elevated");
  assert.strictEqual(res.headline, "Pediatric Consultation Recommended");
  assert.strictEqual(res.color, "#8F1D40");
}

// 6. Possible jaundice signs + preterm -> Immediate Urgent Evaluation
{
  const res = computeTriage({
    analysisResult: { category: "possible_jaundice_signs", model_score: 0.82 },
    patient: { ageHours: 48, gestation: "preterm", feeding: "breastfeeding" }
  });
  assert.strictEqual(res.level, "urgent");
  assert.strictEqual(res.badge, "URGENT EVALUATION");
  assert(res.reasons.some(r => r.includes("Preterm")));
}

// 7. Inconclusive -> Retake in daylight
{
  const res = computeTriage({
    analysisResult: { category: "inconclusive", model_score: 0.48 },
    patient: { ageHours: 60, gestation: "full-term" }
  });
  assert.strictEqual(res.level, "warning");
  assert.strictEqual(res.badge, "INCONCLUSIVE — RETAKE PHOTO");
  assert.strictEqual(res.color, "#9E5700");
}

console.log("All 7 Frontend Triage tests passed successfully!");

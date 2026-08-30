"""
AI Damage Assessment Module - PRAKRITI
Demo/simulation layer for image analysis.
Architecture is modular — real YOLO/SAR model can be plugged in via AI_MODE=real.
"""

import random
import hashlib
from typing import Dict, Any, Optional, List
from app.config import settings


DAMAGE_CLASSES = [
    "completely_collapsed",
    "partially_damaged",
    "flooded",
    "waterlogged",
    "blocked_road",
    "damaged_bridge",
    "vehicles_in_danger",
    "unaffected",
]

DAMAGE_DESCRIPTIONS = {
    "completely_collapsed": "Complete structural failure — building no longer standing.",
    "partially_damaged": "Partial structural damage — walls/roof compromised, building unstable.",
    "flooded": "Area submerged in flood water. Depth estimated >1m.",
    "waterlogged": "Surface waterlogging present. Depth estimated <0.5m.",
    "blocked_road": "Road completely blocked — debris, water, or landslide material.",
    "damaged_bridge": "Bridge structure shows visible damage or displacement.",
    "vehicles_in_danger": "Stranded vehicles or persons detected in hazardous area.",
    "unaffected": "No significant damage detected in this zone.",
}


def analyze_image(image_path: str, filename: str, disaster_context: Optional[str] = None) -> Dict[str, Any]:
    """
    Run damage assessment on uploaded image.
    In AI_MODE=demo: returns realistic simulated inference.
    In AI_MODE=real: placeholder for actual model weights.

    Returns structured assessment with confidence scores and bounding boxes.
    """
    if settings.AI_MODE == "real":
        return _real_inference(image_path, filename)
    else:
        return _demo_inference(filename, disaster_context)


def _demo_inference(filename: str, disaster_context: Optional[str] = None) -> Dict[str, Any]:
    """
    Deterministic demo inference based on filename hash.
    Returns realistic but clearly labelled simulation results.
    """
    # Use filename hash for deterministic (reproducible) results
    seed = int(hashlib.md5(filename.encode()).hexdigest()[:8], 16)
    rng = random.Random(seed)

    # Select primary damage class based on context
    if disaster_context == "flood":
        weights = [0.1, 0.15, 0.35, 0.20, 0.10, 0.05, 0.03, 0.02]
    elif disaster_context == "landslide":
        weights = [0.15, 0.20, 0.10, 0.05, 0.30, 0.10, 0.05, 0.05]
    elif disaster_context == "building_collapse":
        weights = [0.40, 0.30, 0.05, 0.02, 0.05, 0.03, 0.10, 0.05]
    else:
        weights = [0.15, 0.20, 0.20, 0.15, 0.10, 0.08, 0.07, 0.05]

    # Normalize weights
    total = sum(weights)
    norm_weights = [w / total for w in weights]

    # Pick 1-3 detections
    n_detections = rng.randint(1, 3)
    detections = []

    chosen = []
    for _ in range(n_detections):
        cumulative = 0
        r_val = rng.random()
        selected_idx = 0
        for i, w in enumerate(norm_weights):
            cumulative += w
            if r_val <= cumulative:
                selected_idx = i
                break
        chosen.append(DAMAGE_CLASSES[selected_idx])

    chosen = list(set(chosen))  # deduplicate

    for cls in chosen:
        confidence = rng.uniform(0.62, 0.97)
        detections.append({
            "class": cls,
            "label": cls.replace("_", " ").title(),
            "confidence": round(confidence, 3),
            "description": DAMAGE_DESCRIPTIONS[cls],
            "bbox": [
                rng.randint(10, 200),
                rng.randint(10, 150),
                rng.randint(250, 450),
                rng.randint(200, 350),
            ],
        })

    primary = max(detections, key=lambda x: x["confidence"])
    affected_area_pct = round(rng.uniform(20, 85), 1) if primary["class"] not in ("unaffected",) else round(rng.uniform(0, 5), 1)
    damaged_structures = rng.randint(2, 25) if "collapsed" in primary["class"] or "damaged" in primary["class"] else rng.randint(0, 5)

    overall_confidence = round(sum(d["confidence"] for d in detections) / len(detections), 3)

    return {
        "inference_mode": "DEMO_SIMULATION",
        "disclaimer": "⚠️ This is a demo simulation. Results do not represent real satellite analysis.",
        "filename": filename,
        "overall_confidence": overall_confidence,
        "primary_classification": primary["class"],
        "primary_label": primary["label"],
        "detections": detections,
        "estimated_affected_area_pct": affected_area_pct,
        "estimated_damaged_structures": damaged_structures,
        "summary": _build_summary(primary, detections, affected_area_pct, damaged_structures),
        "recommendation": _build_recommendation(primary["class"]),
    }


def _build_summary(primary: Dict, detections: List, area_pct: float, structures: int) -> str:
    classes = [d["label"] for d in detections]
    return (
        f"Primary analysis indicates {primary['label']} (confidence: {primary['confidence']*100:.0f}%). "
        f"Estimated {area_pct}% of visible area affected. "
        f"Approximately {structures} structure(s) showing damage signs. "
        f"Detection classes: {', '.join(classes)}."
    )


def _build_recommendation(primary_class: str) -> str:
    recs = {
        "completely_collapsed": "Immediate search & rescue. Excavator + trained NDRF team required.",
        "partially_damaged": "Structural assessment needed. Do not allow occupancy. Medical standby.",
        "flooded": "Boat deployment required. Evacuation of ground-floor occupants priority.",
        "waterlogged": "Monitor water levels. Prepare evacuation if rising.",
        "blocked_road": "Road clearance via excavator/heavy machinery needed before vehicle access.",
        "damaged_bridge": "Bridge closure mandatory. Identify alternative crossing or boat route.",
        "vehicles_in_danger": "Immediate rescue of stranded persons. Boat or rope rescue as applicable.",
        "unaffected": "No immediate action required. Continue monitoring.",
    }
    return recs.get(primary_class, "Further assessment recommended.")


def _real_inference(image_path: str, filename: str) -> Dict[str, Any]:
    """
    Placeholder for real model inference.
    Load actual YOLO/segmentation weights here when available.
    """
    return {
        "inference_mode": "REAL_MODEL_PLACEHOLDER",
        "disclaimer": "Real model weights not loaded. Configure AI_MODE and model path in settings.",
        "filename": filename,
        "overall_confidence": 0.0,
        "primary_classification": "unknown",
        "primary_label": "Unknown",
        "detections": [],
        "estimated_affected_area_pct": 0.0,
        "estimated_damaged_structures": 0,
        "summary": "Real inference not available. Set AI_MODE=demo for simulation.",
        "recommendation": "Configure model weights to enable real inference.",
    }


def compare_before_after(before_path: str, after_path: str) -> Dict[str, Any]:
    """
    Generate a before/after comparison analysis (demo simulation).
    """
    seed1 = int(hashlib.md5(before_path.encode()).hexdigest()[:8], 16)
    seed2 = int(hashlib.md5(after_path.encode()).hexdigest()[:8], 16)
    rng = random.Random((seed1 + seed2) % (2**32))

    before_damage = rng.uniform(0, 10)
    after_damage = rng.uniform(35, 85)
    change_pct = round(after_damage - before_damage, 1)
    structures_before = rng.randint(15, 40)
    structures_damaged = rng.randint(5, structures_before)

    return {
        "inference_mode": "DEMO_SIMULATION",
        "disclaimer": "⚠️ Demo comparison. Real SAR/optical change detection not active.",
        "before_damage_estimate": round(before_damage, 1),
        "after_damage_estimate": round(after_damage, 1),
        "change_percentage": change_pct,
        "structures_before": structures_before,
        "structures_damaged_after": structures_damaged,
        "damage_increase_factor": round(after_damage / max(before_damage, 1), 1),
        "key_changes": [
            f"{round(change_pct)}% increase in affected area detected",
            f"~{structures_damaged} of {structures_before} structures show new damage",
            f"Inundation extent expanded significantly between images",
            f"Road infrastructure shows post-event blockage",
        ],
        "summary": (
            f"Post-disaster analysis shows {change_pct}% area damage increase. "
            f"Approximately {structures_damaged} structures now showing visible damage. "
            f"Significant change detected in infrastructure and land-cover."
        )
    }

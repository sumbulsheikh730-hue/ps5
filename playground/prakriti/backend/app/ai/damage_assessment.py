"""
PRAKRITI AI Damage Assessment Module
--------------------------------------
Demo/fallback inference layer – no trained model weights required.
NOTE: This module uses algorithmic simulation, not a real trained computer vision model.
Architecture is ready for real YOLO/SAM model integration.
"""

import random
import math
from typing import Dict, List, Optional, Tuple
from PIL import Image
import io


# Damage classification labels
DAMAGE_CLASSES = [
    "completely_collapsed",
    "severely_damaged",
    "moderately_damaged",
    "minor_damage",
    "flooded",
    "waterlogged",
    "road_blocked",
    "bridge_damaged",
    "unaffected",
    "unknown",
]

DAMAGE_COLORS = {
    "completely_collapsed": "#ef4444",
    "severely_damaged":     "#f97316",
    "moderately_damaged":   "#eab308",
    "minor_damage":         "#84cc16",
    "flooded":              "#3b82f6",
    "waterlogged":          "#93c5fd",
    "road_blocked":         "#a855f7",
    "bridge_damaged":       "#f43f5e",
    "unaffected":           "#22c55e",
    "unknown":              "#6b7280",
}


def analyze_image_demo(image_bytes: bytes, filename: str = "") -> Dict:
    """
    Demo damage assessment.
    Returns a realistic response that simulates what a real CV model would return.
    DISCLAIMER: This is a demo simulation. Results are not from a trained disaster model.
    """
    # Attempt to read image dimensions
    width, height = 640, 480
    try:
        img = Image.open(io.BytesIO(image_bytes))
        width, height = img.size
    except Exception:
        pass

    # Seed randomness deterministically based on filename for reproducibility
    seed = sum(ord(c) for c in filename) if filename else 42
    rng = random.Random(seed)

    # Simulate which damage classes are detected
    primary_class = rng.choice([
        "completely_collapsed", "severely_damaged", "flooded",
        "moderately_damaged", "road_blocked", "waterlogged",
    ])
    secondary_class = rng.choice([c for c in DAMAGE_CLASSES if c != primary_class])

    # Generate bounding boxes (normalized 0-1)
    boxes = []
    for _ in range(rng.randint(2, 6)):
        x1 = rng.uniform(0.05, 0.6)
        y1 = rng.uniform(0.05, 0.6)
        x2 = x1 + rng.uniform(0.1, 0.35)
        y2 = y1 + rng.uniform(0.1, 0.35)
        cls = rng.choice([primary_class, secondary_class, "unaffected"])
        conf = rng.uniform(0.55, 0.97)
        boxes.append({
            "class": cls,
            "confidence": round(conf, 2),
            "bbox": [round(x1, 3), round(y1, 3), round(min(x2, 0.95), 3), round(min(y2, 0.95), 3)],
            "color": DAMAGE_COLORS.get(cls, "#6b7280"),
            "label": cls.replace("_", " ").title(),
        })

    # Overall stats
    affected_pct = rng.uniform(15, 85)
    overall_confidence = rng.uniform(0.68, 0.94)

    # Class distribution
    class_dist = {}
    for box in boxes:
        c = box["class"]
        class_dist[c] = class_dist.get(c, 0) + 1

    # Severity from primary class
    severity_map = {
        "completely_collapsed": "critical",
        "severely_damaged": "high",
        "flooded": "high",
        "road_blocked": "moderate",
        "moderately_damaged": "moderate",
        "waterlogged": "moderate",
        "bridge_damaged": "high",
        "minor_damage": "low",
        "unaffected": "low",
        "unknown": "low",
    }

    return {
        "mode": "demo",
        "disclaimer": "DEMO INFERENCE: Results are algorithmic simulation, not a real trained disaster CV model.",
        "primary_damage_class": primary_class,
        "primary_damage_label": primary_class.replace("_", " ").title(),
        "secondary_damage_class": secondary_class,
        "severity": severity_map.get(primary_class, "moderate"),
        "overall_confidence": round(overall_confidence, 2),
        "affected_area_pct": round(affected_pct, 1),
        "estimated_damaged_structures": rng.randint(3, 45),
        "image_dimensions": {"width": width, "height": height},
        "detections": boxes,
        "class_distribution": class_dist,
        "damage_colors": DAMAGE_COLORS,
    }


def compare_images_demo(before_bytes: bytes, after_bytes: bytes) -> Dict:
    """
    Demo before/after comparison.
    Returns estimated change statistics.
    """
    rng = random.Random(len(before_bytes) % 1000 + len(after_bytes) % 1000)

    affected_pct = rng.uniform(30, 80)
    structure_change = rng.uniform(15, 65)
    water_coverage = rng.uniform(10, 55)

    return {
        "mode": "demo",
        "disclaimer": "DEMO INFERENCE: Comparison is algorithmic simulation.",
        "affected_area_pct": round(affected_pct, 1),
        "structure_damage_pct": round(structure_change, 1),
        "water_coverage_pct": round(water_coverage, 1),
        "estimated_newly_flooded_sqkm": round(rng.uniform(0.5, 8.0), 2),
        "estimated_collapsed_structures": rng.randint(5, 80),
        "change_severity": "severe" if affected_pct > 60 else "moderate" if affected_pct > 35 else "minor",
        "highlights": [
            {"area": "Northern zone", "change": f"{rng.randint(40,90)}% newly inundated"},
            {"area": "Main road corridor", "change": "Blocked / debris"},
            {"area": "Residential cluster", "change": f"{rng.randint(3,25)} collapsed structures detected"},
        ],
    }

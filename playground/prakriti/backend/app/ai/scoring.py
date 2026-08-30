"""
PRAKRITI AI Scoring Engine
--------------------------
All scoring is modular – real models can be plugged in later.
This module provides a realistic demo inference layer.
NOTE: All scores are algorithmic simulations, not real trained-model output.
"""

import math
import random
from typing import List, Dict, Any
from datetime import datetime, timezone


# ─────────────────────────────────────────────
# SOURCE RELIABILITY WEIGHTS
# ─────────────────────────────────────────────
SOURCE_WEIGHTS = {
    "satellite":    0.92,
    "official":     0.88,
    "police":       0.80,
    "sensor":       0.78,
    "ngo":          0.70,
    "citizen":      0.55,
    "social_media": 0.35,
    "unknown":      0.30,
}

DISASTER_BASE_SEVERITY = {
    "flood":            55,
    "landslide":        70,
    "cyclone":          75,
    "earthquake":       80,
    "building_collapse":78,
    "fire":             65,
    "road_failure":     45,
    "bridge_failure":   50,
    "industrial":       60,
}


def source_reliability(source_type: str) -> float:
    """Return reliability weight 0-1 for a source type."""
    return SOURCE_WEIGHTS.get(source_type, 0.30)


def compute_report_reliability(report: Dict) -> float:
    """
    Compute a reliability score (0-100) for a single report.
    Factors: source weight, freshness, geographic plausibility, duplicate flag.
    """
    base = source_reliability(report.get("source_type", "unknown")) * 100

    # Freshness decay – lose 2 points per hour of age
    try:
        ts = report.get("timestamp")
        if ts:
            if isinstance(ts, str):
                ts = datetime.fromisoformat(ts.replace("Z", "+00:00"))
            now = datetime.now(timezone.utc)
            if ts.tzinfo is None:
                ts = ts.replace(tzinfo=timezone.utc)
            age_hours = (now - ts).total_seconds() / 3600
            base -= min(20, age_hours * 2)
    except Exception:
        pass

    # Penalise duplicates
    if report.get("is_duplicate"):
        base *= 0.4

    # Penalise if contradiction flagged
    if report.get("contradiction_flag"):
        base -= 10

    # Boost if verified
    if report.get("is_verified"):
        base = min(100, base + 15)

    return max(0.0, min(100.0, round(base, 1)))


def compute_evidence_confidence(reports: List[Dict]) -> Dict:
    """
    Evidence Fusion Engine.
    Returns confidence score (0-100) and explanation.
    """
    if not reports:
        return {"score": 0.0, "reasons": ["No reports available"], "breakdown": {}}

    non_duplicate = [r for r in reports if not r.get("is_duplicate", False)]
    if not non_duplicate:
        non_duplicate = reports

    # Group by source type (independent channels)
    by_source: Dict[str, List] = {}
    for r in non_duplicate:
        st = r.get("source_type", "unknown")
        by_source.setdefault(st, []).append(r)

    # Weighted combination using independent-evidence formula
    # P(evidence) = 1 - ∏(1 - w_i) for independent sources
    combined = 0.0
    reasons = []
    breakdown = {}

    for source_type, reps in by_source.items():
        w = source_reliability(source_type)
        # Multiple reports from same source provide diminishing returns
        effective_count = 1 + math.log(len(reps)) if len(reps) > 1 else 1
        channel_conf = w * min(1.0, effective_count / 3)
        breakdown[source_type] = round(channel_conf * 100, 1)
        combined = 1 - (1 - combined) * (1 - channel_conf)

        label = {
            "satellite": "Satellite/remote sensing evidence",
            "official": f"{len(reps)} official government report(s)",
            "police": f"{len(reps)} police report(s)",
            "citizen": f"{len(reps)} independent citizen report(s)",
            "social_media": f"Social media signals (treated as partial evidence)",
            "sensor": "Sensor/weather data",
            "ngo": "NGO field report",
        }.get(source_type, f"{len(reps)} {source_type} report(s)")
        reasons.append(label)

    score = round(combined * 100, 1)

    # Fresh reports boost
    fresh = sum(1 for r in non_duplicate if _is_fresh(r, max_hours=3))
    if fresh > 0:
        reasons.append(f"{fresh} report(s) received within last 3 hours")
        score = min(100, score + 3)

    return {"score": score, "reasons": reasons, "breakdown": breakdown}


def compute_information_fog(village: Dict, reports: List[Dict]) -> Dict:
    """
    Information Fog Score (0-100).
    Higher = more uncertain.
    """
    fog = 50.0  # baseline

    n_reports = len(reports)
    n_verified = sum(1 for r in reports if r.get("is_verified"))
    n_contradictions = sum(1 for r in reports if r.get("contradiction_flag"))
    n_satellite = sum(1 for r in reports if r.get("source_type") == "satellite")
    comm_gap = village.get("communication_gap_hours", 0)

    # More reports → less fog
    fog -= min(25, n_reports * 3)

    # Verified reports reduce fog significantly
    fog -= min(20, n_verified * 5)

    # Contradictions increase fog
    fog += min(20, n_contradictions * 7)

    # Satellite evidence reduces fog
    fog -= min(20, n_satellite * 15)

    # Communication gap increases fog
    fog += min(20, comm_gap * 2)

    # Low confidence increases fog
    confidence = village.get("confidence_score", 50)
    fog += (100 - confidence) * 0.15

    fog = max(0.0, min(100.0, round(fog, 1)))

    if fog >= 75:
        status = "Critical Uncertainty"
        note = "High uncertainty – remote/satellite verification strongly recommended"
    elif fog >= 50:
        status = "High Uncertainty"
        note = "Significant uncertainty – additional ground verification needed"
    elif fog >= 25:
        status = "Moderate Uncertainty"
        note = "Some uncertainty – situation partially confirmed"
    else:
        status = "Low Uncertainty"
        note = "Situation well-confirmed by multiple reliable sources"

    return {"score": fog, "status": status, "note": note}


def compute_accessibility_score(village: Dict, roads: List[Dict]) -> Dict:
    """Compute accessibility score 0-100 (higher = more accessible)."""
    score = 100.0
    reasons = []

    # Check roads leading to this village
    blocked = [r for r in roads if r.get("status") in ("blocked", "flooded", "damaged")]
    open_roads = [r for r in roads if r.get("status") == "open"]

    if not roads:
        score -= 30
        reasons.append("No road data available")
    elif not open_roads:
        score -= 50
        reasons.append("All roads blocked or damaged")
    else:
        score -= len(blocked) * 12
        if blocked:
            reasons.append(f"{len(blocked)} road(s) blocked/flooded")

    # Distance from response center
    dist = village.get("distance_from_center_km", 0)
    if dist > 30:
        score -= 20
        reasons.append(f"Remote location ({dist:.0f} km from response center)")
    elif dist > 15:
        score -= 10

    # Communication loss
    if not village.get("communication_active", True):
        score -= 20
        reasons.append("Communication link lost")

    # Disaster type impact
    disaster_types = village.get("disaster_types", [])
    if "flood" in disaster_types:
        score -= 15
        reasons.append("Active flooding reduces access")
    if "landslide" in disaster_types:
        score -= 20
        reasons.append("Landslide blocks terrain access")

    score = max(0.0, min(100.0, round(score, 1)))

    if score < 25:
        status = "Severely Isolated"
    elif score < 50:
        status = "Poor Access"
    elif score < 75:
        status = "Limited Access"
    else:
        status = "Accessible"

    return {"score": score, "status": status, "reasons": reasons}


def compute_rescue_priority(village: Dict, reports: List[Dict]) -> Dict:
    """
    Rescue Priority Score = weighted combination of severity factors.
    Returns score 0-100, class P1-P4, and explanation reasons.
    """
    reasons = []

    # 1. Damage severity (0-100)
    severity_map = {"critical": 100, "high": 75, "moderate": 45, "low": 20}
    damage = severity_map.get(village.get("severity", "low"), 20)

    # 2. Population at risk (0-100, normalized to ~1000 max)
    pop_at_risk = village.get("affected_population", 0)
    pop_score = min(100, (pop_at_risk / 800) * 100)

    # 3. Isolation (inverse of accessibility)
    isolation = 100 - village.get("accessibility_score", 100)

    # 4. Medical risk
    med_emergencies = village.get("medical_emergencies", 0)
    medical_score = min(100, med_emergencies * 15)

    # 5. Urgency – based on number of critical-urgency reports
    critical_reports = sum(1 for r in reports if r.get("urgency") == "critical")
    urgency_score = min(100, critical_reports * 25)

    # 6. Confidence – high confidence means score is trustworthy
    confidence = village.get("confidence_score", 50)
    confidence_factor = confidence / 100  # 0-1

    # 7. No resources assigned yet
    no_resource_bonus = 15 if not village.get("assigned_resources") else 0

    # Weighted formula
    raw = (
        damage * 0.25 +
        pop_score * 0.20 +
        isolation * 0.20 +
        medical_score * 0.15 +
        urgency_score * 0.10 +
        no_resource_bonus
    ) * confidence_factor

    score = round(min(100.0, max(0.0, raw)), 1)

    # Build reasons
    if damage >= 75:
        reasons.append(f"Critical/high structural damage detected")
    if pop_at_risk >= 500:
        reasons.append(f"{pop_at_risk:,} people at risk")
    if isolation >= 60:
        reasons.append(f"Village severely isolated (accessibility {100-isolation:.0f}/100)")
    if med_emergencies >= 2:
        reasons.append(f"{med_emergencies} medical emergency reports")
    if critical_reports >= 2:
        reasons.append(f"{critical_reports} critical-urgency reports")
    if not village.get("assigned_resources"):
        reasons.append("No rescue resource currently assigned")
    if not village.get("communication_active", True):
        reasons.append("Communication link lost – possible blackout")

    # Priority class
    if score >= 80:
        priority_class = "P1"
    elif score >= 60:
        priority_class = "P2"
    elif score >= 35:
        priority_class = "P3"
    else:
        priority_class = "P4"

    return {
        "score": score,
        "priority_class": priority_class,
        "reasons": reasons,
        "components": {
            "damage_severity": round(damage, 1),
            "population_risk": round(pop_score, 1),
            "isolation": round(isolation, 1),
            "medical_risk": round(medical_score, 1),
            "urgency": round(urgency_score, 1),
            "confidence_factor": round(confidence_factor, 2),
        }
    }


def detect_contradictions(reports: List[Dict]) -> List[Dict]:
    """
    Simple contradiction detection between pairs of reports for the same village.
    Returns list of contradiction records.
    """
    contradictions = []
    # Pairs with opposing urgency/description patterns
    CONTRADICTION_PAIRS = [
        ("completely submerged", "minor waterlogging"),
        ("no damage", "severe damage"),
        ("totally destroyed", "minor damage"),
        ("road open", "road blocked"),
        ("no casualties", "multiple casualties"),
        ("situation normal", "emergency"),
    ]

    for i, r1 in enumerate(reports):
        for j, r2 in enumerate(reports):
            if j <= i:
                continue
            d1 = (r1.get("description") or "").lower()
            d2 = (r2.get("description") or "").lower()
            for a, b in CONTRADICTION_PAIRS:
                if (a in d1 and b in d2) or (b in d1 and a in d2):
                    contradictions.append({
                        "report_a_id": r1.get("id"),
                        "report_b_id": r2.get("id"),
                        "claim_a": r1.get("description", "")[:120],
                        "claim_b": r2.get("description", "")[:120],
                        "source_a": r1.get("source_type"),
                        "source_b": r2.get("source_type"),
                        "timestamp_a": str(r1.get("timestamp")),
                        "timestamp_b": str(r2.get("timestamp")),
                        "pattern": f'"{a}" vs "{b}"',
                        "action": "Remote satellite verification recommended",
                    })
    return contradictions


def _is_fresh(report: Dict, max_hours: float = 3) -> bool:
    try:
        ts = report.get("timestamp")
        if not ts:
            return False
        if isinstance(ts, str):
            ts = datetime.fromisoformat(ts.replace("Z", "+00:00"))
        now = datetime.now(timezone.utc)
        if ts.tzinfo is None:
            ts = ts.replace(tzinfo=timezone.utc)
        return (now - ts).total_seconds() / 3600 < max_hours
    except Exception:
        return False

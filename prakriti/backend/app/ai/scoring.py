"""
AI Scoring Engine - PRAKRITI
Computes: Information Fog Score, Evidence Confidence, Rescue Priority, Accessibility
All logic is transparent and explainable.
"""

import math
from datetime import datetime, timedelta
from typing import List, Dict, Any, Optional


SOURCE_WEIGHTS = {
    "satellite": 0.92,
    "official": 0.88,
    "police": 0.85,
    "sensor": 0.80,
    "citizen": 0.55,
    "social_media": 0.35,
    "unknown": 0.20,
}

SEVERITY_SCORES = {
    "critical": 1.0,
    "high": 0.75,
    "moderate": 0.45,
    "low": 0.20,
    "unknown": 0.10,
}

DISASTER_URGENCY = {
    "building_collapse": 1.0,
    "landslide": 0.90,
    "cyclone": 0.85,
    "flood": 0.80,
    "earthquake": 0.95,
    "fire": 0.88,
    "road_failure": 0.50,
    "industrial": 0.75,
}


def compute_evidence_confidence(reports: List[Dict], village: Dict) -> Dict[str, Any]:
    """
    Fuse evidence from multiple sources into a confidence score (0-100).
    Returns score and detailed breakdown.
    """
    if not reports:
        return {"score": 0.0, "grade": "none", "breakdown": [], "summary": "No reports available."}

    now = datetime.utcnow()
    source_groups: Dict[str, List] = {}
    for r in reports:
        st = r.get("source_type", "unknown")
        source_groups.setdefault(st, []).append(r)

    breakdown = []
    weighted_sum = 0.0
    total_weight = 0.0

    for source_type, rpts in source_groups.items():
        base_weight = SOURCE_WEIGHTS.get(source_type, 0.20)
        # Diminishing returns for duplicate sources (same type)
        n = len(rpts)
        effective_count = math.log(n + 1, 2)  # log2 scale
        # Recency bonus
        most_recent = max(r.get("timestamp", now - timedelta(hours=24)) for r in rpts
                         if isinstance(r.get("timestamp"), datetime))
        age_hours = max(0, (now - most_recent).total_seconds() / 3600) if isinstance(most_recent, datetime) else 12
        recency_factor = max(0.3, 1.0 - (age_hours / 24) * 0.5)
        verified_bonus = 1.15 if any(r.get("is_verified") for r in rpts) else 1.0

        contribution = base_weight * effective_count * recency_factor * verified_bonus
        weighted_sum += contribution
        total_weight += base_weight * 2  # max possible contribution

        breakdown.append({
            "source": source_type,
            "count": n,
            "weight": round(base_weight, 2),
            "verified": any(r.get("is_verified") for r in rpts),
            "age_hours": round(age_hours, 1),
            "contribution": round(contribution, 3),
        })

    raw_score = (weighted_sum / max(total_weight, 0.1)) * 100
    score = min(98.0, max(5.0, raw_score))

    if score >= 85:
        grade = "high"
    elif score >= 60:
        grade = "medium"
    elif score >= 30:
        grade = "low"
    else:
        grade = "very_low"

    return {
        "score": round(score, 1),
        "grade": grade,
        "breakdown": sorted(breakdown, key=lambda x: -x["contribution"]),
        "summary": _confidence_summary(breakdown, score),
    }


def _confidence_summary(breakdown: List[Dict], score: float) -> str:
    parts = []
    for b in breakdown:
        label = f"{'Verified ' if b['verified'] else ''}{b['source'].replace('_', ' ').title()}"
        if b["count"] > 1:
            label += f" ({b['count']} reports)"
        parts.append(label)
    if parts:
        return f"Based on: {', '.join(parts[:4])}"
    return f"Confidence based on available evidence: {score:.0f}%"


def compute_information_fog(reports: List[Dict], village: Dict, contradictions: List[Dict]) -> Dict[str, Any]:
    """
    Compute Information Fog Score (0-100). Higher = more uncertainty.
    """
    now = datetime.utcnow()
    factors = []
    fog_score = 0.0

    # Factor 1: No reports at all
    if not reports:
        fog_score += 45
        factors.append({"factor": "No reports received", "weight": 45, "description": "Complete information blackout."})
    else:
        # Factor 2: Report age
        most_recent = max(
            (r.get("timestamp") for r in reports if isinstance(r.get("timestamp"), datetime)),
            default=now - timedelta(hours=48)
        )
        if isinstance(most_recent, datetime):
            age_hours = (now - most_recent).total_seconds() / 3600
        else:
            age_hours = 48
        age_penalty = min(30, age_hours * 3)
        if age_penalty > 5:
            fog_score += age_penalty
            factors.append({"factor": "Stale reports", "weight": round(age_penalty), "description": f"Most recent report is {age_hours:.1f}h old."})

        # Factor 3: No verified reports
        verified = [r for r in reports if r.get("is_verified")]
        if not verified:
            fog_score += 20
            factors.append({"factor": "No official verification", "weight": 20, "description": "No verified reports from officials/police."})
        else:
            fog_score += 2
            factors.append({"factor": "Official verification exists", "weight": -15, "description": f"{len(verified)} verified report(s) available."})

        # Factor 4: Contradictions
        if contradictions:
            conflict_penalty = min(25, len(contradictions) * 12)
            fog_score += conflict_penalty
            factors.append({"factor": "Conflicting reports detected", "weight": conflict_penalty, "description": f"{len(contradictions)} contradictions found."})

        # Factor 5: No satellite/drone evidence
        has_satellite = any(r.get("source_type") in ("satellite", "sensor") for r in reports)
        if not has_satellite:
            fog_score += 15
            factors.append({"factor": "No satellite/sensor data", "weight": 15, "description": "No remote sensing confirmation available."})

        # Factor 6: Only one source type
        source_types = set(r.get("source_type", "unknown") for r in reports)
        if len(source_types) == 1:
            fog_score += 10
            factors.append({"factor": "Single source type", "weight": 10, "description": "Reporting from only one source category."})

    fog_score = max(0.0, min(98.0, fog_score))

    if fog_score >= 70:
        status = "very_high"
        label = "Very High Uncertainty"
        action = "Remote sensing verification urgently recommended."
    elif fog_score >= 50:
        status = "high"
        label = "High Uncertainty"
        action = "Official ground verification recommended."
    elif fog_score >= 30:
        status = "moderate"
        label = "Moderate Uncertainty"
        action = "Seek additional verification."
    else:
        status = "low"
        label = "Low Uncertainty"
        action = "Situation relatively well confirmed."

    return {
        "score": round(fog_score, 1),
        "status": status,
        "label": label,
        "action": action,
        "factors": factors,
    }


def compute_accessibility_score(village: Dict, roads: List[Dict]) -> Dict[str, Any]:
    """
    Compute Accessibility Score (0-100). Higher = more accessible.
    """
    base_score = 80.0
    factors = []

    village_roads = [r for r in roads if
                     r.get("from_village_id") == village.get("id") or
                     r.get("to_village_id") == village.get("id")]

    if not village_roads:
        base_score -= 40
        factors.append("No known road connections")

    for road in village_roads:
        status = road.get("status", "open")
        rtype = road.get("road_type", "village")
        type_importance = {"national": 20, "state": 15, "district": 10, "village": 5}.get(rtype, 5)

        if status == "blocked":
            base_score -= type_importance
            factors.append(f"{road.get('name', 'Road')} – Blocked")
        elif status == "flooded":
            base_score -= type_importance * 0.7
            factors.append(f"{road.get('name', 'Road')} – Flooded")
        elif status == "damaged":
            base_score -= type_importance * 0.5
            factors.append(f"{road.get('name', 'Road')} – Damaged")

    # Remote/hill location penalty
    block = village.get("block", "")
    if "Paharpur" in block:
        base_score -= 25
        factors.append("Remote hill location")

    score = max(5.0, min(100.0, base_score))

    if score >= 70:
        status_label = "accessible"
    elif score >= 40:
        status_label = "limited"
    elif score >= 20:
        status_label = "difficult"
    else:
        status_label = "isolated"

    return {
        "score": round(score, 1),
        "status": status_label,
        "factors": factors,
        "road_accessible": score > 30,
    }


def compute_rescue_priority(
    village: Dict,
    incident: Dict,
    confidence: float,
    accessibility: float,
    fog_score: float,
) -> Dict[str, Any]:
    """
    Priority Score = (Damage * Population * Isolation * Urgency * Medical * Confidence) - AccessibilityDifficulty
    Normalized 0-100. Returns class P1-P4 and human-readable explanation.
    """
    pop = village.get("population", 500)
    disaster_types = incident.get("disaster_types", ["flood"])
    severity_str = incident.get("severity", "unknown")
    medical_emergencies = incident.get("medical_emergencies", 0)
    people_stranded = incident.get("people_stranded", 0)
    people_at_risk = incident.get("people_at_risk", 0)

    # Component scores (0-1)
    damage_score = SEVERITY_SCORES.get(severity_str, 0.10)
    pop_score = min(1.0, people_at_risk / max(pop, 1))
    isolation_score = max(0.0, 1.0 - (accessibility / 100))
    urgency_score = max(DISASTER_URGENCY.get(dt, 0.5) for dt in disaster_types) if disaster_types else 0.5
    medical_score = min(1.0, (medical_emergencies * 0.3) + (0.4 if medical_emergencies > 0 else 0))
    confidence_factor = confidence / 100
    stranded_bonus = min(0.3, people_stranded / max(pop, 1) * 0.5)

    raw_score = (
        damage_score * 25 +
        pop_score * 25 +
        isolation_score * 15 +
        urgency_score * 15 +
        medical_score * 10 +
        confidence_factor * 10 -
        (accessibility / 100) * 5 +
        stranded_bonus * 10
    )

    score = max(0.0, min(100.0, raw_score))

    if score >= 80:
        pclass, clabel = "P1", "Immediate Rescue"
    elif score >= 60:
        pclass, clabel = "P2", "Urgent"
    elif score >= 40:
        pclass, clabel = "P3", "Required"
    else:
        pclass, clabel = "P4", "Monitor"

    explanation = _build_priority_explanation(
        village, incident, damage_score, pop_score, isolation_score,
        urgency_score, medical_score, confidence_factor, score
    )

    return {
        "score": round(score, 1),
        "class": pclass,
        "label": clabel,
        "explanation": explanation,
        "components": {
            "damage": round(damage_score * 100, 1),
            "population": round(pop_score * 100, 1),
            "isolation": round(isolation_score * 100, 1),
            "urgency": round(urgency_score * 100, 1),
            "medical": round(medical_score * 100, 1),
            "confidence": round(confidence_factor * 100, 1),
        }
    }


def _build_priority_explanation(
    village, incident, damage_score, pop_score, isolation_score,
    urgency_score, medical_score, confidence_factor, final_score
) -> List[str]:
    reasons = []
    people_at_risk = incident.get("people_at_risk", 0)
    medical_emergencies = incident.get("medical_emergencies", 0)
    assigned = incident.get("assigned_resources", [])
    disaster_types = incident.get("disaster_types", [])

    if damage_score >= 0.75:
        reasons.append(f"Critical structural damage / severe disaster detected ({', '.join(disaster_types)})")
    elif damage_score >= 0.4:
        reasons.append(f"Significant damage reported ({', '.join(disaster_types)})")

    if people_at_risk > 0:
        reasons.append(f"{people_at_risk:,} people estimated at risk")

    if isolation_score > 0.6:
        reasons.append(f"Severely isolated – road access highly limited (accessibility {round((1-isolation_score)*100)}%)")
    elif isolation_score > 0.3:
        reasons.append(f"Partial road access restriction (accessibility {round((1-isolation_score)*100)}%)")

    if medical_emergencies > 0:
        reasons.append(f"{medical_emergencies} medical emergency report(s) received")

    if confidence_factor >= 0.8:
        reasons.append(f"High-confidence evidence ({round(confidence_factor*100)}%) – satellite/official confirmed")
    elif confidence_factor >= 0.5:
        reasons.append(f"Moderate evidence confidence ({round(confidence_factor*100)}%)")
    else:
        reasons.append(f"Low evidence confidence ({round(confidence_factor*100)}%) – caution advised")

    if not assigned:
        reasons.append("No rescue resource currently assigned to this village")
    else:
        reasons.append(f"{len(assigned)} resource(s) currently assigned: {', '.join(assigned)}")

    return reasons


def recommend_resources(villages_incidents: List[Dict], resources: List[Dict]) -> List[Dict]:
    """
    Simple greedy resource allocation based on priority score.
    Returns list of recommendations.
    """
    # Sort incidents by priority descending
    sorted_incidents = sorted(villages_incidents, key=lambda x: -x.get("priority_score", 0))
    available = {r["id"]: r for r in resources if r.get("status") == "available"}
    recommendations = []

    for inc in sorted_incidents:
        village_id = inc.get("village_id")
        disaster_types = inc.get("disaster_types", [])
        needed = _what_resources_needed(disaster_types, inc)

        for resource_type in needed:
            # Find an available resource of this type
            match = next((r for r in available.values() if r.get("resource_type") == resource_type), None)
            if match:
                del available[match["id"]]
                recommendations.append({
                    "resource_id": match["id"],
                    "resource_name": match["name"],
                    "village_id": village_id,
                    "reason": _allocation_reason(match, inc, village_id),
                    "priority": inc.get("priority_class", "P4"),
                })

    return recommendations


def _what_resources_needed(disaster_types: List[str], incident: Dict) -> List[str]:
    needed = []
    if "flood" in disaster_types:
        needed.append("boat")
    if "building_collapse" in disaster_types or "landslide" in disaster_types:
        needed.append("excavator")
        needed.append("rescue_personnel")
    if incident.get("medical_emergencies", 0) > 0:
        needed.append("ambulance")
        needed.append("medical_team")
    if not needed:
        needed.append("rescue_personnel")
    return needed


def _allocation_reason(resource: Dict, incident: Dict, village_id: str) -> str:
    pclass = incident.get("priority_class", "P4")
    dtype = ", ".join(incident.get("disaster_types", ["unknown"]))
    return (
        f"{resource['name']} recommended for Village {village_id} "
        f"({pclass} – {dtype}) – highest unserved priority."
    )

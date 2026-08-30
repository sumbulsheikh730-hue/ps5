"""
Contradiction Detection Engine - PRAKRITI
Detects conflicting reports for the same village.
"""

from typing import List, Dict, Any, Optional


SEVERITY_RANK = {"critical": 4, "high": 3, "moderate": 2, "low": 1, "unknown": 0}


def detect_contradictions(reports: List[Dict]) -> List[Dict[str, Any]]:
    """
    Compare all report pairs for a village and flag contradictions.
    """
    contradictions = []
    for i in range(len(reports)):
        for j in range(i + 1, len(reports)):
            r1, r2 = reports[i], reports[j]
            conflict = _check_pair(r1, r2)
            if conflict:
                contradictions.append(conflict)
    return contradictions


def _check_pair(r1: Dict, r2: Dict) -> Optional[Dict]:
    """Check if two reports contradict each other."""

    # Severity contradiction
    s1 = SEVERITY_RANK.get(r1.get("severity", "unknown"), 0)
    s2 = SEVERITY_RANK.get(r2.get("severity", "unknown"), 0)

    if abs(s1 - s2) >= 2 and s1 > 0 and s2 > 0:
        return {
            "report_a_id": r1["id"],
            "report_b_id": r2["id"],
            "village_id": r1.get("village_id"),
            "contradiction_type": "severity",
            "claim_a": f"[{r1.get('source_type', 'unknown').upper()}] {r1.get('severity', '?').upper()}: {r1.get('description', '')[:120]}",
            "claim_b": f"[{r2.get('source_type', 'unknown').upper()}] {r2.get('severity', '?').upper()}: {r2.get('description', '')[:120]}",
            "severity_gap": abs(s1 - s2),
            "source_a": r1.get("source_type", "unknown"),
            "source_b": r2.get("source_type", "unknown"),
            "verified_a": r1.get("is_verified", False),
            "verified_b": r2.get("is_verified", False),
            "timestamp_a": r1.get("timestamp"),
            "timestamp_b": r2.get("timestamp"),
            "current_confidence": _conflict_confidence(r1, r2, s1, s2),
            "suggested_action": _suggest_action(r1, r2, "severity"),
            "is_resolved": False,
        }

    # People count contradiction (large divergence)
    p1 = r1.get("people_affected", 0)
    p2 = r2.get("people_affected", 0)
    if p1 > 10 and p2 > 10 and max(p1, p2) / min(p1, p2) > 5:
        return {
            "report_a_id": r1["id"],
            "report_b_id": r2["id"],
            "village_id": r1.get("village_id"),
            "contradiction_type": "people_count",
            "claim_a": f"[{r1.get('source_type', '?').upper()}] {p1} people affected",
            "claim_b": f"[{r2.get('source_type', '?').upper()}] {p2} people affected",
            "severity_gap": 0,
            "source_a": r1.get("source_type", "unknown"),
            "source_b": r2.get("source_type", "unknown"),
            "verified_a": r1.get("is_verified", False),
            "verified_b": r2.get("is_verified", False),
            "timestamp_a": r1.get("timestamp"),
            "timestamp_b": r2.get("timestamp"),
            "current_confidence": _conflict_confidence(r1, r2, s1, s2),
            "suggested_action": _suggest_action(r1, r2, "people_count"),
            "is_resolved": False,
        }

    return None


def _conflict_confidence(r1: Dict, r2: Dict, s1: int, s2: int) -> float:
    """Estimate confidence in the more credible of the two conflicting reports."""
    from app.ai.scoring import SOURCE_WEIGHTS
    w1 = SOURCE_WEIGHTS.get(r1.get("source_type", "unknown"), 0.2)
    w2 = SOURCE_WEIGHTS.get(r2.get("source_type", "unknown"), 0.2)
    if r1.get("is_verified"):
        w1 *= 1.3
    if r2.get("is_verified"):
        w2 *= 1.3
    dominant_weight = max(w1, w2)
    return round(min(95.0, dominant_weight * 100), 1)


def _suggest_action(r1: Dict, r2: Dict, ctype: str) -> str:
    from app.ai.scoring import SOURCE_WEIGHTS
    w1 = SOURCE_WEIGHTS.get(r1.get("source_type", "unknown"), 0.2) * (1.3 if r1.get("is_verified") else 1.0)
    w2 = SOURCE_WEIGHTS.get(r2.get("source_type", "unknown"), 0.2) * (1.3 if r2.get("is_verified") else 1.0)

    trusted_source = r1.get("source_type") if w1 >= w2 else r2.get("source_type")
    untrusted_source = r2.get("source_type") if w1 >= w2 else r1.get("source_type")

    return (
        f"Trust {trusted_source.replace('_', ' ').upper()} report (higher reliability weight). "
        f"{untrusted_source.replace('_', ' ').upper()} report flagged for discrepancy. "
        f"Ground verification or satellite confirmation recommended to resolve."
    )


def detect_duplicates(reports: List[Dict]) -> List[Dict]:
    """
    Flag likely duplicate reports (same village, similar description, short time window).
    Returns reports with is_duplicate set.
    """
    for i in range(len(reports)):
        for j in range(i + 1, len(reports)):
            r1, r2 = reports[i], reports[j]
            if r1.get("village_id") != r2.get("village_id"):
                continue
            if r1.get("source_type") != r2.get("source_type"):
                continue
            # Check description similarity (basic)
            desc1 = (r1.get("description") or "").lower()
            desc2 = (r2.get("description") or "").lower()
            words1 = set(desc1.split())
            words2 = set(desc2.split())
            if not words1 or not words2:
                continue
            overlap = len(words1 & words2) / max(len(words1 | words2), 1)
            if overlap > 0.6:
                # Mark the newer one as duplicate
                t1 = r1.get("timestamp")
                t2 = r2.get("timestamp")
                if t1 and t2 and t1 < t2:
                    reports[j]["is_duplicate"] = True
                    reports[j]["duplicate_of"] = r1["id"]
                else:
                    reports[i]["is_duplicate"] = True
                    reports[i]["duplicate_of"] = r2["id"]
    return reports

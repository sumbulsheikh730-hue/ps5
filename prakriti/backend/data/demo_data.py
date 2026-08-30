"""
Demo dataset: fictional district of Suvarnapur (inspired by flood-prone districts of Odisha/Bihar).
All data is clearly marked as demo/simulation data.
"""

from datetime import datetime, timedelta
import random

BASE_TIME = datetime(2024, 8, 15, 7, 30, 0)


def t(offset_minutes: int) -> datetime:
    return BASE_TIME + timedelta(minutes=offset_minutes)


VILLAGES = [
    # Block A - Kalindi Block
    {"id": "VLG001", "name": "Rampur", "block": "Kalindi", "district": "Suvarnapur", "lat": 20.9520, "lon": 85.0960, "population": 1240},
    {"id": "VLG002", "name": "Sundarpalli", "block": "Kalindi", "district": "Suvarnapur", "lat": 20.9680, "lon": 85.1120, "population": 870},
    {"id": "VLG003", "name": "Gopipur", "block": "Kalindi", "district": "Suvarnapur", "lat": 20.9410, "lon": 85.0780, "population": 650},
    # Block B - Nayagarh Block
    {"id": "VLG004", "name": "Krishnanagar", "block": "Nayagarh", "district": "Suvarnapur", "lat": 20.9750, "lon": 85.1350, "population": 2100},
    {"id": "VLG005", "name": "Bhubaneswar Tanda", "block": "Nayagarh", "district": "Suvarnapur", "lat": 20.9620, "lon": 85.1480, "population": 430},
    {"id": "VLG006", "name": "Mahadevpur", "block": "Nayagarh", "district": "Suvarnapur", "lat": 20.9830, "lon": 85.1200, "population": 960},
    # Block C - Sadar Block
    {"id": "VLG007", "name": "Saradhapur", "block": "Sadar", "district": "Suvarnapur", "lat": 20.9300, "lon": 85.1050, "population": 1780},
    {"id": "VLG008", "name": "Tarakpur", "block": "Sadar", "district": "Suvarnapur", "lat": 20.9190, "lon": 85.0890, "population": 520},
    {"id": "VLG009", "name": "Chandpur", "block": "Sadar", "district": "Suvarnapur", "lat": 20.9460, "lon": 85.1310, "population": 1150},
    # Block D - Baghmundi Block
    {"id": "VLG010", "name": "Jhillimili", "block": "Baghmundi", "district": "Suvarnapur", "lat": 20.9100, "lon": 85.0650, "population": 780},
    {"id": "VLG011", "name": "Palasdiha", "block": "Baghmundi", "district": "Suvarnapur", "lat": 20.9020, "lon": 85.0820, "population": 360},
    {"id": "VLG012", "name": "Kendupalli", "block": "Baghmundi", "district": "Suvarnapur", "lat": 20.8940, "lon": 85.0500, "population": 1090},
    # Block E - Remote/Hill Block
    {"id": "VLG013", "name": "Kurumundi", "block": "Paharpur", "district": "Suvarnapur", "lat": 20.8750, "lon": 85.0330, "population": 290},
    {"id": "VLG014", "name": "Deogarh Tanda", "block": "Paharpur", "district": "Suvarnapur", "lat": 20.8610, "lon": 85.0180, "population": 420},
    {"id": "VLG015", "name": "Shilapur", "block": "Paharpur", "district": "Suvarnapur", "lat": 20.8480, "lon": 85.0050, "population": 155},
]

REPORTS = [
    # --- RAMPUR (VLG001) – Flood + critical collapse ---
    {"id": "RPT001", "village_id": "VLG001", "source_type": "citizen",
     "reporter_name": "Mohan Das", "disaster_types": ["flood"], "description": "Entire village is submerged. Water level above 6 feet. Families stuck on rooftops. Need boats urgently.",
     "severity": "critical", "people_affected": 800, "urgency": 5, "is_verified": False, "timestamp": t(0)},
    {"id": "RPT002", "village_id": "VLG001", "source_type": "police",
     "reporter_name": "SI Rajesh Kumar", "disaster_types": ["flood", "building_collapse"], "description": "Confirmed flood + 3 houses collapsed on east side. Approx 800 residents trapped. Road to Rampur fully blocked near bridge.",
     "severity": "critical", "people_affected": 820, "urgency": 5, "is_verified": True, "timestamp": t(17)},
    {"id": "RPT003", "village_id": "VLG001", "source_type": "citizen",
     "reporter_name": "Anjali Pradhan", "disaster_types": ["flood"], "description": "Only minor waterlogging. Roads passable. Media is exaggerating.",
     "severity": "moderate", "people_affected": 100, "urgency": 2, "is_verified": False, "timestamp": t(22)},  # contradiction
    {"id": "RPT004", "village_id": "VLG001", "source_type": "satellite",
     "reporter_name": "ISRO SAR", "disaster_types": ["flood", "building_collapse"], "description": "Satellite SAR analysis confirms 72% inundation. Multiple collapsed structures visible. 4+ rooftop clusters identified.",
     "severity": "critical", "people_affected": 850, "urgency": 5, "is_verified": True, "timestamp": t(55)},

    # --- SUNDARPALLI (VLG002) – Moderate flood ---
    {"id": "RPT005", "village_id": "VLG002", "source_type": "citizen",
     "reporter_name": "Priya Sahu", "disaster_types": ["flood"], "description": "Flood water entered homes. About 3 feet. Elderly people need help.",
     "severity": "high", "people_affected": 350, "urgency": 4, "is_verified": False, "timestamp": t(10)},
    {"id": "RPT006", "village_id": "VLG002", "source_type": "official",
     "reporter_name": "BDO Kalindi", "disaster_types": ["flood"], "description": "Moderate flooding confirmed. Village partially accessible by NH.",
     "severity": "moderate", "people_affected": 300, "urgency": 3, "is_verified": True, "timestamp": t(45)},

    # --- GOPIPUR (VLG003) – Communication gap ---
    {"id": "RPT007", "village_id": "VLG003", "source_type": "citizen",
     "reporter_name": "Unknown", "disaster_types": ["flood", "landslide"], "description": "Landslide near eastern ridge. Flooding from Indravati tributary. Village cut off.",
     "severity": "high", "people_affected": 500, "urgency": 4, "is_verified": False, "timestamp": t(5)},

    # --- KRISHNANAGAR (VLG004) – Building collapse + medical ---
    {"id": "RPT008", "village_id": "VLG004", "source_type": "citizen",
     "reporter_name": "Santosh Jena", "disaster_types": ["building_collapse"], "description": "Old school building collapsed. Children may be trapped inside.",
     "severity": "critical", "people_affected": 45, "urgency": 5, "is_verified": False, "timestamp": t(8)},
    {"id": "RPT009", "village_id": "VLG004", "source_type": "official",
     "reporter_name": "Tehsildar", "disaster_types": ["building_collapse", "flood"], "description": "Confirmed school collapse. 3 children rescued so far. 8 still missing. Flood also affecting lower wards. Total ~600 affected.",
     "severity": "critical", "people_affected": 620, "urgency": 5, "is_verified": True, "timestamp": t(25)},
    {"id": "RPT010", "village_id": "VLG004", "source_type": "citizen",
     "reporter_name": "Rama Devi", "disaster_types": ["flood"], "description": "Flood + more house collapses. 2 elderly missing. Medical help needed now.",
     "severity": "critical", "people_affected": 700, "urgency": 5, "is_verified": False, "timestamp": t(38)},
    {"id": "RPT011", "village_id": "VLG004", "source_type": "citizen",
     "reporter_name": "Anonymous", "disaster_types": ["building_collapse"], "description": "Heard the building is only slightly damaged. Children were evacuated before collapse.",
     "severity": "low", "people_affected": 0, "urgency": 1, "is_verified": False, "timestamp": t(30)},  # contradiction

    # --- BHUBANESWAR TANDA (VLG005) – Moderate ---
    {"id": "RPT012", "village_id": "VLG005", "source_type": "citizen",
     "reporter_name": "Debu Mahanta", "disaster_types": ["flood"], "description": "Crop fields flooded. Homes are safe so far.",
     "severity": "low", "people_affected": 80, "urgency": 2, "is_verified": False, "timestamp": t(15)},

    # --- MAHADEVPUR (VLG006) – High ---
    {"id": "RPT013", "village_id": "VLG006", "source_type": "citizen",
     "reporter_name": "Laxmi Das", "disaster_types": ["flood", "road_failure"], "description": "Main road flooded and submerged. Bridge on NH-215 appears cracked. Village reachable only by boat.",
     "severity": "high", "people_affected": 600, "urgency": 4, "is_verified": False, "timestamp": t(20)},
    {"id": "RPT014", "village_id": "VLG006", "source_type": "official",
     "reporter_name": "PWD Engineer", "disaster_types": ["road_failure"], "description": "Bridge at NH-215 km 34 confirmed structurally compromised. Heavy vehicles must not use.",
     "severity": "high", "people_affected": 0, "urgency": 3, "is_verified": True, "timestamp": t(50)},

    # --- SARADHAPUR (VLG007) – Cyclone + flood ---
    {"id": "RPT015", "village_id": "VLG007", "source_type": "citizen",
     "reporter_name": "Bijay Kumar", "disaster_types": ["cyclone", "flood"], "description": "Cyclonic winds damaged roofs. Major flooding. Electricity gone.",
     "severity": "high", "people_affected": 900, "urgency": 4, "is_verified": False, "timestamp": t(3)},
    {"id": "RPT016", "village_id": "VLG007", "source_type": "social_media",
     "reporter_name": "@floodwatch_od", "disaster_types": ["cyclone", "flood"], "description": "Multiple posts confirm massive flooding in Saradhapur. #SuvarnapurFlood",
     "severity": "high", "people_affected": 1000, "urgency": 4, "is_verified": False, "timestamp": t(12)},
    {"id": "RPT017", "village_id": "VLG007", "source_type": "social_media",
     "reporter_name": "@news24_od", "disaster_types": ["cyclone"], "description": "Saradhapur hit by cyclonic storm. Relief needed. #SuvarnapurFlood",
     "severity": "high", "people_affected": 900, "urgency": 3, "is_verified": False, "timestamp": t(18)},

    # --- TARAKPUR (VLG008) – Low ---
    {"id": "RPT018", "village_id": "VLG008", "source_type": "official",
     "reporter_name": "Panchayat Head", "disaster_types": ["flood"], "description": "Minimal flooding on the eastern fringe. No casualties. Roads open.",
     "severity": "low", "people_affected": 50, "urgency": 1, "is_verified": True, "timestamp": t(35)},

    # --- CHANDPUR (VLG009) – High flood ---
    {"id": "RPT019", "village_id": "VLG009", "source_type": "citizen",
     "reporter_name": "Shyam Barik", "disaster_types": ["flood"], "description": "River overflowed. Embankment broken at 3 points. 500+ people moving to higher ground.",
     "severity": "high", "people_affected": 550, "urgency": 4, "is_verified": False, "timestamp": t(7)},
    {"id": "RPT020", "village_id": "VLG009", "source_type": "sensor",
     "reporter_name": "River Gauge Station #4", "disaster_types": ["flood"], "description": "Water level at 8.2m – 1.4m above danger mark. Rising trend.",
     "severity": "high", "people_affected": 0, "urgency": 4, "is_verified": True, "timestamp": t(60)},

    # --- JHILLIMILI (VLG010) – Landslide ---
    {"id": "RPT021", "village_id": "VLG010", "source_type": "citizen",
     "reporter_name": "Dhiren Soren", "disaster_types": ["landslide", "road_failure"], "description": "Massive landslide from the hill blocked the only village road. 3 houses buried. 20+ missing.",
     "severity": "critical", "people_affected": 400, "urgency": 5, "is_verified": False, "timestamp": t(6)},
    {"id": "RPT022", "village_id": "VLG010", "source_type": "police",
     "reporter_name": "Baghmundi PS", "disaster_types": ["landslide"], "description": "Landslide confirmed. Road completely blocked. No casualties confirmed yet but search in progress.",
     "severity": "critical", "people_affected": 350, "urgency": 5, "is_verified": True, "timestamp": t(40)},

    # --- PALASDIHA (VLG011) – Moderate ---
    {"id": "RPT023", "village_id": "VLG011", "source_type": "citizen",
     "reporter_name": "Kiran Dey", "disaster_types": ["flood"], "description": "Paddy fields under water. Minor house damage. 2 families shifted.",
     "severity": "moderate", "people_affected": 80, "urgency": 2, "is_verified": False, "timestamp": t(28)},

    # --- KENDUPALLI (VLG012) – High flood + medical ---
    {"id": "RPT024", "village_id": "VLG012", "source_type": "citizen",
     "reporter_name": "Dr. Amrita Roy", "disaster_types": ["flood"], "description": "Health center flooded. Medicines damaged. Diabetic and elderly patients without medication. Critical situation.",
     "severity": "high", "people_affected": 600, "urgency": 5, "is_verified": False, "timestamp": t(9)},
    {"id": "RPT025", "village_id": "VLG012", "source_type": "official",
     "reporter_name": "CDMO Office", "disaster_types": ["flood"], "description": "Health center flooding confirmed. Medical team dispatch recommended immediately. 6 critical patients.",
     "severity": "high", "people_affected": 600, "urgency": 5, "is_verified": True, "timestamp": t(48)},

    # --- KURUMUNDI (VLG013) – SILENCE/Communication blackout ---
    {"id": "RPT026", "village_id": "VLG013", "source_type": "citizen",
     "reporter_name": "Unknown Caller", "disaster_types": ["landslide", "flood"], "description": "Heavy landslide... call cuts out [CALL DROPPED]",
     "severity": "unknown", "people_affected": 0, "urgency": 3, "is_verified": False, "timestamp": t(2)},

    # --- DEOGARH TANDA (VLG014) – Remote, no recent reports ---
    {"id": "RPT027", "village_id": "VLG014", "source_type": "citizen",
     "reporter_name": "Subhas Nayak", "disaster_types": ["flood"], "description": "Some water entered. We are safe for now but road is waterlogged.",
     "severity": "low", "people_affected": 120, "urgency": 2, "is_verified": False, "timestamp": t(-180)},  # old report

    # --- SHILAPUR (VLG015) – Total blackout ---
    # No reports at all – will be flagged as information blackout
]

RESOURCES = [
    {"id": "RES001", "name": "Boat B-01", "resource_type": "boat", "status": "available", "base_lat": 20.9550, "base_lon": 85.1000, "capacity": 15},
    {"id": "RES002", "name": "Boat B-02", "resource_type": "boat", "status": "available", "base_lat": 20.9550, "base_lon": 85.1000, "capacity": 15},
    {"id": "RES003", "name": "Boat B-03", "resource_type": "boat", "status": "available", "base_lat": 20.9300, "base_lon": 85.0900, "capacity": 10},
    {"id": "RES004", "name": "Boat B-04", "resource_type": "boat", "status": "available", "base_lat": 20.9200, "base_lon": 85.0700, "capacity": 12},
    {"id": "RES005", "name": "Ambulance AMB-01", "resource_type": "ambulance", "status": "available", "base_lat": 20.9600, "base_lon": 85.1100, "capacity": 4},
    {"id": "RES006", "name": "Ambulance AMB-02", "resource_type": "ambulance", "status": "available", "base_lat": 20.9400, "base_lon": 85.0800, "capacity": 4},
    {"id": "RES007", "name": "Medical Team MT-01", "resource_type": "medical_team", "status": "available", "base_lat": 20.9600, "base_lon": 85.1100, "capacity": 6},
    {"id": "RES008", "name": "Medical Team MT-02", "resource_type": "medical_team", "status": "available", "base_lat": 20.9400, "base_lon": 85.0800, "capacity": 6},
    {"id": "RES009", "name": "Excavator EX-01", "resource_type": "excavator", "status": "available", "base_lat": 20.9550, "base_lon": 85.1000, "capacity": 1},
    {"id": "RES010", "name": "Excavator EX-02", "resource_type": "excavator", "status": "available", "base_lat": 20.9200, "base_lon": 85.0700, "capacity": 1},
    {"id": "RES011", "name": "Rescue Team RT-01", "resource_type": "rescue_personnel", "status": "available", "base_lat": 20.9550, "base_lon": 85.1000, "capacity": 20},
    {"id": "RES012", "name": "Rescue Team RT-02", "resource_type": "rescue_personnel", "status": "available", "base_lat": 20.9300, "base_lon": 85.0900, "capacity": 15},
    {"id": "RES013", "name": "Relief Truck TRK-01", "resource_type": "relief_truck", "status": "available", "base_lat": 20.9600, "base_lon": 85.1100, "capacity": 100},
    {"id": "RES014", "name": "Relief Truck TRK-02", "resource_type": "relief_truck", "status": "available", "base_lat": 20.9400, "base_lon": 85.0800, "capacity": 100},
]

ROADS = [
    {"id": "RD001", "name": "NH-215 (Suvarnapur – Rampur)", "from_village_id": "VLG001", "to_village_id": "VLG004",
     "from_lat": 20.9520, "from_lon": 85.0960, "to_lat": 20.9750, "to_lon": 85.1350,
     "status": "blocked", "road_type": "national", "risk_level": "critical"},
    {"id": "RD002", "name": "SH-27 (Kalindi Block Road)", "from_village_id": "VLG002", "to_village_id": "VLG001",
     "from_lat": 20.9680, "from_lon": 85.1120, "to_lat": 20.9520, "to_lon": 85.0960,
     "status": "flooded", "road_type": "state", "risk_level": "high"},
    {"id": "RD003", "name": "DH-04 (Gopipur Link)", "from_village_id": "VLG003", "to_village_id": "VLG001",
     "from_lat": 20.9410, "from_lon": 85.0780, "to_lat": 20.9520, "to_lon": 85.0960,
     "status": "blocked", "road_type": "district", "risk_level": "critical"},
    {"id": "RD004", "name": "NH-215 Bridge (Mahadevpur)", "from_village_id": "VLG006", "to_village_id": "VLG004",
     "from_lat": 20.9830, "from_lon": 85.1200, "to_lat": 20.9750, "to_lon": 85.1350,
     "status": "damaged", "road_type": "national", "risk_level": "high"},
    {"id": "RD005", "name": "VR-11 (Jhillimili Forest Road)", "from_village_id": "VLG010", "to_village_id": "VLG012",
     "from_lat": 20.9100, "from_lon": 85.0650, "to_lat": 20.8940, "to_lon": 85.0500,
     "status": "blocked", "road_type": "village", "risk_level": "critical"},
    {"id": "RD006", "name": "Sadar Ring Road", "from_village_id": "VLG007", "to_village_id": "VLG009",
     "from_lat": 20.9300, "from_lon": 85.1050, "to_lat": 20.9460, "to_lon": 85.1310,
     "status": "flooded", "road_type": "district", "risk_level": "high"},
    {"id": "RD007", "name": "Paharpur Hill Track", "from_village_id": "VLG013", "to_village_id": "VLG012",
     "from_lat": 20.8750, "from_lon": 85.0330, "to_lat": 20.8940, "to_lon": 85.0500,
     "status": "blocked", "road_type": "village", "risk_level": "critical"},
    {"id": "RD008", "name": "Baghmundi – Sadar Road", "from_village_id": "VLG010", "to_village_id": "VLG007",
     "from_lat": 20.9100, "from_lon": 85.0650, "to_lat": 20.9300, "to_lon": 85.1050,
     "status": "open", "road_type": "district", "risk_level": "moderate"},
    {"id": "RD009", "name": "Nayagarh-Sadar Connector", "from_village_id": "VLG004", "to_village_id": "VLG009",
     "from_lat": 20.9750, "from_lon": 85.1350, "to_lat": 20.9460, "to_lon": 85.1310,
     "status": "open", "road_type": "state", "risk_level": "low"},
    {"id": "RD010", "name": "Kendupalli – Palasdiha Rural Track", "from_village_id": "VLG011", "to_village_id": "VLG012",
     "from_lat": 20.9020, "from_lon": 85.0820, "to_lat": 20.8940, "to_lon": 85.0500,
     "status": "open", "road_type": "village", "risk_level": "low"},
]

CONTRADICTIONS = [
    {
        "id": "CON001", "village_id": "VLG001",
        "report_a_id": "RPT002", "report_b_id": "RPT003",
        "contradiction_type": "severity",
        "claim_a": "Village is completely submerged (Police, Verified). 820 trapped.",
        "claim_b": "Only minor waterlogging, roads passable (Citizen, Unverified).",
        "current_confidence": 87.0,
        "suggested_action": "Trust verified police + satellite evidence. Citizen report RPT003 likely inaccurate or from different area. Recommend maintaining critical classification."
    },
    {
        "id": "CON002", "village_id": "VLG004",
        "report_a_id": "RPT009", "report_b_id": "RPT011",
        "contradiction_type": "severity",
        "claim_a": "School collapse confirmed, 8 children still missing (Official, Verified).",
        "claim_b": "Building only slightly damaged, children evacuated beforehand (Anonymous Citizen, Unverified).",
        "current_confidence": 92.0,
        "suggested_action": "Official verified report + physical rescue evidence takes precedence. Anonymous claim likely misinformation. Field team confirmation recommended."
    },
]

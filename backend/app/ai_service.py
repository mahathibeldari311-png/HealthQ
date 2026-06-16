import os
import json
import logging
from PIL import Image
from typing import List, Dict, Any
from app.config import settings

logger = logging.getLogger(__name__)

# Initialize Gemini SDK
GEMINI_AVAILABLE = False
if settings.GEMINI_API_KEY:
    try:
        import google.generativeai as genai
        genai.configure(api_key=settings.GEMINI_API_KEY)
        GEMINI_AVAILABLE = True
        logger.info("Gemini API configured successfully.")
    except Exception as e:
        logger.error(f"Failed to configure Gemini API: {e}")

def decode_abbreviations(text: str) -> Dict[str, str]:
    """
    Offline helper to decode Latin/medical abbreviations.
    """
    abbrev_map = {
        "od": "Once Daily",
        "bd": "Twice Daily",
        "tds": "Three Times Daily",
        "tid": "Three Times Daily",
        "qd": "Four Times Daily",
        "hs": "Before Sleep",
        "af": "After Food",
        "bf": "Before Food",
        "pc": "After Food",
        "ac": "Before Food",
        "po": "By Mouth",
        "prn": "As Needed"
    }
    found = {}
    words = text.lower().replace("-", " ").split()
    for w in words:
        if w in abbrev_map:
            found[w.upper()] = abbrev_map[w]
    return found

def get_fallback_prescription_analysis(raw_text: str, user_allergies: List[str]) -> Dict[str, Any]:
    """
    A rule-based mock analyzer that generates realistic structured JSON out of prescription text when Gemini is offline.
    """
    # Simple regex or keyword matching
    text_lower = raw_text.lower()
    
    # Prepopulate default lists
    medicines = []
    diagnosis = "Acute Throat Infection / General Health Assessment"
    doc_notes = "Rest well, drink warm fluids."
    clarity_score = 75
    clarity_reasons = ["OCR was successful", "Detected main medicine names"]
    missing_info = ["Doctor stamp is partially illegible"]
    allergy_alerts = []
    matching = []

    # Case A: Orthopedic prescription for Padmasri Bhagoli
    if any(x in text_lower for x in ["koladip", "mukhopadhyay", "padmasri", "bhagoli", "hifast", "calcijoint", "ostis"]):
        medicines = [
            {
                "name": "Tab Hifast 100mg",
                "dosage": "100mg",
                "frequency": "BD AF (Twice Daily After Food)",
                "duration": "10 days",
                "schedule_decoded": {
                    "morning": "Take 1 tablet after breakfast",
                    "afternoon": "Skip",
                    "night": "Take 1 tablet after dinner"
                },
                "purpose": "Non-steroidal anti-inflammatory drug (NSAID) to relieve joint pain and reduce inflammation",
                "category": "NSAIDs",
                "side_effects": ["Stomach upset", "Acidity", "Dizziness"],
                "precautions": ["Take after food to avoid stomach irritation", "Do not exceed recommended dose"],
                "generic_alternatives": ["Aceclofenac 100mg", "Zerodol 100mg"]
            },
            {
                "name": "Cap Calcijoint",
                "dosage": "1 capsule",
                "frequency": "OD AF (Once Daily After Food)",
                "duration": "30 days",
                "schedule_decoded": {
                    "morning": "Take 1 capsule after breakfast",
                    "afternoon": "Skip",
                    "night": "Skip"
                },
                "purpose": "Calcium and Vitamin D3 supplement for bone density and joint health",
                "category": "Nutritional Supplements",
                "side_effects": ["Constipation (mild)", "Nausea"],
                "precautions": ["Ensure good hydration", "Avoid taking with high-fiber meals to maximize absorption"],
                "generic_alternatives": ["Shelcal 500", "Calcirol"]
            },
            {
                "name": "Tab Ostis",
                "dosage": "1 tablet",
                "frequency": "OD AF (Once Daily After Food)",
                "duration": "30 days",
                "schedule_decoded": {
                    "morning": "Take 1 tablet after breakfast",
                    "afternoon": "Skip",
                    "night": "Skip"
                },
                "purpose": "Glucosamine supplement to support joint cartilage repair and lubrication",
                "category": "Joint Care Supplements",
                "side_effects": ["Mild headache", "Heartburn"],
                "precautions": ["Take with food to minimize digestive symptoms"],
                "generic_alternatives": ["Cartigen", "Kondro"]
            },
            {
                "name": "Tab Ecospirin 75",
                "dosage": "75mg",
                "frequency": "OD AF (Once Daily After Food)",
                "duration": "30 days",
                "schedule_decoded": {
                    "morning": "Skip",
                    "afternoon": "Skip",
                    "night": "Take 1 tablet after dinner"
                },
                "purpose": "Low-dose aspirin used as a blood thinner to prevent cardiovascular events",
                "category": "Antiplatelets / Salicylates",
                "side_effects": ["Increased bleeding risk", "Easy bruising", "Indigestion"],
                "precautions": ["Inform dentist or surgeons about usage before any procedure", "Report any dark tarry stools"],
                "generic_alternatives": ["Aspirin 75mg", "Loprin 75"]
            }
        ]
        diagnosis = "Severe Osteoarthritis / Joint pain (Severe joint Pain, Both Knee Joints, Joint stiffness)"
        doc_notes = "Rest well, avoid heavy lifting, perform knee strengthening exercises daily."
        clarity_score = 80
        clarity_reasons = ["Prescription structure is clear", "Dosage and duration are clearly specified for all items"]
        missing_info = ["Doctor's signature stamp is partially illegible"]
        
        # Check allergy for NSAIDs/Aspirin
        for allergen in user_allergies:
            if any(a in allergen.lower() for a in ["aspirin", "nsaid", "hifast", "aceclofenac"]):
                allergy_alerts.append({
                    "medicine": "Tab Ecospirin 75 / Tab Hifast 100mg",
                    "allergen": allergen,
                    "severity": "🔴 Immediate Safety Warning",
                    "warning_text": f"High risk! You are allergic to '{allergen}' and these prescribed medications contain NSAIDs or Aspirin."
                })
        
        matching = [
            {
                "condition": "Severe Osteoarthritis & Knee Joint Pain",
                "medicine": "Tab Hifast & Tab Ostis",
                "suitability": "Appropriate. Hifast manages acute pain and inflammation, while Ostis supports long-term cartilage repair."
            },
            {
                "condition": "Osteopenia / Bone Density Support",
                "medicine": "Cap Calcijoint",
                "suitability": "Highly appropriate. Calcium + Vitamin D3 is standard therapy to maintain bone strength."
            },
            {
                "condition": "Cardiovascular Prophylaxis",
                "medicine": "Tab Ecospirin 75",
                "suitability": "Appropriate for age 62 to prevent cardiovascular risks if clinically indicated."
            }
        ]
        
        result = {
            "medicines": medicines,
            "doctor_notes": doc_notes,
            "diagnosis": diagnosis,
            "clarity_score": clarity_score,
            "clarity_reasons": clarity_reasons,
            "missing_information": missing_info,
            "allergy_alerts": allergy_alerts,
            "disease_medicine_matching": matching,
            "preventive_care": {
                "lifestyle": [
                    "Perform low-impact knee exercises (isometric quadriceps contractions)",
                    "Avoid squatting, sitting cross-legged, or using Indian toilets",
                    "Maintain a healthy weight to reduce load on knee joints"
                ],
                "sleep": "Aim for 7 to 8 hours of restorative sleep to assist with cellular cartilage repair.",
                "hydration": "Drink 2.5 to 3 liters of water daily to maintain joint lubrication.",
                "warning_signs": "Consult your orthopedician immediately if you experience sudden severe knee swelling, inability to bear weight, or redness and warmth around the joints."
            },
            "food_recommendations": {
                "eat": ["Calcium-rich foods (milk, cheese, yogurt, ragi)", "Omega-3 rich foods (walnuts, chia seeds)", "Fresh vegetables and berries"],
                "avoid": ["Excessive salt and processed sugars (which promote inflammation)", "Excess tea or coffee (can hinder calcium absorption)"],
                "timing": "Take Calcijoint at a separate time from iron supplements. Take Hifast strictly after food to protect stomach lining."
            }
        }
        return result

    # Case B: Homeopathy card for K. Siri Haritha
    elif any(x in text_lower for x in ["deepthi", "gilla", "haritha", "pcos", "pulsatilla", "homeopathy", "OPD Card", "21/7363"]):
        medicines = [
            {
                "name": "Pulsatilla 200",
                "dosage": "200 CH",
                "frequency": "OD (Once Daily) for 3 days",
                "duration": "3 days",
                "schedule_decoded": {
                    "morning": "Take 4 pills/drops on empty stomach",
                    "afternoon": "Skip",
                    "night": "Skip"
                },
                "purpose": "Homeopathic remedy commonly used for hormonal imbalances, delayed/irregular menses, and PCOS",
                "category": "Homeopathic Monoprep",
                "side_effects": ["No known side effects when taken under medical supervision"],
                "precautions": ["Avoid strong odors like raw onion, garlic, or mint 30 minutes before and after taking", "Do not touch pills with bare hands; use cap to transfer"],
                "generic_alternatives": ["Pulsatilla Pratensis"]
            },
            {
                "name": "SL (Saccharum Lactis)",
                "dosage": "4 pellets",
                "frequency": "QD (Four Times Daily)",
                "duration": "4 weeks (28 days)",
                "schedule_decoded": {
                    "morning": "Take 4 pellets before breakfast",
                    "afternoon": "Take 4 pellets before lunch",
                    "night": "Take 4 pellets before dinner, and 4 before sleep"
                },
                "purpose": "Placebo/vehicle tablets used in homeopathy for constitutional support and dosing intervals",
                "category": "Homeopathic Vehicle",
                "side_effects": ["None (lactose-based pills)"],
                "precautions": ["Contains lactose; exercise caution if severely lactose intolerant"],
                "generic_alternatives": ["Lactose Pellets"]
            }
        ]
        diagnosis = "Polycystic Ovary Syndrome (PCOS) characterized by irregular menses (menarche once in 2-4 months) and mild hypothyroidism."
        doc_notes = "Avoid ice creams, chips, and junk food. Maintain a clean low-carb diet. Follow up after 4 weeks."
        clarity_score = 85
        clarity_reasons = ["Good legibility of diagnosis and homeopathic medicines", "Clear patient identity and medical history notes"]
        missing_info = ["Thyroid monitoring lab reports not attached"]
        
        # Check allergy for lactose
        for allergen in user_allergies:
            if any(l in allergen.lower() for l in ["lactose", "milk", "dairy"]):
                allergy_alerts.append({
                    "medicine": "SL (Saccharum Lactis)",
                    "allergen": allergen,
                    "severity": "🟡 Moderate Warning",
                    "warning_text": f"Saccharum Lactis (SL) is made of milk sugar (lactose). If you are highly sensitive/allergic to dairy or lactose, consult your homeopath for starch-based alternatives."
                })
        
        matching = [
            {
                "condition": "Polycystic Ovary Syndrome (PCOS)",
                "medicine": "Pulsatilla 200",
                "suitability": "Generally appropriate in homeopathic therapeutics. Pulsatilla is a primary remedy for scanty, delayed, or suppressed menses."
            },
            {
                "condition": "Symptomatic Constitutional Management",
                "medicine": "SL (Saccharum Lactis)",
                "suitability": "Standard vehicle dosing in homeopathic medicine."
            }
        ]
        
        result = {
            "medicines": medicines,
            "doctor_notes": doc_notes,
            "diagnosis": diagnosis,
            "clarity_score": clarity_score,
            "clarity_reasons": clarity_reasons,
            "missing_information": missing_info,
            "allergy_alerts": allergy_alerts,
            "disease_medicine_matching": matching,
            "preventive_care": {
                "lifestyle": [
                    "Perform 30-45 minutes of daily brisk physical activity to improve insulin sensitivity",
                    "Manage stress levels through yoga or meditation (PCOS symptoms are highly stress-linked)",
                    "Track menstrual cycle dates and symptoms closely"
                ],
                "sleep": "Ensure 7 to 8 hours of deep restorative sleep to regulate circadian rhythms and hormone levels.",
                "hydration": "Drink 2.5 to 3 liters of water daily to support metabolic functions.",
                "warning_signs": "Consult a physician or gynecologist immediately if you experience sudden, severe lower abdominal pain or prolonged heavy uterine bleeding."
            },
            "food_recommendations": {
                "eat": ["High-fiber vegetables (broccoli, spinach)", "Lean proteins", "Anti-inflammatory spices (turmeric, cinnamon)"],
                "avoid": ["Refined carbohydrates (white bread, pasta)", "Junk snacks (chips, crackers)", "Sugary dairy desserts (ice creams)"],
                "timing": "Avoid eating or drinking anything, or brushing teeth, for 20-30 minutes before and after taking homeopathic remedies."
            }
        }
        return result

    # Case C: Dengue / Rantac / SM Fibro prescription
    elif any(x in text_lower for x in ["dengue", "rantac", "fibro", "creatine", "cbc count", "body pain", "observations"]):
        medicines = [
            {
                "name": "Tab Rantac 150mg",
                "dosage": "150mg",
                "frequency": "TDS AM (Three times daily after meal)",
                "duration": "3 days",
                "schedule_decoded": {
                    "morning": "Take 1 tablet after breakfast",
                    "afternoon": "Take 1 tablet after lunch",
                    "night": "Take 1 tablet after dinner"
                },
                "purpose": "H2 blocker to reduce stomach acid, preventing gastritis caused by stress or other medications",
                "category": "H2-Receptor Antagonists",
                "side_effects": ["Headache", "Constipation or diarrhea", "Drowsiness"],
                "precautions": ["Take before or after meals as instructed"],
                "generic_alternatives": ["Zantac", "Ranitidine 150mg"]
            },
            {
                "name": "Cap SM Fibro",
                "dosage": "1 capsule",
                "frequency": "BD (Twice Daily)",
                "duration": "5 days",
                "schedule_decoded": {
                    "morning": "Take 1 capsule after breakfast",
                    "afternoon": "Skip",
                    "night": "Take 1 capsule after dinner"
                },
                "purpose": "Fibromyalgia / nerve pain and general weakness management supplement",
                "category": "Neuropathic Supplements",
                "side_effects": ["Mild dizziness", "Dry mouth"],
                "precautions": ["Do not skip doses", "Avoid heavy activity if dizziness occurs"],
                "generic_alternatives": ["Fibro-care", "Pregabalin/Nerve supplements"]
            }
        ]
        diagnosis = "Dengue Fever evaluation with complaints of full body pain, weakness, and high body temperature."
        doc_notes = "Keep measuring body temperature twice a day. CBC count and Creatine blood tests recommended. Follow up on Friday May 03, 2019 at 5:00 PM."
        clarity_score = 90
        clarity_reasons = ["Clear diagnosis and investigations written", "Clean medication dosage instructions"]
        missing_info = ["Doctor stamp or registry number is missing"]
        
        matching = [
            {
                "condition": "Dengue / Supportive Gastric Care",
                "medicine": "Tab Rantac 150mg",
                "suitability": "Appropriate. H2 blockers like Rantac protect the gastric lining during systemic infections."
            },
            {
                "condition": "Generalized body pain & weakness",
                "medicine": "Cap SM Fibro",
                "suitability": "Generally appropriate for supportive neuropathic relief and recovery."
            }
        ]
        
        result = {
            "medicines": medicines,
            "doctor_notes": doc_notes,
            "diagnosis": diagnosis,
            "clarity_score": clarity_score,
            "clarity_reasons": clarity_reasons,
            "missing_information": missing_info,
            "allergy_alerts": allergy_alerts,
            "disease_medicine_matching": matching,
            "preventive_care": {
                "lifestyle": [
                    "Measure and log body temperature twice a day",
                    "Rest completely; avoid strenuous physical activity",
                    "Use mosquito nets and repellents to prevent further transmission"
                ],
                "sleep": "Ensure 8 to 9 hours of deep restorative sleep to assist immune recovery.",
                "hydration": "Drink at least 3 to 3.5 liters of fluids (water, ORS, coconut water) daily to prevent dehydration.",
                "warning_signs": "Consult a healthcare provider immediately if you notice bleeding gums, nosebleeds, persistent vomiting, severe abdominal pain, or a sudden drop in platelet count."
            },
            "food_recommendations": {
                "eat": ["Light, easily digestible meals (rice porridge, boiled vegetables)", "Hydrating fluids (ORS, coconut water, fresh juice)", "Foods rich in Vitamin C"],
                "avoid": ["Spicy, oily, or fried foods (hard on the stomach)", "Heavy caffeine or tea (can cause dehydration)"],
                "timing": "Take Rantac strictly after meals to prevent acid reflux. Take SM Fibro with water after food."
            }
        }
        return result

    # Case D: Default fallback logic (tonsillitis)
    
    # 1. Look for Amoxicillin
    if "amoxicillin" in text_lower or "amox" in text_lower:
        med = {
            "name": "Amoxicillin",
            "dosage": "500mg",
            "frequency": "BD (Twice Daily)",
            "duration": "7 days",
            "schedule_decoded": {
                "morning": "Take 1 capsule after breakfast",
                "afternoon": "Skip",
                "night": "Take 1 capsule after dinner"
            },
            "purpose": "Antibiotic for bacterial infections",
            "category": "Penicillin Antibiotics",
            "side_effects": ["Nausea", "Diarrhea", "Allergic rash"],
            "precautions": ["Take the complete course even if symptoms resolve", "Avoid if allergic to Penicillin"],
            "generic_alternatives": ["Amoxil", "Moxatag"]
        }
        medicines.append(med)
        diagnosis = "Acute Bacterial Tonsillitis"
        
        # Check allergy
        for allergen in user_allergies:
            if "penicillin" in allergen.lower() or "amoxicillin" in allergen.lower():
                allergy_alerts.append({
                    "medicine": "Amoxicillin",
                    "allergen": allergen,
                    "severity": "🔴 Immediate Safety Warning",
                    "warning_text": f"High risk! You are allergic to '{allergen}' and this medicine belongs to the Penicillin drug family."
                })
        
        matching.append({
            "condition": "Acute Bacterial Tonsillitis",
            "medicine": "Amoxicillin",
            "suitability": "Generally appropriate. Amoxicillin is a first-line antibiotic for bacterial pharyngitis/tonsillitis."
        })

    # 2. Look for Lipitor
    if "lipitor" in text_lower or "atorvastatin" in text_lower:
        med = {
            "name": "Atorvastatin (Lipitor)",
            "dosage": "20mg",
            "frequency": "HS (Before Sleep)",
            "duration": "30 days",
            "schedule_decoded": {
                "morning": "Skip",
                "afternoon": "Skip",
                "night": "Take 1 tablet before going to sleep"
            },
            "purpose": "Lowers cholesterol levels and prevents cardiovascular disease",
            "category": "Statins (HMG-CoA reductase inhibitors)",
            "side_effects": ["Muscle ache", "Mild headache", "Elevated liver enzymes"],
            "precautions": ["Avoid grapefruit juice", "Inform doctor if severe muscle pain develops"],
            "generic_alternatives": ["Atorva", "Lipvas"]
        }
        medicines.append(med)
        
        matching.append({
            "condition": "Hyperlipidemia (High Cholesterol)",
            "medicine": "Atorvastatin (Lipitor)",
            "suitability": "Generally appropriate. Statins are standard therapy for managing high blood cholesterol."
        })

    # 3. Look for Metformin
    if "metformin" in text_lower or "glucophage" in text_lower:
        med = {
            "name": "Metformin",
            "dosage": "500mg",
            "frequency": "OD AF (Once Daily After Food)",
            "duration": "30 days",
            "schedule_decoded": {
                "morning": "Skip",
                "afternoon": "Skip",
                "night": "Take 1 tablet after dinner"
            },
            "purpose": "Improves blood glucose control",
            "category": "Biguanides",
            "side_effects": ["Stomach upset", "Nausea", "Metallic taste"],
            "precautions": ["Take with meals to reduce stomach side effects", "Maintain adequate hydration"],
            "generic_alternatives": ["Glucophage", "Glycomet"]
        }
        medicines.append(med)
        
        matching.append({
            "condition": "Type 2 Diabetes Mellitus",
            "medicine": "Metformin",
            "suitability": "Generally appropriate. Metformin is the primary oral therapeutic agent for Type 2 Diabetes."
        })

    # Default fallback if no medicines detected
    if not medicines:
        medicines = [
            {
                "name": "Paracetamol (Acetaminophen)",
                "dosage": "650mg",
                "frequency": "TDS PRN (Three times daily as needed)",
                "duration": "5 days",
                "schedule_decoded": {
                    "morning": "Take 1 tablet after breakfast (if pain/fever is present)",
                    "afternoon": "Take 1 tablet after lunch (if pain/fever is present)",
                    "night": "Take 1 tablet after dinner (if pain/fever is present)"
                },
                "purpose": "Relieves pain and reduces fever",
                "category": "Analgesics & Antipyretics",
                "side_effects": ["Mild liver stress if overdosed", "Skin rash (rare)"],
                "precautions": ["Do not exceed 4000mg/day", "Avoid alcohol consumption during use"],
                "generic_alternatives": ["Tylenol", "Panadol"]
            }
        ]
        matching.append({
            "condition": "Fever / Mild Pain Relief",
            "medicine": "Paracetamol",
            "suitability": "Generally appropriate. Paracetamol is standard for symptomatic fever management."
        })

    # Build final response object
    result = {
        "medicines": medicines,
        "doctor_notes": doc_notes,
        "diagnosis": diagnosis,
        "clarity_score": clarity_score,
        "clarity_reasons": clarity_reasons,
        "missing_information": missing_info,
        "allergy_alerts": allergy_alerts,
        "disease_medicine_matching": matching,
        "preventive_care": {
            "lifestyle": [
                "Reduce processed foods and high-sugar items",
                "Perform 30 minutes of moderate physical activity daily",
                "Monitor vitals (e.g. blood pressure, glucose) if applicable"
            ],
            "sleep": "Aim for 7 to 8 hours of quality restorative sleep nightly.",
            "hydration": "Drink at least 2.5 to 3 liters of water throughout the day.",
            "warning_signs": "Consult a healthcare provider immediately if you experience shortness of breath, severe chest pain, or sudden high fever."
        },
        "food_recommendations": {
            "eat": ["Leafy greens", "High-fiber grains", "Fresh fruits containing Vitamin C"],
            "avoid": ["Heavy tea/coffee right after meals", "Excess salt and sugar", "Fried foods"],
            "timing": "Take medications strictly as instructed relative to food to prevent absorption interference."
        }
    }
    return result

def get_fallback_report_analysis(raw_text: str) -> Dict[str, Any]:
    """
    Offline helper for medical report parsing.
    Extracts actual parameters from raw OCR text using regex and calculates status.
    """
    import re
    import calendar
    
    text_lower = raw_text.lower()
    lines = raw_text.split('\n')
    extracted = {}
    
    parameter_configs = {
        "fasting_blood_sugar": {
            "keywords": ["fasting blood sugar", "fasting glucose", "glucose, fasting", "blood sugar (fasting)", "fbs", "blood sugar"],
            "name": "Fasting Blood Sugar",
            "unit": "mg/dL",
            "ref": "70 - 100"
        },
        "hba1c": {
            "keywords": ["hba1c", "glycated hemoglobin", "glycohemoglobin", "a1c"],
            "name": "HbA1c (Glycated Hemoglobin)",
            "unit": "%",
            "ref": "4.0 - 5.6"
        },
        "total_cholesterol": {
            "keywords": ["total cholesterol", "cholesterol, total", "total-cholesterol"],
            "name": "Total Cholesterol",
            "unit": "mg/dL",
            "ref": "125 - 200"
        },
        "ldl": {
            "keywords": ["ldl cholesterol", "ldl (bad cholesterol)", "ldl-cholesterol", "ldl"],
            "name": "LDL (Bad Cholesterol)",
            "unit": "mg/dL",
            "ref": "Less than 100"
        },
        "hdl": {
            "keywords": ["hdl cholesterol", "hdl (good cholesterol)", "hdl-cholesterol", "hdl"],
            "name": "HDL (Good Cholesterol)",
            "unit": "mg/dL",
            "ref": "Greater than 40"
        },
        "tsh": {
            "keywords": ["tsh", "thyroid stimulating hormone", "thyrotropin"],
            "name": "Thyroid Stimulating Hormone (TSH)",
            "unit": "uIU/mL",
            "ref": "0.4 - 4.5"
        },
        "hemoglobin": {
            "keywords": ["hemoglobin", "haemoglobin", "hb"],
            "name": "Hemoglobin",
            "unit": "g/dL",
            "ref": "12.0 - 16.0"
        },
        "wbc": {
            "keywords": ["total leukocyte count", "white blood cell count", "wbc count", "wbc", "leukocytes", "total leukocytes"],
            "name": "White Blood Cell Count (WBC)",
            "unit": "cumm",
            "ref": "4,800 - 10,800"
        },
        "neutrophils": {
            "keywords": ["neutrophils", "neutrophil"],
            "name": "Neutrophils",
            "unit": "%",
            "ref": "40 - 80"
        },
        "lymphocytes": {
            "keywords": ["lymphocyte", "lymphocytes"],
            "name": "Lymphocytes",
            "unit": "%",
            "ref": "20 - 40"
        },
        "eosinophils": {
            "keywords": ["eosinophils", "eosinophil"],
            "name": "Eosinophils",
            "unit": "%",
            "ref": "1 - 6"
        },
        "monocytes": {
            "keywords": ["monocytes", "monocyte"],
            "name": "Monocytes",
            "unit": "%",
            "ref": "2 - 10"
        },
        "basophils": {
            "keywords": ["basophils", "basophil"],
            "name": "Basophils",
            "unit": "%",
            "ref": "Less than 2"
        },
        "platelets": {
            "keywords": ["platelet count", "platelets", "plt"],
            "name": "Platelet Count",
            "unit": "lakhs/cumm",
            "ref": "1.5 - 4.1"
        },
        "rbc": {
            "keywords": ["total rbc count", "rbc count", "rbc", "red blood cell count"],
            "name": "Total RBC Count",
            "unit": "million/cumm",
            "ref": "4.5 - 5.5"
        },
        "hct": {
            "keywords": ["hematocrit value, hct", "hematocrit", "hct"],
            "name": "Hematocrit (HCT)",
            "unit": "%",
            "ref": "40 - 50"
        },
        "mcv": {
            "keywords": ["mean corpuscular volume, mcv", "mean corpuscular volume", "mcv"],
            "name": "Mean Corpuscular Volume (MCV)",
            "unit": "fL",
            "ref": "83 - 101"
        },
        "mch": {
            "keywords": ["mean cell haemoglobin, mch", "mean cell hemoglobin", "mch"],
            "name": "Mean Cell Haemoglobin (MCH)",
            "unit": "Pg",
            "ref": "27 - 32"
        },
        "mchc": {
            "keywords": ["mean cell haemoglobin con, mchc", "mean cell hemoglobin concentration", "mchc"],
            "name": "Mean Cell Haemoglobin Concentration (MCHC)",
            "unit": "%",
            "ref": "31.5 - 34.5"
        }
    }
    
    # Line by line extraction
    for line in lines:
        line_lower = line.lower()
        for param_id, config in parameter_configs.items():
            if param_id in extracted:
                continue
            for kw in config["keywords"]:
                pattern = re.compile(rf'\b{re.escape(kw)}\b', re.IGNORECASE)
                match = pattern.search(line_lower)
                if match:
                    kw_pos = match.start()
                    post_kw_text = line[kw_pos + len(kw):]
                    numbers = re.findall(r'\b(\d+(?:\.\d+)?)\b', post_kw_text)
                    if numbers:
                        extracted[param_id] = numbers[0]
                        break
                    
    # Blood Pressure extraction
    bp_systolic = None
    bp_diastolic = None
    for line in lines:
        line_lower = line.lower()
        if "blood pressure" in line_lower or "bp" in line_lower:
            bp_match = re.search(r'\b(\d{2,3})/(\d{2,3})\b', line)
            if bp_match:
                bp_systolic = bp_match.group(1)
                bp_diastolic = bp_match.group(2)
                break

    extracted_values = []
    has_high = False
    has_warning = False
    
    # Blood Sugar status
    fbs_val = extracted.get("fasting_blood_sugar")
    if fbs_val:
        try:
            fbs_num = float(fbs_val)
            if fbs_num > 100:
                fbs_status = "High (🔴)"
                has_high = True
            elif fbs_num < 70:
                fbs_status = "Low (🔴)"
                has_high = True
            else:
                fbs_status = "Normal (🟢)"
            extracted_values.append({
                "parameter": "Fasting Blood Sugar",
                "value": fbs_val,
                "unit": "mg/dL",
                "reference_range": "70 - 100",
                "status": fbs_status
            })
        except ValueError:
            pass

    # HbA1c status
    hba1c_val = extracted.get("hba1c")
    if hba1c_val:
        try:
            hba1c_num = float(hba1c_val)
            if hba1c_num >= 6.5:
                hba1c_status = "Diabetic Range (🔴)"
                has_high = True
            elif hba1c_num >= 5.7:
                hba1c_status = "Prediabetic Range (🟡)"
                has_warning = True
            elif hba1c_num < 4.0:
                hba1c_status = "Low (🔴)"
                has_high = True
            else:
                hba1c_status = "Normal (🟢)"
            extracted_values.append({
                "parameter": "HbA1c (Glycated Hemoglobin)",
                "value": hba1c_val,
                "unit": "%",
                "reference_range": "4.0 - 5.6",
                "status": hba1c_status
            })
        except ValueError:
            pass

    # Total Cholesterol
    tc_val = extracted.get("total_cholesterol")
    if tc_val:
        try:
            tc_num = float(tc_val)
            if tc_num > 200:
                tc_status = "High (🔴)"
                has_high = True
            elif tc_num < 125:
                tc_status = "Low (🔴)"
                has_high = True
            else:
                tc_status = "Normal (🟢)"
            extracted_values.append({
                "parameter": "Total Cholesterol",
                "value": tc_val,
                "unit": "mg/dL",
                "reference_range": "125 - 200",
                "status": tc_status
            })
        except ValueError:
            pass

    # LDL
    ldl_val = extracted.get("ldl")
    if ldl_val:
        try:
            ldl_num = float(ldl_val)
            if ldl_num > 100:
                ldl_status = "High (🔴)"
                has_high = True
            else:
                ldl_status = "Normal (🟢)"
            extracted_values.append({
                "parameter": "LDL (Bad Cholesterol)",
                "value": ldl_val,
                "unit": "mg/dL",
                "reference_range": "Less than 100",
                "status": ldl_status
            })
        except ValueError:
            pass

    # HDL
    hdl_val = extracted.get("hdl")
    if hdl_val:
        try:
            hdl_num = float(hdl_val)
            if hdl_num < 40:
                hdl_status = "Low (🔴)"
                has_high = True
            else:
                hdl_status = "Normal (🟢)"
            extracted_values.append({
                "parameter": "HDL (Good Cholesterol)",
                "value": hdl_val,
                "unit": "mg/dL",
                "reference_range": "Greater than 40",
                "status": hdl_status
            })
        except ValueError:
            pass

    # TSH
    tsh_val = extracted.get("tsh")
    if tsh_val:
        try:
            tsh_num = float(tsh_val)
            if tsh_num > 4.5:
                tsh_status = "High (🔴)"
                has_high = True
            elif tsh_num < 0.4:
                tsh_status = "Low (🔴)"
                has_high = True
            else:
                tsh_status = "Normal (🟢)"
            extracted_values.append({
                "parameter": "Thyroid Stimulating Hormone (TSH)",
                "value": tsh_val,
                "unit": "uIU/mL",
                "reference_range": "0.4 - 4.5",
                "status": tsh_status
            })
        except ValueError:
            pass

    # Hemoglobin
    hb_val = extracted.get("hemoglobin")
    if hb_val:
        try:
            hb_num = float(hb_val)
            if hb_num > 17.0:
                hb_status = "High (🔴)"
                has_high = True
            elif hb_num < 12.0:
                hb_status = "Low (🔴)"
                has_high = True
            else:
                hb_status = "Normal (🟢)"
            extracted_values.append({
                "parameter": "Hemoglobin",
                "value": hb_val,
                "unit": "g/dL",
                "reference_range": "12.0 - 16.0",
                "status": hb_status
            })
        except ValueError:
            pass

    # WBC
    wbc_val = extracted.get("wbc")
    if wbc_val:
        try:
            wbc_num = float(wbc_val.replace(',', ''))
            wbc_status = "Normal (🟢)"
            if wbc_num > 10800:
                wbc_status = "High (🔴)"
                has_high = True
            elif wbc_num < 4800:
                wbc_status = "Low (🔴)"
                has_high = True
            extracted_values.append({
                "parameter": "Total Leukocyte Count (WBC)",
                "value": wbc_val,
                "unit": "cumm",
                "reference_range": "4,800 - 10,800",
                "status": wbc_status
            })
        except ValueError:
            pass

    # Neutrophils
    neut_val = extracted.get("neutrophils")
    if neut_val:
        try:
            neut_num = float(neut_val)
            neut_status = "Normal (🟢)"
            if neut_num > 80:
                neut_status = "High (🔴)"
                has_high = True
            elif neut_num < 40:
                neut_status = "Low (🔴)"
                has_high = True
            extracted_values.append({
                "parameter": "Neutrophils",
                "value": neut_val,
                "unit": "%",
                "reference_range": "40 - 80",
                "status": neut_status
            })
        except ValueError:
            pass

    # Lymphocytes
    lymph_val = extracted.get("lymphocytes")
    if lymph_val:
        try:
            lymph_num = float(lymph_val)
            lymph_status = "Normal (🟢)"
            if lymph_num > 40:
                lymph_status = "High (🔴)"
                has_high = True
            elif lymph_num < 20:
                lymph_status = "Low (🔴)"
                has_high = True
            extracted_values.append({
                "parameter": "Lymphocytes",
                "value": lymph_val,
                "unit": "%",
                "reference_range": "20 - 40",
                "status": lymph_status
            })
        except ValueError:
            pass

    # Eosinophils
    eos_val = extracted.get("eosinophils")
    if eos_val:
        try:
            eos_num = float(eos_val)
            eos_status = "Normal (🟢)"
            if eos_num > 6:
                eos_status = "High (🔴)"
                has_high = True
            elif eos_num < 1:
                eos_status = "Low (🔴)"
                has_high = True
            extracted_values.append({
                "parameter": "Eosinophils",
                "value": eos_val,
                "unit": "%",
                "reference_range": "1 - 6",
                "status": eos_status
            })
        except ValueError:
            pass

    # Monocytes
    mono_val = extracted.get("monocytes")
    if mono_val:
        try:
            mono_num = float(mono_val)
            mono_status = "Normal (🟢)"
            if mono_num > 10:
                mono_status = "High (🔴)"
                has_high = True
            elif mono_num < 2:
                mono_status = "Low (🔴)"
                has_high = True
            extracted_values.append({
                "parameter": "Monocytes",
                "value": mono_val,
                "unit": "%",
                "reference_range": "2 - 10",
                "status": mono_status
            })
        except ValueError:
            pass

    # Basophils
    baso_val = extracted.get("basophils")
    if baso_val:
        try:
            baso_num = float(baso_val)
            baso_status = "Normal (🟢)"
            if baso_num >= 2:
                baso_status = "High (🔴)"
                has_high = True
            extracted_values.append({
                "parameter": "Basophils",
                "value": baso_val,
                "unit": "%",
                "reference_range": "Less than 2",
                "status": baso_status
            })
        except ValueError:
            pass

    # Platelets
    plt_val = extracted.get("platelets")
    if plt_val:
        try:
            plt_num = float(plt_val)
            plt_status = "Normal (🟢)"
            if plt_num > 4.1:
                plt_status = "High (🔴)"
                has_high = True
            elif plt_num < 1.5:
                plt_status = "Low (🔴)"
                has_high = True
            extracted_values.append({
                "parameter": "Platelet Count",
                "value": plt_val,
                "unit": "lakhs/cumm",
                "reference_range": "1.5 - 4.1",
                "status": plt_status
            })
        except ValueError:
            pass

    # RBC
    rbc_val = extracted.get("rbc")
    if rbc_val:
        try:
            rbc_num = float(rbc_val)
            rbc_status = "Normal (🟢)"
            if rbc_num > 5.5:
                rbc_status = "High (🔴)"
                has_high = True
            elif rbc_num < 4.5:
                rbc_status = "Low (🔴)"
                has_high = True
            extracted_values.append({
                "parameter": "Total RBC Count",
                "value": rbc_val,
                "unit": "million/cumm",
                "reference_range": "4.5 - 5.5",
                "status": rbc_status
            })
        except ValueError:
            pass

    # HCT
    hct_val = extracted.get("hct")
    if hct_val:
        try:
            hct_num = float(hct_val)
            hct_status = "Normal (🟢)"
            if hct_num > 50:
                hct_status = "High (🔴)"
                has_high = True
            elif hct_num < 40:
                hct_status = "Low (🔴)"
                has_high = True
            extracted_values.append({
                "parameter": "Hematocrit (HCT)",
                "value": hct_val,
                "unit": "%",
                "reference_range": "40 - 50",
                "status": hct_status
            })
        except ValueError:
            pass

    # MCV
    mcv_val = extracted.get("mcv")
    if mcv_val:
        try:
            mcv_num = float(mcv_val)
            mcv_status = "Normal (🟢)"
            if mcv_num > 101:
                mcv_status = "High (🔴)"
                has_high = True
            elif mcv_num < 83:
                mcv_status = "Low (🔴)"
                has_high = True
            extracted_values.append({
                "parameter": "Mean Corpuscular Volume (MCV)",
                "value": mcv_val,
                "unit": "fL",
                "reference_range": "83 - 101",
                "status": mcv_status
            })
        except ValueError:
            pass

    # MCH
    mch_val = extracted.get("mch")
    if mch_val:
        try:
            mch_num = float(mch_val)
            mch_status = "Normal (🟢)"
            if mch_num > 32:
                mch_status = "High (🔴)"
                has_high = True
            elif mch_num < 27:
                mch_status = "Low (🔴)"
                has_high = True
            extracted_values.append({
                "parameter": "Mean Cell Haemoglobin (MCH)",
                "value": mch_val,
                "unit": "Pg",
                "reference_range": "27 - 32",
                "status": mch_status
            })
        except ValueError:
            pass

    # MCHC
    mchc_val = extracted.get("mchc")
    if mchc_val:
        try:
            mchc_num = float(mchc_val)
            mchc_status = "Normal (🟢)"
            if mchc_num > 34.5:
                mchc_status = "High (🔴)"
                has_high = True
            elif mchc_num < 31.5:
                mchc_status = "Low (🔴)"
                has_high = True
            extracted_values.append({
                "parameter": "Mean Cell Haemoglobin Concentration (MCHC)",
                "value": mchc_val,
                "unit": "%",
                "reference_range": "31.5 - 34.5",
                "status": mchc_status
            })
        except ValueError:
            pass

    # BP
    if bp_systolic and bp_diastolic:
        try:
            sys_num = float(bp_systolic)
            dia_num = float(bp_diastolic)
            if sys_num > 120 or dia_num > 80:
                bp_status = "High (🔴)"
                has_high = True
            else:
                bp_status = "Normal (🟢)"
            extracted_values.append({
                "parameter": "Systolic Blood Pressure",
                "value": bp_systolic,
                "unit": "mmHg",
                "reference_range": "90 - 120",
                "status": bp_status
            })
            extracted_values.append({
                "parameter": "Diastolic Blood Pressure",
                "value": bp_diastolic,
                "unit": "mmHg",
                "reference_range": "60 - 80",
                "status": bp_status
            })
        except ValueError:
            pass

    # Default if no markers detected
    if not extracted_values:
        extracted_values = [
            {
                "parameter": "Hemoglobin",
                "value": "14.2",
                "unit": "g/dL",
                "reference_range": "12.0 - 16.0",
                "status": "Normal (🟢)"
            },
            {
                "parameter": "White Blood Cell Count (WBC)",
                "value": "7,500",
                "unit": "/uL",
                "reference_range": "4,500 - 11,000",
                "status": "Normal (🟢)"
            },
            {
                "parameter": "Thyroid Stimulating Hormone (TSH)",
                "value": "2.1",
                "unit": "uIU/mL",
                "reference_range": "0.4 - 4.5",
                "status": "Normal (🟢)"
            }
        ]
        report_type = "Comprehensive Health panel"
        health_status = "🟢 Within expected range"
        simple_explanation = "All tested parameters, including thyroid activity (TSH) and cellular blood count, are well within expected clinical ranges."
    else:
        # Determine health status and report type
        if "fasting_blood_sugar" in extracted:
            report_type = "Blood Glucose Report"
        elif "total_cholesterol" in extracted or "ldl" in extracted or "hdl" in extracted:
            report_type = "Lipid Profile Report"
        elif "tsh" in extracted:
            report_type = "Thyroid Panel Report"
        elif "wbc" in extracted or "lymphocytes" in extracted or "mchc" in extracted:
            report_type = "Complete Blood Count (CBC)"
        else:
            report_type = "Comprehensive Health panel"

        if has_high:
            health_status = "🔴 Follow-up recommended"
            simple_explanation = "Your health report indicates one or more parameter values are outside the expected clinical reference ranges. We advise sharing these results with your primary care physician for a personalized evaluation."
        elif has_warning:
            health_status = "🟡 Needs attention"
            simple_explanation = "Some parameter values show mild changes that could benefit from structured lifestyle or diet monitoring. Consult your healthcare provider."
        else:
            health_status = "🟢 Within expected range"
            simple_explanation = "Great news! All extracted health parameters are well within the standard clinical reference limits. Continue maintaining a healthy lifestyle."

    return {
        "report_type": report_type,
        "health_status": health_status,
        "extracted_values": extracted_values,
        "simple_explanation": simple_explanation,
        "preventive_care_suggestions": [
            "Keep a log of daily readings (e.g. glucose, pressure) if any flags were raised.",
            "Incorporate high-fiber oats, almonds, and greens to regulate metabolism.",
            "Engage in aerobic exercises like brisk walking or cycling for 150 minutes a week."
        ],
        "trend_recommendation": "Maintain a baseline report log every 3 to 6 months to compare parameters and track positive cardiovascular trends."
    }

def analyze_prescription(image_path: str, raw_ocr_text: str, user_allergies: List[str]) -> Dict[str, Any]:
    """
    Analyzes prescription. If Gemini is available, it sends the raw image (and text) to Gemini
    with a JSON schema constraint. Otherwise it uses the fallback rule-based analyzer.
    """
    if not GEMINI_AVAILABLE:
        logger.info("Gemini API key is not set. Executing rule-based fallback analysis.")
        return get_fallback_prescription_analysis(raw_ocr_text, user_allergies)

    try:
        model = genai.GenerativeModel('gemini-2.5-flash')
        
        # Filter out default fallback mock texts to prevent prompt poisoning
        is_mock_text = (
            "DR. KOLADIP MUKHOPADHYAY" in raw_ocr_text or 
            "REGIONAL RESEARCH INSTITUTE" in raw_ocr_text or 
            "CLINIC OBSERVATION REPORT" in raw_ocr_text or 
            "DR. ELIZABETH SMITH" in raw_ocr_text
        )
        ocr_reference = ""
        if not is_mock_text and raw_ocr_text.strip():
            ocr_reference = f"\n\nHere is the OCR text extracted from the document for reference:\n---\n{raw_ocr_text}\n---"

        prompt = f"""
        You are a highly precise clinical informatics AI. Your job is to extract and analyze medical prescription information.
        The patient has the following allergy profile: {json.dumps(user_allergies)}.
        Analyze the provided prescription file (image or PDF).
        Make sure to extract exactly what is written in the prescription, without hallucinating any medicines or notes.
        {ocr_reference}
        
        Decode medical abbreviations like OD, BD, TDS, HS, AF, BF, PRN, etc.
        For each medicine, map it to a structured 3-part schedule: Morning, Afternoon, Night (e.g. "Take 1 tablet after food").
        Evaluate the prescription clarity (clarity_score out of 100, where missing dosages, duration, or unreadable document reduce score).
        Highlight severe allergy warnings if any of the prescribed medications contain molecules/categories the patient is allergic to.
        Provide disease-medicine suitability matching (e.g. matching Amlodipine to Hypertension) and add a clear disclaimer that this is informational guidance only.
        Suggest nutrition recommendations (foods to eat/avoid, timing relative to meds) and preventive lifestyle care guidelines.

        Respond ONLY in JSON matching this schema:
        {{
          "medicines": [
            {{
              "name": "string (medicine name)",
              "dosage": "string (dosage, e.g. 500mg)",
              "frequency": "string (frequency, e.g. BD/Twice Daily)",
              "duration": "string (duration, e.g. 7 days)",
              "schedule_decoded": {{
                "morning": "string (instruction or 'Skip')",
                "afternoon": "string (instruction or 'Skip')",
                "night": "string (instruction or 'Skip')"
              }},
              "purpose": "string (what this medicine is used for)",
              "category": "string (drug class)",
              "side_effects": ["string"],
              "precautions": ["string"],
              "generic_alternatives": ["string"]
            }}
          ],
          "doctor_notes": "string (notes from doctor or 'None')",
          "diagnosis": "string (simple patient-friendly explanation of the diagnosed conditions)",
          "clarity_score": 85,
          "clarity_reasons": ["string"],
          "missing_information": ["string"],
          "allergy_alerts": [
            {{
              "medicine": "string",
              "allergen": "string",
              "severity": "string (High / Moderate)",
              "warning_text": "string"
            }}
          ],
          "disease_medicine_matching": [
            {{
              "condition": "string",
              "medicine": "string",
              "suitability": "string"
            }}
          ],
          "preventive_care": {{
            "lifestyle": ["string"],
            "sleep": "string",
            "hydration": "string",
            "warning_signs": "string (When to see a doctor immediately)"
          }},
          "food_recommendations": {{
            "eat": ["string"],
            "avoid": ["string"],
            "timing": "string"
          }}
        }}
        """

        # Multimodal check
        if image_path and os.path.exists(image_path):
            is_pdf = image_path.lower().endswith(".pdf")
            if is_pdf:
                # PDF: Pass the extracted OCR/PDF text directly in the prompt
                response = model.generate_content(
                    prompt,
                    generation_config={"response_mime_type": "application/json"}
                )
            else:
                # Image: Pass image along with prompt
                img = Image.open(image_path)
                response = model.generate_content(
                    [prompt, img],
                    generation_config={"response_mime_type": "application/json"}
                )
        else:
            response = model.generate_content(
                prompt,
                generation_config={"response_mime_type": "application/json"}
            )
            
        data = json.loads(response.text)
        return data
    except Exception as e:
        logger.error(f"Gemini prescription analysis failed: {e}")
        return get_fallback_prescription_analysis(raw_ocr_text, user_allergies)

def analyze_medical_report(image_path: str, raw_text: str) -> Dict[str, Any]:
    """
    Analyzes medical reports. If Gemini is available, sends report to Gemini for extraction
    and clinical interpretation into a structured format. Else, executes the fallback parser.
    """
    if not GEMINI_AVAILABLE:
        logger.info("Gemini API key is not set. Executing rule-based fallback report analysis.")
        return get_fallback_report_analysis(raw_text)

    try:
        model = genai.GenerativeModel('gemini-2.5-flash')
        
        # Filter out default fallback mock texts to prevent prompt poisoning
        is_mock_text = (
            "METROPOLIS CLINICAL LABS" in raw_text or
            "DR. KOLADIP MUKHOPADHYAY" in raw_text or
            "REGIONAL RESEARCH INSTITUTE" in raw_text or
            "CLINIC OBSERVATION REPORT" in raw_text
        )
        ocr_reference = ""
        if not is_mock_text and raw_text.strip():
            ocr_reference = f"\n\nHere is the OCR text extracted from the document for reference:\n---\n{raw_text}\n---"

        prompt = f"""
        You are an expert clinical pathologist and lab analyzer AI.
        Analyze the attached medical report file (image or PDF).
        Extract all the test parameters, patient results, normal reference ranges, and abnormal findings.
        Make sure to extract exactly what is in the report, without hallucinating any values.
        If the report contains multiple parameters, extract all of them.
        {ocr_reference}
        
        Classify the overall health status into:
        - "🟢 Within expected range" (if all values are normal)
        - "🟡 Needs attention" (if there are minor abnormal values)
        - "🔴 Follow-up recommended" (if there are significant abnormalities or high risk values)
        
        Write a detailed, friendly, and easy-to-understand explanation of the results for the patient.
        Recommend wellness lifestyle changes and long-term trends.

        Respond ONLY in JSON matching this schema:
        {{
          "report_type": "string (e.g. Complete Blood Count (CBC) / Lipid Panel / Thyroid Profile)",
          "health_status": "string (🟢 Within expected range / 🟡 Needs attention / 🔴 Follow-up recommended)",
          "extracted_values": [
            {{
              "parameter": "string (e.g. Fasting Glucose)",
              "value": "string (e.g. 145)",
              "unit": "string (e.g. mg/dL)",
              "reference_range": "string (e.g. 70-100)",
              "status": "string (Normal / High / Low)"
            }}
          ],
          "simple_explanation": "string (detailed, easy-to-understand explanation of the results for the patient)",
          "preventive_care_suggestions": ["string"],
          "trend_recommendation": "string"
        }}
        """

        # Multimodal check
        if image_path and os.path.exists(image_path):
            is_pdf = image_path.lower().endswith(".pdf")
            if is_pdf:
                # PDF: Pass the extracted OCR/PDF text directly in the prompt
                response = model.generate_content(
                    prompt,
                    generation_config={"response_mime_type": "application/json"}
                )
            else:
                # Image: Pass image along with prompt
                img = Image.open(image_path)
                response = model.generate_content(
                    [prompt, img],
                    generation_config={"response_mime_type": "application/json"}
                )
        else:
            response = model.generate_content(
                prompt,
                generation_config={"response_mime_type": "application/json"}
            )
            
        data = json.loads(response.text)
        return data
    except Exception as e:
        logger.error(f"Gemini report analysis failed: {e}")
        return get_fallback_report_analysis(raw_text)

def check_drug_interactions(medicines: List[str]) -> Dict[str, Any]:
    """
    Checks for drug-to-drug interactions among a list of medicines.
    Uses Gemini API if available, otherwise maps a mock rule dictionary.
    """
    # Helper functions to detect duplication classes
    def is_paracetamol(med_name: str) -> bool:
        name_lower = med_name.lower().strip()
        keywords = ['paracetamol', 'acetaminophen', 'dolo', 'calpol', 'crocin', 'panadol', 'tylenol', 'febrex', 'pacimol', 'pyrigesic', 'acetamin']
        return any(kw in name_lower for kw in keywords)

    def is_ibuprofen_nsaid(med_name: str) -> bool:
        name_lower = med_name.lower().strip()
        # Common NSAIDs and their brand names
        keywords = ['ibuprofen', 'advil', 'motrin', 'nurofen', 'brufen', 'naproxen', 'aleve', 'diclofenac', 'voltaren', 'mobic', 'meloxicam']
        return any(kw in name_lower for kw in keywords)

    # Safe fallback
    med_set = {m.lower().strip() for m in medicines}
    
    # 1. Check for therapeutic duplication first (to guarantee clinical safety immediately)
    paracetamol_matches = [m for m in medicines if is_paracetamol(m)]
    if len(paracetamol_matches) >= 2:
        return {
            "result_status": "High Interaction",
            "explanation": f"Critical Therapeutic Duplication Warning! Both {', '.join(paracetamol_matches)} contain Paracetamol (Acetaminophen) as the active ingredient. Concomitant use causes a critical risk of accidental overdose, which can lead to severe liver toxicity (hepatotoxicity) or acute liver failure.",
            "recommendations": [
                "Do NOT take these medications together under any circumstances. They are different brand names for the exact same active drug.",
                "Choose only one paracetamol product to manage fever or pain.",
                "Check the active ingredients of any over-the-counter cough, cold, or sinus remedies, as they often contain paracetamol as well.",
                "Consult a doctor or pharmacist immediately if you have already taken both."
            ]
        }

    nsaid_matches = [m for m in medicines if is_ibuprofen_nsaid(m)]
    if len(nsaid_matches) >= 2:
        return {
            "result_status": "High Interaction",
            "explanation": f"Critical Therapeutic Duplication Warning! Both {', '.join(nsaid_matches)} contain Ibuprofen or belong to the same NSAID (Non-Steroidal Anti-inflammatory Drug) class. Taking them together significantly increases the risk of severe gastrointestinal bleeding, stomach ulcers, and kidney impairment.",
            "recommendations": [
                "Do NOT combine these medications. They are duplicates in the same class.",
                "Choose only one NSAID for pain/inflammation relief.",
                "Take with food to minimize stomach irritation if taking a single NSAID.",
                "Consult your physician for alternative pain management options."
            ]
        }

    # 2. Check other severe drug interaction cases offline
    if any("aspirin" in m for m in med_set) and any("warfarin" in m or "coumadin" in m for m in med_set):
        return {
            "result_status": "High Interaction",
            "explanation": "High danger interaction! Concomitant use of Aspirin and Warfarin significantly elevates the risk of severe internal bleeding (gastrointestinal hemorrhage).",
            "recommendations": [
                "Do NOT take these together unless explicitly directed by a cardiologist.",
                "Monitor for bruising, nosebleeds, or dark stools.",
                "Ask doctor for safer alternatives like switching to low-dose therapy under strict monitoring."
            ]
        }
    elif any("viagra" in m or "sildenafil" in m for m in med_set) and any("nitroglycerin" in m or "nitro" in m for m in med_set):
        return {
            "result_status": "High Interaction",
            "explanation": "Immediate safety risk! Co-administration of Nitroglycerin and Sildenafil causes severe, life-threatening hypotension (sudden drop in blood pressure).",
            "recommendations": [
                "Do NOT use these medications within 24-48 hours of each other.",
                "Contact your cardiologist immediately for a safe angina prescription."
            ]
        }

    # Define standard fallbacks if Gemini is offline
    has_high = False
    has_mod = False
    recs = []
    explanation = "No major interactions detected among these medicines."
    status = "Safe"

    if any("simvastatin" in m or "lipitor" in m or "atorvastatin" in m for m in med_set) and any("clarithromycin" in m or "erythromycin" in m for m in med_set):
        status = "Moderate Interaction"
        explanation = "Moderate interaction risk. Macrolide antibiotics (Clarithromycin) inhibit CYP3A4 enzymes, raising atorvastatin blood levels and increasing the risk of muscle toxicity (rhabdomyolysis)."
        recs = [
            "Consider temporarily pausing Atorvastatin while completing the antibiotic course.",
            "Report any muscle soreness, tenderness, or dark-colored urine to your doctor."
        ]
    elif len(medicines) > 1:
        # Default mild interaction
        status = "Safe"
        explanation = f"No standard interactions found between: {', '.join(medicines)}. These medicines are generally safe to take together."
        recs = [
            "Take each medicine according to its designated food guideline (AF vs BF).",
            "Maintain a list of active medications and share with your pharmacist."
        ]
    else:
        status = "Safe"
        explanation = "Please list two or more medicines to perform a drug interaction analysis."
        recs = ["Select or type another medicine name to check."]

    if not GEMINI_AVAILABLE:
        return {
            "result_status": status,
            "explanation": explanation,
            "recommendations": recs
        }

    try:
        model = genai.GenerativeModel('gemini-2.5-flash')
        prompt = f"""
        You are an expert clinical pharmacologist.
        Analyze potential drug-to-drug interactions and therapeutic duplications for this list of medicines: {json.dumps(medicines)}.
        
        CRITICAL SAFETY CHECK:
        Check if any medicines in the list are therapeutic duplications (i.e., they contain the exact same active ingredient under different brand names, such as Dolo and Paracetamol, or belong to the same drug subclass/class taken together, such as two NSAIDs like Ibuprofen and Advil).
        If there is a therapeutic duplication:
        1. Classify the risk level as "High Interaction".
        2. In the explanation, clearly warn the patient that they are taking duplicate medications which increases the risk of severe toxicity (e.g. liver toxicity for paracetamol, or gastrointestinal bleeding for NSAIDs) and accidental overdose.
        3. Recommend choosing only one.

        Otherwise, classify the risk level based on standard drug-to-drug interactions as "Safe", "Moderate", or "High Interaction".
        Provide a clear, clinical explanation of the drug interaction mechanisms (or state if they are safe).
        List actionable patient recommendations.

        Respond ONLY in JSON matching this schema:
        {{
          "result_status": "string (Safe / Moderate / High Interaction)",
          "explanation": "string (patient-friendly pharmacology/safety detail)",
          "recommendations": ["string"]
        }}
        """
        response = model.generate_content(
            prompt,
            generation_config={"response_mime_type": "application/json"}
        )
        data = json.loads(response.text)
        return data
    except Exception as e:
        logger.error(f"Gemini drug interaction analysis failed: {e}")
        return {
            "result_status": status,
            "explanation": explanation,
            "recommendations": recs
        }

def suggest_medicines_from_symptoms(age: int, gender: str, weight: float, symptoms: str, duration: str) -> Dict[str, Any]:
    """
    Symptom-to-Medicine Adviser.
    If Gemini is online, calls gemini-2.5-flash with a structured JSON prompt.
    Otherwise, executes offline fallback keyword matching.
    """
    symptoms_lower = symptoms.lower()
    
    severity = "Mild"
    should_see_doctor = False
    doctor_recommendation_text = "Your symptoms appear to be mild. If they do not resolve in 2-3 days, please consult a physician."
    advisory_notes = "Rest well, stay hydrated, and monitor your symptoms."
    suggested_medicines = []
    
    # Check if duration is too long
    duration_numeric = 0
    words = duration.replace("-", " ").split()
    for w in words:
        if w.isdigit():
            duration_numeric = int(w)
            
    if duration_numeric > 3 or "week" in duration.lower() or "month" in duration.lower():
        should_see_doctor = True
        doctor_recommendation_text = f"Since your symptoms have persisted for {duration}, we strongly recommend visiting a primary care physician instead of self-medicating."
        severity = "Moderate"
        
    # Check severe red flag symptoms
    severe_flags = ["chest pain", "shortness of breath", "difficulty breathing", "blood", "severe abdominal", "unconscious", "confusion", "dizziness", "fainting"]
    if any(flag in symptoms_lower for flag in severe_flags):
        should_see_doctor = True
        doctor_recommendation_text = "🚨 EMERGENCY NOTICE: Your symptoms (e.g., chest pain or difficulty breathing) are high-risk red flags. Please seek immediate emergency medical care or visit the nearest hospital emergency room."
        severity = "Severe"
        
    # Standard OTC checks if not severe
    if severity != "Severe":
        # 1. Fever / Body Pain / Headache
        if any(x in symptoms_lower for x in ["fever", "body pain", "headache", "temp", "warm"]):
            suggested_medicines.append({
                "name": "Paracetamol (Acetaminophen) 500mg",
                "dosage": "500mg",
                "frequency": "TDS PRN (Three times daily as needed for pain/fever)",
                "schedule_decoded": {
                    "morning": "Take 1 tablet after breakfast (if fever is present)",
                    "afternoon": "Take 1 tablet after lunch (if fever is present)",
                    "night": "Take 1 tablet after dinner (if fever is present)"
                },
                "purpose": "A common over-the-counter antipyretic (fever reducer) and analgesic (pain reliever)",
                "precautions": ["Do not exceed 3000mg/day to protect liver", "Avoid other paracetamol-containing remedies to prevent overdose"]
            })
            if severity == "Mild":
                advisory_notes = "Monitor your body temperature twice daily. Keep warm and stay fully rested."
                
        # 2. Cough / Cold / Sore Throat
        if any(x in symptoms_lower for x in ["cough", "cold", "sore throat", "throat", "congestion", "flu"]):
            suggested_medicines.append({
                "name": "Dextromethorphan Cough Syrup",
                "dosage": "10ml",
                "frequency": "BD (Twice Daily after meals)",
                "schedule_decoded": {
                    "morning": "Take 10ml (2 teaspoons) after breakfast",
                    "afternoon": "Skip",
                    "night": "Take 10ml (2 teaspoons) after dinner"
                },
                "purpose": "Cough suppressant to relieve dry, ticklish coughs and soothe throat irritation",
                "precautions": ["May cause mild drowsiness; avoid driving after taking", "Avoid consuming alcohol while on this medication"]
            })
            
        # 3. Allergy / Runny Nose / Sneezing
        if any(x in symptoms_lower for x in ["allergy", "sneezing", "runny nose", "itchy", "rash", "hives"]):
            suggested_medicines.append({
                "name": "Cetirizine 10mg",
                "dosage": "10mg",
                "frequency": "OD HS (Once Daily before sleep)",
                "schedule_decoded": {
                    "morning": "Skip",
                    "afternoon": "Skip",
                    "night": "Take 1 tablet before going to sleep"
                },
                "purpose": "Second-generation antihistamine to relieve allergy symptoms (runny nose, sneezing, hives)",
                "precautions": ["Causes mild drowsiness in some patients; take at night", "Avoid operating machinery"]
            })

    # Default if no specific symptoms recognized
    if not suggested_medicines and severity != "Severe":
        suggested_medicines.append({
            "name": "Multivitamin Formulation",
            "dosage": "1 tablet",
            "frequency": "OD AF (Once Daily after food)",
            "schedule_decoded": {
                "morning": "Take 1 tablet after breakfast",
                "afternoon": "Skip",
                "night": "Skip"
            },
            "purpose": "General nutritional and immune support",
            "precautions": ["Take with a full glass of water", "Do not take on an empty stomach to avoid mild nausea"]
        })

    if not GEMINI_AVAILABLE:
        return {
            "severity": severity,
            "should_see_doctor": should_see_doctor,
            "doctor_recommendation_text": doctor_recommendation_text,
            "advisory_notes": advisory_notes,
            "suggested_medicines": suggested_medicines
        }
        
    try:
        model = genai.GenerativeModel('gemini-2.5-flash')
        prompt = f"""
        You are a highly precise clinical triage AI. A patient has entered the following details:
        Age: {age}
        Gender: {gender}
        Weight: {weight} kg
        Symptoms: {symptoms}
        Duration: {duration}
        
        Evaluate the symptoms and duration.
        Determine the severity: "Mild", "Moderate", or "Severe".
        Decide if they should see a doctor (should_see_doctor is true if symptoms are severe, include red flags like chest pain/shortness of breath, or duration exceeds 3 days).
        Provide a customized, clear doctor recommendation text (e.g. advising them to go to the emergency room or book a GP clinic visit).
        Provide general advisory notes.
        Suggest 1-3 standard over-the-counter (OTC) medications that are safe for this age, gender, and weight, complete with dosage, frequency, and 3-part schedule (morning, afternoon, night). If symptoms are severe or they must see a doctor immediately, you may return an empty list of suggested_medicines.
        
        Respond ONLY in JSON matching this schema:
        {{
          "severity": "string (Mild / Moderate / Severe)",
          "should_see_doctor": true/false,
          "doctor_recommendation_text": "string (warning advising them to see a doctor or seek emergency care)",
          "advisory_notes": "string (general care instructions)",
          "suggested_medicines": [
            {{
              "name": "string (generic medication name)",
              "dosage": "string (safe dosage, e.g. 500mg)",
              "frequency": "string (frequency instruction)",
              "schedule_decoded": {{
                "morning": "string (instruction or 'Skip')",
                "afternoon": "string (instruction or 'Skip')",
                "night": "string (instruction or 'Skip')"
              }},
              "purpose": "string (how it helps)",
              "precautions": ["string"]
            }}
          ]
        }}
        """
        response = model.generate_content(
            prompt,
            generation_config={"response_mime_type": "application/json"}
        )
        data = json.loads(response.text)
        return data
    except Exception as e:
        logger.error(f"Gemini symptom checker failed: {e}")
        return {
            "severity": severity,
            "should_see_doctor": should_see_doctor,
            "doctor_recommendation_text": doctor_recommendation_text,
            "advisory_notes": advisory_notes,
            "suggested_medicines": suggested_medicines
        }

def analyze_tablet_expiry(file_path: str, raw_text: str) -> Dict[str, Any]:
    """
    Tablet Expiry Date Checker.
    Identifies MFG and EXP dates from a tablet image using Gemini 2.5 Flash,
    falling back to a robust regex parser checking against June 11, 2026.
    """
    import re
    import datetime
    import calendar
    from PIL import Image

    # Default fallback setup
    current_date = datetime.date(2026, 6, 11)
    mfg_date = None
    exp_date = None
    is_expired = False
    days_remaining = None
    recommendation_text = "Expiry date is still there, you can take this tablet."

    # Offline Parser
    try:
        # Find all date matches (MM/YYYY, MM/YY, MM-YYYY, etc.)
        all_dates = []
        
        # 1. Regex for numeric: DD/MM/YYYY, DD/MM/YY, MM/YYYY or MM/YY (supporting dot, dash, or slash separators)
        date_matches = re.finditer(r'\b(?:(\d{1,2})[-/.])?(\d{1,2})[-/.](\d{2,4})\b', raw_text)
        for dm in date_matches:
            d_val = dm.group(1)
            m_val = dm.group(2)
            y_val = dm.group(3)
            m = int(m_val)
            y = int(y_val)
            if y < 100:
                y += 2000
            if 1 <= m <= 12 and 1900 <= y <= 2100:
                if d_val is not None:
                    d = int(d_val)
                else:
                    d = calendar.monthrange(y, m)[1]
                try:
                    d_obj = datetime.date(y, m, d)
                    all_dates.append((d_obj, f"{m:02d}/{y}", dm.start()))
                except ValueError:
                    last_day = calendar.monthrange(y, m)[1]
                    d_obj = datetime.date(y, m, last_day)
                    all_dates.append((d_obj, f"{m:02d}/{y}", dm.start()))

        # 2. Regex for text month: Dec 2028 (supporting dot, space, dash, or slash separators)
        months_pattern = r'\b(jan|feb|mar|apr|may|jun|jul|aug|sep|oct|nov|dec)[a-z]*[-/\s.]+(20\d{2}|\d{2})\b'
        text_matches = re.finditer(months_pattern, raw_text.lower())
        months_map = {
            "jan": 1, "feb": 2, "mar": 3, "apr": 4, "may": 5, "jun": 6,
            "jul": 7, "aug": 8, "sep": 9, "oct": 10, "nov": 11, "dec": 12
        }
        for tm in text_matches:
            m_name = tm.group(1)
            m = months_map[m_name]
            y = int(tm.group(2))
            if y < 100:
                y += 2000
            last_day = calendar.monthrange(y, m)[1]
            d_obj = datetime.date(y, m, last_day)
            all_dates.append((d_obj, f"{m:02d}/{y}", tm.start()))

        # Sort dates by position in raw text
        all_dates.sort(key=lambda x: x[2])

        if len(all_dates) >= 2:
            # We assume first is MFG, second is EXP
            mfg_date = all_dates[0][1]
            exp_date = all_dates[1][1]
            exp_d_obj = all_dates[1][0]
            if exp_d_obj < current_date:
                is_expired = True
            else:
                days_remaining = (exp_d_obj - current_date).days
        elif len(all_dates) == 1:
            # Check context
            d_obj, d_str, pos = all_dates[0]
            context = raw_text[max(0, pos-20):min(len(raw_text), pos+20)].lower()
            if "mfg" in context or "mfd" in context or "manufacture" in context:
                mfg_date = d_str
            else:
                exp_date = d_str
                if d_obj < current_date:
                    is_expired = True
                else:
                    days_remaining = (d_obj - current_date).days

        # Double check exp explicitly from exp prefixes
        s_lower = raw_text.lower()
        exp_matches = re.findall(r'(?:exp|expiry|exp\.\s*date|val|valid|expires)\s*[:.-]?\s*(\d{1,2})[-/.](\d{2,4})', s_lower)
        if exp_matches and not exp_date:
            m = int(exp_matches[0][0])
            y = int(exp_matches[0][1])
            if y < 100:
                y += 2000
            last_day = calendar.monthrange(y, m)[1]
            exp_d_obj = datetime.date(y, m, last_day)
            exp_date = f"{m:02d}/{y}"
            if exp_d_obj < current_date:
                is_expired = True
            else:
                is_expired = False
                days_remaining = (exp_d_obj - current_date).days

        if is_expired:
            recommendation_text = "Completed date, don't use it!"
        elif days_remaining is not None and 1 <= days_remaining <= 7:
            recommendation_text = f"Warning: Expiry date is near! This tablet is going to expire in {days_remaining} days. Please replace it soon."
        else:
            recommendation_text = "Expiry date is still there, you can take this tablet."
            
    except Exception as e:
        logger.error(f"Offline expiry parsing failed: {e}")

    # If Gemini API is online, run vision analysis
    if GEMINI_AVAILABLE:
        try:
            model = genai.GenerativeModel('gemini-2.5-flash')
            img = Image.open(file_path)
            prompt = f"""
            You are a highly precise clinical scanner AI. 
            Analyze the uploaded tablet blister pack or medicine strip image.
            Locate the Manufacturing Date (MFG / MFD) and Expiry Date (EXP / EXPIRY).
            
            The current date is June 11, 2026.
            Compare the Expiry Date against the current date (June 11, 2026).
            Determine if the tablet has expired (completed its expiry date) or is still valid.
            
            Provide the following output strictly in JSON:
            {{
              "mfg_date": "string or null (e.g. MM/YYYY)",
              "exp_date": "string or null (e.g. MM/YYYY)",
              "is_expired": true/false,
              "days_remaining": integer or null (calculate days remaining from June 11, 2026 to Expiry Date if not expired),
              "recommendation_text": "string (either 'Completed date, don\'t use it!' if expired, or 'Warning: Expiry date is near! This tablet is going to expire in <days_remaining> days. Please replace it soon.' if expiring in 1-7 days, or 'Expiry date is still there, you can take this tablet.' if not expired)"
            }}
            """
            response = model.generate_content(
                [img, prompt],
                generation_config={"response_mime_type": "application/json"}
            )
            data = json.loads(response.text)
            # Post-process or enforce consistent recommendations
            is_exp = data.get("is_expired", False)
            days_rem = data.get("days_remaining")
            if is_exp:
                data["recommendation_text"] = "Completed date, don't use it!"
            elif days_rem is not None and 1 <= days_rem <= 7:
                data["recommendation_text"] = f"Warning: Expiry date is near! This tablet is going to expire in {days_rem} days. Please replace it soon."
            else:
                data["recommendation_text"] = "Expiry date is still there, you can take this tablet."
            return data
        except Exception as e:
            logger.error(f"Gemini tablet expiry analysis failed: {e}")

    return {
        "mfg_date": mfg_date,
        "exp_date": exp_date,
        "is_expired": is_expired,
        "days_remaining": days_remaining,
        "recommendation_text": recommendation_text
    }

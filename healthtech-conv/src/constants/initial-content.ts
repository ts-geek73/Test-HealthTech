import type { SectionType } from "@/constants";

export const initialContent: Record<SectionType, string> = {
    hpi: `The patient is a 65-year-old male with a history of hypertension, type 2 diabetes mellitus, and coronary artery disease who presented to the emergency department with chief complaint of progressive shortness of breath over the past 3 days.

The patient reports worsening dyspnea on exertion, now occurring with minimal activity. He also notes bilateral lower extremity edema and orthopnea requiring 3 pillows to sleep. He denies chest pain, palpitations, or syncope.`,
    course: `Hospital Day 1-2: Patient was admitted to the cardiac care unit. Initial workup revealed elevated BNP at 1,250 pg/mL and chest X-ray showing pulmonary edema. IV furosemide was initiated with good diuretic response.

Hospital Day 3-4: Patient's respiratory status improved significantly. Transitioned to oral diuretics. Echocardiogram showed EF of 35% with global hypokinesis. Cardiology consulted for optimization of heart failure regimen.

Hospital Day 5: Patient ambulating without significant dyspnea. Discharge planning initiated.`,
    meds: `DISCHARGE MEDICATIONS:

1. Lisinopril 10mg PO daily
2. Carvedilol 12.5mg PO twice daily
3. Furosemide 40mg PO daily
4. Spironolactone 25mg PO daily
5. Metformin 1000mg PO twice daily
6. Atorvastatin 40mg PO at bedtime
7. Aspirin 81mg PO daily
8. Potassium chloride 20mEq PO daily`,
    diagnosis: `PRIMARY DIAGNOSIS:
- Acute on chronic systolic heart failure (HFrEF) exacerbation

SECONDARY DIAGNOSES:
- Hypertension, controlled
- Type 2 diabetes mellitus
- Coronary artery disease, stable
- Chronic kidney disease, stage 3

DISCHARGE CONDITION: Stable, improved`,
};
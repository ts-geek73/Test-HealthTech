import { FileText, Activity, Pill, Stethoscope } from "lucide-react";
export type SectionType = "hpi" | "course" | "meds" | "diagnosis";

export const sections: { id: SectionType; label: string; icon: React.ElementType }[] = [
    { id: "hpi", label: "HPI", icon: FileText },
    { id: "course", label: "Course", icon: Activity },
    { id: "meds", label: "Meds", icon: Pill },
    { id: "diagnosis", label: "Diagnosis", icon: Stethoscope },
];
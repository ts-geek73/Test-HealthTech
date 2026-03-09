import { Button } from "@/components/ui/button";
import { ChevronDown, User } from "lucide-react";
import { useEffect, useRef, useState } from "react";

const PATIENT_OPTIONS = [
  { patientId: "mrn2096", accountNumber: "acc2096" },
  { patientId: "mrn2095", accountNumber: "acc2095" },
  { patientId: "mrn2094", accountNumber: "acc2094" },
  { patientId: "mrn2093", accountNumber: "acc2093" },
];

export interface PatientProps {
  patientId: string | null;
  accountNumber: string | null;
  setPatientId: (patientId: string) => void;
  setAccountNumber: (accountNumber: string) => void;
}

export default function PatientDropdown({
  patientId,
  accountNumber,
  setPatientId,
  setAccountNumber,
}: PatientProps) {
  const [open, setOpen] = useState(false);

  const ref = useRef<HTMLDivElement>(null);

  useEffect(() => {
    const handler = (e: MouseEvent) => {
      if (ref.current && !ref.current.contains(e.target as Node)) {
        setOpen(false);
      }
    };

    document.addEventListener("mousedown", handler);
    return () => document.removeEventListener("mousedown", handler);
  }, []);

  const label = patientId
    ? `${patientId} · ${accountNumber}`
    : "Select Patient";

  return (
    <div className="relative" ref={ref}>
      <Button
        variant="outline"
        size="sm"
        className="h-8 gap-1.5 text-xs font-medium"
        onClick={() => setOpen((o) => !o)}
      >
        <User className="h-3.5 w-3.5 text-muted-foreground" />

        <span>{label}</span>

        <ChevronDown
          className={`h-3 w-3 text-muted-foreground transition-transform duration-200 ${
            open ? "rotate-180" : ""
          }`}
        />
      </Button>

      {open && (
        <div className="absolute right-0 top-full mt-1.5 w-64 rounded-xl border border-border bg-card shadow-lg z-50 overflow-hidden">
          <div className="px-3 py-2.5 border-b border-border text-xs font-semibold">
            Patients
          </div>

          <div className="py-1.5 px-1.5 space-y-0.5">
            {PATIENT_OPTIONS.map((p) => (
              <div
                key={p.patientId}
                onClick={() => {
                  setPatientId(p.patientId);
                  setAccountNumber(p.accountNumber);
                  setOpen(false);
                }}
                className={`rounded-lg px-3 py-2.5 cursor-pointer transition-colors border ${
                  p.patientId === patientId
                    ? "bg-secondary border-border"
                    : "border-transparent hover:bg-muted/60"
                }`}
              >
                <div className="flex items-center justify-between">
                  <span className="text-xs font-semibold">{p.patientId}</span>

                  <span className="text-[10px] text-muted-foreground">
                    {p.accountNumber}
                  </span>
                </div>
              </div>
            ))}
          </div>
        </div>
      )}
    </div>
  );
}

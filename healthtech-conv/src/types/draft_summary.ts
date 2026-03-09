export interface DraftSummaryMetadata {
  patient_id: string;
  account_number: string;
  ai_discharge_summary_file_path: string;
  ai_discharge_summary_json_file_path: string;
}

export const initialDraftSummaryMetadata: DraftSummaryMetadata = {
  patient_id: "mrn2095",
  account_number: "acc2095",
  ai_discharge_summary_file_path:
    "192.168.168.199/DocServer/Doc-U-Script/AI-Documents\\mrn2095_acc2095_ai_generated_discharge_summary.docx",
  ai_discharge_summary_json_file_path:
    "192.168.168.199/DocServer/Doc-U-Script/AI-Documents\\mrn2095_acc2095_ai_generated_discharge_summary.json",
};

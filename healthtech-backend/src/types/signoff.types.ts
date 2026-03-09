export interface Signoff {
  id: string;
  draftId: string;
  signedBy: string;
  signedAt: Date;
  signatureImagePath: string;
  signedDocPath: string | null;
  signedVersion: number;
  timezoneOffset: string | null;
  revokedAt: Date | null;
  revokedBy: string | null;
  revocationReason: string | null;
}

export interface EditorAction {
  id: string;
  draftId: string;
  userId: string;
  userDisplayName: string | null;
  action: 'prepare' | 'edit' | 'commit' | 'rollback' | 'discard' | 'ai_edit' | 'inline_save' | 'view' | 'checkout';
  versionAtAction: number | null;
  metadata: any;
  createdAt: Date;
}

export interface SignDraftParams {
  signedBy: string;
  signatureImagePath: string;
  signatureImageData?: string;
  timezoneOffset?: string;
}

export interface RevokeSignatureParams {
  revokedBy: string;
  reason: string;
}
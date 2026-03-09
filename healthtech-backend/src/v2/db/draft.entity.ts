import { Reference } from "../../agents/types/draft-summary";
import { SectionEntity } from "./section.entity";

import fs from "fs";
import { toLocalPath } from "../../smbClient";

function getSignatureBase64(filePath: string) {
  if (!filePath) return null;

  const localPath = toLocalPath(filePath);

  if (!fs.existsSync(localPath)) {
    console.warn("[DRAFT] Signature file not found", { localPath });
    return null;
  }

  const buffer = fs.readFileSync(localPath);
  return `data:image/png;base64,${buffer.toString("base64")}`;
}

export class DraftEntity {
  readonly id: string;
  readonly sessionId: string;
  readonly createdBy: string;

  private _currentVersion: number;
  private _nextVersion: number;
  private _signature: string | null;
  private _isSigned: boolean;
  private _signedAt: Date | null;
  private _signedBy: string | null;
  private _signedDocPath: string | null;

  private _sections: SectionEntity[];
  private _references: Map<string, Reference>;

  constructor(params: {
    id: string;
    sessionId: string;
    createdBy: string;
    initialSections: SectionEntity[];
    references?: Reference[];
    currentVersion?: number;
    nextVersion?: number;
    signature?: string | null;
    isSigned?: boolean;
    signedAt?: Date | null;
    signedBy?: string | null;
    signedDocPath?: string | null;
  }) {
    this.id = params.id;
    this.sessionId = params.sessionId;
    this.createdBy = params.createdBy;
    this._signature = params.signature ?? null;
    this._sections = params.initialSections ?? [];
    this._references = new Map((params.references ?? []).map((r) => [r.id, r]));

    this._currentVersion = params.currentVersion ?? 0;
    this._nextVersion = params.nextVersion ?? 1;

    this._isSigned = params.isSigned ?? false;
    this._signedAt = params.signedAt ?? null;
    this._signedBy = params.signedBy ?? null;
    this._signedDocPath = params.signedDocPath ?? null;
  }

  get currentVersion(): string {
    return `v${this._currentVersion}`;
  }

  get currentVersionNumber(): number {
    return this._currentVersion;
  }

  get nextVersionNumber(): number {
    return this._nextVersion;
  }

  get signature(): string | null {
    return this._signature;
  }

  get isSigned(): boolean {
    return this._isSigned;
  }

  get signedAt(): Date | null {
    return this._signedAt;
  }

  get signedBy(): string | null {
    return this._signedBy;
  }

  get signedDocPath(): string | null {
    return this._signedDocPath;
  }

  get sections(): SectionEntity[] {
    return [...this._sections].sort((a, b) => a.position - b.position);
  }

  get references(): Reference[] {
    return Array.from(this._references.values());
  }

  getSection(id: string): SectionEntity | undefined {
    return this._sections.find((s) => s.id === id);
  }

  addOrUpdateReferences(refs: Reference[]): void {
    for (const r of refs) {
      this._references.set(r.id, r);
    }
  }

  getReference(id: string): Reference | undefined {
    return this._references.get(id);
  }

  advanceVersion(): void {
    this._currentVersion = this._nextVersion;
    this._nextVersion += 1;
  }

  markAsSigned(signedBy: string, signedAt: Date, signature: string): void {
    this._isSigned = true;
    this._signedBy = signedBy;
    this._signedAt = signedAt;
    this._signature = signature;
  }

  addDocPath(path: string): void {
    this._signedDocPath = path;
  }

  clearSignature(): void {
    this._isSigned = false;
    this._signedBy = null;
    this._signedAt = null;
    this._signature = null;
    this._signedDocPath = null;
  }

  restoreSections(sections: SectionEntity[]): void {
    this._sections = sections;
  }

  restoreReferences(refs: Reference[]): void {
    this._references = new Map(refs.map((r) => [r.id, r]));
  }

  toJSON() {
    return {
      id: this.id,
      sessionId: this.sessionId,
      createdBy: this.createdBy,
      currentVersion: this._currentVersion,
      nextVersion: this._nextVersion,
      signature: getSignatureBase64(this._signature ?? ""),
      isSigned: this._isSigned,
      signedAt: this._signedAt?.toISOString() ?? null,
      signedBy: this._signedBy,
      signedDocPath: this._signedDocPath,
      sections: this.sections.map((s) => s.toJSON()),
      references: this.references,
    };
  }

  static fromJSON(data: any): DraftEntity {
    const sections = (data.sections ?? []).map((s: any) =>
      SectionEntity.fromJSON(s),
    );

    return new DraftEntity({
      id: data.id,
      sessionId: data.sessionId,
      createdBy: data.createdBy,
      initialSections: sections,
      references: data.references ?? [],
      currentVersion: data.currentVersion,
      nextVersion: data.nextVersion,
      signature: data.signature ?? null,
      isSigned: data.isSigned ?? false,
      signedAt: data.signedAt ? new Date(data.signedAt) : null,
      signedBy: data.signedBy ?? null,
      signedDocPath: data.signedDocPath ?? null,
    });
  }
}

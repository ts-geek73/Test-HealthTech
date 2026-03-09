/**
 * Mock data helpers for the DraftProvider.
 *
 * These replace the real API calls when VITE_API_BASE_URL is unavailable.
 * The raw JSON was extracted from notepad.txt and lives next to this file
 * as mockDraftData.json.
 */

import mockDataMap from "./mockDraftData.json";

/* ---------- tiny helpers ------------------------------------------------ */

function lookupKey(pid: string, acc: string) {
  return `${pid}/${acc}`;
}

function getPatientData(pid: string, acc: string) {
  const key = lookupKey(pid, acc);
  const entry = (mockDataMap as Record<string, any>)[key];
  if (!entry) {
    throw new Error(`No mock data found for ${key}`);
  }
  return entry; // { success, data: { sections, references, ... } }
}

/* ---------- mock "API responses" ---------------------------------------- */

/**
 * Simulates POST /prepare-draft
 * Returns the full draft object for the given patient.
 */
export function mockPrepareDraft(pid: string, acc: string) {
  return getPatientData(pid, acc);
}

/**
 * Simulates GET /drafts/:pid/:acc
 * Returns the draft with sections, references, version info, signoff, etc.
 */
export function mockGetDraft(pid: string, acc: string) {
  return getPatientData(pid, acc);
}

/**
 * Simulates GET /drafts/:pid/:acc/history
 * Returns a basic history array derived from currentVersion.
 */
export function mockGetHistory(pid: string, acc: string) {
  const entry = getPatientData(pid, acc);
  const version = entry.data.currentVersion ?? 0;
  return {
    success: true,
    data: [
      {
        version: `v${version}`,
        createdBy: entry.data.createdBy ?? "anonymous",
        timestamp: new Date().toISOString(),
        isRollback: false,
      },
    ],
  };
}

/**
 * Simulates GET /drafts/:pid/:acc/versions/:version
 * Returns a snapshot (same as the current draft for mock purposes).
 */
export function mockGetVersionSnapshot(pid: string, acc: string) {
  const entry = getPatientData(pid, acc);
  return {
    success: true,
    data: {
      version: `v${entry.data.currentVersion ?? 0}`,
      createdBy: entry.data.createdBy ?? "anonymous",
      timestamp: new Date().toISOString(),
      isRollback: false,
      sections: entry.data.sections ?? [],
    },
  };
}

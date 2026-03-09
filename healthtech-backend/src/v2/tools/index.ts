import { createSectionTool } from "./create-section.tool";
import { parseIntentTool } from "./parse-intent-tool";
import { validateIntentTool } from "./validate-intent-tool";
import { searchSectionsTool } from "./search-sections-tool";
import { applyEditTool } from "./apply-edit-tool";
import { validatePatchTool } from "./validate-patch-tool";

export const healthcareTools = [
    parseIntentTool,
    validateIntentTool,
    searchSectionsTool,
    applyEditTool,
    createSectionTool,
    validatePatchTool
];

export {
    createSectionTool,
    parseIntentTool,
    validateIntentTool,
    searchSectionsTool,
    applyEditTool,
    validatePatchTool
};


import { DynamicStructuredTool } from "@langchain/core/tools";
import { z } from "zod";
import { validatePatch } from "./intent-parser";
import { createAzureOpenAIModel } from "../../agents/config/azure-openai.config";
import logger from "../../logger";

const model = createAzureOpenAIModel();

export const validatePatchTool = new DynamicStructuredTool({
    name: "validate_patch",
    description: "Validate if the patch applied to a document section correctly reflects the user's original instruction. Call this AFTER apply_edit.",
    schema: z.object({
        instruction: z.string().describe("The user's original raw instruction (e.g., 'Change pulse to 80')"),
        originalContent: z.string().describe("The section content BEFORE the patch was applied"),
        updatedContent: z.string().describe("The section content AFTER the patch was applied"),
    }),
    func: async ({ instruction, originalContent, updatedContent }) => {
        try {
            logger.info("validate_patch tool: invoked", { instruction });
            const validation = await validatePatch(instruction, originalContent, updatedContent, model);

            return JSON.stringify({
                isValid: validation.isValid,
                reason: validation.reason
            });
        } catch (error: any) {
            logger.error("validate_patch tool: failed", { error: error.message });
            return JSON.stringify({ error: error.message });
        }
    }
});

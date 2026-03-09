import { HumanMessage, SystemMessage } from "@langchain/core/messages";
import { AzureChatOpenAI } from "@langchain/openai";
import logger from "../../logger";
import { EnrichedData, ScoredSection } from "../../agents/types/agent.types";

const PATCH_SYSTEM_PROMPT = `You are a clinical documentation editor.
Update ONLY the provided section content based on the instruction.

STRICT RULES:
- **Accuracy**: Modify only what is requested. Be extremely precise with medication names, doses, and parenthetical/bracketed content (e.g., "(Lexapro 10mg)").
- **Multi-item Updates**: If the instruction says "set all medications to 20mg", update every single medication entry in the section accordingly.
- **Reordering**: If the user asks to change the order of items, rearrange them exactly as requested while preserving their content.
- **Formatting**: Preserve all existing line breaks, bullet points, and clinical structure.
- **No Commentary**: Return ONLY the updated section content as plain text. Do NOT add any explanations, status messages (like "section removed"), markdown, or JSON.
- **Wording**: Keep medical terminology professional and unchanged unless explicitly asked to modify it.

Use the ENRICHED CONTEXT (if provided) to ensure the accuracy of the modification.`;

const ADD_SYSTEM_PROMPT = `You are a clinical documentation editor.
Append a new item to the provided section content based on the instruction.

STRICT RULES:
- **Precise Addition**: Add ONLY the new item specified.
- **Style Matching**: Mirror the formatting, indentation, and style of existing items in the section.
- **No Commentary**: Return the FULL updated section content as plain text. Do NOT add any explanations or conversational text.
- **Integrity**: Preserve all existing content exactly as-is.

Use the ENRICHED CONTEXT (if provided) to ensure the accuracy of the new item being added.`;

/**
 * Updates (replaces/modifies) existing content within a section.
 *
 * @param section - The section to patch
 * @param instruction - The user's original instruction
 * @param model - A shared AzureChatOpenAI instance
 * @returns The full updated section content as a string
 */
export async function patchSection(
  section: ScoredSection,
  instruction: string,
  model: AzureChatOpenAI,
  enrichedData?: EnrichedData[]
): Promise<string> {
  logger.info("Patch editor: patching section", {
    sectionTitle: section.title,
    instruction,
    hasEnrichedData: !!enrichedData?.length
  });

  const enrichedContext = enrichedData?.length
    ? `\n\nENRICHED CONTEXT (Historical Records):\n${enrichedData.map(d => `[${d.id}]: ${d.content}`).join("\n")}`
    : "";

  const response = await model.invoke([
    new SystemMessage(PATCH_SYSTEM_PROMPT),
    new HumanMessage(
      `Instruction: ${instruction}\n\nCurrent Section (${section.title}):\n${section.content}${enrichedContext}`,
    ),
  ]);

  const updated =
    typeof response.content === "string"
      ? response.content.trim()
      : JSON.stringify(response.content);

  logger.info("Patch editor: section patched", { sectionTitle: section.title });
  return updated;
}

/**
 * Appends a new structured item to a section (e.g. new allergy, new medication).
 *
 * @param section - The section to append to
 * @param instruction - The user's original instruction
 * @param model - A shared AzureChatOpenAI instance
 * @returns The full updated section content as a string
 */
export async function addToSection(
  section: ScoredSection,
  instruction: string,
  model: AzureChatOpenAI,
  enrichedData?: EnrichedData[],
): Promise<string> {
  logger.info("Patch editor: adding to section", {
    sectionTitle: section.title,
    instruction,
    hasEnrichedData: !!enrichedData?.length
  });

  const enrichedContext = enrichedData?.length
    ? `\n\nENRICHED CONTEXT (Historical Records):\n${enrichedData.map(d => `[${d.id}]: ${d.content}`).join("\n")}`
    : "";

  const response = await model.invoke([
    new SystemMessage(ADD_SYSTEM_PROMPT),
    new HumanMessage(
      `Instruction: ${instruction}\n\nCurrent Section (${section.title}):\n${section.content}${enrichedContext}`,
    ),
  ]);

  const updated =
    typeof response.content === "string"
      ? response.content.trim()
      : JSON.stringify(response.content);

  logger.info("Patch editor: item added to section", {
    sectionTitle: section.title,
  });
  return updated;
}

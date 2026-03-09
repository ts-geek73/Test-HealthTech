import { AzureChatOpenAI } from "@langchain/openai";
import { HumanMessage, SystemMessage } from "@langchain/core/messages";
import logger from "../../logger";
import { IntentResult } from "../../agents/types/agent.types";

const VALID_ACTIONS = ["replace", "add", "delete", "update", "change"] as const;

const INTENT_SYSTEM_PROMPT = `Extract all explicit and implicit medical edit requests from the user's instruction and return ONLY a valid, syntactically correct JSON array of objects as defined below (output the array only—no markdown, preamble, or explanatory text):
[
{
"action": "replace" | "add" | "delete" | "update" | "change",
"target": "section name or concept to be changed",
"value": "new value or content to apply" // for 'delete' use "" or omit
}
]
Guidelines:
- For multiple instructions, extract each edit as a separate object in the array.
- Identify the 'target' (e.g., section, entity, medication) as specifically as the input allows.
- Use the user's explicit verb (e.g., "add", "delete") for 'action' where present. Correct common spelling errors for action verbs (e.g., 'chnage' → 'change', 'romove' → 'remove', etc.).
- For shorthand or implicit instructions (e.g., a med and dose), infer 'update' as the action, with the entity as 'target' and the updated detail as 'value.'
- For "add", assign the provided content to 'value.' For "delete", specify 'target' and set 'value' to "" if nothing replaces it.
- If an instruction is ambiguous, choose the most reasonable interpretation; never omit a detected request.

# Output Format
Return only the JSON array as specified. No extra text, markdown, or commentary.
Examples:
Input: Update observation to 16 min and remove suicidal ideation.
Output:
[
{
"action": "update",
"target": "observation",
"value": "16 min"
},
{
"action": "delete",
"target": "suicidal ideation",
"value": ""
}
]
Input: Hydroxyzine 50mg PO BID, stop quetiapine.
Output:
[
{
"action": "update",
"target": "Hydroxyzine",
"value": "50mg PO BID"
},
{
"action": "delete",
"target": "quetiapine",
"value": ""
}
]
Input: Add "Discharged to home" under disposition.
Output:
[
{
"action": "add",
"target": "disposition",
"value": "Discharged to home"
}
]
Typical user inputs may target medications, doses, frequencies, problems, or section names. Each distinct edit should appear as its own object. Extract all edit requests, explicit and implicit, as modeled.`;


const VALIDATION_SYSTEM_PROMPT = `You are a critical auditor for a medical document editor.

Your task is to verify whether the extracted intents (JSON array) correctly and completely represent the meaning of the user's instruction.

User Instruction: "{instruction}"
Extracted Intents: {intents}

Important Interpretation Rules:
- The user's instruction may contain spelling mistakes or typos (e.g., "chnage" instead of "change", "updte" instead of "update").
- DO NOT mark the instruction invalid due to spelling mistakes.
- Assume obvious typos represent the closest meaningful word.
- Validation must focus on **semantic correctness**, not spelling accuracy.

Rules for validation:

1. Every distinct edit requested by the user must appear in the intents.
2. If the user's instruction clearly implies an edit but the intents miss it, mark invalid.
3. If the intents contain hallucinated actions, targets, or values not present in the instruction, mark invalid.
4. If the instruction truly lacks required information (for example: "change medication" without specifying what to change it to), mark invalid.
5. Clinical shorthand is valid. For example:
   - "Hydroxyzine 50mg" → valid update intent
   - "Observation 16 min" → valid update intent
6. Ignore spelling mistakes when the meaning is obvious.
7. If the extracted intent correctly reflects the user's intended meaning despite spelling errors, mark it as valid.

Output MUST be a valid JSON object only:

{
  "isValid": true | false,
  "reason": "Short explanation. If valid return 'OK'."
}
`;

/**
 * Parses a natural language instruction into one or more structured IntentResults.
 *
 * Uses temperature=0 for deterministic, consistent JSON extraction.
 *
 * @param instruction - The user's raw instruction (e.g. "Change Effexor dose to 75mg daily and add a check-in")
 * @param model - A shared AzureChatOpenAI instance
 * @returns Array of parsed IntentResults
 * @throws Error if the LLM response cannot be parsed as valid JSON
 */
export async function parseIntent(
    instruction: string,
    model: AzureChatOpenAI,
    feedback?: string
): Promise<IntentResult[]> {
    logger.info("Intent parser: parsing instruction", { instruction, hasFeedback: !!feedback });

    const messages = [
        new SystemMessage(INTENT_SYSTEM_PROMPT),
        new HumanMessage(`Instruction: ${instruction}`),
    ];

    if (feedback) {
        messages.push(new HumanMessage(`FEEDBACK FROM PREVIOUS VALIDATION: ${feedback}\n\nPlease correct the previous attempt based on this feedback.`));
    }

    const response = await model.invoke(messages);

    const rawContent =
        typeof response.content === "string"
            ? response.content
            : JSON.stringify(response.content);

    // Extract the JSON array even if the model wraps it in markdown fences
    const jsonMatch = rawContent.match(/\[[\s\S]*\]/);
    if (!jsonMatch) {
        logger.error("Intent parser: no JSON array found in response", { rawContent });
        throw new Error(
            `Intent parser could not extract JSON array from model response. Raw: ${rawContent}`
        );
    }

    let parsedArray: any[];
    try {
        parsedArray = JSON.parse(jsonMatch[0]);
    } catch (e) {
        logger.error("Intent parser: JSON.parse failed", { jsonMatch: jsonMatch[0] });
        throw new Error(`Intent parser produced invalid JSON: ${jsonMatch[0]}`);
    }

    if (!Array.isArray(parsedArray)) {
        logger.error("Intent parser: response is not an array", { parsedArray });
        throw new Error("Intent parser expected an array of results.");
    }

    const results: IntentResult[] = parsedArray.map((parsed: any) => {
        const action = VALID_ACTIONS.includes(parsed.action) ? parsed.action : "update";

        return {
            action,
            target: String(parsed.target || ""),
            value: String(parsed.value ?? ""),
        };
    });

    logger.info("Intent parser: intents extracted", { count: results.length, results });
    return results;
}

/**
 * Validates that the parsed intents correctly represent the user's instruction.
 *
 * @param instruction - The original user instruction
 * @param intents - The array of parsed IntentResults
 * @param model - A shared AzureChatOpenAI instance
 * @returns Object indicating if valid and the reason if not
 */
export async function validateIntent(
    instruction: string,
    intents: IntentResult[],
    model: AzureChatOpenAI
): Promise<{ isValid: boolean; reason?: string }> {
    logger.info("Intent parser: validating intents", { instruction, intentCount: intents.length });

    const prompt = VALIDATION_SYSTEM_PROMPT
        .replace("{instruction}", instruction)
        .replace("{intents}", JSON.stringify(intents, null, 2));

    const response = await model.invoke([
        new SystemMessage(prompt),
        new HumanMessage("Perform validation and return JSON object."),
    ]);

    const rawContent =
        typeof response.content === "string"
            ? response.content
            : JSON.stringify(response.content);

    const jsonMatch = rawContent.match(/\{[\s\S]*\}/);
    if (!jsonMatch) {
        logger.error("Intent validator: no JSON object found in response", { rawContent });
        return { isValid: true }; // Default to true if validation fails to avoid blocking if just a formatting error
    }

    try {
        const result = JSON.parse(jsonMatch[0]);
        logger.info("Intent validator: result", result);
        return {
            isValid: Boolean(result.isValid),
            reason: result.reason || undefined,
        };
    } catch (e) {
        logger.error("Intent validator: JSON.parse failed", { jsonMatch: jsonMatch[0] });
        return { isValid: true };
    }
}
const PATCH_VALIDATION_SYSTEM_PROMPT = `You are a specialized medical documentation auditor.
Your job is to verify if a patch applied to a document section correctly reflects the user's original instruction.

User Instruction: "{instruction}"
Original Content:
{originalContent}

Updated Content:
{updatedContent}

Rules for validation:
1. Compare the differences between the original and updated content.
2. Does the change accurately represent WHAT the user asked for?
3. Did the patch accidentally remove or modify information that was NOT part of the instruction?
4. Is the medical terminology and formatting preserved correctly?
5. If the user asked to "set all medications to 20mg", are ALL of them updated?
6. If the user asked to delete something, is it gone?
7. If there are hallucinated changes (changes not requested), mark invalid.

Output MUST be a valid JSON object only:
{
  "isValid": true | false,
  "reason": "Clear explanation of why it is invalid. If valid return 'OK'."
}
`;

/**
 * Validates that the applied patch correctly represents the user's instruction.
 *
 * @param instruction - The original user instruction
 * @param originalContent - The section content before the patch
 * @param updatedContent - The section content after the patch
 * @param model - A shared AzureChatOpenAI instance
 * @returns Object indicating if valid and the reason if not
 */
export async function validatePatch(
    instruction: string,
    originalContent: string,
    updatedContent: string,
    model: AzureChatOpenAI
): Promise<{ isValid: boolean; reason?: string }> {
    logger.info("Intent parser: validating patch", { instruction });

    const prompt = PATCH_VALIDATION_SYSTEM_PROMPT
        .replace("{instruction}", instruction)
        .replace("{originalContent}", originalContent)
        .replace("{updatedContent}", updatedContent);

    const response = await model.invoke([
        new SystemMessage(prompt),
        new HumanMessage("Perform validation and return JSON object."),
    ]);

    const rawContent =
        typeof response.content === "string"
            ? response.content
            : JSON.stringify(response.content);

    const jsonMatch = rawContent.match(/\{[\s\S]*\}/);
    if (!jsonMatch) {
        logger.error("Patch validator: no JSON object found in response", { rawContent });
        return { isValid: true }; // Default to true if validation fails to avoid blocking if just a formatting error
    }

    try {
        const result = JSON.parse(jsonMatch[0]);
        logger.info("Patch validator: result", result);
        return {
            isValid: Boolean(result.isValid),
            reason: result.reason || undefined,
        };
    } catch (e) {
        logger.error("Patch validator: JSON.parse failed", { jsonMatch: jsonMatch[0] });
        return { isValid: true };
    }
}

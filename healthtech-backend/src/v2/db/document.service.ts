import fs from "fs/promises";
import HTMLtoDOCX from "html-to-docx";
import path from "path";
import { FILESERVER_BASE, toNetworkPath } from "../../smbClient";
import { DraftEntity } from "./draft.entity";

type UnifiedProcessor = any;

export class DocumentService {
  private static processor: UnifiedProcessor | null = null;

  private static async getProcessor(): Promise<UnifiedProcessor> {
    if (this.processor) return this.processor;

    const { unified } = await import("unified");
    const remarkParse = (await import("remark-parse")).default;
    const remarkGfm = (await import("remark-gfm")).default;
    const remarkRehype = (await import("remark-rehype")).default;
    const rehypeStringify = (await import("rehype-stringify")).default;
    const rehypeSanitize = (await import("rehype-sanitize")).default;

    this.processor = unified()
      .use(remarkParse)
      .use(remarkGfm)
      .use(remarkRehype)
      .use(rehypeSanitize)
      .use(rehypeStringify);

    return this.processor;
  }

  private async markdownToHtml(markdown: string): Promise<string> {
    const processor = await DocumentService.getProcessor();
    const file = await processor.process(markdown.replace(/\t/g, "    "));
    return String(file);
  }

  private async renderSections(draft: DraftEntity): Promise<string> {
    const rendered = await Promise.all(
      draft.sections.map(async (section) => {
        const rawBody = await this.markdownToHtml(section.content ?? "");

        const title = section.title.replace(/:$/, "").trim().toUpperCase();

        return `
          <p style="font-weight:bold; text-align:start; margin-bottom:6pt;">${title}</p>${rawBody}<p style="margin-bottom:18pt;"></p>
        `;
      }),
    );

    return rendered.join("");
  }

  private renderSignoff(draft: DraftEntity, base64: string): string {
    if (!draft.isSigned || !draft.signedAt || !draft.signedBy) return "";

    const formattedDate = draft.signedAt.toLocaleDateString("en-US", {
      month: "2-digit",
      day: "2-digit",
      year: "numeric",
    });

    const formattedTime = draft.signedAt.toLocaleTimeString("en-US", {
      hour: "2-digit",
      minute: "2-digit",
      second: "2-digit",
      hour12: true,
    });

    const offsetMinutes = -draft.signedAt.getTimezoneOffset();
    const offsetHours = Math.floor(Math.abs(offsetMinutes) / 60);
    const offsetMins = Math.abs(offsetMinutes) % 60;

    const gmtLabel = `GMT ${offsetMinutes >= 0 ? "+" : "-"}${offsetHours}:${offsetMins
      .toString()
      .padStart(2, "0")}`;

    const signatureBlock = draft.signature
      ? `<p style="margin:0; padding:0; line-height:1;">
       <img 
         src="${base64}" 
         style="height:75px; display:block; object-fit:contain;"
         width="60"
         height="30"
       />
     </p>`
      : "";
    return `
      <p style="margin-top:24pt; border-top:1pt solid #000; padding-top:6pt;">Electronically signed on ${formattedDate} at ${formattedTime} (${gmtLabel})</p>${signatureBlock}
    `;
  }

  private wrapHtml(content: string): string {
    return `<!DOCTYPE html>
<html>
<head>
<meta charset="utf-8" />
</head>
<body>
${content}
</body>
</html>`;
  }

  public async generateDocxFromDraft(params: {
    draft: DraftEntity;
    base64: string;
  }): Promise<string> {
    const { draft } = params;

    console.log("[DOCX] Starting signed discharge summary generation", {
      sessionId: draft.sessionId,
      draftVersion: draft.currentVersion,
    });

    if (!draft.isSigned) {
      throw new Error("Cannot generate official document: draft not signed.");
    }

    console.log("[DOCX] Rendering document sections...");
    const sections = await this.renderSections(draft);

    console.log("[DOCX] Rendering signoff...");
    const signoff = this.renderSignoff(draft, params.base64);

    const html = this.wrapHtml(sections + signoff);

    console.log("[DOCX] Converting HTML → DOCX...");

    const result = await HTMLtoDOCX(html, null, {
      footer: false,
      pageNumber: false,
      margins: {
        top: 1440,
        bottom: 1440,
        left: 1260,
        right: 1260,
      },
      font: "Arial",
      fontSize: 22,
    });

    const buffer =
      result instanceof Buffer ? result : Buffer.from(result as ArrayBuffer);

    console.log("[DOCX] DOCX buffer created", { sizeBytes: buffer.length });
    const fileName = `${draft.sessionId}_signed_discharge_summary.docx`;
    const localPath = path.join(FILESERVER_BASE, fileName);

    console.log("[DOCX] Writing to file server", { localPath });

    await fs.mkdir(FILESERVER_BASE, { recursive: true });
    await fs.writeFile(localPath, buffer);

    const networkPath = toNetworkPath(localPath);

    console.log("[DOCX] Upload successful", {
      filePath: networkPath,
      fileSize: buffer.length,
    });

    return networkPath;
  }
}

function getSafeFileName(targetRole: string) {
  const role = targetRole
    .trim()
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, "-")
    .replace(/^-|-$/g, "");
  return `updated-resume-${role || "resume"}`;
}

function isSectionHeading(line: string) {
  const trimmed = line.trim();
  return (
    trimmed.length <= 80 &&
    /[A-Z]/.test(trimmed) &&
    trimmed === trimmed.toLocaleUpperCase() &&
    !/^[-•]/.test(trimmed)
  );
}

export const resumeDesigns = [
  {
    id: "modern",
    name: "Modern Teal",
    description: "Fresh color with crisp section dividers",
    accent: "0F766E",
    title: "102A43",
    body: "334155",
    divider: "D8E3E7",
    topRule: true,
    titleAlignment: "left",
    titleBorder: "bottom",
    headingBorder: "bottom",
  },
  {
    id: "classic",
    name: "Classic Navy",
    description: "Centered name with a timeless navy palette",
    accent: "1D4ED8",
    title: "172554",
    body: "334155",
    divider: "DBE3EF",
    topRule: false,
    titleAlignment: "center",
    titleBorder: "bottom",
    headingBorder: "bottom",
  },
  {
    id: "minimal",
    name: "Minimal Slate",
    description: "Quiet, understated styling with clean side rules",
    accent: "475569",
    title: "1E293B",
    body: "334155",
    divider: "E2E8F0",
    topRule: true,
    titleAlignment: "left",
    titleBorder: "none",
    headingBorder: "left",
  },
] as const;

export type ResumeDesignId = (typeof resumeDesigns)[number]["id"];

export function getResumeDesign(id: ResumeDesignId) {
  return resumeDesigns.find((design) => design.id === id) ?? resumeDesigns[0];
}

function saveBlob(blob: Blob, fileName: string) {
  const url = URL.createObjectURL(blob);
  const link = document.createElement("a");
  link.href = url;
  link.download = fileName;
  document.body.appendChild(link);
  try {
    link.click();
  } finally {
    link.remove();
    window.setTimeout(() => URL.revokeObjectURL(url), 1000);
  }
}

export async function downloadResumeDocx(
  resumeText: string,
  targetRole: string,
) {
  const { Document, HeadingLevel, Packer, Paragraph } = await import("docx");
  const lines = resumeText.split(/\r?\n/);
  let hasTitle = false;
  const children = lines.flatMap((rawLine) => {
    const line = rawLine.trim();
    if (!line) return [new Paragraph({ text: "" })];

    if (!hasTitle) {
      hasTitle = true;
      return [
        new Paragraph({
          text: line,
          heading: HeadingLevel.TITLE,
        }),
      ];
    }

    if (isSectionHeading(line)) {
      return [
        new Paragraph({
          text: line,
          heading: HeadingLevel.HEADING_1,
        }),
      ];
    }

    const bullet = line.match(/^[-•]\s+(.+)$/);
    return [
      new Paragraph({
        text: bullet ? bullet[1] : line,
        ...(bullet ? { bullet: { level: 0 } } : {}),
      }),
    ];
  });
  const document = new Document({
    sections: [
      {
        properties: {
          page: {
            margin: { top: 720, right: 900, bottom: 720, left: 900 },
          },
        },
        children,
      },
    ],
  });
  const blob = await Packer.toBlob(document);
  saveBlob(blob, `${getSafeFileName(targetRole)}.docx`);
}

export async function downloadUpdatedResumeDocx(
  resumeText: string,
  targetRole: string,
  designId: ResumeDesignId,
) {
  const { BorderStyle, Document, Packer, Paragraph, TextRun } =
    await import("docx");
  const design = getResumeDesign(designId);
  let hasTitle = false;
  const children = resumeText.split(/\r?\n/).flatMap((rawLine) => {
    const line = rawLine.trim();
    if (!line) {
      return [new Paragraph({ text: "", spacing: { after: 100 } })];
    }

    if (!hasTitle) {
      hasTitle = true;
      return [
        new Paragraph({
          children: [
            new TextRun({
              text: line,
              bold: true,
              color: design.title,
              font: "Arial",
              size: 44,
            }),
          ],
          ...(design.titleAlignment === "center"
            ? { alignment: "center" as const }
            : {}),
          spacing: { after: 220 },
          border: {
            ...(design.topRule
              ? {
                  top: {
                    color: design.accent,
                    size: 16,
                    space: 8,
                    style: BorderStyle.SINGLE,
                  },
                }
              : {}),
            ...(design.titleBorder === "none"
              ? {}
              : {
                  [design.titleBorder]: {
                    color: design.accent,
                    size: 16,
                    space: 8,
                    style: BorderStyle.SINGLE,
                  },
                }),
          },
        }),
      ];
    }

    if (isSectionHeading(line)) {
      return [
        new Paragraph({
          children: [
            new TextRun({
              text: line,
              bold: true,
              color: design.accent,
              font: "Arial",
              size: 20,
            }),
          ],
          spacing: { before: 240, after: 100 },
          border: {
            [design.headingBorder]: {
              color: design.divider,
              size: 4,
              space: 4,
              style: BorderStyle.SINGLE,
            },
          },
        }),
      ];
    }

    const bullet = line.match(/^[-•]\s+(.+)$/);
    return [
      new Paragraph({
        children: [
          new TextRun({
            text: bullet ? bullet[1] : line,
            color: design.body,
            font: "Arial",
            size: 20,
          }),
        ],
        ...(bullet ? { bullet: { level: 0 } } : {}),
        spacing: { after: 90, line: 276 },
      }),
    ];
  });
  const document = new Document({
    sections: [
      {
        properties: {
          page: {
            size: { width: 11906, height: 16838 },
            margin: { top: 720, right: 900, bottom: 720, left: 900 },
          },
        },
        children,
      },
    ],
  });
  const blob = await Packer.toBlob(document);
  saveBlob(blob, `${getSafeFileName(targetRole)}.docx`);
}

export async function downloadHtmlPreviewPdf(
  previewId: string,
  fileName: string,
) {
  const preview = document.getElementById(previewId);
  if (!preview) {
    throw new Error("The preview is unavailable. Refresh and try again.");
  }
  const [{ default: html2canvas }, { jsPDF }] = await Promise.all([
    import("html2canvas"),
    import("jspdf"),
  ]);
  await document.fonts.ready;
  const canvas = await html2canvas(preview, {
    backgroundColor: "#ffffff",
    scale: 2,
    useCORS: true,
  });
  const pdf = new jsPDF({ orientation: "portrait", unit: "mm", format: "a4" });
  const pixelsPerMillimeter = canvas.width / 210;
  const pageHeightPixels = Math.floor(pixelsPerMillimeter * 297);
  const pageCanvas = document.createElement("canvas");
  const context = pageCanvas.getContext("2d");
  if (!context) {
    throw new Error("Your browser could not prepare the PDF. Try downloading the Word copy.");
  }
  pageCanvas.width = canvas.width;

  let offset = 0;
  let pageNumber = 0;
  while (offset < canvas.height) {
    const sliceHeight = Math.min(pageHeightPixels, canvas.height - offset);
    pageCanvas.height = sliceHeight;
    context.clearRect(0, 0, pageCanvas.width, pageCanvas.height);
    context.drawImage(
      canvas,
      0,
      offset,
      canvas.width,
      sliceHeight,
      0,
      0,
      canvas.width,
      sliceHeight,
    );
    if (pageNumber > 0) pdf.addPage();
    pdf.addImage(
      pageCanvas.toDataURL("image/png"),
      "PNG",
      0,
      0,
      210,
      sliceHeight / pixelsPerMillimeter,
    );
    offset += sliceHeight;
    pageNumber += 1;
  }

  saveBlob(pdf.output("blob"), fileName);
}

export async function downloadResumePdf(targetRole: string) {
  await downloadHtmlPreviewPdf("resume-output-preview", `${getSafeFileName(targetRole)}.pdf`);
}

export function isResumeSectionHeading(line: string) {
  return isSectionHeading(line);
}

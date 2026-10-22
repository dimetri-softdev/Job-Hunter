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

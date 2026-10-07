"use client";

import { useRef, useState } from "react";
import type { ChangeEvent } from "react";
import { Loader2, Upload } from "lucide-react";
import { Button } from "@/components/ui/button";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { fetcher } from "@/lib/api";
import type { FitAssessment, FitVerdict } from "@/lib/application-types";

interface ImportedApplication {
  company: string;
  position: string;
  status: string;
  notes: string | null;
  jobUrl: string | null;
  jobSummary: string | null;
  fitAssessment: FitAssessment | null;
  nextAction: string | null;
  followUpAt: string | null;
}

const applicationStatuses = new Set([
  "SAVED",
  "APPLIED",
  "PHONE_SCREEN",
  "INTERVIEWING",
  "OFFERED",
  "REJECTED",
  "WITHDRAWN",
]);

const fitVerdicts: FitVerdict[] = [
  "STRONG_MATCH",
  "POSSIBLE_MATCH",
  "STRETCH",
  "LOW_MATCH",
  "INSUFFICIENT_INFO",
];

function parseCsvRows(input: string) {
  const text = input.replace(/^\uFEFF/, "");
  const rows: string[][] = [];
  let row: string[] = [];
  let field = "";
  let inQuotes = false;
  let afterQuote = false;

  function pushField() {
    row.push(field);
    field = "";
    afterQuote = false;
  }

  function pushRow() {
    pushField();
    if (row.some((value) => value.trim())) rows.push(row);
    row = [];
  }

  for (let index = 0; index < text.length; index += 1) {
    const character = text[index];

    if (inQuotes) {
      if (character === '"' && text[index + 1] === '"') {
        field += '"';
        index += 1;
      } else if (character === '"') {
        inQuotes = false;
        afterQuote = true;
      } else {
        field += character;
      }
      continue;
    }

    if (afterQuote) {
      if (character === ",") {
        pushField();
      } else if (character === "\r" || character === "\n") {
        if (character === "\r" && text[index + 1] === "\n") index += 1;
        pushRow();
      } else if (character !== " " && character !== "\t") {
        throw new Error("The CSV contains unexpected text after a quoted field.");
      }
      continue;
    }

    if (character === ",") {
      pushField();
    } else if (character === "\r" || character === "\n") {
      if (character === "\r" && text[index + 1] === "\n") index += 1;
      pushRow();
    } else if (character === '"') {
      if (field.length > 0) {
        throw new Error("The CSV contains a quote inside an unquoted field.");
      }
      inQuotes = true;
    } else {
      field += character;
    }
  }

  if (inQuotes) throw new Error("The CSV has an unclosed quoted field.");
  if (field.length > 0 || row.length > 0 || afterQuote) pushRow();
  return rows;
}

function parseListCell(value: string) {
  return value
    .split(";")
    .map((item) => item.trim())
    .filter(Boolean);
}

function isValidDateOnly(value: string) {
  if (!/^\d{4}-\d{2}-\d{2}$/.test(value)) return false;
  const [year, month, day] = value.split("-").map(Number);
  const date = new Date(Date.UTC(year, month - 1, day));
  return (
    date.getUTCFullYear() === year &&
    date.getUTCMonth() === month - 1 &&
    date.getUTCDate() === day
  );
}

function parseApplicationsCsv(input: string): ImportedApplication[] {
  const [headers, ...records] = parseCsvRows(input);
  if (!headers || records.length === 0) {
    throw new Error("The CSV must include a header row and at least one application.");
  }

  const headerIndexes = new Map(
    headers.map((header, index) => [header.trim().toLocaleLowerCase(), index]),
  );
  for (const requiredHeader of ["company", "position", "status"]) {
    if (!headerIndexes.has(requiredHeader)) {
      throw new Error(`The CSV is missing the required "${requiredHeader}" column.`);
    }
  }

  return records.map((record, recordIndex) => {
    if (record.length !== headers.length) {
      throw new Error(`CSV record ${recordIndex + 2} has an inconsistent number of columns.`);
    }
    const get = (name: string) => {
      const index = headerIndexes.get(name.toLocaleLowerCase());
      return index === undefined ? "" : record[index];
    };

    const company = get("company").trim();
    const position = get("position").trim();
    const status = get("status").trim();
    if (!company || !position) {
      throw new Error(`CSV record ${recordIndex + 2} needs a company and position.`);
    }
    if (!applicationStatuses.has(status)) {
      throw new Error(`CSV record ${recordIndex + 2} has an unsupported status.`);
    }

    const jobUrl = get("job url").trim();
    if (jobUrl) {
      try {
        const parsedUrl = new URL(jobUrl);
        if (!["http:", "https:"].includes(parsedUrl.protocol)) {
          throw new Error();
        }
      } catch {
        throw new Error(`CSV record ${recordIndex + 2} has an invalid job URL.`);
      }
    }

    const followUpAt = get("follow-up date").trim();
    if (followUpAt && !isValidDateOnly(followUpAt)) {
      throw new Error(`CSV record ${recordIndex + 2} has an invalid follow-up date.`);
    }

    const fitRoleTitle = get("fit role title").trim();
    const fitVerdictValue = get("fit verdict").trim();
    const fitAssessmentText = get("fit assessment");
    const hasFitAssessment = Boolean(
      fitRoleTitle || fitVerdictValue || fitAssessmentText.trim() ||
        get("strengths") || get("gaps") || get("questions to confirm"),
    );
    let fitAssessment: FitAssessment | null = null;
    if (hasFitAssessment) {
      const fitVerdict = fitVerdicts.find(
        (verdict) => verdict === fitVerdictValue,
      );
      if (!fitRoleTitle || !fitVerdict) {
        throw new Error(`CSV record ${recordIndex + 2} has incomplete fit-assessment data.`);
      }
      const strengths = parseListCell(get("strengths"));
      const gaps = parseListCell(get("gaps"));
      const questionsToConfirm = parseListCell(get("questions to confirm"));
      if (strengths.length > 5 || gaps.length > 5 || questionsToConfirm.length > 5) {
        throw new Error(`CSV record ${recordIndex + 2} has more than 5 fit-assessment items in a category.`);
      }
      fitAssessment = {
        roleTitle: fitRoleTitle,
        verdict: fitVerdict,
        assessment: fitAssessmentText,
        strengths,
        gaps,
        questionsToConfirm,
      };
    }

    return {
      company,
      position,
      status,
      jobUrl: jobUrl || null,
      jobSummary: get("job summary").trim() ? get("job summary") : null,
      fitAssessment,
      nextAction: get("next action").trim() ? get("next action") : null,
      followUpAt: followUpAt || null,
      notes: get("notes").trim() ? get("notes") : null,
    };
  });
}

export function ApplicationCsvImport({
  onImported,
}: {
  onImported: () => Promise<void>;
}) {
  const fileInput = useRef<HTMLInputElement>(null);
  const [open, setOpen] = useState(false);
  const [fileName, setFileName] = useState("");
  const [applications, setApplications] = useState<ImportedApplication[]>([]);
  const [importing, setImporting] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [notice, setNotice] = useState<string | null>(null);

  async function handleFileChange(event: ChangeEvent<HTMLInputElement>) {
    const input = event.currentTarget;
    const file = input.files?.[0];
    input.value = "";
    if (!file) return;

    setError(null);
    setNotice(null);
    try {
      const parsed = parseApplicationsCsv(await file.text());
      setFileName(file.name);
      setApplications(parsed);
      setOpen(true);
    } catch (parseError: unknown) {
      setError(
        parseError instanceof Error
          ? parseError.message
          : "Unable to read this CSV file.",
      );
    }
  }

  async function handleImport() {
    setImporting(true);
    setError(null);
    try {
      const result = await fetcher<{ created: number }>("/applications/import", {
        method: "POST",
        body: JSON.stringify({ applications }),
      });
      setOpen(false);
      setApplications([]);
      try {
        await onImported();
        setNotice(`Imported ${result.created} applications.`);
      } catch {
        setNotice(
          `Imported ${result.created} applications, but the list could not be refreshed. Reload the page to see them.`,
        );
      }
    } catch (importError: unknown) {
      setError(
        importError instanceof Error
          ? importError.message
          : "Unable to import these applications.",
      );
    } finally {
      setImporting(false);
    }
  }

  return (
    <>
      <input
        ref={fileInput}
        type="file"
        accept=".csv,text/csv"
        className="sr-only"
        aria-label="Choose applications CSV file"
        onChange={(event) => void handleFileChange(event)}
      />
      <Button
        type="button"
        variant="outline"
        onClick={() => fileInput.current?.click()}
        className="h-9 border-[#2b2e3b] text-xs text-slate-300 hover:bg-[#1f212d] hover:text-white"
      >
        <Upload className="h-4 w-4" />
        Import CSV
      </Button>
      {error && (
        <p role="alert" className="basis-full text-xs text-rose-400">
          {error}
        </p>
      )}
      {notice && (
        <p role="status" className="basis-full text-xs text-emerald-300">
          {notice}
        </p>
      )}

      <Dialog
        open={open}
        onOpenChange={(nextOpen) => {
          if (!importing) setOpen(nextOpen);
        }}
      >
        <DialogContent className="border-[#1f212d] bg-[#0d0e14] text-slate-100 sm:max-w-xl">
          <DialogHeader>
            <DialogTitle className="text-white">Import applications</DialogTitle>
            <DialogDescription>
              Review the new records from {fileName} before importing.
            </DialogDescription>
          </DialogHeader>
          <div className="space-y-4">
            <p className="text-xs text-slate-300">
              {applications.length} applications will be added as new records.
              Existing applications will not be changed. Fit assessments and
              follow-up details are restored; original creation dates and linked
              roadmap associations are not.
            </p>
            <div className="max-h-48 overflow-y-auto rounded-lg border border-[#252836]">
              <ul className="divide-y divide-[#252836]">
                {applications.slice(0, 5).map((application, index) => (
                  <li
                    key={`${application.company}-${application.position}-${index}`}
                    className="flex items-center justify-between gap-3 px-3 py-2 text-xs"
                  >
                    <span className="truncate text-slate-200">
                      {application.company} · {application.position}
                    </span>
                    <span className="shrink-0 font-mono text-[10px] text-slate-500">
                      {application.status}
                    </span>
                  </li>
                ))}
              </ul>
              {applications.length > 5 && (
                <p className="border-t border-[#252836] px-3 py-2 text-[11px] text-slate-500">
                  And {applications.length - 5} more...
                </p>
              )}
            </div>
            {error && (
              <p role="alert" className="text-xs text-rose-400">
                {error}
              </p>
            )}
            <div className="flex justify-end gap-2 border-t border-[#1f212d] pt-4">
              <Button
                type="button"
                variant="ghost"
                onClick={() => setOpen(false)}
                disabled={importing}
                className="text-slate-300 hover:bg-[#1f212d] hover:text-white"
              >
                Cancel
              </Button>
              <Button
                type="button"
                onClick={() => void handleImport()}
                disabled={importing}
                className="bg-blue-600 text-white hover:bg-blue-500"
              >
                {importing ? (
                  <Loader2 className="h-4 w-4 animate-spin" />
                ) : (
                  <Upload className="h-4 w-4" />
                )}
                {importing ? "Importing..." : "Import applications"}
              </Button>
            </div>
          </div>
        </DialogContent>
      </Dialog>
    </>
  );
}

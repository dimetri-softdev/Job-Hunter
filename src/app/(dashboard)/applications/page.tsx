"use client";

import React, { useEffect, useState } from "react";
import { Building2, Loader2, Plus } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog";
import {
  JobPostingModal,
  type CreatedApplication,
} from "@/components/dashboard/job-posting-modal";
import { JobFitModal } from "@/components/dashboard/job-fit-modal";
import { PNetApplicationPack } from "@/components/dashboard/pnet-application-pack";
import { DashboardPageHeader } from "@/components/dashboard/page-header";
import { fetcher } from "@/lib/api";
import { ExternalLink } from "lucide-react";

interface Application {
  id: string;
  company: string;
  position: string;
  status: string;
  createdAt: string;
  jobUrl?: string | null;
  jobSummary?: string | null;
}

function isPNetListing(jobUrl?: string | null) {
  if (!jobUrl) return false;
  try {
    const hostname = new URL(jobUrl).hostname;
    return hostname === "pnet.co.za" || hostname.endsWith(".pnet.co.za");
  } catch {
    return false;
  }
}

export default function ApplicationsPage() {
  const [applications, setApplications] = useState<Application[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [dialogOpen, setDialogOpen] = useState(false);
  const [saving, setSaving] = useState(false);
  const [saveError, setSaveError] = useState<string | null>(null);

  function handleApplicationCreated(application: CreatedApplication) {
    setApplications((current) => [application, ...current]);
  }

  async function handleCreateApplication(
    event: React.FormEvent<HTMLFormElement>,
  ) {
    event.preventDefault();
    const form = event.currentTarget;
    setSaving(true);
    setSaveError(null);

    const formData = new FormData(form);
    try {
      const application = await fetcher<Application>("/applications", {
        method: "POST",
        body: JSON.stringify({
          company: formData.get("company"),
          position: formData.get("position"),
          status: formData.get("status"),
          notes: formData.get("notes") || null,
        }),
      });
      setApplications((current) => [application, ...current]);
      setDialogOpen(false);
      form.reset();
    } catch (saveError: unknown) {
      setSaveError(
        saveError instanceof Error
          ? saveError.message
          : "Failed to save application.",
      );
    } finally {
      setSaving(false);
    }
  }

  useEffect(() => {
    async function loadApplications() {
      try {
        const data = await fetcher<Application[]>("/applications");
        setApplications(data);
      } catch (err: unknown) {
        setError(
          err instanceof Error ? err.message : "Failed to load applications",
        );
      } finally {
        setLoading(false);
      }
    }
    loadApplications();
  }, []);

  if (loading) {
    return (
      <div className="flex items-center justify-center h-64 text-slate-400 gap-2">
        <Loader2 className="h-5 w-5 animate-spin" />
        <span>Loading applications...</span>
      </div>
    );
  }

  if (error) {
    return (
      <div className="p-4 bg-red-500/10 text-red-400 border border-red-500/20 rounded-xl text-xs">
        {error}
      </div>
    );
  }

  return (
    <div className="w-full space-y-6">
      <DashboardPageHeader
        title="Job Applications"
        description="Keep track of the roles you have applied for and where they stand."
      >
        <JobFitModal />
        <JobPostingModal onApplicationCreated={handleApplicationCreated} />
        <Dialog
          open={dialogOpen}
          onOpenChange={(open) => {
            setDialogOpen(open);
            if (open) setSaveError(null);
          }}
        >
          <DialogTrigger className="inline-flex h-9 items-center justify-center gap-2 rounded-lg bg-blue-600 px-4 text-xs font-semibold text-white transition-colors hover:bg-blue-500 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-blue-400">
            <Plus className="h-4 w-4" />
            Add application
          </DialogTrigger>
          <DialogContent className="border-[#1f212d] bg-[#0d0e14] text-slate-100 sm:max-w-lg">
            <DialogHeader>
              <DialogTitle className="text-white">Add application</DialogTitle>
              <DialogDescription>
                Record a role you are pursuing.
              </DialogDescription>
            </DialogHeader>
            <form className="space-y-4" onSubmit={handleCreateApplication}>
              <div className="space-y-2">
                <label htmlFor="company" className="text-xs text-slate-300">
                  Company
                </label>
                <Input
                  id="company"
                  name="company"
                  required
                  maxLength={120}
                  placeholder="e.g. Acme"
                  className="h-10 border-[#2b2e3b] bg-[#090a0f] text-sm text-white placeholder:text-slate-500"
                />
              </div>
              <div className="space-y-2">
                <label htmlFor="position" className="text-xs text-slate-300">
                  Job title
                </label>
                <Input
                  id="position"
                  name="position"
                  required
                  maxLength={120}
                  placeholder="e.g. Frontend Engineer"
                  className="h-10 border-[#2b2e3b] bg-[#090a0f] text-sm text-white placeholder:text-slate-500"
                />
              </div>
              <div className="space-y-2">
                <label htmlFor="status" className="text-xs text-slate-300">
                  Status
                </label>
                <select
                  id="status"
                  name="status"
                  defaultValue="APPLIED"
                  className="h-10 w-full rounded-lg border border-[#2b2e3b] bg-[#090a0f] px-3 text-sm text-white outline-none focus-visible:border-blue-400 focus-visible:ring-2 focus-visible:ring-blue-400/30"
                >
                  <option value="APPLIED">Applied</option>
                  <option value="INTERVIEWING">Interviewing</option>
                  <option value="OFFERED">Offered</option>
                  <option value="REJECTED">Rejected</option>
                </select>
              </div>
              <div className="space-y-2">
                <label htmlFor="notes" className="text-xs text-slate-300">
                  Notes <span className="text-slate-500">(optional)</span>
                </label>
                <Textarea
                  id="notes"
                  name="notes"
                  maxLength={2000}
                  rows={3}
                  placeholder="Add any details you want to remember"
                  className="resize-y border-[#2b2e3b] bg-[#090a0f] text-sm text-white placeholder:text-slate-500"
                />
              </div>
              {saveError && (
                <p role="alert" className="text-xs text-rose-400">
                  {saveError}
                </p>
              )}
              <div className="flex justify-end gap-2 border-t border-[#1f212d] pt-4">
                <Button
                  type="button"
                  variant="ghost"
                  className="text-slate-300 hover:bg-[#1f212d] hover:text-white"
                  onClick={() => setDialogOpen(false)}
                  disabled={saving}
                >
                  Cancel
                </Button>
                <Button
                  type="submit"
                  disabled={saving}
                  className="bg-blue-600 text-white hover:bg-blue-500"
                >
                  {saving ? (
                    <Loader2 className="h-4 w-4 animate-spin" />
                  ) : (
                    <Plus className="h-4 w-4" />
                  )}
                  Save application
                </Button>
              </div>
            </form>
          </DialogContent>
        </Dialog>
      </DashboardPageHeader>

      <div className="bg-[#12131a] border border-[#1f212d] rounded-2xl overflow-hidden">
        {applications.length === 0 ? (
          <div className="p-8 text-center text-slate-500 text-xs">
            No applications recorded for this account.
          </div>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full text-left text-xs">
              <thead className="bg-[#090a0f] border-b border-[#1f212d] text-slate-400 font-mono uppercase text-[10px]">
                <tr>
                  <th className="p-4">Company & Position</th>
                  <th className="p-4">Created</th>
                  <th className="p-4">Status</th>
                  <th className="p-4">Next step</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-[#1f212d] text-slate-300">
                {applications.map((app) => (
                  <tr
                    key={app.id}
                    className="hover:bg-[#181a24] transition-colors"
                  >
                    <td className="p-4">
                      <div className="flex items-center gap-3">
                        <div className="p-2 bg-[#1f212d] rounded-lg text-slate-400">
                          <Building2 className="h-4 w-4" />
                        </div>
                        <div>
                          <div className="font-semibold text-white">
                            {app.position}
                          </div>
                          <div className="text-slate-400 text-[11px]">
                            {app.company}
                          </div>
                          {app.jobSummary && (
                            <div className="mt-1 max-w-xl line-clamp-2 text-[11px] leading-4 text-slate-500">
                              {app.jobSummary}
                            </div>
                          )}
                          {app.jobUrl && (
                            <a
                              href={app.jobUrl}
                              target="_blank"
                              rel="noreferrer"
                              className="mt-1 inline-flex items-center gap-1 text-[11px] text-blue-400 hover:text-blue-300"
                            >
                              View posting
                              <ExternalLink className="h-3 w-3" />
                            </a>
                          )}
                        </div>
                      </div>
                    </td>
                    <td className="p-4 font-mono text-slate-400">
                      {new Date(app.createdAt).toLocaleDateString()}
                    </td>
                    <td className="p-4">
                      <span className="px-2.5 py-1 rounded-full text-[10px] font-medium border bg-blue-500/10 text-blue-400 border-blue-500/20">
                        {app.status.replaceAll("_", " ")}
                      </span>
                    </td>
                    <td className="p-4">
                      {isPNetListing(app.jobUrl) && app.jobSummary && (
                        <PNetApplicationPack
                          applicationId={app.id}
                          company={app.company}
                          position={app.position}
                        />
                      )}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </div>
    </div>
  );
}

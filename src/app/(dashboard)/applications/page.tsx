"use client";

import React, { useEffect, useState } from "react";
import { Building2, Loader2, Pencil, Plus, Trash2 } from "lucide-react";
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
  notes?: string | null;
  jobUrl?: string | null;
  jobSummary?: string | null;
}

const STATUSES = [
  { value: "APPLIED", label: "Applied" },
  { value: "INTERVIEWING", label: "Interviewing" },
  { value: "OFFERED", label: "Offered" },
  { value: "REJECTED", label: "Rejected" },
];

const fieldClass =
  "h-10 border-[#2b2e3b] bg-[#090a0f] text-sm text-white placeholder:text-slate-500";

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
  const [editing, setEditing] = useState<Application | null>(null);
  const [editSaving, setEditSaving] = useState(false);
  const [editError, setEditError] = useState<string | null>(null);
  const [deleting, setDeleting] = useState<Application | null>(null);
  const [deleteBusy, setDeleteBusy] = useState(false);
  const [deleteError, setDeleteError] = useState<string | null>(null);
  const [actionError, setActionError] = useState<string | null>(null);

  function replaceApplication(updated: Application) {
    setApplications((current) =>
      current.map((app) =>
        app.id === updated.id ? { ...app, ...updated } : app,
      ),
    );
  }

  async function handleStatusChange(app: Application, status: string) {
    const previous = app.status;
    setActionError(null);
    replaceApplication({ ...app, status });
    try {
      const updated = await fetcher<Application>(`/applications/${app.id}`, {
        method: "PUT",
        body: JSON.stringify({
          company: app.company,
          position: app.position,
          status,
          notes: app.notes ?? null,
          jobUrl: app.jobUrl ?? null,
        }),
      });
      replaceApplication(updated);
    } catch (err: unknown) {
      replaceApplication({ ...app, status: previous });
      setActionError(
        err instanceof Error ? err.message : "Failed to update status.",
      );
    }
  }

  async function handleEditSubmit(event: React.FormEvent<HTMLFormElement>) {
    event.preventDefault();
    if (!editing) return;
    const formData = new FormData(event.currentTarget);
    setEditSaving(true);
    setEditError(null);
    try {
      const updated = await fetcher<Application>(
        `/applications/${editing.id}`,
        {
          method: "PUT",
          body: JSON.stringify({
            company: formData.get("company"),
            position: formData.get("position"),
            status: formData.get("status"),
            notes: formData.get("notes") || null,
            jobUrl: formData.get("jobUrl") || null,
          }),
        },
      );
      replaceApplication(updated);
      setEditing(null);
    } catch (err: unknown) {
      setEditError(
        err instanceof Error ? err.message : "Failed to update application.",
      );
    } finally {
      setEditSaving(false);
    }
  }

  async function handleDeleteConfirm() {
    if (!deleting) return;
    setDeleteBusy(true);
    setDeleteError(null);
    try {
      await fetcher(`/applications/${deleting.id}`, { method: "DELETE" });
      setApplications((current) =>
        current.filter((app) => app.id !== deleting.id),
      );
      setDeleting(null);
    } catch (err: unknown) {
      setDeleteError(
        err instanceof Error ? err.message : "Failed to delete application.",
      );
    } finally {
      setDeleteBusy(false);
    }
  }

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

      {actionError && (
        <p role="alert" className="text-xs text-rose-400">
          {actionError}
        </p>
      )}

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
                  <th className="p-4 text-right">Actions</th>
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
                      <select
                        aria-label={`Status for ${app.position} at ${app.company}`}
                        value={app.status}
                        onChange={(e) =>
                          handleStatusChange(app, e.target.value)
                        }
                        className="h-8 rounded-lg border border-blue-500/20 bg-blue-500/10 px-2 text-[11px] font-medium text-blue-300 outline-none focus-visible:ring-2 focus-visible:ring-blue-400/30"
                      >
                        {STATUSES.map((s) => (
                          <option
                            key={s.value}
                            value={s.value}
                            className="bg-[#0d0e14]"
                          >
                            {s.label}
                          </option>
                        ))}
                      </select>
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
                    <td className="p-4">
                      <div className="flex justify-end gap-1">
                        <Button
                          type="button"
                          variant="ghost"
                          size="icon"
                          aria-label={`Edit ${app.position} at ${app.company}`}
                          className="text-slate-400 hover:bg-[#1f212d] hover:text-white"
                          onClick={() => {
                            setEditError(null);
                            setEditing(app);
                          }}
                        >
                          <Pencil className="h-4 w-4" />
                        </Button>
                        <Button
                          type="button"
                          variant="ghost"
                          size="icon"
                          aria-label={`Delete ${app.position} at ${app.company}`}
                          className="text-slate-400 hover:bg-rose-500/10 hover:text-rose-400"
                          onClick={() => {
                            setDeleteError(null);
                            setDeleting(app);
                          }}
                        >
                          <Trash2 className="h-4 w-4" />
                        </Button>
                      </div>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </div>

      <Dialog
        open={editing !== null}
        onOpenChange={(open) => {
          if (!open) setEditing(null);
        }}
      >
        <DialogContent className="border-[#1f212d] bg-[#0d0e14] text-slate-100 sm:max-w-lg">
          <DialogHeader>
            <DialogTitle className="text-white">Edit application</DialogTitle>
            <DialogDescription>
              Update the details of this role.
            </DialogDescription>
          </DialogHeader>
          {editing && (
            <form
              key={editing.id}
              className="space-y-4"
              onSubmit={handleEditSubmit}
            >
              <div className="space-y-2">
                <label
                  htmlFor="edit-company"
                  className="text-xs text-slate-300"
                >
                  Company
                </label>
                <Input
                  id="edit-company"
                  name="company"
                  required
                  maxLength={120}
                  defaultValue={editing.company}
                  className={fieldClass}
                />
              </div>
              <div className="space-y-2">
                <label
                  htmlFor="edit-position"
                  className="text-xs text-slate-300"
                >
                  Job title
                </label>
                <Input
                  id="edit-position"
                  name="position"
                  required
                  maxLength={120}
                  defaultValue={editing.position}
                  className={fieldClass}
                />
              </div>
              <div className="space-y-2">
                <label htmlFor="edit-status" className="text-xs text-slate-300">
                  Status
                </label>
                <select
                  id="edit-status"
                  name="status"
                  defaultValue={editing.status}
                  className="h-10 w-full rounded-lg border border-[#2b2e3b] bg-[#090a0f] px-3 text-sm text-white outline-none focus-visible:border-blue-400 focus-visible:ring-2 focus-visible:ring-blue-400/30"
                >
                  {STATUSES.map((s) => (
                    <option key={s.value} value={s.value}>
                      {s.label}
                    </option>
                  ))}
                </select>
              </div>
              <div className="space-y-2">
                <label htmlFor="edit-jobUrl" className="text-xs text-slate-300">
                  Job posting link{" "}
                  <span className="text-slate-500">(optional)</span>
                </label>
                <Input
                  id="edit-jobUrl"
                  name="jobUrl"
                  type="url"
                  maxLength={2000}
                  defaultValue={editing.jobUrl ?? ""}
                  placeholder="https://"
                  className={fieldClass}
                />
              </div>
              <div className="space-y-2">
                <label htmlFor="edit-notes" className="text-xs text-slate-300">
                  Notes <span className="text-slate-500">(optional)</span>
                </label>
                <Textarea
                  id="edit-notes"
                  name="notes"
                  maxLength={2000}
                  rows={4}
                  defaultValue={editing.notes ?? ""}
                  className="resize-y border-[#2b2e3b] bg-[#090a0f] text-sm text-white placeholder:text-slate-500"
                />
              </div>
              {editError && (
                <p role="alert" className="text-xs text-rose-400">
                  {editError}
                </p>
              )}
              <div className="flex justify-end gap-2 border-t border-[#1f212d] pt-4">
                <Button
                  type="button"
                  variant="ghost"
                  className="text-slate-300 hover:bg-[#1f212d] hover:text-white"
                  onClick={() => setEditing(null)}
                  disabled={editSaving}
                >
                  Cancel
                </Button>
                <Button
                  type="submit"
                  disabled={editSaving}
                  className="bg-blue-600 text-white hover:bg-blue-500"
                >
                  {editSaving && <Loader2 className="h-4 w-4 animate-spin" />}
                  Save changes
                </Button>
              </div>
            </form>
          )}
        </DialogContent>
      </Dialog>

      <Dialog
        open={deleting !== null}
        onOpenChange={(open) => {
          if (!open && !deleteBusy) setDeleting(null);
        }}
      >
        <DialogContent className="border-[#1f212d] bg-[#0d0e14] text-slate-100 sm:max-w-md">
          <DialogHeader>
            <DialogTitle className="text-white">
              Delete application?
            </DialogTitle>
            <DialogDescription>
              {deleting
                ? `${deleting.position} at ${deleting.company} will be permanently removed.`
                : ""}
            </DialogDescription>
          </DialogHeader>
          {deleteError && (
            <p role="alert" className="text-xs text-rose-400">
              {deleteError}
            </p>
          )}
          <div className="flex justify-end gap-2 border-t border-[#1f212d] pt-4">
            <Button
              type="button"
              variant="ghost"
              className="text-slate-300 hover:bg-[#1f212d] hover:text-white"
              onClick={() => setDeleting(null)}
              disabled={deleteBusy}
            >
              Cancel
            </Button>
            <Button
              type="button"
              onClick={handleDeleteConfirm}
              disabled={deleteBusy}
              className="bg-rose-600 text-white hover:bg-rose-500"
            >
              {deleteBusy && <Loader2 className="h-4 w-4 animate-spin" />}
              Delete
            </Button>
          </div>
        </DialogContent>
      </Dialog>
    </div>
  );
}

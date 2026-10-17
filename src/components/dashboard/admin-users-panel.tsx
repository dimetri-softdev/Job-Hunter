"use client";

import { useCallback, useEffect, useState, type FormEvent } from "react";
import {
  ChevronLeft,
  ChevronRight,
  Loader2,
  Search,
  Shield,
  ShieldOff,
  Trash2,
  UserRound,
  UserRoundX,
} from "lucide-react";

interface AdminUser {
  id: string;
  email: string;
  createdAt: string;
  lastSignInAt: string | null;
  bannedUntil: string | null;
  isSuspended: boolean;
  isAdmin: boolean;
  isBootstrapAdmin: boolean;
  subscription: {
    plan: string;
    status: string;
    trialEndsAt: string | null;
    currentPeriodEnd: string | null;
  } | null;
}

interface UserPage {
  users: AdminUser[];
  page: number;
  pageSize: number;
  hasMore: boolean;
  totalAdmins: number;
  currentUserId: string;
}

interface AdminRecord {
  userId: string | null;
  email: string;
  source: "environment" | "database";
  createdAt: string | null;
  addedBy: string | null;
}

function getErrorMessage(payload: unknown, status: number) {
  return payload &&
    typeof payload === "object" &&
    "error" in payload &&
    typeof payload.error === "string"
    ? payload.error
    : `Request failed (${status}).`;
}

async function readJson(response: Response): Promise<unknown> {
  try {
    return await response.json();
  } catch {
    return null;
  }
}

export function AdminUsersPanel() {
  const [page, setPage] = useState(1);
  const [searchDraft, setSearchDraft] = useState("");
  const [search, setSearch] = useState("");
  const [users, setUsers] = useState<UserPage | null>(null);
  const [admins, setAdmins] = useState<AdminRecord[]>([]);
  const [loading, setLoading] = useState(true);
  const [busyId, setBusyId] = useState<string | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [refreshToken, setRefreshToken] = useState(0);
  const [deleteCandidate, setDeleteCandidate] = useState<{
    id: string;
    email: string;
    confirmation: string;
  } | null>(null);

  const refresh = useCallback(() => {
    setRefreshToken((token) => token + 1);
  }, []);

  useEffect(() => {
    const controller = new AbortController();
    async function loadUsers() {
      setLoading(true);
      setError(null);
      const params = new URLSearchParams({
        page: String(page),
        ...(search ? { q: search } : {}),
      });
      try {
        const [userResponse, adminResponse] = await Promise.all([
          fetch(`/api/admin/users?${params}`, {
            cache: "no-store",
            signal: controller.signal,
          }),
          fetch("/api/admin/admins", {
            cache: "no-store",
            signal: controller.signal,
          }),
        ]);
        const [userPayload, adminPayload] = await Promise.all([
          readJson(userResponse),
          readJson(adminResponse),
        ]);
        if (!userResponse.ok) {
          throw new Error(getErrorMessage(userPayload, userResponse.status));
        }
        if (!adminResponse.ok) {
          throw new Error(getErrorMessage(adminPayload, adminResponse.status));
        }
        if (
          !userPayload ||
          typeof userPayload !== "object" ||
          !("users" in userPayload) ||
          !Array.isArray(userPayload.users) ||
          !adminPayload ||
          typeof adminPayload !== "object" ||
          !("admins" in adminPayload) ||
          !Array.isArray(adminPayload.admins)
        ) {
          throw new Error("The server returned unexpected account data.");
        }
        setUsers(userPayload as UserPage);
        setAdmins(adminPayload.admins as AdminRecord[]);
      } catch (loadError: unknown) {
        if (controller.signal.aborted) return;
        setError(
          loadError instanceof Error
            ? loadError.message
            : "Unable to load accounts.",
        );
      } finally {
        if (!controller.signal.aborted) setLoading(false);
      }
    }
    void loadUsers();
    return () => controller.abort();
  }, [page, refreshToken, search]);

  function applySearch(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    setPage(1);
    setSearch(searchDraft.trim());
  }

  async function updateAccount(
    id: string,
    action: "suspend" | "unsuspend" | "promote" | "demote",
  ) {
    setBusyId(id);
    setError(null);
    try {
      let response: Response;
      if (action === "suspend" || action === "unsuspend") {
        response = await fetch("/api/admin/users", {
          method: "PATCH",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ userId: id, suspended: action === "suspend" }),
        });
      } else if (action === "promote") {
        response = await fetch("/api/admin/admins", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ userId: id }),
        });
      } else {
        response = await fetch(`/api/admin/admins/${encodeURIComponent(id)}`, {
          method: "DELETE",
        });
      }
      const payload = await readJson(response);
      if (!response.ok) throw new Error(getErrorMessage(payload, response.status));
      refresh();
    } catch (actionError: unknown) {
      setError(
        actionError instanceof Error
          ? actionError.message
          : "Unable to update this account.",
      );
    } finally {
      setBusyId(null);
    }
  }

  async function grantTrial(id: string) {
    setBusyId(id);
    setError(null);
    try {
      const response = await fetch("/api/admin/billing/trials", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ userId: id }),
      });
      const payload = await readJson(response);
      if (!response.ok) throw new Error(getErrorMessage(payload, response.status));
      refresh();
    } catch (grantError: unknown) {
      setError(
        grantError instanceof Error
          ? grantError.message
          : "Unable to grant this trial.",
      );
    } finally {
      setBusyId(null);
    }
  }

  async function revokeTrial(id: string) {
    if (!window.confirm("End this user's Standard trial now? Their saved data will remain available to view and export.")) {
      return;
    }
    setBusyId(id);
    setError(null);
    try {
      const response = await fetch("/api/admin/billing/trials", {
        method: "DELETE",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ userId: id }),
      });
      const payload = await readJson(response);
      if (!response.ok) throw new Error(getErrorMessage(payload, response.status));
      refresh();
    } catch (revokeError: unknown) {
      setError(
        revokeError instanceof Error
          ? revokeError.message
          : "Unable to revoke this trial.",
      );
    } finally {
      setBusyId(null);
    }
  }

  async function deleteAccount() {
    if (!deleteCandidate) return;
    const { id, confirmation } = deleteCandidate;
    setBusyId(id);
    setError(null);
    try {
      const response = await fetch(`/api/admin/users/${encodeURIComponent(id)}`, {
        method: "DELETE",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ confirmEmail: confirmation }),
      });
      const payload = await readJson(response);
      if (!response.ok) throw new Error(getErrorMessage(payload, response.status));
      setDeleteCandidate(null);
      refresh();
    } catch (deleteError: unknown) {
      setError(
        deleteError instanceof Error
          ? deleteError.message
          : "Unable to delete this account.",
      );
    } finally {
      setBusyId(null);
    }
  }

  const canDelete = (user: AdminUser) =>
    !user.isAdmin && user.id !== users?.currentUserId;

  return (
    <section className="space-y-5">
      <div className="grid gap-3 sm:grid-cols-3">
        <AccountStat label="Administrators" value={users?.totalAdmins ?? "—"} />
        <AccountStat
          label="Accounts on this page"
          value={users?.users.length ?? "—"}
        />
        <AccountStat
          label="Page"
          value={users ? `${users.page}${users.hasMore ? "+" : ""}` : "—"}
        />
      </div>

      <section className="rounded-xl border border-[#1f212d] bg-[#12131a] p-4">
        <div className="flex flex-wrap items-start justify-between gap-3">
          <div>
            <h2 className="flex items-center gap-2 text-sm font-semibold text-white">
              <Shield className="size-4 text-violet-300" aria-hidden="true" />
              Administrator access
            </h2>
            <p className="mt-1 text-xs leading-5 text-slate-400">
              Environment-managed admins are protected. Remove database-managed access here.
            </p>
          </div>
          {admins.length > 0 && (
            <span className="text-xs text-slate-500">
              {admins.length} configured
            </span>
          )}
        </div>
        {admins.length === 0 ? (
          <p className="mt-4 text-sm text-slate-500">
            No administrators are listed. Configure <code>ADMIN_EMAILS</code> to bootstrap access.
          </p>
        ) : (
          <ul className="mt-4 divide-y divide-[#1f212d]">
            {admins.map((admin) => (
              <li
                key={`${admin.source}-${admin.userId ?? admin.email}`}
                className="flex flex-wrap items-center justify-between gap-3 py-3 first:pt-0 last:pb-0"
              >
                <div className="min-w-0">
                  <p className="break-all text-sm text-slate-200">{admin.email}</p>
                  <p className="mt-1 text-xs text-slate-500">
                    {admin.source === "environment"
                      ? "Protected · ADMIN_EMAILS"
                      : `Added ${admin.createdAt ? new Date(admin.createdAt).toLocaleDateString() : ""}`}
                  </p>
                </div>
                {admin.source === "database" && admin.userId && (
                  <button
                    type="button"
                    onClick={() => void updateAccount(admin.userId!, "demote")}
                    disabled={
                      busyId === admin.userId ||
                      admin.userId === users?.currentUserId
                    }
                    title={
                      admin.userId === users?.currentUserId
                        ? "You cannot remove your own administrator access."
                        : "Remove administrator access"
                    }
                    className="inline-flex min-h-9 items-center gap-2 rounded-lg border border-[#2b2e3b] px-3 text-xs text-slate-300 hover:bg-white/5 disabled:cursor-not-allowed disabled:opacity-40"
                  >
                    {busyId === admin.userId ? (
                      <Loader2 className="size-4 animate-spin" aria-hidden="true" />
                    ) : (
                      <ShieldOff className="size-4" aria-hidden="true" />
                    )}
                    Remove admin
                  </button>
                )}
              </li>
            ))}
          </ul>
        )}
      </section>

      <section className="rounded-xl border border-[#1f212d] bg-[#12131a] p-4">
        <div className="mb-4">
          <h2 className="flex items-center gap-2 text-sm font-semibold text-white">
            <UserRound className="size-4 text-violet-300" aria-hidden="true" />
            User accounts
          </h2>
          <p className="mt-1 text-xs leading-5 text-slate-400">
            Browse accounts by page. Search filters the accounts on the current identity-provider page.
          </p>
        </div>
        <form onSubmit={applySearch} className="mb-4 flex flex-col gap-2 sm:flex-row">
          <label className="sr-only" htmlFor="admin-user-search">
            Search users on this page
          </label>
          <div className="relative flex-1">
            <Search
              className="pointer-events-none absolute left-3 top-1/2 size-4 -translate-y-1/2 text-slate-500"
              aria-hidden="true"
            />
            <input
              id="admin-user-search"
              value={searchDraft}
              onChange={(event) => setSearchDraft(event.target.value)}
              maxLength={200}
              placeholder="Filter by email or user ID on this page"
              className="min-h-10 w-full rounded-lg border border-[#2b2e3b] bg-[#0d0e14] pl-9 pr-3 text-sm text-white placeholder:text-slate-600"
            />
          </div>
          <button
            type="submit"
            disabled={loading}
            className="min-h-10 rounded-lg bg-violet-500 px-4 text-sm font-semibold text-white hover:bg-violet-400 disabled:opacity-50"
          >
            Search page
          </button>
        </form>

        {error && (
          <p role="alert" className="mb-4 rounded-lg bg-rose-500/10 p-3 text-sm text-rose-200">
            {error}
          </p>
        )}
        {loading && !users ? (
          <p className="flex items-center gap-2 py-6 text-sm text-slate-400">
            <Loader2 className="size-4 animate-spin" aria-hidden="true" />
            Loading accounts…
          </p>
        ) : users?.users.length === 0 ? (
          <p className="py-6 text-center text-sm text-slate-400">
            No accounts match this filter on page {page}.
          </p>
        ) : (
          <ul className="divide-y divide-[#1f212d]">
            {users?.users.map((user) => {
              const suspended = user.isSuspended;
              const isSelf = user.id === users.currentUserId;
              return (
                <li key={user.id} className="py-4 first:pt-0 last:pb-0">
                  <div className="flex flex-col justify-between gap-4 xl:flex-row xl:items-center">
                    <div className="min-w-0">
                      <div className="flex flex-wrap items-center gap-2">
                        <p className="break-all text-sm font-medium text-white">
                          {user.email || "No email"}
                        </p>
                        {user.isAdmin && (
                          <span className="rounded-full bg-violet-400/10 px-2 py-0.5 text-[10px] font-semibold uppercase tracking-wide text-violet-200">
                            Admin
                          </span>
                        )}
                        {suspended && (
                          <span className="rounded-full bg-amber-400/10 px-2 py-0.5 text-[10px] font-semibold uppercase tracking-wide text-amber-200">
                            Suspended
                          </span>
                        )}
                        {isSelf && (
                          <span className="rounded-full bg-slate-400/10 px-2 py-0.5 text-[10px] text-slate-300">
                            You
                          </span>
                        )}
                      </div>
                      <p className="mt-1 break-all font-mono text-[10px] text-slate-600">
                        {user.id}
                      </p>
                      <p className="mt-1 text-xs text-slate-500">
                        Joined {new Date(user.createdAt).toLocaleDateString()}
                        {user.lastSignInAt &&
                          ` · Last active ${new Date(user.lastSignInAt).toLocaleDateString()}`}
                      </p>
                      <p className="mt-1 text-xs text-slate-400">
                        {user.subscription
                          ? `${user.subscription.plan} · ${user.subscription.status.toLowerCase().replaceAll("_", " ")}${
                              user.subscription.trialEndsAt
                                ? ` · trial ends ${new Date(user.subscription.trialEndsAt).toLocaleDateString()}`
                                : ""
                            }`
                          : "No trial or subscription assigned"}
                      </p>
                    </div>
                    <div className="flex flex-wrap gap-2">
                      {!user.subscription && !user.isAdmin && (
                        <button
                          type="button"
                          onClick={() => void grantTrial(user.id)}
                          disabled={busyId === user.id || suspended}
                          className="inline-flex min-h-9 items-center gap-2 rounded-lg border border-violet-400/30 px-3 text-xs text-violet-200 hover:bg-violet-400/10 disabled:cursor-not-allowed disabled:opacity-40"
                        >
                          {busyId === user.id ? (
                            <Loader2 className="size-4 animate-spin" aria-hidden="true" />
                          ) : null}
                          Grant 14-day Standard trial
                        </button>
                      )}
                      {user.subscription?.status === "TRIALING" && (
                        <button
                          type="button"
                          onClick={() => void revokeTrial(user.id)}
                          disabled={busyId === user.id}
                          className="inline-flex min-h-9 items-center gap-2 rounded-lg border border-rose-400/20 px-3 text-xs text-rose-200 hover:bg-rose-400/10 disabled:cursor-not-allowed disabled:opacity-40"
                        >
                          {busyId === user.id ? (
                            <Loader2 className="size-4 animate-spin" aria-hidden="true" />
                          ) : null}
                          Revoke trial
                        </button>
                      )}
                      {user.isAdmin ? (
                        !user.isBootstrapAdmin && (
                          <button
                            type="button"
                            onClick={() => void updateAccount(user.id, "demote")}
                            disabled={
                              busyId === user.id || isSelf || user.isBootstrapAdmin
                            }
                            className="inline-flex min-h-9 items-center gap-2 rounded-lg border border-[#2b2e3b] px-3 text-xs text-slate-300 hover:bg-white/5 disabled:opacity-40"
                          >
                            {busyId === user.id ? (
                              <Loader2 className="size-4 animate-spin" aria-hidden="true" />
                            ) : (
                              <ShieldOff className="size-4" aria-hidden="true" />
                            )}
                            Remove admin
                          </button>
                        )
                      ) : (
                        <button
                          type="button"
                          onClick={() => void updateAccount(user.id, "promote")}
                          disabled={busyId === user.id}
                          className="inline-flex min-h-9 items-center gap-2 rounded-lg border border-[#2b2e3b] px-3 text-xs text-slate-300 hover:bg-white/5 disabled:opacity-40"
                        >
                          {busyId === user.id ? (
                            <Loader2 className="size-4 animate-spin" aria-hidden="true" />
                          ) : (
                            <Shield className="size-4" aria-hidden="true" />
                          )}
                          Make admin
                        </button>
                      )}
                      <button
                        type="button"
                        onClick={() =>
                          void updateAccount(
                            user.id,
                            suspended ? "unsuspend" : "suspend",
                          )
                        }
                        disabled={busyId === user.id || isSelf || user.isAdmin}
                        title={
                          user.isAdmin
                            ? "Remove administrator access before suspension."
                            : isSelf
                              ? "You cannot suspend your own account."
                              : undefined
                        }
                        className="inline-flex min-h-9 items-center gap-2 rounded-lg border border-[#2b2e3b] px-3 text-xs text-slate-300 hover:bg-white/5 disabled:cursor-not-allowed disabled:opacity-40"
                      >
                        {busyId === user.id ? (
                          <Loader2 className="size-4 animate-spin" aria-hidden="true" />
                        ) : (
                          <UserRoundX className="size-4" aria-hidden="true" />
                        )}
                        {suspended ? "Unsuspend" : "Suspend"}
                      </button>
                      {canDelete(user) && (
                        <button
                          type="button"
                          onClick={() =>
                            setDeleteCandidate((current) =>
                              current?.id === user.id
                                ? null
                                : { id: user.id, email: user.email, confirmation: "" },
                            )
                          }
                          className="inline-flex min-h-9 items-center gap-2 rounded-lg border border-rose-500/30 px-3 text-xs text-rose-200 hover:bg-rose-500/10"
                        >
                          <Trash2 className="size-4" aria-hidden="true" />
                          Delete
                        </button>
                      )}
                    </div>
                  </div>
                  {deleteCandidate?.id === user.id && (
                    <div className="mt-4 rounded-lg border border-rose-500/20 bg-rose-500/[0.04] p-3">
                      <p className="text-sm font-medium text-rose-100">
                        Permanently delete this account and its application data?
                      </p>
                      <p className="mt-1 text-xs text-rose-100/70">
                        Type <span className="font-semibold">{user.email}</span> to confirm. This cannot be undone.
                      </p>
                      <div className="mt-3 flex flex-col gap-2 sm:flex-row">
                        <input
                          value={deleteCandidate.confirmation}
                          onChange={(event) =>
                            setDeleteCandidate((current) =>
                              current?.id === user.id
                                ? { ...current, confirmation: event.target.value }
                                : current,
                            )
                          }
                          autoComplete="off"
                          aria-label="Type account email to confirm deletion"
                          className="min-h-10 flex-1 rounded-lg border border-rose-500/30 bg-[#0d0e14] px-3 text-sm text-white"
                        />
                        <button
                          type="button"
                          onClick={() => void deleteAccount()}
                          disabled={
                            busyId === user.id ||
                            deleteCandidate.confirmation.trim().toLowerCase() !==
                              user.email.toLowerCase()
                          }
                          className="inline-flex min-h-10 items-center justify-center gap-2 rounded-lg bg-rose-600 px-4 text-sm font-semibold text-white hover:bg-rose-500 disabled:cursor-not-allowed disabled:opacity-40"
                        >
                          {busyId === user.id && (
                            <Loader2 className="size-4 animate-spin" aria-hidden="true" />
                          )}
                          Confirm deletion
                        </button>
                        <button
                          type="button"
                          onClick={() => setDeleteCandidate(null)}
                          className="min-h-10 rounded-lg border border-[#2b2e3b] px-4 text-sm text-slate-300 hover:bg-white/5"
                        >
                          Cancel
                        </button>
                      </div>
                    </div>
                  )}
                </li>
              );
            })}
          </ul>
        )}

        {users && (page > 1 || users.hasMore) && (
          <nav
            aria-label="User account pages"
            className="mt-4 flex items-center justify-between border-t border-[#1f212d] pt-4"
          >
            <button
              type="button"
              onClick={() => setPage((current) => Math.max(1, current - 1))}
              disabled={page === 1 || loading}
              className="inline-flex min-h-9 items-center gap-2 rounded-lg border border-[#2b2e3b] px-3 text-xs text-slate-300 disabled:opacity-40"
            >
              <ChevronLeft className="size-4" aria-hidden="true" />
              Previous
            </button>
            <span className="text-xs text-slate-500">Page {page}</span>
            <button
              type="button"
              onClick={() => setPage((current) => current + 1)}
              disabled={!users.hasMore || loading}
              className="inline-flex min-h-9 items-center gap-2 rounded-lg border border-[#2b2e3b] px-3 text-xs text-slate-300 disabled:opacity-40"
            >
              Next
              <ChevronRight className="size-4" aria-hidden="true" />
            </button>
          </nav>
        )}
      </section>
    </section>
  );
}

function AccountStat({ label, value }: { label: string; value: string | number }) {
  return (
    <article className="rounded-xl border border-[#1f212d] bg-[#12131a] p-4">
      <p className="text-xs font-medium text-slate-400">{label}</p>
      <p className="mt-2 text-2xl font-semibold text-white">{value}</p>
    </article>
  );
}

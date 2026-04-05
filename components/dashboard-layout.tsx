"use client";

import { AnimatePresence, motion } from "framer-motion";
import {
  Bell,
  BriefcaseBusiness,
  CalendarDays,
  CheckCircle2,
  ChevronLeft,
  ChevronRight,
  Inbox,
  Layers3,
  LogOut,
  MoreHorizontal,
  PencilLine,
  Plus,
  Send,
  Sparkles,
  Trash2
} from "lucide-react";
import Link from "next/link";
import React, { useMemo, useState, useTransition } from "react";
import { usePathname, useRouter } from "next/navigation";
import { type CSSProperties } from "react";

type FolderSummary = {
  _id: string;
  color: string;
  name: string;
};

type NotificationItemData = {
  createdAt: string;
  id: string;
  notes?: string;
  senderEmail?: string;
  senderName?: string;
  status: "accepted" | "pending" | "rejected";
  title: string;
  type: "TASK_PROPOSAL";
};

type DashboardLayoutProps = {
  children: React.ReactNode;
  initialFolders: FolderSummary[];
  initialNotifications: NotificationItemData[];
  user: {
    email: string;
    name: string;
    role?: "admin" | "user";
  };
};

export function DashboardLayout({
  children,
  initialFolders,
  initialNotifications,
  user
}: DashboardLayoutProps) {
  const pathname = usePathname();
  const router = useRouter();
  const [isSidebarCollapsed, setIsSidebarCollapsed] = useState(false);
  const [folders, setFolders] = useState<FolderSummary[]>(initialFolders);
  const [notifications, setNotifications] =
    useState<NotificationItemData[]>(initialNotifications);
  const [showNotifications, setShowNotifications] = useState(false);
  const [isFolderModalOpen, setIsFolderModalOpen] = useState(false);
  const [isAssignModalOpen, setIsAssignModalOpen] = useState(false);
  const [openFolderMenuId, setOpenFolderMenuId] = useState<string | null>(null);
  const [editingFolder, setEditingFolder] = useState<FolderSummary | null>(null);
  const [newFolderName, setNewFolderName] = useState("");
  const [newFolderColor, setNewFolderColor] = useState("#FF7A59");
  const [proposalEmail, setProposalEmail] = useState("");
  const [proposalTitle, setProposalTitle] = useState("");
  const [proposalNotes, setProposalNotes] = useState("");
  const [assignError, setAssignError] = useState<string | null>(null);
  const [isPending, startTransition] = useTransition();
  const sidebarWidth = isSidebarCollapsed ? 94 : 314;

  const pendingCount = useMemo(
    () => notifications.filter((item) => item.status === "pending").length,
    [notifications]
  );
  const isProposalInvalid =
    proposalEmail.trim().length === 0 || proposalTitle.trim().length === 0;

  const handleCreateFolder = async (event: React.FormEvent<HTMLFormElement>) => {
    event.preventDefault();

    if (!newFolderName.trim()) {
      return;
    }

    const response = await fetch("/api/folders", {
      body: JSON.stringify({
        color: newFolderColor,
        name: newFolderName.trim()
      }),
      headers: {
        "Content-Type": "application/json"
      },
      method: "POST"
    });

    if (!response.ok) {
      return;
    }

    const folder = (await response.json()) as FolderSummary;
    setFolders((current) => [...current, folder]);
    setNewFolderName("");
    setNewFolderColor("#FF7A59");
    setIsFolderModalOpen(false);
    startTransition(() => router.refresh());
  };

  const handleUpdateFolder = async (event: React.FormEvent<HTMLFormElement>) => {
    event.preventDefault();

    if (!editingFolder || !newFolderName.trim()) {
      return;
    }

    const response = await fetch("/api/folders", {
      body: JSON.stringify({
        color: newFolderColor,
        folderId: editingFolder._id,
        name: newFolderName.trim()
      }),
      headers: {
        "Content-Type": "application/json"
      },
      method: "PATCH"
    });

    if (!response.ok) {
      return;
    }

    const updatedFolder = (await response.json()) as FolderSummary;
    setFolders((current) =>
      current.map((folder) =>
        folder._id === updatedFolder._id ? updatedFolder : folder
      )
    );
    setEditingFolder(null);
    setNewFolderName("");
    setNewFolderColor("#FF7A59");
    setIsFolderModalOpen(false);
    startTransition(() => router.refresh());
  };

  const openCreateFolderModal = () => {
    setEditingFolder(null);
    setNewFolderName("");
    setNewFolderColor("#FF7A59");
    setIsFolderModalOpen(true);
  };

  const openRenameFolderModal = (folder: FolderSummary) => {
    setEditingFolder(folder);
    setNewFolderName(folder.name);
    setNewFolderColor(folder.color);
    setOpenFolderMenuId(null);
    setIsFolderModalOpen(true);
  };

  const handleDeleteFolder = async (folder: FolderSummary) => {
    const response = await fetch("/api/folders", {
      body: JSON.stringify({ folderId: folder._id }),
      headers: {
        "Content-Type": "application/json"
      },
      method: "DELETE"
    });

    if (!response.ok) {
      return;
    }

    setFolders((current) =>
      current.filter((currentFolder) => currentFolder._id !== folder._id)
    );
    setOpenFolderMenuId(null);

    if (pathname === `/folder/${folder._id}`) {
      router.push("/");
    }

    startTransition(() => router.refresh());
  };

  const handleSendProposal = async (event: React.FormEvent<HTMLFormElement>) => {
    event.preventDefault();

    setAssignError(null);

    const response = await fetch("/api/proposals", {
      body: JSON.stringify({
        notes: proposalNotes,
        targetUserEmail: proposalEmail.trim(),
        title: proposalTitle.trim()
      }),
      headers: {
        "Content-Type": "application/json"
      },
      method: "POST"
    });

    if (!response.ok) {
      const payload = (await response.json()) as { error?: string };
      setAssignError(payload.error ?? "Failed to assign task");
      return;
    }

    setProposalEmail("");
    setProposalTitle("");
    setProposalNotes("");
    setIsAssignModalOpen(false);
  };

  const handleLogout = async () => {
    await fetch("/api/auth/logout", { method: "POST" });
    router.push("/login");
    router.refresh();
  };

  const navItems = [
    {
      active: pathname === "/",
      href: "/",
      icon: <Inbox className="h-4 w-4" />,
      label: "My Desk"
    },
    {
      active: pathname === "/assigned",
      href: "/assigned",
      icon: <BriefcaseBusiness className="h-4 w-4" />,
      label: "Assigned"
    },
    {
      active: pathname === "/today",
      href: "/today",
      icon: <CalendarDays className="h-4 w-4" />,
      label: "Today"
    },
    {
      active: pathname === "/completed",
      href: "/completed",
      icon: <CheckCircle2 className="h-4 w-4" />,
      label: "Completed"
    }
  ];

  return (
    <div
      className="min-h-screen bg-[var(--surface-canvas)] text-[var(--text-primary)]"
      style={{ "--sidebar-width": `${sidebarWidth}px` } as CSSProperties}
    >
      <div className="pointer-events-none fixed inset-0 overflow-hidden">
        <div className="absolute left-[-12rem] top-[-8rem] h-[30rem] w-[30rem] rounded-full bg-[radial-gradient(circle,_rgba(255,122,89,0.28),_transparent_68%)] blur-3xl" />
        <div className="absolute right-[-10rem] top-[12rem] h-[28rem] w-[28rem] rounded-full bg-[radial-gradient(circle,_rgba(0,205,178,0.18),_transparent_70%)] blur-3xl" />
        <div className="absolute bottom-[-14rem] left-[28%] h-[32rem] w-[32rem] rounded-full bg-[radial-gradient(circle,_rgba(255,214,102,0.14),_transparent_72%)] blur-3xl" />
      </div>

      <div className="relative z-10 min-h-screen lg:pl-[var(--sidebar-width)]">
        <motion.aside
          animate={{ width: isSidebarCollapsed ? 94 : 314 }}
          className={`hidden border-r border-white/8 bg-[rgba(8,11,20,0.82)] py-5 backdrop-blur-2xl lg:fixed lg:inset-y-0 lg:left-0 lg:z-40 lg:flex lg:h-screen lg:flex-col lg:overflow-hidden ${
            isSidebarCollapsed ? "px-3" : "px-4"
          }`}
          initial={false}
        >
          <div
            className={`flex ${
              isSidebarCollapsed
                ? "flex-col items-center gap-3"
                : "items-center justify-between"
            }`}
          >
            <div
              className={`flex overflow-hidden ${
                isSidebarCollapsed ? "justify-center" : "items-center gap-3"
              }`}
            >
              <div className="flex h-14 w-14 shrink-0 items-center justify-center rounded-[1.7rem] border border-white/10 bg-[linear-gradient(135deg,#FF7A59_0%,#FFC145_100%)] text-slate-950 shadow-[0_16px_30px_rgba(255,122,89,0.24)]">
                <Layers3 className="h-5 w-5" />
              </div>
              {!isSidebarCollapsed && (
                <div>
                  <p className="text-[11px] font-semibold uppercase tracking-[0.28em] text-[var(--text-muted)]">
                    Mission Control
                  </p>
                  <h1 className="text-lg font-semibold tracking-tight text-white">
                    Orbit Taskflow
                  </h1>
                </div>
              )}
            </div>

            <button
              aria-label="Toggle sidebar"
              className="flex h-9 w-9 items-center justify-center rounded-2xl border border-white/10 bg-white/5 text-[var(--text-secondary)] transition hover:border-white/20 hover:text-white"
              onClick={() => setIsSidebarCollapsed((current) => !current)}
              type="button"
            >
              {isSidebarCollapsed ? (
                <ChevronRight className="h-4 w-4" />
              ) : (
                <ChevronLeft className="h-4 w-4" />
              )}
            </button>
          </div>

          {!isSidebarCollapsed && (
            <div className="mt-8 rounded-[2rem] border border-white/10 bg-[linear-gradient(180deg,rgba(255,255,255,0.08),rgba(255,255,255,0.02))] p-5 shadow-[0_20px_60px_rgba(0,0,0,0.24)]">
              <div className="flex items-center justify-between">
                <span className="rounded-full border border-white/10 bg-white/6 px-3 py-1 text-[10px] font-semibold uppercase tracking-[0.22em] text-[var(--text-muted)]">
                  {user.role === "admin" ? "Admin Deck" : "Personal HQ"}
                </span>
                <Sparkles className="h-4 w-4 text-[var(--brand-secondary)]" />
              </div>
              <h2 className="mt-4 text-xl font-semibold tracking-tight text-white">
                {user.role === "admin"
                  ? "Assign work, watch progress, and keep delivery crisp."
                  : "Own your work, accept assignments, and keep your flow organized."}
              </h2>
            </div>
          )}

          <nav
            className={`mt-8 space-y-2 ${
              isSidebarCollapsed ? "flex flex-col items-center" : ""
            }`}
          >
            {navItems.map((item) => (
              <NavItem
                active={item.active}
                collapsed={isSidebarCollapsed}
                href={item.href}
                icon={item.icon}
                key={item.href}
                label={item.label}
              />
            ))}
          </nav>

          <div
            className={`mt-8 flex px-2 ${
              isSidebarCollapsed
                ? "justify-center"
                : "items-center justify-between"
            }`}
          >
            {!isSidebarCollapsed && (
              <span className="text-[10px] font-semibold uppercase tracking-[0.24em] text-[var(--text-muted)]">
                Collections
              </span>
            )}
            <button
              className="flex h-9 w-9 items-center justify-center rounded-2xl border border-white/10 bg-white/5 text-[var(--text-secondary)] transition hover:border-white/20 hover:text-white"
              onClick={openCreateFolderModal}
              type="button"
            >
              <Plus className="h-4 w-4" />
            </button>
          </div>

          <div
            className={`mt-4 flex-1 space-y-2 overflow-y-auto scrollbar-hide ${
              isSidebarCollapsed ? "flex flex-col items-center pr-0" : "pr-1"
            }`}
          >
            {folders.map((folder) => (
              <FolderNavItem
                collapsed={isSidebarCollapsed}
                folder={folder}
                href={`/folder/${folder._id}`}
                key={folder._id}
                menuOpen={openFolderMenuId === folder._id}
                onDelete={() => void handleDeleteFolder(folder)}
                onOpenMenu={() =>
                  setOpenFolderMenuId((current) =>
                    current === folder._id ? null : folder._id
                  )
                }
                onRename={() => openRenameFolderModal(folder)}
              />
            ))}
          </div>

          <div
            className={`mt-6 rounded-[2rem] border border-white/10 bg-white/5 ${
              isSidebarCollapsed ? "p-3" : "p-4"
            }`}
          >
            <div
              className={`flex ${
                isSidebarCollapsed ? "justify-center" : "items-center gap-3"
              }`}
            >
              <div className="flex h-11 w-11 items-center justify-center rounded-[1.25rem] bg-[linear-gradient(135deg,#00CDB2_0%,#7CFFCB_100%)] text-slate-950">
                {user.name.slice(0, 1).toUpperCase()}
              </div>
              {!isSidebarCollapsed && (
                <div className="min-w-0 flex-1">
                  <p className="truncate text-sm font-semibold text-white">
                    {user.name}
                  </p>
                  <p className="truncate text-xs text-[var(--text-secondary)]">
                    {user.email}
                  </p>
                </div>
              )}
              {!isSidebarCollapsed && (
                <button
                  className="flex h-10 w-10 items-center justify-center rounded-2xl border border-white/10 bg-white/5 text-[var(--text-secondary)] transition hover:border-white/20 hover:text-white"
                  onClick={handleLogout}
                  type="button"
                >
                  <LogOut className="h-4 w-4" />
                </button>
              )}
            </div>
          </div>
        </motion.aside>

        <main className="flex min-h-screen flex-col">
          <header className="sticky top-0 z-30 border-b border-white/8 bg-[rgba(6,10,18,0.68)] px-4 py-4 backdrop-blur-2xl sm:px-6 lg:px-8">
            <div className="flex flex-wrap items-center justify-between gap-4">
              <div>
                <p className="text-[11px] font-semibold uppercase tracking-[0.28em] text-[var(--text-muted)]">
                  Premium Task Operating System
                </p>
                <h2 className="mt-1 text-2xl font-semibold tracking-tight text-white">
                  {pathname === "/assigned"
                    ? "Accepted admin tasks"
                    : pathname === "/completed"
                      ? "Completed work archive"
                      : pathname === "/today"
                        ? "Today&apos;s focus ritual"
                        : "Your personal workspace"}
                </h2>
              </div>

              <div className="flex flex-wrap items-center gap-3">
                {user.role === "admin" && (
                  <button
                    className="flex items-center gap-2 rounded-full border border-white/10 bg-[linear-gradient(135deg,#FF7A59_0%,#FFC145_100%)] px-5 py-3 text-sm font-semibold text-slate-950 shadow-[0_18px_35px_rgba(255,122,89,0.22)] transition hover:scale-[1.02]"
                    onClick={() => setIsAssignModalOpen(true)}
                    type="button"
                  >
                    <Send className="h-4 w-4" />
                    Assign Task
                  </button>
                )}

                <button
                  className="relative flex h-12 w-12 items-center justify-center rounded-full border border-white/10 bg-white/5 text-[var(--text-secondary)] transition hover:border-white/20 hover:text-white"
                  onClick={() => setShowNotifications((current) => !current)}
                  type="button"
                >
                  <Bell className="h-5 w-5" />
                  {pendingCount > 0 && (
                    <span className="absolute right-2 top-2 h-2.5 w-2.5 rounded-full bg-[var(--brand-primary)] ring-4 ring-[var(--surface-canvas)]" />
                  )}
                </button>
              </div>
            </div>
          </header>

          <div className="flex-1 px-4 py-6 sm:px-6 lg:px-8">
            <div className="mx-auto max-w-7xl">{children}</div>
          </div>
        </main>

        <AnimatePresence>
          {showNotifications && (
            <motion.div
              animate={{ opacity: 1, x: 0 }}
              className="fixed inset-y-4 right-4 z-[80] w-[min(92vw,26rem)] rounded-[2rem] border border-white/10 bg-[rgba(8,11,20,0.92)] p-5 shadow-[0_24px_90px_rgba(0,0,0,0.45)] backdrop-blur-3xl"
              exit={{ opacity: 0, x: 20 }}
              initial={{ opacity: 0, x: 20 }}
            >
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-[11px] font-semibold uppercase tracking-[0.24em] text-[var(--text-muted)]">
                    Notifications
                  </p>
                  <h3 className="mt-1 text-xl font-semibold text-white">
                    Inbox and approvals
                  </h3>
                </div>
                <button
                  className="rounded-full border border-white/10 px-3 py-1 text-xs text-[var(--text-secondary)] transition hover:border-white/20 hover:text-white"
                  onClick={() => setShowNotifications(false)}
                  type="button"
                >
                  Close
                </button>
              </div>

              <div className="mt-5 space-y-3 overflow-y-auto pr-1 scrollbar-hide">
                {notifications.length === 0 ? (
                  <div className="rounded-[1.75rem] border border-dashed border-white/10 bg-white/4 px-6 py-12 text-center">
                    <p className="text-sm font-medium text-white">
                      No notifications yet
                    </p>
                    <p className="mt-2 text-sm leading-6 text-[var(--text-secondary)]">
                      Admin assignments and approval requests will appear here.
                    </p>
                  </div>
                ) : (
                  notifications.map((notification) => (
                    <NotificationCard
                      item={notification}
                      key={notification.id}
                      onHandled={(nextStatus) => {
                        setNotifications((current) =>
                          current.map((entry) =>
                            entry.id === notification.id
                              ? { ...entry, status: nextStatus }
                              : entry
                          )
                        );
                        startTransition(() => router.refresh());
                      }}
                    />
                  ))
                )}
              </div>
            </motion.div>
          )}
        </AnimatePresence>
      </div>

      <AnimatePresence>
        {isFolderModalOpen && (
          <ModalFrame
            onClose={() => {
              setIsFolderModalOpen(false);
              setEditingFolder(null);
            }}
            title={editingFolder ? "Rename collection" : "Create a collection"}
            subtitle={
              editingFolder
                ? "Rename the folder or change its accent color."
                : "Turn your personal workspace into themed lanes, similar to boards and spaces in the best task apps."
            }
          >
            <form
              className="space-y-5"
              onSubmit={editingFolder ? handleUpdateFolder : handleCreateFolder}
            >
              <label className="block">
                <span className="mb-2 block text-[11px] font-semibold uppercase tracking-[0.22em] text-[var(--text-muted)]">
                  Folder name
                </span>
                <input
                  autoFocus
                  className="w-full rounded-[1.4rem] border border-white/10 bg-white/5 px-5 py-4 text-white outline-none transition placeholder:text-[var(--text-muted)] focus:border-[var(--brand-secondary)]"
                  onChange={(event) => setNewFolderName(event.target.value)}
                  placeholder="Client delivery, deep work, personal backlog"
                  value={newFolderName}
                />
              </label>

              <div>
                <span className="mb-3 block text-[11px] font-semibold uppercase tracking-[0.22em] text-[var(--text-muted)]">
                  Accent color
                </span>
                <div className="flex flex-wrap gap-3">
                  {["#FF7A59", "#00CDB2", "#FFC145", "#70A5FF", "#F45D7A", "#8EFFA8"].map(
                    (color) => (
                      <button
                        className={`h-10 w-10 rounded-full border-2 transition ${
                          newFolderColor === color
                            ? "scale-110 border-white"
                            : "border-transparent opacity-60 hover:opacity-100"
                        }`}
                        key={color}
                        onClick={() => setNewFolderColor(color)}
                        style={{ backgroundColor: color }}
                        type="button"
                      />
                    )
                  )}
                </div>
              </div>

              <div className="flex justify-end gap-3">
                <button
                  className="rounded-full border border-white/10 px-5 py-3 text-sm font-medium text-[var(--text-secondary)] transition hover:border-white/20 hover:text-white"
                  onClick={() => {
                    setIsFolderModalOpen(false);
                    setEditingFolder(null);
                  }}
                  type="button"
                >
                  Cancel
                </button>
                <button
                  className="rounded-full bg-[linear-gradient(135deg,#00CDB2_0%,#7CFFCB_100%)] px-5 py-3 text-sm font-semibold text-slate-950 transition hover:scale-[1.02]"
                  type="submit"
                >
                  {editingFolder ? "Save folder" : "Create folder"}
                </button>
              </div>
            </form>
          </ModalFrame>
        )}
      </AnimatePresence>

      <AnimatePresence>
        {isAssignModalOpen && (
          <ModalFrame
            onClose={() => setIsAssignModalOpen(false)}
            title="Assign a task"
            subtitle="Send a polished proposal. The user will receive it as a notification and the task appears in Assigned only after acceptance."
          >
            <form className="space-y-5" onSubmit={handleSendProposal}>
              <label className="block">
                <span className="mb-2 block text-[11px] font-semibold uppercase tracking-[0.22em] text-[var(--text-muted)]">
                  User email
                </span>
                <input
                  autoFocus
                  className="w-full rounded-[1.4rem] border border-white/10 bg-white/5 px-5 py-4 text-white outline-none transition placeholder:text-[var(--text-muted)] focus:border-[var(--brand-primary)]"
                  onChange={(event) => setProposalEmail(event.target.value)}
                  placeholder="member@workspace.com"
                  type="email"
                  value={proposalEmail}
                />
              </label>

              <label className="block">
                <span className="mb-2 block text-[11px] font-semibold uppercase tracking-[0.22em] text-[var(--text-muted)]">
                  Task title
                </span>
                <input
                  className="w-full rounded-[1.4rem] border border-white/10 bg-white/5 px-5 py-4 text-white outline-none transition placeholder:text-[var(--text-muted)] focus:border-[var(--brand-primary)]"
                  onChange={(event) => setProposalTitle(event.target.value)}
                  placeholder="Ship onboarding polish pass"
                  value={proposalTitle}
                />
              </label>

              <label className="block">
                <span className="mb-2 block text-[11px] font-semibold uppercase tracking-[0.22em] text-[var(--text-muted)]">
                  Notes
                </span>
                <textarea
                  className="min-h-32 w-full rounded-[1.4rem] border border-white/10 bg-white/5 px-5 py-4 text-white outline-none transition placeholder:text-[var(--text-muted)] focus:border-[var(--brand-primary)]"
                  onChange={(event) => setProposalNotes(event.target.value)}
                  placeholder="Include context, deadline, or handoff notes."
                  value={proposalNotes}
                />
              </label>

              {assignError && (
                <p className="rounded-[1.2rem] border border-rose-500/20 bg-rose-500/10 px-4 py-3 text-sm text-rose-200">
                  {assignError}
                </p>
              )}

              <div className="flex justify-end gap-3">
                <button
                  className="rounded-full border border-white/10 px-5 py-3 text-sm font-medium text-[var(--text-secondary)] transition hover:border-white/20 hover:text-white"
                  onClick={() => setIsAssignModalOpen(false)}
                  type="button"
                >
                  Cancel
                </button>
                <button
                  className="rounded-full bg-[linear-gradient(135deg,#FF7A59_0%,#FFC145_100%)] px-5 py-3 text-sm font-semibold text-slate-950 transition hover:scale-[1.02] disabled:cursor-not-allowed disabled:opacity-60"
                  disabled={isPending || isProposalInvalid}
                  type="submit"
                >
                  Send proposal
                </button>
              </div>
            </form>
          </ModalFrame>
        )}
      </AnimatePresence>
    </div>
  );
}

function NavItem({
  active,
  collapsed,
  href,
  icon,
  label
}: {
  active?: boolean;
  collapsed: boolean;
  href: string;
  icon: React.ReactNode;
  label: string;
}) {
  if (collapsed) {
    return (
      <Link
        aria-label={label}
        className={`flex h-14 w-14 items-center justify-center rounded-[1.6rem] border transition ${
          active
            ? "border-white/14 bg-white/10 text-white shadow-[inset_0_1px_0_rgba(255,255,255,0.08)]"
            : "border-transparent text-[var(--text-secondary)] hover:border-white/10 hover:bg-white/6 hover:text-white"
        }`}
        href={href}
        title={label}
      >
        <span className="flex h-10 w-10 items-center justify-center rounded-2xl bg-black/20">
          {icon}
        </span>
      </Link>
    );
  }

  return (
    <Link
      className={`group flex items-center gap-3 rounded-[1.35rem] border px-3 py-3 text-sm font-medium transition ${
        active
          ? "border-white/14 bg-white/10 text-white shadow-[inset_0_1px_0_rgba(255,255,255,0.08)]"
          : "border-transparent text-[var(--text-secondary)] hover:border-white/10 hover:bg-white/6 hover:text-white"
      }`}
      href={href}
    >
      <span className="flex h-9 w-9 items-center justify-center rounded-2xl bg-black/20">
        {icon}
      </span>
      {!collapsed && <span className="truncate">{label}</span>}
    </Link>
  );
}

function FolderNavItem({
  collapsed,
  folder,
  href,
  menuOpen,
  onDelete,
  onOpenMenu,
  onRename
}: {
  collapsed: boolean;
  folder: FolderSummary;
  href: string;
  menuOpen: boolean;
  onDelete: () => void;
  onOpenMenu: () => void;
  onRename: () => void;
}) {
  if (collapsed) {
    return (
      <Link
        aria-label={folder.name}
        className="flex h-14 w-14 items-center justify-center rounded-[1.6rem] border border-transparent text-[var(--text-secondary)] transition hover:border-white/10 hover:bg-white/6 hover:text-white"
        href={href}
        title={folder.name}
      >
        <span className="flex h-10 w-10 items-center justify-center rounded-2xl bg-black/20">
          <span
            className="h-3 w-3 rounded-full"
            style={{ backgroundColor: folder.color }}
          />
        </span>
      </Link>
    );
  }

  return (
    <div className="relative">
      <div className="group flex items-center gap-2 rounded-[1.35rem] border border-transparent px-2 py-1 transition hover:border-white/10 hover:bg-white/6">
        <Link
          className="flex min-w-0 flex-1 items-center gap-3 rounded-[1.1rem] px-1 py-2 text-sm font-medium text-[var(--text-secondary)] transition hover:text-white"
          href={href}
        >
          <span className="flex h-9 w-9 items-center justify-center rounded-2xl bg-black/20">
            <span
              className="h-2.5 w-2.5 rounded-full"
              style={{ backgroundColor: folder.color }}
            />
          </span>
          <span className="truncate">{folder.name}</span>
        </Link>

        <button
          className="flex h-9 w-9 items-center justify-center rounded-2xl border border-white/10 bg-white/5 text-[var(--text-secondary)] opacity-0 transition hover:border-white/20 hover:text-white group-hover:opacity-100"
          onClick={onOpenMenu}
          type="button"
        >
          <MoreHorizontal className="h-4 w-4" />
        </button>
      </div>

      {menuOpen && (
        <div className="absolute right-2 top-12 z-20 w-40 rounded-[1.25rem] border border-white/10 bg-[rgba(10,14,24,0.96)] p-2 shadow-[0_20px_50px_rgba(0,0,0,0.35)] backdrop-blur-2xl">
          <button
            className="flex w-full items-center gap-2 rounded-xl px-3 py-2 text-sm text-[var(--text-secondary)] transition hover:bg-white/6 hover:text-white"
            onClick={onRename}
            type="button"
          >
            <PencilLine className="h-4 w-4" />
            Rename
          </button>
          <button
            className="flex w-full items-center gap-2 rounded-xl px-3 py-2 text-sm text-rose-200 transition hover:bg-rose-500/10"
            onClick={onDelete}
            type="button"
          >
            <Trash2 className="h-4 w-4" />
            Delete
          </button>
        </div>
      )}
    </div>
  );
}

function NotificationCard({
  item,
  onHandled
}: {
  item: NotificationItemData;
  onHandled: (status: NotificationItemData["status"]) => void;
}) {
  const [isSubmitting, startTransition] = useTransition();

  const respond = async (action: "accepted" | "rejected") => {
    const response = await fetch("/api/notifications", {
      body: JSON.stringify({
        action,
        proposalId: item.id
      }),
      headers: {
        "Content-Type": "application/json"
      },
      method: "POST"
    });

    if (!response.ok) {
      return;
    }

    startTransition(() => onHandled(action));
  };

  return (
    <div className="rounded-[1.6rem] border border-white/10 bg-white/5 p-4">
      <div className="flex items-start justify-between gap-3">
        <div>
          <span className="rounded-full border border-white/10 bg-black/15 px-2.5 py-1 text-[10px] font-semibold uppercase tracking-[0.22em] text-[var(--text-muted)]">
            Proposal
          </span>
          <h4 className="mt-3 text-base font-semibold text-white">{item.title}</h4>
          <p className="mt-2 text-sm leading-6 text-[var(--text-secondary)]">
            {item.notes || "No extra notes were included."}
          </p>
        </div>
        <span
          className={`rounded-full px-3 py-1 text-[10px] font-semibold uppercase tracking-[0.18em] ${
            item.status === "accepted"
              ? "bg-emerald-400/14 text-emerald-200"
              : item.status === "rejected"
                ? "bg-rose-400/14 text-rose-200"
                : "bg-[var(--brand-secondary)]/14 text-[var(--brand-secondary)]"
          }`}
        >
          {item.status}
        </span>
      </div>

      {(item.senderName || item.senderEmail) && (
        <p className="mt-3 text-xs uppercase tracking-[0.18em] text-[var(--text-muted)]">
          From {item.senderName || item.senderEmail}
        </p>
      )}

      {item.status === "pending" && (
        <div className="mt-4 flex gap-3">
          <button
            className="flex-1 rounded-full bg-[linear-gradient(135deg,#00CDB2_0%,#7CFFCB_100%)] px-4 py-3 text-sm font-semibold text-slate-950 transition hover:scale-[1.01] disabled:cursor-not-allowed disabled:opacity-60"
            disabled={isSubmitting}
            onClick={() => void respond("accepted")}
            type="button"
          >
            Accept
          </button>
          <button
            className="flex-1 rounded-full border border-white/10 px-4 py-3 text-sm font-medium text-[var(--text-secondary)] transition hover:border-white/20 hover:text-white disabled:cursor-not-allowed disabled:opacity-60"
            disabled={isSubmitting}
            onClick={() => void respond("rejected")}
            type="button"
          >
            Decline
          </button>
        </div>
      )}
    </div>
  );
}

function ModalFrame({
  children,
  onClose,
  subtitle,
  title
}: {
  children: React.ReactNode;
  onClose: () => void;
  subtitle: string;
  title: string;
}) {
  return (
    <div className="fixed inset-0 z-[100] flex items-center justify-center p-4">
      <motion.button
        animate={{ opacity: 1 }}
        className="absolute inset-0 bg-[rgba(3,6,14,0.76)] backdrop-blur-sm"
        initial={{ opacity: 0 }}
        onClick={onClose}
        type="button"
      />
      <motion.div
        animate={{ opacity: 1, scale: 1, y: 0 }}
        className="relative w-full max-w-xl rounded-[2.2rem] border border-white/10 bg-[linear-gradient(180deg,rgba(18,23,36,0.98),rgba(9,12,21,0.98))] p-6 shadow-[0_40px_120px_rgba(0,0,0,0.5)] sm:p-8"
        exit={{ opacity: 0, scale: 0.96, y: 12 }}
        initial={{ opacity: 0, scale: 0.96, y: 12 }}
      >
        <div className="absolute right-0 top-0 h-40 w-40 rounded-full bg-[radial-gradient(circle,_rgba(255,122,89,0.22),_transparent_68%)] blur-3xl" />
        <div className="relative">
          <span className="rounded-full border border-white/10 bg-white/6 px-3 py-1 text-[10px] font-semibold uppercase tracking-[0.24em] text-[var(--text-muted)]">
            Workspace action
          </span>
          <h3 className="mt-4 text-2xl font-semibold tracking-tight text-white">
            {title}
          </h3>
          <p className="mt-3 text-sm leading-6 text-[var(--text-secondary)]">
            {subtitle}
          </p>
          <div className="mt-8">{children}</div>
        </div>
      </motion.div>
    </div>
  );
}

"use client";

import { AnimatePresence, motion } from "framer-motion";
import {
  Folder as FolderIcon,
  Inbox,
  PencilLine,
  Sparkles,
  Trash2,
  X
} from "lucide-react";
import { useState } from "react";

type TaskModalProps = {
  folders: { _id: string; color: string; name: string }[];
  initialData?: { folderId?: string; notes: string; title: string };
  isOpen: boolean;
  onClose: () => void;
  onDelete?: () => void;
  onSave: (task: { folderId?: string; notes: string; title: string }) => void;
};

export function TaskModal({
  folders,
  initialData,
  isOpen,
  onClose,
  onDelete,
  onSave
}: TaskModalProps) {
  const [title, setTitle] = useState(initialData?.title ?? "");
  const [notes, setNotes] = useState(initialData?.notes ?? "");
  const [folderId, setFolderId] = useState(initialData?.folderId ?? "");
  const isSaveDisabled = title.trim().length === 0;

  if (!isOpen) {
    return null;
  }

  return (
    <AnimatePresence>
      <div className="fixed inset-0 z-[100] flex items-start justify-center overflow-y-auto p-4 sm:p-6">
        <motion.button
          animate={{ opacity: 1 }}
          className="absolute inset-0 bg-[rgba(4,7,14,0.72)] backdrop-blur-md"
          initial={{ opacity: 0 }}
          onClick={onClose}
          type="button"
        />

        <motion.div
          animate={{ opacity: 1, scale: 1, y: 0 }}
          className="relative my-4 flex max-h-[calc(100vh-2rem)] w-full max-w-5xl flex-col overflow-hidden rounded-[2.4rem] border border-white/10 bg-[linear-gradient(180deg,rgba(15,20,33,0.98),rgba(7,9,16,0.98))] shadow-[0_40px_120px_rgba(0,0,0,0.45)] sm:my-6"
          exit={{ opacity: 0, scale: 0.96, y: 14 }}
          initial={{ opacity: 0, scale: 0.96, y: 14 }}
        >
          <div className="absolute -right-16 top-0 h-48 w-48 rounded-full bg-[radial-gradient(circle,_rgba(255,122,89,0.28),_transparent_70%)] blur-3xl" />
          <div className="absolute -bottom-24 left-0 h-52 w-52 rounded-full bg-[radial-gradient(circle,_rgba(0,205,178,0.2),_transparent_70%)] blur-3xl" />

          <div className="relative flex min-h-0 flex-1 flex-col">
            <div className="shrink-0 p-6 sm:p-8">
              <div className="flex items-start justify-between gap-4">
                <div>
                  <span className="inline-flex items-center gap-2 rounded-full border border-white/10 bg-white/6 px-3 py-1 text-[10px] font-semibold uppercase tracking-[0.24em] text-[var(--text-muted)]">
                    <Sparkles className="h-3.5 w-3.5" />
                    Quick capture
                  </span>
                  <h2 className="mt-4 text-3xl font-semibold tracking-tight text-white">
                    {initialData ? "Refine task details" : "Create a premium task card"}
                  </h2>
                  <p className="mt-3 max-w-xl text-sm leading-6 text-[var(--text-secondary)]">
                    Capture work fast like Todoist, keep context rich like Notion, and
                    make the card feel deliberate instead of disposable.
                  </p>
                </div>

                <button
                  className="flex h-11 w-11 items-center justify-center rounded-full border border-white/10 bg-white/5 text-[var(--text-secondary)] transition hover:border-white/20 hover:text-white"
                  onClick={onClose}
                  type="button"
                >
                  <X className="h-4 w-4" />
                </button>
              </div>
            </div>

            <div className="min-h-0 flex-1 overflow-y-auto px-6 pb-6 sm:px-8 sm:pb-8">
              <div className="grid gap-6 lg:grid-cols-[1.2fr_0.85fr]">
                <div>
                  <div className="space-y-5">
                    <label className="block">
                      <span className="mb-2 block text-[11px] font-semibold uppercase tracking-[0.22em] text-[var(--text-muted)]">
                        Task title
                      </span>
                      <input
                        autoFocus
                        className="w-full rounded-[1.5rem] border border-white/10 bg-white/5 px-5 py-4 text-lg font-medium text-white outline-none transition placeholder:text-[var(--text-muted)] focus:border-[var(--brand-primary)]"
                        onChange={(event) => setTitle(event.target.value)}
                        placeholder="Launch client review notes"
                        value={title}
                      />
                    </label>

                    <label className="block">
                      <span className="mb-2 block text-[11px] font-semibold uppercase tracking-[0.22em] text-[var(--text-muted)]">
                        Notes and context
                      </span>
                      <textarea
                        className="min-h-[18rem] max-h-[50vh] w-full resize-y overflow-y-auto rounded-[1.5rem] border border-white/10 bg-white/5 px-5 py-4 text-sm leading-7 text-white outline-none transition placeholder:text-[var(--text-muted)] focus:border-[var(--brand-secondary)]"
                        onChange={(event) => setNotes(event.target.value)}
                        placeholder="Write the why, the handoff, checklist, or the exact next step."
                        value={notes}
                      />
                    </label>
                  </div>
                </div>

                <div className="rounded-[1.8rem] border border-white/10 bg-white/5 p-5 lg:max-h-full lg:overflow-y-auto scrollbar-hide">
                  <div className="flex items-center gap-3">
                    <div className="flex h-10 w-10 items-center justify-center rounded-2xl bg-[linear-gradient(135deg,#00CDB2_0%,#7CFFCB_100%)] text-slate-950">
                      <PencilLine className="h-4 w-4" />
                    </div>
                    <div>
                      <p className="text-sm font-semibold text-white">Placement</p>
                      <p className="text-sm text-[var(--text-secondary)]">
                        Choose where this task should live.
                      </p>
                    </div>
                  </div>

                  <div className="mt-5 space-y-2">
                    <button
                      className={`flex w-full items-center justify-between rounded-[1.3rem] border px-4 py-3 text-left text-sm transition ${
                        folderId === ""
                          ? "border-white/16 bg-white/10 text-white"
                          : "border-white/8 bg-black/10 text-[var(--text-secondary)] hover:border-white/14 hover:text-white"
                      }`}
                      onClick={() => setFolderId("")}
                      type="button"
                    >
                      <span className="flex items-center gap-3">
                        <span className="flex h-9 w-9 items-center justify-center rounded-2xl bg-white/8">
                          <Inbox className="h-4 w-4" />
                        </span>
                        Inbox
                      </span>
                      <span className="text-xs uppercase tracking-[0.18em] text-[var(--text-muted)]">
                        Default
                      </span>
                    </button>

                    {folders.map((folder) => (
                      <button
                        className={`flex w-full items-center justify-between rounded-[1.3rem] border px-4 py-3 text-left text-sm transition ${
                          folderId === folder._id
                            ? "border-white/16 bg-white/10 text-white"
                            : "border-white/8 bg-black/10 text-[var(--text-secondary)] hover:border-white/14 hover:text-white"
                        }`}
                        key={folder._id}
                        onClick={() => setFolderId(folder._id)}
                        type="button"
                      >
                        <span className="flex items-center gap-3">
                          <span
                            className="flex h-9 w-9 items-center justify-center rounded-2xl"
                            style={{ backgroundColor: `${folder.color}22`, color: folder.color }}
                          >
                            <FolderIcon className="h-4 w-4" />
                          </span>
                          {folder.name}
                        </span>
                        <span
                          className="h-2.5 w-2.5 rounded-full"
                          style={{ backgroundColor: folder.color }}
                        />
                      </button>
                    ))}
                  </div>

                  <div className="mt-6 rounded-[1.4rem] border border-white/8 bg-black/15 p-4">
                    <p className="text-[11px] font-semibold uppercase tracking-[0.22em] text-[var(--text-muted)]">
                      Modal preview
                    </p>
                    <h3 className="mt-3 text-lg font-semibold text-white">
                      {title || "Your task title will appear here"}
                    </h3>
                    <div className="mt-2 max-h-64 overflow-y-auto pr-1 scrollbar-hide">
                      <p className="whitespace-pre-wrap break-words text-sm leading-6 text-[var(--text-secondary)]">
                        {notes || "Add notes to build richer context for your task card."}
                      </p>
                    </div>
                  </div>
                </div>
              </div>

              <div className="mt-8 flex flex-wrap items-center justify-between gap-3">
                {initialData && onDelete ? (
                  <button
                    className="inline-flex items-center gap-2 rounded-full border border-rose-400/20 bg-rose-400/10 px-4 py-3 text-sm font-semibold text-rose-100 transition hover:bg-rose-400/14"
                    onClick={onDelete}
                    type="button"
                  >
                    <Trash2 className="h-4 w-4" />
                    Delete task
                  </button>
                ) : (
                  <div />
                )}

                <div className="flex flex-wrap gap-3">
                  <button
                    className="rounded-full border border-white/10 px-5 py-3 text-sm font-medium text-[var(--text-secondary)] transition hover:border-white/20 hover:text-white"
                    onClick={onClose}
                    type="button"
                  >
                    Cancel
                  </button>
                  <button
                    className="rounded-full bg-[linear-gradient(135deg,#FF7A59_0%,#FFC145_100%)] px-5 py-3 text-sm font-semibold text-slate-950 transition hover:scale-[1.02] disabled:cursor-not-allowed disabled:opacity-50"
                    disabled={isSaveDisabled}
                    onClick={() =>
                      onSave({
                        folderId,
                        notes,
                        title: title.trim()
                      })
                    }
                    type="button"
                  >
                    {initialData ? "Save changes" : "Create task"}
                  </button>
                </div>
              </div>
            </div>
          </div>
        </motion.div>
      </div>
    </AnimatePresence>
  );
}

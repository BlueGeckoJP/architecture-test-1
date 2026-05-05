"use client";

type WorldStateEditorProps = {
  facts: string;
  updatedAt: string | null;
  saving: boolean;
  onChange: (facts: string) => void;
  onApply: () => void;
  onCancel: () => void;
};

export function WorldStateEditor({
  facts,
  updatedAt,
  saving,
  onChange,
  onApply,
  onCancel,
}: WorldStateEditorProps) {
  return (
    <section className="flex min-h-0 flex-col border-zinc-200 border-r bg-white">
      <div className="border-zinc-200 border-b px-5 py-4">
        <div className="flex items-center justify-between gap-4">
          <div>
            <h1 className="font-semibold text-xl text-zinc-950">World State</h1>
            <p className="mt-1 text-sm text-zinc-500">
              {updatedAt
                ? `Updated ${new Date(updatedAt).toLocaleString()}`
                : "Not loaded"}
            </p>
          </div>
        </div>
      </div>
      <div className="flex min-h-0 flex-1 flex-col gap-4 p-5">
        <textarea
          className="min-h-[320px] flex-1 resize-none rounded-md border border-zinc-300 bg-zinc-50 p-4 font-mono text-sm leading-6 text-zinc-900 outline-none transition focus:border-zinc-900 focus:bg-white"
          value={facts}
          onChange={(event) => onChange(event.target.value)}
          spellCheck={false}
        />
        <div className="flex items-center justify-end gap-2">
          <button
            className="h-10 rounded-md border border-zinc-300 px-4 font-medium text-sm text-zinc-700 transition hover:bg-zinc-100 disabled:opacity-50"
            type="button"
            onClick={onCancel}
            disabled={saving}
          >
            Cancel
          </button>
          <button
            className="h-10 rounded-md bg-zinc-950 px-4 font-medium text-sm text-white transition hover:bg-zinc-800 disabled:opacity-50"
            type="button"
            onClick={onApply}
            disabled={saving}
          >
            {saving ? "Applying" : "Apply"}
          </button>
        </div>
      </div>
    </section>
  );
}

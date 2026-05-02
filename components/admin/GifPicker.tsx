"use client";

import { useEffect, useRef, useState, useTransition } from "react";
import { Loader2, Search, X } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";

interface Result {
  id: string;
  previewUrl: string;
  fullUrl: string;
  description: string;
}

interface Props {
  open: boolean;
  onClose: () => void;
  onPicked: (result: { id: string; url: string }) => void;
  kind: "avatar" | "banner";
}

export function GifPicker({ open, onClose, onPicked, kind }: Props) {
  const [query, setQuery] = useState("");
  const [results, setResults] = useState<Result[]>([]);
  const [error, setError] = useState<string | null>(null);
  const [searching, setSearching] = useState(false);
  const [picking, start] = useTransition();
  const debouncedTimer = useRef<NodeJS.Timeout | null>(null);

  useEffect(() => {
    if (!open) return;
    setResults([]);
    setError(null);
  }, [open]);

  useEffect(() => {
    if (!open) return;
    if (debouncedTimer.current) clearTimeout(debouncedTimer.current);
    debouncedTimer.current = setTimeout(() => doSearch(query), 250);
    return () => {
      if (debouncedTimer.current) clearTimeout(debouncedTimer.current);
    };
  }, [query, open]);

  async function doSearch(q: string) {
    if (!q.trim()) {
      setResults([]);
      setError(null);
      return;
    }
    setSearching(true);
    setError(null);
    try {
      const res = await fetch(`/api/branding/gif?q=${encodeURIComponent(q)}`);
      if (!res.ok) {
        const j = (await res.json().catch(() => ({}))) as { error?: string };
        if (j.error === "giphy_not_configured") {
          setError("GIF search needs a Giphy API key. Set GIPHY_API_KEY in Vercel.");
        } else {
          setError("GIF search is unavailable right now.");
        }
        return;
      }
      const j = (await res.json()) as { results: Result[] };
      setResults(j.results);
    } finally {
      setSearching(false);
    }
  }

  function pick(r: Result) {
    start(async () => {
      const res = await fetch("/api/branding/gif/select", {
        method: "POST",
        headers: { "content-type": "application/json" },
        body: JSON.stringify({ url: r.fullUrl, kind }),
      });
      if (!res.ok) {
        const j = (await res.json().catch(() => ({}))) as { error?: string };
        setError(j.error || "Could not save GIF.");
        return;
      }
      const j = (await res.json()) as { id: string; url: string };
      onPicked({ id: j.id, url: j.url });
      onClose();
    });
  }

  if (!open) return null;

  return (
    <div
      className="fixed inset-0 z-50 flex items-start justify-center bg-ink/50 px-4 py-12 backdrop-blur-sm"
      onClick={onClose}
    >
      <div
        className="flex max-h-[80vh] w-full max-w-2xl flex-col overflow-hidden rounded-xl border border-border bg-bg shadow-[var(--shadow-modal)]"
        onClick={(e) => e.stopPropagation()}
      >
        <div className="flex items-center gap-3 border-b border-border px-4 py-3">
          <Search size={14} className="text-ink-muted" />
          <Input
            autoFocus
            placeholder="Search GIFs (Giphy)…"
            value={query}
            onChange={(e) => setQuery(e.target.value)}
            className="h-8 border-0 bg-transparent shadow-none focus-visible:ring-0"
          />
          <Button type="button" variant="ghost" size="icon-sm" onClick={onClose}>
            <X size={14} />
          </Button>
        </div>
        <div className="min-h-[160px] flex-1 overflow-y-auto p-3">
          {error ? (
            <div className="px-2 py-6 text-center text-[12.5px] text-ink-muted">{error}</div>
          ) : searching ? (
            <div className="flex items-center justify-center py-12 text-ink-muted">
              <Loader2 className="animate-spin" size={16} />
            </div>
          ) : results.length === 0 ? (
            <div className="px-2 py-12 text-center text-[12.5px] text-ink-muted">
              {query.trim() ? "No results." : "Type to search Giphy."}
            </div>
          ) : (
            <div className="grid grid-cols-3 gap-2 md:grid-cols-4">
              {results.map((r) => (
                <button
                  key={r.id}
                  type="button"
                  disabled={picking}
                  onClick={() => pick(r)}
                  className="group relative aspect-square overflow-hidden rounded-md border border-border transition-colors duration-150 hover:border-primary disabled:opacity-50"
                >
                  {/* eslint-disable-next-line @next/next/no-img-element */}
                  <img
                    src={r.previewUrl}
                    alt={r.description}
                    className="h-full w-full object-cover"
                  />
                </button>
              ))}
            </div>
          )}
        </div>
        <div className="border-t border-border bg-bg-elevated px-4 py-2 text-center font-mono text-[10px] uppercase tracking-[0.12em] text-ink-muted">
          GIFs powered by Giphy
        </div>
      </div>
    </div>
  );
}

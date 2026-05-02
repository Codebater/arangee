"use client";

import { useState, useTransition } from "react";
import { Loader2, RotateCcw } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { TOKEN_GROUPS, COLOR_VALUE_RE } from "@/lib/theme-tokens";
import { saveBrandingTokens } from "@/server-actions/branding";

interface Props {
  initialLight: Record<string, string>;
  initialDark: Record<string, string>;
}

export function ThemeBuilder({ initialLight, initialDark }: Props) {
  const [light, setLight] = useState<Record<string, string>>(initialLight);
  const [dark, setDark] = useState<Record<string, string>>(initialDark);
  const [pending, start] = useTransition();
  const [savedAt, setSavedAt] = useState<number | null>(null);

  function setToken(mode: "light" | "dark", key: string, value: string) {
    const trimmed = value.trim();
    const updater = mode === "light" ? setLight : setDark;
    updater((prev) => {
      const next = { ...prev };
      if (trimmed === "") delete next[key];
      else next[key] = trimmed;
      return next;
    });
  }

  function resetToken(key: string) {
    setLight((prev) => {
      const n = { ...prev };
      delete n[key];
      return n;
    });
    setDark((prev) => {
      const n = { ...prev };
      delete n[key];
      return n;
    });
  }

  function resetAll() {
    setLight({});
    setDark({});
  }

  function save() {
    start(async () => {
      const cleanLight: Record<string, string> = {};
      for (const [k, v] of Object.entries(light)) if (COLOR_VALUE_RE.test(v)) cleanLight[k] = v;
      const cleanDark: Record<string, string> = {};
      for (const [k, v] of Object.entries(dark)) if (COLOR_VALUE_RE.test(v)) cleanDark[k] = v;
      await saveBrandingTokens({
        themeTokensLight: cleanLight,
        themeTokensDark: cleanDark,
      });
      setSavedAt(Date.now());
    });
  }

  const dirty =
    JSON.stringify(light) !== JSON.stringify(initialLight) ||
    JSON.stringify(dark) !== JSON.stringify(initialDark);

  return (
    <div className="space-y-6">
      {TOKEN_GROUPS.map((group) => (
        <div key={group.id} className="space-y-3">
          <h3 className="font-mono text-[11px] uppercase tracking-[0.12em] text-ink-muted">
            {group.title}
          </h3>
          <div className="space-y-2.5">
            {group.tokens.map((tok) => {
              const lightVal = light[tok.key] ?? "";
              const darkVal = dark[tok.key] ?? "";
              const overridden = Boolean(lightVal) || Boolean(darkVal);
              return (
                <div
                  key={tok.key}
                  className="grid grid-cols-[120px_1fr_1fr_auto] items-center gap-3 rounded-md border border-border bg-surface px-3 py-2"
                >
                  <span className="text-[12.5px] text-ink">{tok.label}</span>
                  <ColorRow
                    mode="light"
                    value={lightVal}
                    onChange={(v) => setToken("light", tok.key, v)}
                  />
                  <ColorRow
                    mode="dark"
                    value={darkVal}
                    onChange={(v) => setToken("dark", tok.key, v)}
                  />
                  <button
                    type="button"
                    onClick={() => resetToken(tok.key)}
                    disabled={!overridden}
                    title="Reset to default"
                    className="inline-flex h-7 w-7 items-center justify-center rounded-md text-ink-muted transition-colors duration-150 hover:bg-surface-hover hover:text-ink disabled:cursor-not-allowed disabled:opacity-30 disabled:hover:bg-transparent"
                  >
                    <RotateCcw size={12} />
                  </button>
                </div>
              );
            })}
          </div>
        </div>
      ))}

      <div className="flex items-center justify-between border-t border-border pt-4">
        <Button
          type="button"
          variant="ghost"
          size="sm"
          onClick={resetAll}
          className="gap-1.5 text-ink-muted hover:text-ink"
        >
          <RotateCcw size={13} />
          Reset all to default
        </Button>
        <div className="flex items-center gap-3">
          {savedAt && !dirty && !pending && (
            <span className="font-mono text-[11px] uppercase tracking-[0.1em] text-ink-muted">
              Saved
            </span>
          )}
          <Button type="button" onClick={save} disabled={pending || !dirty} className="gap-2">
            {pending ? (
              <>
                <Loader2 className="animate-spin" />
                <span>Saving…</span>
              </>
            ) : (
              <span>Save theme</span>
            )}
          </Button>
        </div>
      </div>
    </div>
  );
}

function ColorRow({
  mode,
  value,
  onChange,
}: {
  mode: "light" | "dark";
  value: string;
  onChange: (v: string) => void;
}) {
  const isHex = /^#[0-9a-fA-F]{6}$/.test(value);
  return (
    <div className="flex items-center gap-2">
      <span className="font-mono text-[10px] uppercase tracking-[0.1em] text-ink-muted">
        {mode === "light" ? "L" : "D"}
      </span>
      <input
        type="color"
        value={isHex ? value : "#000000"}
        onChange={(e) => onChange(e.target.value)}
        className="h-7 w-7 cursor-pointer rounded border border-border bg-transparent p-0"
        title={`${mode} color`}
      />
      <Input
        value={value}
        onChange={(e) => onChange(e.target.value)}
        placeholder="default"
        className="h-7 flex-1 font-mono text-[11.5px]"
      />
    </div>
  );
}

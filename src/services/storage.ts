import type { Angle } from "../math/expression-engine";
export type ModuleId =
  "scientific" | "functions" | "matrices" | "combinatorics" | "numerical";
export interface Preferences {
  angle: Angle;
  digits: number;
  notation: "auto" | "fixed" | "scientific";
  theme: "light" | "dark";
}
export interface HistoryEntry {
  id: string;
  module: ModuleId;
  expression: string;
  result: string;
  timestamp: string;
  payload?: Record<string, unknown>;
}
const KEY = "piratas-calculo-v1";
const defaults: Preferences = {
  angle: "DEG",
  digits: 12,
  notation: "auto",
  theme: "light",
};
let failure = false;
function read(): { preferences: Preferences; history: HistoryEntry[] } {
  try {
    const raw = JSON.parse(localStorage.getItem(KEY) || "{}");
    const p = raw.preferences || {};
    const preferences: Preferences = {
      angle: p.angle === "RAD" ? "RAD" : "DEG",
      digits:
        Number.isInteger(p.digits) && p.digits >= 2 && p.digits <= 16
          ? p.digits
          : 12,
      notation: ["auto", "fixed", "scientific"].includes(p.notation)
        ? p.notation
        : "auto",
      theme: p.theme === "dark" ? "dark" : "light",
    };
    const history = Array.isArray(raw.history)
      ? raw.history
          .filter(
            (h: any) =>
              h &&
              typeof h.id === "string" &&
              typeof h.expression === "string" &&
              typeof h.result === "string" &&
              typeof h.timestamp === "string" &&
              [
                "scientific",
                "functions",
                "matrices",
                "combinatorics",
                "numerical",
              ].includes(h.module),
          )
          .slice(0, 100)
      : [];
    return { preferences, history };
  } catch {
    return { preferences: { ...defaults }, history: [] };
  }
}
const state = read();
export function persist() {
  try {
    localStorage.setItem(KEY, JSON.stringify(state));
    failure = false;
  } catch {
    failure = true;
  }
  window.dispatchEvent(new CustomEvent("storagechange"));
}
export const storage = {
  get preferences() {
    return state.preferences;
  },
  get history() {
    return state.history;
  },
  get failed() {
    return failure;
  },
  setPreferences(p: Partial<Preferences>) {
    Object.assign(state.preferences, p);
    persist();
  },
  add(
    module: ModuleId,
    expression: string,
    result: string,
    payload?: Record<string, unknown>,
  ) {
    state.history.unshift({
      id: crypto.randomUUID(),
      module,
      expression: expression.slice(0, 1000),
      result: result.slice(0, 22000),
      timestamp: new Date().toISOString(),
      payload,
    });
    state.history = state.history.slice(0, 100);
    persist();
  },
  remove(id: string) {
    state.history = state.history.filter((h) => h.id !== id);
    persist();
  },
  clear() {
    state.history = [];
    persist();
  },
};

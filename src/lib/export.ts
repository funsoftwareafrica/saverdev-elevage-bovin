// Helpers d'export — CSV (universel, Excel/Sheets/LibreOffice compatibles).

export function toCSV<T extends Record<string, unknown>>(rows: T[], columns: { key: keyof T; label: string }[]): string {
  const escape = (v: unknown): string => {
    if (v == null) return "";
    const s = String(v);
    if (/[;"\n]/.test(s)) return `"${s.replace(/"/g, '""')}"`;
    return s;
  };
  const header = columns.map((c) => escape(c.label)).join(";");
  const body = rows.map((row) => columns.map((c) => escape(row[c.key])).join(";")).join("\n");
  return "\uFEFF" + header + "\n" + body;
}

export function downloadFile(content: string, filename: string, mimeType = "text/csv;charset=utf-8") {
  if (typeof window === "undefined") return;
  const blob = new Blob([content], { type: mimeType });
  const url = URL.createObjectURL(blob);
  const a = document.createElement("a");
  a.href = url; a.download = filename;
  document.body.appendChild(a); a.click();
  document.body.removeChild(a); URL.revokeObjectURL(url);
}

export function exportCSV<T extends Record<string, unknown>>(rows: T[], columns: { key: keyof T; label: string }[], filename: string) {
  downloadFile(toCSV(rows, columns), filename);
}

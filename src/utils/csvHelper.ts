export function parseCSV(text: string): Record<string, string>[] {
  const lines: string[] = [];
  let currentLine = "";
  let inQuotes = false;
  
  for (let i = 0; i < text.length; i++) {
    const char = text[i];
    const nextChar = text[i + 1];
    if (char === '"') {
      if (inQuotes && nextChar === '"') {
        currentLine += '"';
        i++;
      } else {
        inQuotes = !inQuotes;
      }
    } else if (char === '\n' || char === '\r') {
      if (inQuotes) {
        currentLine += char;
      } else {
        if (char === '\r' && nextChar === '\n') {
          i++;
        }
        lines.push(currentLine);
        currentLine = "";
      }
    } else {
      currentLine += char;
    }
  }
  if (currentLine) {
    lines.push(currentLine);
  }

  if (lines.length === 0) return [];

  const headers = splitCSVLine(lines[0]);
  const results: Record<string, string>[] = [];

  for (let i = 1; i < lines.length; i++) {
    if (!lines[i].trim()) continue;
    const values = splitCSVLine(lines[i]);
    const row: Record<string, string> = {};
    headers.forEach((header, idx) => {
      const headerKey = header.trim().toLowerCase();
      row[headerKey] = values[idx] ? values[idx].trim() : "";
    });
    results.push(row);
  }

  return results;
}

export function splitCSVLine(line: string): string[] {
  const result: string[] = [];
  let currentField = "";
  let inQuotes = false;

  for (let i = 0; i < line.length; i++) {
    const char = line[i];
    const nextChar = line[i + 1];
    if (char === '"') {
      if (inQuotes && nextChar === '"') {
        currentField += '"';
        i++;
      } else {
        inQuotes = !inQuotes;
      }
    } else if (char === ',') {
      if (inQuotes) {
        currentField += char;
      } else {
        result.push(currentField);
        currentField = "";
      }
    } else {
      currentField += char;
    }
  }
  result.push(currentField);
  return result;
}

export function generateCSV(headers: string[], rows: string[][]): string {
  const escapeField = (val: string) => {
    if (val === null || val === undefined) return "";
    const stringVal = String(val);
    const escaped = stringVal.replace(/"/g, '""');
    if (escaped.includes(',') || escaped.includes('\n') || escaped.includes('\r') || escaped.includes('"')) {
      return `"${escaped}"`;
    }
    return escaped;
  };

  const headerLine = headers.map(escapeField).join(',');
  const rowLines = rows.map(row => row.map(escapeField).join(','));
  return [headerLine, ...rowLines].join('\r\n');
}

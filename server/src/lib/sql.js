// =====================================================
// SQL utilities — statement splitting for db/schema.sql
// Handles:
//   * `--` line comments (skipped, outside strings/dollar)
//   * single-quoted strings ('...' with '' escapes)
//   * dollar-quoted bodies ($$...$$ and $tag$...$tag$)
// =====================================================

/**
 * Splits raw SQL into individual statements, ignoring `;` inside
 * strings, dollar-quoted bodies, and `--` comments.
 */
export function splitSqlStatements(sql) {
  const statements = [];
  let current = '';
  let inSingle = false;
  let dollarTag = null;

  const flush = () => {
    const trimmed = current.trim();
    if (trimmed) statements.push(trimmed);
    current = '';
  };

  for (let i = 0; i < sql.length; i++) {
    const ch = sql[i];
    const next = sql[i + 1];

    // Inside dollar-quoted body (e.g. $$ ... $$)
    if (dollarTag) {
      current += ch;
      if (sql.startsWith(dollarTag, i)) {
        current += dollarTag;
        i += dollarTag.length - 1;
        dollarTag = null;
      }
      continue;
    }

    // Inside single-quoted string
    if (inSingle) {
      current += ch;
      if (ch === "'") {
        if (next === "'") {
          current += next;
          i += 1;
          continue;
        }
        inSingle = false;
      }
      continue;
    }

    // `--` line comment: skip until end of line
    if (ch === '-' && next === '-') {
      while (i < sql.length && sql[i] !== '\n') i += 1;
      continue;
    }

    // Start of dollar-quoted body
    if (ch === '$') {
      const m = sql.slice(i).match(/^\$[A-Za-z_][A-Za-z0-9_]*\$|^\$\$/);
      if (m) {
        dollarTag = m[0];
        current += dollarTag;
        i += dollarTag.length - 1;
        continue;
      }
    }

    // Start of single-quoted string
    if (ch === "'") {
      inSingle = true;
      current += ch;
      continue;
    }

    // Statement terminator
    if (ch === ';') {
      flush();
      continue;
    }

    current += ch;
  }

  flush();
  return statements;
}
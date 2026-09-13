// keyboardType="numeric" only restricts the on-screen keyboard on native devices — it does
// nothing in a browser, so any web form field using it must still validate input itself before
// sending it to the API (a non-numeric value silently becomes NaN -> null -> a confusing 400).

// Returns a finite number, or null if the text is empty/blank.
// Throws if the text is non-empty but not a valid number, so callers can show a clear message.
export function parseRequiredNumber(text) {
  if (text == null || text.trim() === '') {
    throw new Error('This field is required.');
  }
  const value = Number(text);
  if (!Number.isFinite(value)) {
    throw new Error(`"${text}" is not a valid number.`);
  }
  return value;
}

// Returns a finite number, or null if the text is empty/blank (for optional numeric fields).
// Throws if the text is non-empty but not a valid number.
export function parseOptionalNumber(text) {
  if (text == null || text.trim() === '') {
    return null;
  }
  const value = Number(text);
  if (!Number.isFinite(value)) {
    throw new Error(`"${text}" is not a valid number.`);
  }
  return value;
}

/**
 * US-style phone display as the user types: (AAA) BBB-CCCC.
 * Strips non-digits, ignores a leading country code 1 when 11 digits are entered, caps at 10 digits.
 */
export function formatPhoneInput(text: string): string {
  const digits = text.replace(/\D/g, '');
  if (digits.length === 0) {
    return '';
  }
  let d = digits;
  if (d.length >= 11 && d.startsWith('1')) {
    d = d.slice(1, 11);
  } else {
    d = d.slice(0, 10);
  }
  if (d.length === 0) {
    return '';
  }
  if (d.length <= 3) {
    return `(${d}`;
  }
  if (d.length <= 6) {
    return `(${d.slice(0, 3)}) ${d.slice(3)}`;
  }
  return `(${d.slice(0, 3)}) ${d.slice(3, 6)}-${d.slice(6)}`;
}

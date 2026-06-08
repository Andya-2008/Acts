import { formatPhoneInput } from '@/shared/utils/formatPhoneInput';

/** Strip formatting; returns up to 10 US national digits. */
export function digitsOnlyPhone(text: string): string {
  const digits = text.replace(/\D/g, '');
  if (digits.length >= 11 && digits.startsWith('1')) {
    return digits.slice(1, 11);
  }
  return digits.slice(0, 10);
}

/** US mobile numbers as E.164 (+1XXXXXXXXXX). */
export function toUsE164(phoneDisplay: string): string | null {
  const d = digitsOnlyPhone(phoneDisplay);
  if (d.length !== 10) {
    return null;
  }
  return `+1${d}`;
}

export function e164ToDisplayPhone(e164: string): string {
  const digits = e164.replace(/\D/g, '');
  const ten = digits.length >= 11 && digits.startsWith('1') ? digits.slice(1, 11) : digits.slice(-10);
  return formatPhoneInput(ten);
}

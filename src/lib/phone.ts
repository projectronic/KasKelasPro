/** Converts a local Indonesian phone number into a wa.me link. */
export function toWhatsAppLink(phone: string): string {
  const digits = phone.replace(/\D/g, "");
  const withCountryCode = digits.startsWith("0") ? `62${digits.slice(1)}` : digits;
  return `https://wa.me/${withCountryCode}`;
}

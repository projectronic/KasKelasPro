import { toWhatsAppLink } from "@/lib/phone";

export function PhoneLink({ phone, className }: { phone: string; className?: string }) {
  return (
    <a
      href={toWhatsAppLink(phone)}
      target="_blank"
      rel="noopener noreferrer"
      className={className ?? "underline underline-offset-4 hover:text-foreground"}
    >
      {phone}
    </a>
  );
}

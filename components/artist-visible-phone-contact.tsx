import { siWhatsapp } from "simple-icons";

type ContactChannel = "whatsapp" | "mobile" | null;

function digitsOnly(s: string): string {
  return s.replace(/\D/g, "");
}

function PhoneHandsetIcon({ className }: { className?: string }) {
  return (
    <svg viewBox="0 0 24 24" className={className} fill="none" stroke="currentColor" strokeWidth={1.75} aria-hidden>
      <path
        strokeLinecap="round"
        strokeLinejoin="round"
        d="M6.62 10.79a15.053 15.053 0 006.59 6.59l2.2-2.2a1 1 0 011.01-.24 11.36 11.36 0 003.68.59 1 1 0 011 1V20a1 1 0 01-1 1A17 17 0 013 4a1 1 0 011-1h3.5a1 1 0 011 1 0 11.36 11.36 0 00.59 3.68 1 1 0 01-.24 1.01l-2.2 2.2z"
      />
    </svg>
  );
}

/**
 * When a phone number is visible to the viewer, show it with a WhatsApp vs mobile handset affordance.
 */
export function ArtistVisiblePhoneContact({
  contactNumber,
  contactType,
  className = "",
}: {
  contactNumber: string;
  contactType: ContactChannel;
  /** Wrapper classes (e.g. flex row). */
  className?: string;
}) {
  const trimmed = contactNumber.trim();
  if (!trimmed) return null;

  const isWhatsapp = contactType === "whatsapp";
  const waDigits = digitsOnly(trimmed);
  const href =
    isWhatsapp && waDigits.length > 0 ? `https://wa.me/${waDigits}` : `tel:${encodeURIComponent(trimmed)}`;
  const label = isWhatsapp
    ? `Message on WhatsApp: ${trimmed}`
    : `Call or text: ${trimmed}`;

  return (
    <a
      href={href}
      aria-label={label}
      target={isWhatsapp ? "_blank" : undefined}
      rel={isWhatsapp ? "noopener noreferrer" : undefined}
      className={`inline-flex min-h-[44px] items-center gap-2.5 rounded-xl border border-stone-200 bg-stone-50/90 px-3 py-2 text-sm font-medium text-stone-800 shadow-sm transition-colors hover:border-amber-300 hover:bg-amber-50/90 ${className}`}
    >
      <span
        className="flex h-10 w-10 shrink-0 items-center justify-center rounded-lg"
        style={{
          backgroundColor: isWhatsapp ? `${siWhatsapp.hex}18` : "#78716c18",
          color: isWhatsapp ? `#${siWhatsapp.hex}` : "#57534e",
        }}
        aria-hidden
      >
        {isWhatsapp ? (
          <svg viewBox="0 0 24 24" className="h-5 w-5" aria-hidden>
            <path fill="currentColor" d={siWhatsapp.path} />
          </svg>
        ) : (
          <PhoneHandsetIcon className="h-5 w-5" />
        )}
      </span>
      <span className="min-w-0 break-all ph-no-capture">{trimmed}</span>
    </a>
  );
}

/** Compact inline icon + number for admin tables and review screens. */
export function ArtistPhoneContactInline({
  contactNumber,
  contactType,
}: {
  contactNumber: string;
  contactType: ContactChannel;
}) {
  const trimmed = contactNumber.trim();
  if (!trimmed) {
    return <span className="text-stone-400">—</span>;
  }
  const isWhatsapp = contactType === "whatsapp";
  return (
    <span className="inline-flex items-center gap-2">
      <span
        className="inline-flex h-7 w-7 shrink-0 items-center justify-center rounded-md"
        style={{
          backgroundColor: isWhatsapp ? `${siWhatsapp.hex}14` : "#78716c14",
          color: isWhatsapp ? `#${siWhatsapp.hex}` : "#57534e",
        }}
        title={isWhatsapp ? "WhatsApp" : "Mobile"}
        aria-hidden
      >
        {isWhatsapp ? (
          <svg viewBox="0 0 24 24" className="h-4 w-4">
            <path fill="currentColor" d={siWhatsapp.path} />
          </svg>
        ) : (
          <PhoneHandsetIcon className="h-4 w-4" />
        )}
      </span>
      <span className="ph-no-capture">{trimmed}</span>
    </span>
  );
}

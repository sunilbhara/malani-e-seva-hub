import { useId } from "react";

/**
 * App-icon style brand marks (inline SVG, no network request) so readers instantly recognise
 * the real Instagram / YouTube / WhatsApp / Telegram accounts.
 */
type IconProps = { className?: string };

export function InstagramIcon({ className }: IconProps) {
  const id = useId();
  return (
    <svg viewBox="0 0 48 48" className={className} aria-hidden focusable="false">
      <defs>
        <radialGradient id={`${id}-ig`} cx="0.3" cy="1.07" r="1.25">
          <stop offset="0" stopColor="#FFDD55" />
          <stop offset="0.1" stopColor="#FFDD55" />
          <stop offset="0.5" stopColor="#FF543E" />
          <stop offset="1" stopColor="#C837AB" />
        </radialGradient>
        <radialGradient id={`${id}-ig2`} cx="-0.17" cy="0.07" r="0.6">
          <stop offset="0" stopColor="#3771C8" />
          <stop offset="0.13" stopColor="#3771C8" />
          <stop offset="1" stopColor="#6600FF" stopOpacity="0" />
        </radialGradient>
      </defs>
      <rect width="48" height="48" rx="12" fill={`url(#${id}-ig)`} />
      <rect width="48" height="48" rx="12" fill={`url(#${id}-ig2)`} />
      <rect x="11" y="11" width="26" height="26" rx="8" fill="none" stroke="#fff" strokeWidth="3" />
      <circle cx="24" cy="24" r="6.2" fill="none" stroke="#fff" strokeWidth="3" />
      <circle cx="31.6" cy="16.4" r="1.9" fill="#fff" />
    </svg>
  );
}

export function YouTubeIcon({ className }: IconProps) {
  return (
    <svg viewBox="0 0 48 48" className={className} aria-hidden focusable="false">
      <rect width="48" height="48" rx="12" fill="#fff" />
      <path d="M41.3 15.6a4.6 4.6 0 0 0-3.2-3.2C35.3 11.6 24 11.6 24 11.6s-11.3 0-14.1.8a4.6 4.6 0 0 0-3.2 3.2C6 18.4 6 24 6 24s0 5.6.7 8.4a4.6 4.6 0 0 0 3.2 3.2c2.8.8 14.1.8 14.1.8s11.3 0 14.1-.8a4.6 4.6 0 0 0 3.2-3.2c.7-2.8.7-8.4.7-8.4s0-5.6-.7-8.4Z" fill="#FF0000" />
      <path d="M20.4 29.4 29.8 24l-9.4-5.4v10.8Z" fill="#fff" />
    </svg>
  );
}

export function WhatsAppIcon({ className }: IconProps) {
  return (
    <svg viewBox="0 0 48 48" className={className} aria-hidden focusable="false">
      <rect width="48" height="48" rx="12" fill="#25D366" />
      <path
        d="M24 10.5a13.4 13.4 0 0 0-11.5 20.3L10.6 37.5l6.9-1.8A13.4 13.4 0 1 0 24 10.5Zm0 24.5a11 11 0 0 1-5.6-1.5l-.4-.2-4.1 1.1 1.1-4-.3-.4A11 11 0 1 1 24 35Zm6-8.2c-.3-.2-2-1-2.3-1.1-.3-.1-.5-.2-.8.2l-1 1.3c-.2.2-.4.3-.7.1a9 9 0 0 1-4.5-3.9c-.3-.6.3-.5 1-1.7.1-.2 0-.4 0-.6l-1-2.5c-.3-.7-.6-.6-.8-.6h-.7a1.3 1.3 0 0 0-1 .5 4 4 0 0 0-1.2 3 7 7 0 0 0 1.4 3.7c.2.2 2.4 3.7 5.9 5.2 2.2.9 3.1 1 4.2.8.7-.1 2-.8 2.3-1.6.3-.8.3-1.5.2-1.6l-.9-.6Z"
        fill="#fff"
      />
    </svg>
  );
}

export function TelegramIcon({ className }: IconProps) {
  return (
    <svg viewBox="0 0 48 48" className={className} aria-hidden focusable="false">
      <rect width="48" height="48" rx="12" fill="#27A7E7" />
      <path d="m10.9 23.4 21.4-8.3c1-.4 1.9.2 1.6 1.7l-3.6 17c-.3 1.2-1 1.5-2 .9l-5.5-4-2.6 2.5c-.3.3-.5.5-1.1.5l.4-5.6 10.2-9.2c.4-.4-.1-.6-.7-.2L16.4 26.8l-5.4-1.7c-1.2-.4-1.2-1.2.3-1.7Z" fill="#fff" />
    </svg>
  );
}

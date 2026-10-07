// Business details shared with the edge functions (single source of truth, audit B12).
export { BUSINESS, fullAddress, isOpenAt, openingHoursSpecification } from "../../supabase/functions/_shared/business";
import { BUSINESS } from "../../supabase/functions/_shared/business";

export const telHref = `tel:+${BUSINESS.phoneDigits}`;

export function whatsappHref(text?: string): string {
  const base = `https://wa.me/${BUSINESS.whatsappNumber}`;
  return text ? `${base}?text=${encodeURIComponent(text)}` : base;
}

export const directionsHref = `https://www.google.com/maps/dir/?api=1&destination=${BUSINESS.geo.latitude},${BUSINESS.geo.longitude}`;

// Single source of truth for business details (name, address, phone, hours, location).
// Imported by both the web app (src/lib/business.ts re-exports it) and edge functions,
// so the site, structured data and AI prompts never disagree (audit B12).
// Keep this file free of Deno- or browser-specific APIs.

export const BUSINESS = {
  name: "Malani Barmer",
  nameHi: "मालाणी मोबाइल ई-मित्र सर्विस",
  owner: "Tarun Bharti",
  phone: "+91 9950788973",
  phoneDigits: "919950788973",
  whatsappNumber: "919950788973",
  email: null as string | null,
  siteUrl: "https://malanibarmer.com",
  address: {
    street: "Near IDBI Bank, Opp. Railway Station, High School Road",
    streetHi: "आईडीबीआई बैंक के पास, रेलवे स्टेशन के सामने, हाई स्कूल रोड",
    city: "Barmer",
    cityHi: "बाड़मेर",
    region: "Rajasthan",
    postalCode: "344001",
    country: "IN",
  },
  geo: { latitude: 25.746793418531855, longitude: 71.39670954386371 },
  // Day 0 = Sunday. Times are 24h IST. Verify with the shop before going live.
  hours: [
    { days: [1, 2, 3, 4, 5, 6], open: "09:00", close: "20:00" },
    { days: [0], open: "10:00", close: "18:00" },
  ],
  hoursText: "Mon–Sat 9:00 AM – 8:00 PM, Sun 10:00 AM – 6:00 PM",
  hoursTextHi: "सोम–शनि सुबह 9 से रात 8 बजे, रविवार सुबह 10 से शाम 6 बजे",
  social: {
    instagram: "https://www.instagram.com/malani_mobile_barmer/",
    youtube: "https://www.youtube.com/@MalaniMobileandElectronices",
  },
  defaultImage: "https://res.cloudinary.com/duovfafmc/image/upload/v1757222789/0022_jfozz9.jpg",
} as const;

export function fullAddress(lang: "hi" | "en" = "en"): string {
  const a = BUSINESS.address;
  return lang === "hi"
    ? `${a.streetHi}, ${a.cityHi} ${a.postalCode}`
    : `${a.street}, ${a.city}, ${a.region} ${a.postalCode}`;
}

/** Schema.org openingHoursSpecification built from BUSINESS.hours. */
export function openingHoursSpecification() {
  const names = ["Sunday", "Monday", "Tuesday", "Wednesday", "Thursday", "Friday", "Saturday"];
  return BUSINESS.hours.map((h) => ({
    "@type": "OpeningHoursSpecification",
    dayOfWeek: h.days.map((d) => names[d]),
    opens: h.open,
    closes: h.close,
  }));
}

/** Whether the shop is open at the given instant (evaluated in IST). */
export function isOpenAt(date: Date): boolean {
  // IST is UTC+5:30 with no daylight saving, so shift the UTC wall clock by 330 minutes.
  const istTotal = date.getUTCHours() * 60 + date.getUTCMinutes() + 330;
  const dayShift = Math.floor(istTotal / 1440);
  const minutes = istTotal % 1440;
  const day = (date.getUTCDay() + dayShift) % 7;
  return BUSINESS.hours.some((h) => {
    if (!(h.days as readonly number[]).includes(day)) return false;
    const [oh, om] = h.open.split(":").map(Number);
    const [ch, cm] = h.close.split(":").map(Number);
    return minutes >= oh * 60 + om && minutes < ch * 60 + cm;
  });
}

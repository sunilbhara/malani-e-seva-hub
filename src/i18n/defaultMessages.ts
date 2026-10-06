import type { FaqItem, LanguageOption, NavItem } from "./types";

export const languageOptions: LanguageOption[] = [
  { value: "hi", label: "हिंदी" },
  { value: "en", label: "English" },
];

export const defaultMessages = {
  locale: "en-IN",
  languageSwitcher: {
    label: "Language",
    placeholder: "Language",
  },
  navigation: {
    brandTagline: "Complete Solutions Hub",
    blog: "Blog",
    login: "Login",
    logout: "Logout",
    admin: "Admin",
    mobileAddress: "Near IDBI Bank, Barmer",
    items: [
      { label: "Home", section: "home", route: "/" },
      { label: "E-Mitra Services", section: "services", route: "/services" },
      { label: "Mobile & Electronics", section: "mobile-electronics", route: "/mobile-electronics" },
      { label: "Mataji Studio", section: "mataji-studio", route: "/mataji-studio" },
      { label: "Location", section: "location", route: "/#location" },
      { label: "Contact", section: "contact", route: "/#contact" },
    ] as NavItem[],
  },
  hero: {
    badge: "Authorized E-Mitra Center",
    subtitle: "E-Mitra services, mobile electronics and professional photography - all in one trusted place.",
    primaryCta: "Get Started",
    secondaryCta: "Explore Services",
    whatsapp: "WhatsApp",
    location: "Barmer",
    trustItems: ["Govt Authorized", "24/7 Support"],
    floatingCards: ["Document Services", "Mobile Electronics", "Mataji Studio"],
    scrollLabel: "Scroll",
    imageAlt: "Malani Barmer service collage",
  },
  homepage: {
    mainServices: {
      badge: "Our Core Services",
      title: "Everything You Need",
      subtitle: "Under One Roof",
      description:
        "From government services to modern electronics and professional photography, we are your complete solution in Barmer.",
      cta: "Visit Dedicated Page",
      trustTitle: "Trusted by 50,000+ Customers in Barmer",
      trustItems: ["Quick Service", "Government Authorized", "24/7 Support"],
      services: [
        {
          id: "emitra",
          title: "E-Mitra Services",
          description:
            "Government authorized digital services for your official work with reliable support and quick processing.",
          features: ["Government Forms", "Certificate Applications", "Bill Payments", "Digital Services"],
          stats: "50,000+ Documents Processed",
          route: "/services",
        },
        {
          id: "mobile",
          title: "Mobile & Electronics",
          description:
            "Latest smartphones, gadgets and electronics with warranty support and competitive prices in Barmer.",
          features: ["Latest Mobiles", "Electronics", "Accessories", "Warranties"],
          stats: "1000+ Happy Customers",
          route: "/mobile-electronics",
        },
        {
          id: "studio",
          title: "Mataji Studio",
          description:
            "Professional photography services for weddings, events and portraits that preserve your important moments beautifully.",
          features: ["Wedding Photography", "Event Coverage", "Portrait Sessions", "Digital Albums"],
          stats: "500+ Events Covered",
          route: "/mataji-studio",
        },
      ],
    },
    services: {
      badge: "Our Premium Services",
      title: "Your One-Stop Solution",
      description:
        "We provide comprehensive e-governance and digital services to make life easier for families, students and professionals in Barmer.",
      items: [
        {
          title: "Form Filling Services",
          description: "Assistance for exam forms, job applications, government forms and online registrations.",
          features: ["Exam Registration", "Job Applications", "Government Forms", "Online Applications"],
        },
        {
          title: "Passport Size Photos",
          description: "Professional passport photos for official documents, IDs and application needs.",
          features: ["Instant Printing", "Digital Format", "All Sizes Available", "Government Standard"],
        },
        {
          title: "Money Transfer",
          description: "Fast money transfer services with secure processing and helpful in-person guidance.",
          features: ["Bank Transfers", "Mobile Wallets", "Cash Pickup", "International Transfers"],
        },
        {
          title: "Bill Payments",
          description: "Utility bill payments, mobile recharge and government fee support from one counter.",
          features: ["Electricity Bills", "Mobile Recharge", "Water Bills", "Government Fees"],
        },
        {
          title: "Digital Services",
          description: "Digital government services and online document support for everyday requirements.",
          features: ["Aadhaar Services", "PAN Card", "Voter ID", "Digital Certificates"],
        },
        {
          title: "Insurance Services",
          description: "Practical insurance support for life, health, vehicle and property protection needs.",
          features: ["Life Insurance", "Health Insurance", "Vehicle Insurance", "Property Insurance"],
        },
      ],
    },
    mobileElectronics: {
      title: "Malani Mobile & Electronics",
      description:
        "Discover the latest in mobile technology and electronics with premium quality, competitive prices and expert local support.",
      categories: [
        { id: "all", name: "All Products" },
        { id: "mobiles", name: "Mobiles" },
        { id: "accessories", name: "Accessories" },
        { id: "appliances", name: "Appliances" },
      ],
      buyNow: "Buy Now",
      contactTitle: "Visit Our Store Today!",
      contactDescription: "Expert advice, competitive prices and genuine products guaranteed.",
      contactHighlights: ["Authorized Dealer", "1 Year Warranty", "Easy EMI Available"],
    },
    matajiStudio: {
      title: "Mataji Studio",
      description:
        "Capturing important moments with artistic vision and professional expertise. Every photo tells a story.",
      categories: [
        { id: "all", name: "All Photos" },
        { id: "weddings", name: "Weddings" },
        { id: "portraits", name: "Portraits" },
        { id: "events", name: "Events" },
      ],
      whyTitle: "Why Choose Mataji Studio?",
      whyItems: [
        "Professional equipment and lighting",
        "Experienced photographers",
        "Quick turnaround time",
        "Affordable packages",
        "Custom editing services",
        "Digital and print delivery",
      ],
      contactTitle: "Contact Us",
    },
    features: {
      badge: "Why Choose Us",
      title: "Most Trusted E-Mitra in Barmer",
      description:
        "With years of experience and thousands of satisfied customers, we remain a reliable local partner for government and digital services in Barmer.",
      items: [
        {
          title: "Lightning Fast Service",
          description: "Quick processing and practical guidance for most services with minimal waiting time.",
        },
        {
          title: "100% Secure & Reliable",
          description: "Customer documents and details are handled carefully with a trusted service process.",
        },
        {
          title: "Expert Professional Support",
          description: "Experienced staff helps customers through documentation, digital forms and service requirements.",
        },
        {
          title: "Government Certified Center",
          description: "Officially authorized e-Mitra support backed by local trust and day-to-day experience.",
        },
      ],
      stats: [
        { number: "50000+", label: "Happy Customers" },
        { number: "99.9%", label: "Success Rate" },
        { number: "24/7", label: "Support Available" },
        { number: "50+", label: "Services Offered" },
      ],
      imageAlt: "Professional customer service desk in Barmer",
      floatingStatLabel: "Happy Customers",
      floatingStatSuffix: "& Counting...",
    },
    contact: {
      badge: "Get In Touch",
      title: "Contact Tarun Bharti",
      description:
        "Visit our center or contact us for assistance with e-Mitra services, photography bookings and mobile electronics enquiries.",
      cards: {
        address: "Our Address",
        phone: "Phone Number",
        hours: "Working Hours",
        proprietor: "Proprietor",
      },
    },
    map: {
      title: "Find Our Location",
      description: "Visit our center in Barmer for trusted local services and in-person support.",
      phoneLabel: "Phone",
      hoursLabel: "Business Hours",
      directionsTitle: "Get Directions",
      googleMaps: "Open in Google Maps",
      appleMaps: "Open in Apple Maps",
      helpTitle: "Need Help?",
      helpDescription: "Call us directly for immediate assistance with your service request.",
      callNow: "Call Now",
    },
  },
  forms: {
    contact: {
      title: "Send us a Message",
      subtitle: "We'll get back to you within 24 hours",
      placeholders: {
        name: "Your Name",
        phone: "Phone Number",
        email: "Email Address",
        service: "Service Required",
        message: "Your Message",
      },
      validation: {
        name: "Name is required",
        phone: "Phone number is required",
        phonePattern: "Enter a valid 10-digit number",
        email: "Email is required",
        emailPattern: "Enter a valid email",
        service: "Service is required",
        message: "Message is required",
      },
      submitting: "Sending...",
      submit: "Send Message",
      success: "Message sent successfully!",
      error: "Something went wrong. Please try again.",
    },
    booking: {
      trigger: "Book a Photo Session",
      title: "Book Your Session",
      labels: {
        name: "Full Name",
        phone: "Phone Number",
        email: "Email Address",
        sessionType: "Session Type",
        date: "Preferred Date",
        message: "Additional Details",
      },
      placeholders: {
        name: "Enter your full name",
        phone: "10-digit phone number",
        email: "your@email.com",
        sessionType: "Select a session",
        message: "Tell us about your photography needs...",
      },
      options: ["Wedding Photography", "Portrait Session", "Event Coverage", "Family Photos"],
      validation: {
        name: "Name is required",
        phone: "Phone number is required",
        phonePattern: "Enter a valid 10-digit number",
        email: "Email is required",
        emailPattern: "Invalid email address",
        sessionType: "Session type is required",
        date: "Date is required",
      },
      submitting: "Sending...",
      submit: "Send Booking Request",
      success: "Booking request sent successfully!",
      error: "Failed to send booking request. Please try again after some time.",
    },
  },
  footer: {
    description:
      "Your complete solution hub for E-Mitra services, mobile electronics and professional photography in Barmer, Rajasthan.",
    quickServicesTitle: "Quick Services",
    quickServices: ["Form Filling", "Passport Photos", "Money Transfer", "Bill Payments", "Digital Services", "Insurance Services"],
    contactInfoTitle: "Contact Info",
    importantLinksTitle: "Important Links",
    quickLinksTitle: "Quick Links",
    followUs: "Follow Us",
    proprietor: "Proprietor",
    copyright: "Malani Barmer. All rights reserved. | Complete Solutions Hub",
    rated: "Rated 4.9/5 by customers",
    links: {
      privacy: "Privacy Policy",
      terms: "Terms & Conditions",
      about: "About Us",
      blog: "Blog",
      support: "Help & Support",
      services: "E-Mitra Services",
      mobile: "Mobile & Electronics",
      studio: "Mataji Studio",
    },
  },
  seoPages: {
    common: {
      overviewLabel: "Overview",
      servicesLabel: "Services",
      faqLabel: "FAQ",
      relatedLabel: "Explore related pages",
      blogLabel: "From the blog",
      breadcrumbHome: "Home",
      blogTitle: "Read more on the Malani Barmer blog",
      blogDescription: "Explore articles, updates and service guidance connected to our local offerings in Barmer.",
      blogCta: "Go to Blog",
      locationTitle: "Visit us in Barmer, Rajasthan 344001",
      locationText: "Near IDBI Bank Opp. Railway Station, High School Road, Barmer 344001",
    },
    serviceCards: {
      services: [
        {
          title: "Online Form Filling",
          description: "Support for exam forms, scholarship applications, job forms and government registrations.",
          bullets: ["Exam and recruitment forms", "Application review before submission", "Student-friendly assistance"],
        },
        {
          title: "Certificates and ID-linked Services",
          description: "Help with Aadhaar-linked digital workflows, PAN support, voter-related documentation and certificates.",
          bullets: ["Document uploads and corrections", "Certificate application workflows", "Guidance on required documents"],
        },
        {
          title: "Bills, Transfers and Daily Utility Support",
          description: "Useful walk-in support for payments, transfers and common digital tasks handled at local service centers.",
          bullets: ["Bill payment support", "Money transfer assistance", "Digital task help for families and seniors"],
        },
      ],
      mobile: [
        {
          title: "Smartphones and Accessories",
          description: "Compare popular devices, chargers, cases and audio accessories with guidance based on real everyday usage.",
          bullets: ["Latest mobile options", "Essential accessories", "Budget and premium recommendations"],
        },
        {
          title: "Premium Audio and Entertainment",
          description: "Explore headphones like Sony WH-1000XM5 and TV options including LG OLED ranges with local purchase support.",
          bullets: ["Sony WH-1000XM5 enquiries", "LG OLED product guidance", "Feature comparisons before purchase"],
        },
        {
          title: "Local Support and Buyer Confidence",
          description: "A nearby showroom experience matters when buyers want help understanding warranty, compatibility and usage.",
          bullets: ["In-store product explanation", "After-sales guidance", "Trusted local recommendations"],
        },
      ],
      studio: [
        {
          title: "Pre Wedding Photography",
          description: "Creative pre wedding concepts that balance local culture, styling and natural couple moments.",
          bullets: ["Traditional pre wedding shoot ideas", "Location planning in and around Barmer", "Outfit and mood guidance"],
        },
        {
          title: "Haldi and Wedding Coverage",
          description: "Coverage for haldi, wedding rituals and candid family moments with a polished storytelling approach.",
          bullets: ["Haldi photoshoot coverage", "Wedding couple photoshoot", "Candid and traditional frames"],
        },
        {
          title: "Portraits, Events and Birthdays",
          description: "Portrait sessions, family celebrations and pre birthday photoshoots planned around your mood and occasion.",
          bullets: ["Couple photography", "Event photography", "Pre birthday and family sessions"],
        },
      ],
    },
    faqs: {
      services: [
        {
          question: "Which E-Mitra services do you offer in Barmer?",
          answer: "We assist with online forms, documentation support, certificates, bill payments, digital applications and common cyber cafe style service needs.",
        },
        {
          question: "Can I visit without an appointment?",
          answer: "Yes. Most customers walk in directly for routine documentation and online service support.",
        },
        {
          question: "Where is your E-Mitra center located?",
          answer: "We are near IDBI Bank Opp. Railway Station, High School Road, Barmer 344001.",
        },
      ] as FaqItem[],
      mobile: [
        {
          question: "Do you help customers compare mobile phones before buying?",
          answer: "Yes. We regularly guide customers through feature, budget and accessory comparisons based on their actual needs.",
        },
        {
          question: "Can I enquire about Sony WH-1000XM5 or LG OLED products?",
          answer: "Yes. You can contact us for availability, pricing guidance and related accessory information.",
        },
        {
          question: "Why choose a local mobile showroom in Barmer?",
          answer: "A local showroom offers hands-on guidance, after-sales assistance and practical recommendations tailored to your use case.",
        },
      ] as FaqItem[],
      studio: [
        {
          question: "Do you offer pre wedding photography in Barmer?",
          answer: "Yes. Mataji Studio provides pre wedding photography, couple portraits and traditional concept planning for local shoots.",
        },
        {
          question: "Can I book a haldi photoshoot package?",
          answer: "Yes. We handle haldi coverage, wedding couple sessions and related event photography bookings.",
        },
        {
          question: "Do you also shoot portraits and birthday sessions?",
          answer: "Yes. We offer portraits, family shoots, pre birthday photoshoots and celebration coverage.",
        },
      ] as FaqItem[],
    },
    services: {
      title: "E-Mitra Services in Barmer | Online Documentation, Forms & Cyber Cafe Support",
      description:
        "Malani Barmer offers trusted E-Mitra services in Barmer including online forms, certificates, bill payments, documentation support and cyber cafe assistance near you.",
      heroEyebrow: "E-Mitra Barmer",
      heroTitle: "Trusted E-Mitra Services and Online Documentation Support in Barmer",
      heroDescription:
        "From government forms and certificate applications to digital payments and cyber cafe support, Malani Barmer helps local families, students and businesses complete essential work quickly.",
      heroBullets: ["Government forms and online applications", "Documentation support near IDBI Bank, Barmer", "Helpful in-person guidance for digital services"],
      overviewTitle: "Complete local support for everyday documentation",
      overviewText:
        "People searching for e mitra services, near e mitra or cyber cafe near me in Barmer often need quick help with forms, ID-linked services and online submissions. Our team provides practical support without confusing paperwork.",
      sectionTitle: "Popular E-Mitra and cyber cafe services",
      faqTitle: "Frequently asked questions about E-Mitra services in Barmer",
      ctaTitle: "Need an E-Mitra near you in Barmer?",
      ctaDescription: "Call or visit Malani Barmer for document support, online services and reliable eMitra assistance.",
      ctaPrimary: "Contact Our Desk",
      ctaSecondary: "Explore Mobile & Electronics",
    },
    mobile: {
      title: "Mobile Showroom in Barmer | Malani Mobile & Electronics",
      description:
        "Visit Malani Mobile, a trusted mobile showroom in Barmer for smartphones, Sony WH-1000XM5, LG OLED TVs, accessories and expert local guidance.",
      heroEyebrow: "Malani Mobile",
      heroTitle: "Mobile Showroom and Electronics Store in Barmer",
      heroDescription:
        "Shop smartphones, headphones, TVs and accessories with guidance from a local electronics team that understands value, support and after-sales needs.",
      heroBullets: ["Mobile showroom Barmer with latest gadgets", "Accessories, premium audio and home electronics", "Practical local support before and after purchase"],
      overviewTitle: "Why customers visit Malani Mobile",
      overviewText:
        "When customers search for malani mobile, mobile showroom Barmer or electronics shop Barmer, they want trustworthy recommendations and genuine products. We help buyers compare features, pricing and use cases before purchasing.",
      sectionTitle: "Featured mobile and electronics categories",
      faqTitle: "Frequently asked questions about our mobile showroom",
      ctaTitle: "Looking for a dependable electronics shop in Barmer?",
      ctaDescription: "Talk to our team about smartphones, accessories, Sony WH-1000XM5 headphones and LG OLED options.",
      ctaPrimary: "Ask About Availability",
      ctaSecondary: "Visit Mataji Studio",
    },
    studio: {
      title: "Mataji Studio Barmer | Pre Wedding, Haldi & Couple Photography",
      description:
        "Mataji Studio in Barmer offers pre wedding photography, haldi photoshoots, couple portraits, wedding coverage and event photography with local creative direction.",
      heroEyebrow: "Mataji Studio",
      heroTitle: "Pre Wedding, Haldi and Wedding Photography in Barmer",
      heroDescription:
        "Mataji Studio captures pre wedding stories, haldi ceremonies, couple portraits and family celebrations with a style that feels personal, local and memorable.",
      heroBullets: ["Pre wedding photography and traditional couple shoots", "Haldi photoshoot and wedding day coverage", "Portrait, birthday and event sessions in Barmer"],
      overviewTitle: "Photography that feels personal and local",
      overviewText:
        "Couples and families searching for photographer Barmer, haldi photoshoot or wedding couple photoshoot want creative guidance along with reliability. Mataji Studio combines both with clear communication and polished edits.",
      sectionTitle: "Popular Mataji Studio photography services",
      faqTitle: "Frequently asked questions about Mataji Studio",
      ctaTitle: "Planning a photo session in Barmer?",
      ctaDescription: "Book Mataji Studio for pre wedding, haldi, portrait and celebration photography with a local team you can trust.",
      ctaPrimary: "Book a Session",
      ctaSecondary: "See E-Mitra Services",
    },
  },
};

export type MessageCatalog = typeof defaultMessages;

/** Locale overrides only need the keys they translate; the rest falls back to the base catalog. */
export type DeepPartial<T> = T extends readonly unknown[] ? T : T extends object ? { [K in keyof T]?: DeepPartial<T[K]> } : T;

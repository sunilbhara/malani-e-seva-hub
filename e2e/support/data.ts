// Seed data for the mock backend. Dates are relative to "today" in India so statuses
// (open / closing / closed / upcoming) stay correct whenever the suite runs.

export const TEST_USERS = {
  reader: { id: "e2e00000-0000-4000-8000-000000000001", email: "e2e-reader@example.test", password: "Reader-e2e-2026", role: "user" as const, name: "राम पाठक" },
  admin: { id: "e2e00000-0000-4000-8000-000000000002", email: "e2e-admin@example.test", password: "Admin-e2e-2026", role: "admin" as const, name: "मालाणी टीम" },
};

export function istToday(): string {
  return new Date(Date.now() + 330 * 60_000).toISOString().slice(0, 10);
}

export function day(offset: number): string {
  const d = new Date(`${istToday()}T00:00:00Z`);
  d.setUTCDate(d.getUTCDate() + offset);
  return d.toISOString().slice(0, 10);
}

export interface Job {
  post_id: string;
  recruitment_id: string | null;
  organisation: string;
  total_posts: number | null;
  qualifications: string[];
  departments: string[];
  state: string;
  age_min: number | null;
  age_max: number | null;
  salary: string | null;
  fees: Array<{ category: string; amount: number }>;
  apply_start: string | null;
  last_date: string | null;
  fee_last_date: string | null;
  admit_card_date: string | null;
  exam_date: string | null;
  result_date: string | null;
  extra_dates: Array<{ label: string; date: string }>;
  apply_link: string | null;
  notification_pdf: string | null;
  official_website: string | null;
  updated_at: string;
}

export interface Post {
  id: string;
  title: string;
  slug: string;
  content: string;
  excerpt: string;
  image_url: string | null;
  category: string;
  tags: string[];
  status: "draft" | "scheduled" | "published" | "archived";
  post_type: string;
  published_at: string | null;
  updated_at: string;
  created_at: string;
  scheduled_at: string | null;
  author_id: string;
  language: string;
  seo_title: string | null;
  seo_description: string | null;
  og_image_url: string | null;
  canonical_url: string | null;
  source_url: string | null;
  official_link: string | null;
  is_verified: boolean;
  read_time_min: number;
  views_count: number;
  likes_count: number;
  comments_count: number;
  share_count: number;
  bookmarks_count: number;
  broadcast_at: string | null;
  job: Job | null;
}

const uuid = (n: number) => `e2e10000-0000-4000-8000-${String(n).padStart(12, "0")}`;

function post(n: number, p: Partial<Post> & Pick<Post, "title" | "slug">, job?: Partial<Job> | null): Post {
  const id = uuid(n);
  const published = new Date(Date.now() - n * 3_600_000).toISOString();
  return {
    id,
    post_type: "job",
    content: "<h2>भर्ती का विवरण</h2><p>इस भर्ती में कुल पद हैं।</p><h2>योग्यता</h2><p>मान्यता प्राप्त बोर्ड से पास।</p><h2>आवेदन कैसे करें</h2><ol><li>आधिकारिक वेबसाइट खोलें</li><li>फॉर्म भरें</li></ol>",
    excerpt: "इस भर्ती में कुल पद हैं।",
    image_url: null,
    category: "Government Job",
    tags: [],
    status: "published",
    published_at: published,
    updated_at: published,
    created_at: published,
    scheduled_at: null,
    author_id: TEST_USERS.admin.id,
    language: "hi",
    seo_title: null,
    seo_description: null,
    og_image_url: null,
    canonical_url: null,
    source_url: "https://rsmssb.rajasthan.gov.in/notice.pdf",
    official_link: "https://rsmssb.rajasthan.gov.in",
    is_verified: true,
    read_time_min: 2,
    views_count: 100 - n,
    likes_count: 3,
    comments_count: 0,
    share_count: 0,
    bookmarks_count: 0,
    broadcast_at: published,
    ...p,
    job:
      job === null
        ? null
        : {
            post_id: id,
            recruitment_id: null,
            organisation: "RSMSSB",
            total_posts: 100 + n,
            qualifications: ["graduate"],
            departments: ["rsmssb"],
            state: "rajasthan",
            age_min: 18,
            age_max: 40,
            salary: "पे-लेवल 5",
            fees: [{ category: "सामान्य", amount: 600 }],
            apply_start: day(-5),
            last_date: day(15 + n),
            fee_last_date: null,
            admit_card_date: null,
            exam_date: null,
            result_date: null,
            extra_dates: [],
            apply_link: "https://rsmssb.rajasthan.gov.in/apply",
            notification_pdf: null,
            official_website: "https://rsmssb.rajasthan.gov.in",
            updated_at: published,
            ...job,
          },
  };
}

export const RECRUITMENTS = [{ id: "e2e20000-0000-4000-8000-000000000001", name: "राजस्थान पुलिस कांस्टेबल 2026", organisation: "राजस्थान पुलिस", created_at: new Date().toISOString() }];

export function seedPosts(): Post[] {
  const list: Post[] = [
    post(1, { title: "राजस्थान पुलिस कांस्टेबल भर्ती 2026 — 9617 पद", slug: "rajasthan-police-constable-2026", tags: ["police"] }, {
      organisation: "राजस्थान पुलिस",
      total_posts: 9617,
      qualifications: ["12th"],
      departments: ["police"],
      last_date: day(3),
      exam_date: day(60),
      recruitment_id: RECRUITMENTS[0].id,
      fees: [{ category: "सामान्य / OBC", amount: 600 }, { category: "SC / ST", amount: 400 }],
      apply_link: "https://police.rajasthan.gov.in/apply",
      official_website: "https://police.rajasthan.gov.in",
    }),
    post(2, { title: "SBI क्लर्क भर्ती 2026 — 5000 पद", slug: "sbi-clerk-2026" }, { organisation: "State Bank of India — Central Recruitment and Promotion Department", total_posts: 5000, departments: ["bank"], state: "all_india", last_date: day(25) }),
    post(3, { title: "पटवारी भर्ती 2025 — आवेदन बंद", slug: "patwari-2025-closed" }, { organisation: "राजस्व मंडल", departments: ["patwari"], last_date: day(-10) }),
    post(4, { title: "REET मुख्य भर्ती — जल्द शुरू", slug: "reet-upcoming" }, { organisation: "RSMSSB", departments: ["teacher"], apply_start: day(10), last_date: day(40) }),
    post(5, { title: "राजस्थान पुलिस कांस्टेबल एडमिट कार्ड जारी", slug: "police-admit-card", post_type: "admit_card", category: "Admit Card" }, {
      organisation: "राजस्थान पुलिस",
      recruitment_id: RECRUITMENTS[0].id,
      departments: ["police"],
      qualifications: ["12th"],
      last_date: null,
      apply_start: null,
      exam_date: day(60),
    }),
    post(6, { title: "पटवारी परीक्षा रिजल्ट घोषित", slug: "patwari-result", post_type: "result", category: "Result" }, { last_date: null, apply_start: null, departments: ["patwari"] }),
    post(7, { title: "RPSC परीक्षा कैलेंडर 2026", slug: "rpsc-exam-calendar", post_type: "exam", category: "Exam Date" }, { last_date: null, apply_start: null, departments: ["rpsc"] }),
    post(8, { title: "जन आधार कार्ड कैसे बनवाएँ — ई-मित्र गाइड", slug: "jan-aadhaar-guide", post_type: "guide", category: "E-Mitra Guide" }, null),
    post(9, { title: "ड्राफ्ट — पाठकों को नहीं दिखना चाहिए", slug: "secret-draft", post_type: "job", status: "draft", published_at: null }),
  ];
  // Enough open jobs to need a second page (page size 20).
  for (let i = 0; i < 22; i += 1) {
    list.push(post(20 + i, { title: `ग्राम विकास अधिकारी भर्ती बैच ${i + 1}`, slug: `vdo-batch-${i + 1}` }, { departments: ["rsmssb"], qualifications: i % 2 ? ["graduate"] : ["12th"] }));
  }
  return list;
}

export function seedQuiz() {
  return [
    { id: "e2e30000-0000-4000-8000-000000000001", quiz_date: istToday(), position: 1, question: "राजस्थान की राजधानी कौनसी है?", options: ["जोधपुर", "जयपुर", "बाड़मेर", "अजमेर"], correct_index: 1, explanation: "जयपुर 1949 से राजस्थान की राजधानी है।" },
    { id: "e2e30000-0000-4000-8000-000000000002", quiz_date: istToday(), position: 2, question: "बाड़मेर राजस्थान के किस भाग में है?", options: ["उत्तर", "पूर्व", "पश्चिम", "दक्षिण"], correct_index: 2, explanation: null },
  ];
}

export function seedCatalog() {
  const img = (id: string) => `https://images.unsplash.com/photo-${id}?w=800&h=800&fit=crop`;
  const base = { image_path: null, is_active: true, created_at: "2026-10-01T00:00:00Z", mrp: null as number | null };
  return [
    { ...base, id: "e2e40000-0000-4000-8000-000000000001", kind: "product", category: "mobiles", title: "Redmi Note 14", price: 17999, mrp: 21999, features: ["5110mAh बैटरी", "50MP कैमरा"], image_url: img("p1"), sort_order: 10 },
    { ...base, id: "e2e40000-0000-4000-8000-000000000002", kind: "product", category: "accessories", title: "boAt Airdopes 141", price: null, features: [], image_url: img("p2"), sort_order: 20 },
    { ...base, id: "e2e40000-0000-4000-8000-000000000003", kind: "product", category: "mobiles", title: "पुराना मॉडल (छुपा)", price: 9999, features: [], image_url: img("p3"), sort_order: 30, is_active: false },
    { ...base, id: "e2e40000-0000-4000-8000-000000000004", kind: "studio_photo", category: "weddings", title: "शादी के पल", price: null, features: [], image_url: img("s1"), sort_order: 10 },
    { ...base, id: "e2e40000-0000-4000-8000-000000000005", kind: "studio_photo", category: "portraits", title: "फैमिली पोर्ट्रेट", price: null, features: [], image_url: img("s2"), sort_order: 20 },
  ];
}

export function seedCollections() {
  return [
    { id: "e2e48000-0000-4000-8000-000000000001", title: "त्योहार ऑफ़र", description: "दिवाली पर खास दाम", sort_order: 10, is_active: true, created_at: "2026-10-01T00:00:00Z" },
    { id: "e2e48000-0000-4000-8000-000000000002", title: "छुपा कलेक्शन", description: null, sort_order: 20, is_active: false, created_at: "2026-10-01T00:00:00Z" },
  ];
}

export function seedCollectionItems() {
  return [
    { collection_id: "e2e48000-0000-4000-8000-000000000001", item_id: "e2e40000-0000-4000-8000-000000000001", sort_order: 10 },
    { collection_id: "e2e48000-0000-4000-8000-000000000001", item_id: "e2e40000-0000-4000-8000-000000000003", sort_order: 20 },
    { collection_id: "e2e48000-0000-4000-8000-000000000002", item_id: "e2e40000-0000-4000-8000-000000000002", sort_order: 10 },
  ];
}

// E-Mitra price list (Blueprint §9.6). Fill in `price` (₹) once confirmed by the shop;
// items without a price show "दाम पूछें" with a WhatsApp link instead of a made-up number.
export interface EmitraService {
  name: string;
  price: number | null;
  documents: string[];
}

export interface EmitraGroup {
  title: string;
  services: EmitraService[];
}

export const EMITRA_GROUPS: EmitraGroup[] = [
  {
    title: "नौकरी और परीक्षा फॉर्म",
    services: [
      { name: "सरकारी भर्ती ऑनलाइन फॉर्म", price: null, documents: ["आधार कार्ड", "10वीं/12वीं की मार्कशीट", "फोटो और हस्ताक्षर", "SSO ID (अगर है)", "जाति/निवास प्रमाण पत्र (अगर लागू)"] },
      { name: "एडमिट कार्ड / रिजल्ट प्रिंट", price: null, documents: ["रजिस्ट्रेशन नंबर", "जन्म तिथि"] },
      { name: "छात्रवृत्ति (स्कॉलरशिप) फॉर्म", price: null, documents: ["आधार कार्ड", "बैंक पासबुक", "आय प्रमाण पत्र", "पिछली कक्षा की मार्कशीट"] },
    ],
  },
  {
    title: "प्रमाण पत्र",
    services: [
      { name: "मूल निवास प्रमाण पत्र", price: null, documents: ["आधार कार्ड", "राशन कार्ड", "फोटो", "स्व-घोषणा पत्र"] },
      { name: "जाति प्रमाण पत्र", price: null, documents: ["आधार कार्ड", "पिता का जाति प्रमाण पत्र (अगर है)", "राशन कार्ड"] },
      { name: "आय प्रमाण पत्र", price: null, documents: ["आधार कार्ड", "राशन कार्ड", "स्व-घोषणा पत्र"] },
    ],
  },
  {
    title: "पहचान और दस्तावेज़",
    services: [
      { name: "आधार अपडेट / डाउनलोड सहायता", price: null, documents: ["आधार नंबर", "आधार से जुड़ा मोबाइल"] },
      { name: "पैन कार्ड आवेदन / सुधार", price: null, documents: ["आधार कार्ड", "फोटो", "हस्ताक्षर"] },
      { name: "पासपोर्ट साइज़ फोटो", price: null, documents: [] },
    ],
  },
  {
    title: "भुगतान और रोज़ के काम",
    services: [
      { name: "बिजली / पानी बिल भुगतान", price: null, documents: ["बिल या K नंबर"] },
      { name: "मोबाइल रिचार्ज", price: null, documents: ["मोबाइल नंबर"] },
      { name: "पैसे भेजना (मनी ट्रांसफ़र)", price: null, documents: ["पाने वाले का बैंक खाता और IFSC", "आपका आधार/मोबाइल"] },
    ],
  },
];

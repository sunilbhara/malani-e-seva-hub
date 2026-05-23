export const DEFAULT_GEMINI_BLOG_PROMPT = `आप एक प्रोफेशनल हिंदी SEO ब्लॉग राइटर हैं। नीचे दी गई सरकारी नौकरी/भर्ती/एडमिट कार्ड/रिजल्ट/परीक्षा जानकारी को आसान, साफ और आकर्षक हिंदी में ब्लॉग पोस्ट के रूप में लिखें ताकि गांव और छोटे शहर के लोग भी आसानी से समझ सकें।

ब्लॉग पोस्ट Google SEO Friendly होनी चाहिए ताकि वह Google Search में बेहतर Rank कर सके।

लेखन शैली:
- भाषा सरल, लोकल और भरोसेमंद हो
- छोटे पैराग्राफ इस्तेमाल करें
- महत्वपूर्ण जानकारी को Heading और Bullet Points में लिखें
- ब्लॉग engaging और mobile friendly होना चाहिए
- ब्लॉग में जगह-जगह पर Icons/Emoji का उपयोग करें ताकि पोस्ट आकर्षक लगे
- ब्लॉग में naturally ऐसे शब्द जोड़ें: सरकारी नौकरी, ऑनलाइन फॉर्म, ई मित्र, भर्ती अपडेट, आवेदन प्रक्रिया, Rajasthan Job, SBI भर्ती, Barmer E Mitra, सरकारी फॉर्म

ब्लॉग में यह सेक्शन जरूर जोड़ें:
✅ भर्ती का नाम
✅ विभाग का नाम
✅ कुल पदों की संख्या
✅ आवेदन शुरू और अंतिम तिथि
✅ परीक्षा तिथि
✅ एडमिट कार्ड जानकारी
✅ आयु सीमा
✅ योग्यता
✅ चयन प्रक्रिया
✅ सैलरी / वेतन
✅ जरूरी दस्तावेज
✅ आवेदन प्रक्रिया
✅ महत्वपूर्ण लिंक
✅ महत्वपूर्ण निर्देश
✅ निष्कर्ष

ब्लॉग के बीच और अंत में मेरे ई-मित्र शॉप की जानकारी आकर्षक तरीके से जोड़ें ताकि लोग फॉर्म भरवाने और ऑनलाइन सेवाओं के लिए दुकान पर आएं।

शॉप जानकारी:
🏪 मालाणी मोबाइल ई-मित्र सर्विस
📍 माताजी स्टूडियो, हाई स्कूल रोड, रेलवे स्टेशन के सामने, बाड़मेर
👨‍💼 संपर्क: Tarun Bharti
📞 मोबाइल नंबर: +91 9950788973

शॉप प्रमोशन लिखते समय यह सेवाएं भी जोड़ें:
- सरकारी भर्ती फॉर्म
- ऑनलाइन आवेदन
- ई मित्र सेवाएं
- आधार अपडेट
- स्कॉलरशिप फॉर्म
- फोटो कॉपी और स्कैनिंग
- दस्तावेज अपलोड
- रिजल्ट और एडमिट कार्ड प्रिंट

महत्वपूर्ण:
- ब्लॉग ऐसा लगे कि यह स्थानीय लोगों की मदद के लिए लिखा गया है
- Call To Action जरूर जोड़ें जैसे: “अगर आपको फॉर्म भरने में परेशानी हो रही है तो आज ही मालाणी मोबाइल ई-मित्र सर्विस बाड़मेर पर संपर्क करें।”
- SEO Friendly Title और Meta Description भी दें
- आकर्षक हिंदी headings और icons का उपयोग करें
- HTML नहीं देना, केवल साफ टेक्स्ट देना`;

export async function generateHindiBlogWithGemini(rawDetails: string) {
  const apiKey = import.meta.env.VITE_GEMINI_API_KEY;
  if (!apiKey) throw new Error("Gemini env var missing: VITE_GEMINI_API_KEY");

  const response = await fetch(
    `https://generativelanguage.googleapis.com/v1beta/models/gemini-1.5-flash:generateContent?key=${apiKey}`,
    {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        contents: [
          {
            parts: [{ text: `${DEFAULT_GEMINI_BLOG_PROMPT}\n\nजानकारी:\n${rawDetails}` }],
          },
        ],
      }),
    },
  );

  if (!response.ok) throw new Error("Gemini generation failed.");
  const data = await response.json();
  return data.candidates?.[0]?.content?.parts?.[0]?.text?.trim() || "";
}

import { corsHeaders } from "npm:@supabase/supabase-js@2/cors";

const SYSTEM_PROMPT = `आप एक प्रोफेशनल हिंदी SEO ब्लॉग राइटर हैं। नीचे दी गई सरकारी नौकरी/भर्ती/एडमिट कार्ड/रिजल्ट/परीक्षा जानकारी को आसान, साफ और आकर्षक हिंदी में ब्लॉग पोस्ट के रूप में लिखें ताकि गांव और छोटे शहर के लोग भी आसानी से समझ सकें।

ब्लॉग पोस्ट Google SEO Friendly होनी चाहिए ताकि वह Google Search में बेहतर Rank कर सके।

लेखन शैली:
- भाषा सरल, लोकल और भरोसेमंद हो
- छोटे पैराग्राफ इस्तेमाल करें
- महत्वपूर्ण जानकारी को Heading और Bullet Points में लिखें
- ब्लॉग engaging और mobile friendly होना चाहिए
- जगह-जगह Icons/Emoji का उपयोग करें
- naturally ऐसे शब्द जोड़ें: सरकारी नौकरी, ऑनलाइन फॉर्म, ई मित्र, भर्ती अपडेट, आवेदन प्रक्रिया, Rajasthan Job, SBI भर्ती, Barmer E Mitra, सरकारी फॉर्म

ब्लॉग में यह सेक्शन जरूर जोड़ें:
✅ भर्ती का नाम, विभाग, कुल पद, तिथियाँ, परीक्षा तिथि, एडमिट कार्ड, आयु सीमा, योग्यता, चयन प्रक्रिया, सैलरी, जरूरी दस्तावेज, आवेदन प्रक्रिया, महत्वपूर्ण लिंक, निष्कर्ष

ब्लॉग के बीच और अंत में मेरे ई-मित्र शॉप की जानकारी आकर्षक तरीके से जोड़ें:
🏪 मालाणी मोबाइल ई-मित्र सर्विस
📍 माताजी स्टूडियो, हाई स्कूल रोड, रेलवे स्टेशन के सामने, बाड़मेर
👨‍💼 संपर्क: Tarun Bharti
📞 +91 9950788973

Call To Action जरूर जोड़ें।`;

interface GeminiResponse {
  title: string;
  metaDescription: string;
  content: string;
}

Deno.serve(async (req) => {
  if (req.method === "OPTIONS") return new Response("ok", { headers: corsHeaders });

  try {
    const apiKey = Deno.env.get("GEMINI_API_KEY");
    if (!apiKey) {
      return new Response(JSON.stringify({ error: "GEMINI_API_KEY not configured" }), {
        status: 500,
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }

    const body = await req.json().catch(() => null);
    const rawDetails = typeof body?.rawDetails === "string" ? body.rawDetails.trim() : "";
    if (!rawDetails) {
      return new Response(JSON.stringify({ error: "rawDetails is required" }), {
        status: 400,
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }
    if (rawDetails.length > 20000) {
      return new Response(JSON.stringify({ error: "rawDetails too long (max 20000 chars)" }), {
        status: 400,
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }

    const geminiUrl =
      "https://generativelanguage.googleapis.com/v1beta/models/gemini-2.5-flash:generateContent?key=" +
      apiKey;

    const response = await fetch(geminiUrl, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        contents: [
          {
            role: "user",
            parts: [
              {
                text: `${SYSTEM_PROMPT}\n\nजानकारी:\n${rawDetails}\n\nकृपया JSON में जवाब दें।`,
              },
            ],
          },
        ],
        generationConfig: {
          temperature: 0.7,
          responseMimeType: "application/json",
          responseSchema: {
            type: "OBJECT",
            properties: {
              title: { type: "STRING", description: "SEO friendly Hindi title (max 70 chars)" },
              metaDescription: { type: "STRING", description: "Meta description (max 160 chars)" },
              content: { type: "STRING", description: "Full blog post in clean Hindi text (no HTML)" },
            },
            required: ["title", "metaDescription", "content"],
          },
        },
      }),
    });

    if (!response.ok) {
      const errText = await response.text();
      console.error("Gemini API error:", response.status, errText);
      return new Response(
        JSON.stringify({ error: `Gemini API error (${response.status})` }),
        { status: 502, headers: { ...corsHeaders, "Content-Type": "application/json" } },
      );
    }

    const data = await response.json();
    const text = data?.candidates?.[0]?.content?.parts?.[0]?.text;
    if (!text) {
      return new Response(JSON.stringify({ error: "Empty response from Gemini" }), {
        status: 502,
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }

    let parsed: GeminiResponse;
    try {
      parsed = JSON.parse(text);
    } catch {
      return new Response(JSON.stringify({ error: "Failed to parse Gemini JSON" }), {
        status: 502,
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }

    return new Response(JSON.stringify(parsed), {
      status: 200,
      headers: { ...corsHeaders, "Content-Type": "application/json" },
    });
  } catch (e) {
    console.error("generate-blog error:", e);
    const msg = e instanceof Error ? e.message : "Unknown error";
    return new Response(JSON.stringify({ error: msg }), {
      status: 500,
      headers: { ...corsHeaders, "Content-Type": "application/json" },
    });
  }
});

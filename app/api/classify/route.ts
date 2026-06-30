import { NextRequest, NextResponse } from "next/server";
import { GoogleGenerativeAI, Schema, SchemaType } from "@google/generative-ai";

export async function POST(req: NextRequest) {
  try {
    const formData = await req.formData();
    const image = formData.get("image") as File | null;

    if (!image) {
      return NextResponse.json({ error: "No image provided" }, { status: 400 });
    }

    const apiKey = process.env.GEMINI_API_KEY;

    // Jika user sudah memasukkan GEMINI_API_KEY, jalankan AI sungguhan
    if (apiKey) {
      const genAI = new GoogleGenerativeAI(apiKey);
      // Menggunakan model terbaru yang didukung oleh API Key (Gemini 3.5 Flash)
      const model = genAI.getGenerativeModel({ model: "gemini-3.5-flash" });
      
      const imageBytes = await image.arrayBuffer();
      const base64 = Buffer.from(imageBytes).toString("base64");
      
      const locale = formData.get("locale") as string || "id";
      const language = locale === "en" ? "English" : "Indonesian";
      const prompt = `Classify this waste into: organic (food, leaves), non_organic (plastic, glass, paper, metal), or uncertain. Also provide a short disposal tip in ${language}.`;

      // Definisi Schema minimal untuk menghemat token
      const responseSchema: Schema = {
        type: SchemaType.OBJECT,
        properties: {
          classification: {
            type: SchemaType.STRING,
            description: "organic, non_organic, or uncertain",
          },
          confidence: {
            type: SchemaType.NUMBER,
          },
          tip: {
            type: SchemaType.STRING,
          }
        },
        required: ["classification", "confidence", "tip"],
      };

      const result = await model.generateContent({
        contents: [
          {
            role: "user",
            parts: [
              {
                inlineData: {
                  data: base64,
                  mimeType: image.type,
                }
              },
              { text: prompt }
            ],
          }
        ],
        generationConfig: {
          responseMimeType: "application/json",
          responseSchema: responseSchema,
          temperature: 0.2, // dibuat rendah agar analisis logis dan konsisten
        }
      });

      const responseText = result.response.text();
      const parsed = JSON.parse(responseText);

      return NextResponse.json({
        classification: parsed.classification,
        confidence: parsed.confidence,
        tip: parsed.tip,
      });
    }

    // ── Placeholder fallback: Jika belum ada GEMINI_API_KEY, jalankan mock logic ──
    const name = image.name.toLowerCase();
    let classification: "organic" | "non_organic" | "uncertain" = "uncertain";
    let confidence = 0.72;
    let tip = "Tidak bisa mengklasifikasi ini dengan pasti. Tanyakan ke petugas sampah lokalmu.";

    if (name.includes("food") || name.includes("leaf") || name.includes("organic") || name.includes("fruit") || name.includes("vegetable")) {
      classification = "organic";
      confidence = 0.91;
      tip = "Sampah ini bisa dikompos. Cari tong hijau atau TPS organik terdekat.";
    } else if (name.includes("plastic") || name.includes("bottle") || name.includes("can") || name.includes("paper") || name.includes("glass")) {
      classification = "non_organic";
      confidence = 0.88;
      tip = "Bawa ke bank sampah atau TPS non-organik untuk didaur ulang.";
    }

    // Simulate a slight delay
    await new Promise((r) => setTimeout(r, 1200));

    return NextResponse.json({ classification, confidence, tip });
  } catch (error) {
    console.error("Classify error:", error);
    return NextResponse.json({ error: "Classification failed" }, { status: 500 });
  }
}

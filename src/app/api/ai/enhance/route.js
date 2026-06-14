import { NextResponse } from 'next/server';
import { GoogleGenerativeAI } from "@google/generative-ai";

const genAI = new GoogleGenerativeAI(process.env.GEMINI_API_KEY);

export async function POST(req) {
  try {
    const { description, name, isShort, text, context } = await req.json();

    if (!description && !name && !text) {
      return NextResponse.json({ error: 'At least name, description, or text is required' }, { status: 400 });
    }

    let prompt = "";
    if (context === "whatsapp_marketing") {
      prompt = `
      You are an expert e-commerce copywriter for "Mahally Jordan", a marketplace for local products.
      Rewrite and enhance the following text to be a high-converting, professional, and extremely engaging WhatsApp message campaign.
      Use WhatsApp formatting rules (*bold* for headings/emphasis, _italics_ for subheadings, ~strikethrough~ for old pricing if applicable).
      Integrate relevant emojis naturally to improve scannability. Keep it concise, punchy, and make sure it has a clear call-to-action (CTA).
      The original draft is: ${text || description}
      
      Return ONLY the enhanced WhatsApp broadcast message. Do not include any other text, conversational filler, or intro/outro sentences.
      `;
    } else {
      prompt = isShort
        ? `
        You are an expert e-commerce copywriter for "Mahally Jordan", a marketplace for local products.
        Write a highly concise, engaging, and punchy SHORT product description (tagline/key highlights).
        It should consist of 1-2 sentences of a catchy hook, followed by 2-3 brief, high-impact bullet points highlighting key benefits.
        The product name is: ${name || 'N/A'}
        The current text is: ${description || 'N/A'}
        
        Return ONLY the enhanced short description. Do not include any other text or conversational filler.
        Keep it brief, premium, and extremely easy to read at a glance.
        `
        : `
        You are an expert e-commerce copywriter for "Mahally Jordan", a marketplace for local products.
        Rewrite and enhance the following product description to be professional, engaging, and high-converting.
        Use a clean structure with bullet points for key features.
        The product name is: ${name || 'N/A'}
        The current description is: ${description || 'N/A'}
        
        Return ONLY the enhanced description. Do not include any other text or conversational filler.
        Use emojis sparingly but effectively.
        `;
    }

    let result;
    const modelsToTry = ["gemini-2.0-flash", "gemini-2.5-flash", "gemini-flash-latest"];
    let lastError = null;

    for (const modelName of modelsToTry) {
      try {
        const model = genAI.getGenerativeModel({ model: modelName });
        result = await model.generateContent(prompt);
        if (result) break;
      } catch (err) {
        console.warn(`Gemini model ${modelName} failed, trying next:`, err.message);
        lastError = err;
      }
    }

    if (!result) {
      throw lastError || new Error("All configured Gemini models failed.");
    }

    const response = await result.response;
    const enhancedDescription = response.text();

    return NextResponse.json({ enhanced: enhancedDescription, enhancedText: enhancedDescription });
  } catch (error) {
    console.error('AI Enhancement Error:', error);
    return NextResponse.json({ error: 'Failed to enhance description with AI' }, { status: 500 });
  }
}


import { GoogleGenAI, GenerateContentResponse } from "@google/genai";

export async function convertPageToMarkdown(base64Image: string): Promise<string> {
  const ai = new GoogleGenAI({ apiKey: process.env.API_KEY || '' });
  
  const prompt = `
    Analyze this PDF page image and convert it into high-quality Markdown text. 
    Follow these rules strictly:
    1. PRECISION: Maintain the exact logical flow of the text. Identify multi-column layouts and read them in the correct order (usually top-to-bottom of the first column, then the second).
    2. TABLES: Identify tables and reconstruct them using standard Markdown table syntax. Ensure cell contents are preserved and properly aligned. Do not scramble table rows.
    3. IMAGES: Completely ignore all images, logos, and decorative graphics. Only focus on text and data.
    4. HEADINGS: Use appropriate Markdown headers (# ## ###) based on visual hierarchy.
    5. LISTS: Preserve bulleted or numbered lists.
    6. VERTICAL TEXT: If text is oriented vertically, transcribe it as regular text in its logical position in the flow.
    7. CLEANLINESS: Do not add any conversational text or metadata about the conversion. Just output the Markdown content of the page.
  `;

  try {
    const response: GenerateContentResponse = await ai.models.generateContent({
      model: 'gemini-3-flash-preview', // Flash is excellent for high-speed OCR tasks
      contents: {
        parts: [
          { inlineData: { mimeType: 'image/jpeg', data: base64Image } },
          { text: prompt }
        ]
      },
      config: {
        temperature: 0.1, // Low temperature for higher factual precision
        thinkingConfig: { thinkingBudget: 0 } 
      }
    });

    return response.text || '';
  } catch (error) {
    console.error('Error in Gemini conversion:', error);
    throw new Error('Failed to convert page using AI');
  }
}

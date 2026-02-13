
import { GoogleGenAI, GenerateContentResponse } from "@google/genai";

const MAX_RETRIES = 5;
const INITIAL_BACKOFF_MS = 3000;

async function sleep(ms: number) {
  return new Promise(resolve => setTimeout(resolve, ms));
}

export async function convertPageToMarkdown(base64Image: string, retryCount = 0): Promise<string> {
  // Sempre inicializamos uma nova instância para garantir o uso da chave mais recente se necessário
  const ai = new GoogleGenAI({ apiKey: process.env.API_KEY || '' });
  
  const prompt = `
    Converta esta imagem de página de PDF em Markdown de alta qualidade.
    REGRAS:
    1. Preserve a ordem lógica de leitura (especialmente em colunas).
    2. Reconstrua tabelas fielmente usando sintaxe Markdown.
    3. Ignore imagens e logotipos decorativos.
    4. Use cabeçalhos (#, ##) baseados na hierarquia visual.
    5. Retorne APENAS o Markdown, sem comentários ou explicações.
  `;

  try {
    const response: GenerateContentResponse = await ai.models.generateContent({
      model: 'gemini-3-flash-preview', // Modelo otimizado para velocidade e eficiência de cota
      contents: {
        parts: [
          { inlineData: { mimeType: 'image/jpeg', data: base64Image } },
          { text: prompt }
        ]
      },
      config: {
        temperature: 0.1,
        thinkingConfig: { thinkingBudget: 0 } 
      }
    });

    if (!response.text) {
      throw new Error("Resposta vazia da IA");
    }

    return response.text;
  } catch (error: any) {
    const errorMsg = error?.message || "";
    const isQuotaError = errorMsg.includes('429') || errorMsg.includes('RESOURCE_EXHAUSTED');
    const isTransient = isQuotaError || errorMsg.includes('503') || errorMsg.includes('500');

    if (isTransient && retryCount < MAX_RETRIES) {
      // Backoff exponencial: 3s, 6s, 12s, 24s...
      const waitTime = INITIAL_BACKOFF_MS * Math.pow(2, retryCount);
      console.warn(`[Cota] Limite atingido. Aguardando ${waitTime}ms para liberar gratuidade...`);
      await sleep(waitTime);
      return convertPageToMarkdown(base64Image, retryCount + 1);
    }

    throw new Error(isQuotaError 
      ? "O servidor de IA está muito ocupado. Tente novamente em alguns segundos ou reduza o tamanho do PDF." 
      : "Falha na conversão da página.");
  }
}

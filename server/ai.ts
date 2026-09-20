import { ENV } from "./_core/env";

export function geminiRuntimeStatus() {
  return { provider: "Google Gemini", model: ENV.geminiModel, credentialConfigured: Boolean(ENV.geminiApiKey) };
}

export async function testGeminiConnection() {
  if (!ENV.geminiApiKey) throw new Error("GEMINI_API_KEY não está configurada no cofre do ambiente");
  const response = await fetch("https://generativelanguage.googleapis.com/v1beta/interactions", {
    method: "POST",
    headers: { "Content-Type": "application/json", "x-goog-api-key": ENV.geminiApiKey },
    body: JSON.stringify({ model: ENV.geminiModel, input: "Responda somente: LUmina AI pronta." }),
  });
  if (!response.ok) throw new Error(`A API Gemini recusou a verificação (${response.status})`);
  const data = await response.json() as { output_text?: string };
  return { ok: true, output: typeof data.output_text === "string" ? data.output_text.slice(0, 120) : "Conexão confirmada" };
}

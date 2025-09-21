import OpenAI from "openai";

export function getAzureOpenAI() {
  const baseURL = process.env.AZURE_OPENAI_BASE_URL!;
  const apiKey  = process.env.AZURE_OPENAI_API_KEY!;
  if (!baseURL || !apiKey) throw new Error("Azure OpenAI env not set");
  return new OpenAI({ baseURL, apiKey });
}

// For chat.completions (your deployment name is the model id)
export function getChatModel() {
  const m = process.env.AZURE_OPENAI_DEPLOYMENT || "gpt-5-mini";
  return m;
}

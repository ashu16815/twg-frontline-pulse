import OpenAI from "openai";

export function getAzureOpenAI() {
  const baseURL = process.env.AZURE_OPENAI_BASE_URL!;
  const apiKey  = process.env.AZURE_OPENAI_API_KEY!;
  const apiVersion = process.env.AZURE_OPENAI_API_VERSION!;
  
  if (!baseURL || !apiKey || !apiVersion) {
    throw new Error("Azure OpenAI environment variables not set");
  }
  
  return new OpenAI({ 
    baseURL: `${baseURL}/openai/deployments/${process.env.AZURE_OPENAI_DEPLOYMENT}`,
    apiKey,
    defaultQuery: { 'api-version': apiVersion }
  });
}

// For chat.completions (your deployment name is the model id)
export function getChatModel() {
  const m = process.env.AZURE_OPENAI_DEPLOYMENT || "gpt-5-mini";
  return m;
}

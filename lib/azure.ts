import OpenAI from "openai";

export function getAzureOpenAI() {
  const baseURL = process.env.AZURE_OPENAI_BASE_URL?.trim();
  const apiKey  = process.env.AZURE_OPENAI_API_KEY?.trim();
  const apiVersion = process.env.AZURE_OPENAI_API_VERSION?.trim();
  const deployment = process.env.AZURE_OPENAI_DEPLOYMENT?.trim();
  
  if (!baseURL || !apiKey || !apiVersion || !deployment) {
    throw new Error("Azure OpenAI environment variables not set");
  }
  
  return new OpenAI({ 
    baseURL: `${baseURL}/openai/deployments/${deployment}`,
    apiKey,
    defaultQuery: { 'api-version': apiVersion }
  });
}

// For chat.completions (your deployment name is the model id)
export function getChatModel() {
  const m = process.env.AZURE_OPENAI_DEPLOYMENT?.trim() || "gpt-5-mini";
  return m;
}

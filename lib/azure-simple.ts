import { callAzureJSON as originalCallAzureJSON } from './azure';

export async function callAzureJSON(messages: any[]) {
  // Use the existing working Azure implementation
  return await originalCallAzureJSON(messages);
}

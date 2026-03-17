/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import { GoogleGenAI } from "@google/genai";
import { BEdKG_SCHEMA_CONTEXT } from "../constants/schemaContext";

const genAI = new GoogleGenAI({ apiKey: process.env.GEMINI_API_KEY || "" });

const MODELS_TO_TRY = [
  "gemini-3.1-pro-preview",
  "gemini-3-flash-preview",
  "gemini-flash-latest"
];

export async function processNaturalLanguageQuery(query: string) {
  const prompt = `
${BEdKG_SCHEMA_CONTEXT}

User Query: "${query}"

Please provide:
1. A brief natural language explanation of how you will answer this.
2. The SPARQL query to fetch the data. **IMPORTANT: Always use the DISTINCT keyword in your SELECT statements (e.g., SELECT DISTINCT *) to avoid duplicate results from multiple declarations in the ABox. Also preserve exact case-sensitive BEdKG identifiers from the schema context. Do not invent or rename any mdProperty, mdAttribute, mdData, or ontology term.**
3. A placeholder for the final answer (you can't run the query yet, but explain what the result will show).
`;

  let lastError: any = null;

  for (const modelName of MODELS_TO_TRY) {
    try {
      console.log(`Attempting query with model: ${modelName}`);
      const response = await genAI.models.generateContent({
        model: modelName,
        contents: prompt,
      });

      if (response && response.text) {
        return response.text;
      }
    } catch (error: any) {
      lastError = error;
      // Check if it's a quota error (429) or resource exhausted
      const isQuotaError = 
        error?.message?.includes("429") || 
        error?.message?.includes("RESOURCE_EXHAUSTED") ||
        error?.status === "RESOURCE_EXHAUSTED";

      if (isQuotaError) {
        console.warn(`Quota exceeded for ${modelName}, trying next model...`);
        continue; // Try the next model in the list
      } else {
        // If it's a different kind of error, we might want to throw it immediately
        // or try the next model anyway. For SPARQL generation, trying another model is usually safe.
        console.error(`Error with ${modelName}:`, error);
        continue;
      }
    }
  }

  // If we get here, all models failed
  throw lastError || new Error("All AI models failed to process the query.");
}

export function extractSparql(text: string): string | null {
  const match = text.match(/```sparql\n([\s\S]*?)```/);
  return match ? match[1].trim() : null;
}

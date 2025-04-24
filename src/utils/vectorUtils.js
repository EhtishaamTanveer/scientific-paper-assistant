import axios from "axios";
import { v4 as uuidv4 } from "uuid";
import { ChromaClient } from "chromadb";

// Helper to chunk text
export const chunkText = (text, chunkSize = 500, overlap = 50) => {
  const words = text.split(/\s+/);
  const chunks = [];

  for (let i = 0; i < words.length; i += chunkSize - overlap) {
    const chunk = words.slice(i, i + chunkSize).join(" ");
    chunks.push(chunk);
  }

  return chunks;
};

// Helper to get OpenAI embeddings
export const getEmbedding = async (text) => {
  const apiKey = process.env.REACT_APP_OPENAI_API_KEY;

  const response = await axios.post(
    "https://api.openai.com/v1/embeddings",
    {
      input: text,
      model: "text-embedding-ada-002",
    },
    {
      headers: {
        Authorization: `Bearer ${apiKey}`,
        "Content-Type": "application/json",
      },
    }
  );

  return response.data.data[0].embedding;
};

// Main function to chunk, embed, and index a paper
export const chunkAndIndexPaper = async (paperTitle, fullText) => {
  const client = new ChromaClient();
  const collectionName = paperTitle.replace(/[^a-zA-Z0-9]/g, "_");

  let collection = await client.getOrCreateCollection({
    name: collectionName,
    metadata: { type: "paper" },
  });

  const chunks = chunkText(fullText);

  for (let i = 0; i < chunks.length; i++) {
    const chunk = chunks[i];
    const embedding = await getEmbedding(chunk);

    await collection.add({
      ids: [uuidv4()],
      documents: [chunk],
      embeddings: [embedding],
      metadata: [{ page: i + 1, paper: paperTitle }],
    });
  }

  console.log(`✅ Indexed ${chunks.length} chunks for: ${paperTitle}`);
};

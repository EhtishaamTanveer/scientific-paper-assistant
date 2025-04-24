export const summarizeTextWithOpenAI = async (text, title) => {
    const apiKey = process.env.REACT_APP_OPENAI_API_KEY;
  
    const prompt = `
  You are an assistant summarizing a scientific paper titled: "${title}".
  
  Your task:
  - Structure the summary into 4 sections: Introduction, Methods, Results, Conclusion.
  - Write in clear, plain text (NO markdown formatting, asterisks, or bold).
  - Highlight keywords like methods, results, and datasets by writing them in ALL CAPS.
  - Keep each section brief and readable.
  - At the end, extract metadata like:
    - Estimated year of publication (if mentioned)
    - Author names (if available)
  At the end, include:
  - Year of publication (if known)
  - Author names (list them clearly after “Authors:”)

  `;
  
    const response = await fetch("https://api.openai.com/v1/chat/completions", {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        Authorization: `Bearer ${apiKey}`,
      },
      body: JSON.stringify({
        model: "gpt-4o",
        messages: [
          {
            role: "system",
            content: "You are an expert assistant that summarizes academic papers for readers.",
          },
          {
            role: "user",
            content: prompt + "\n\n" + text,
          },
        ],
        temperature: 0.4,
        max_tokens: 1500,
      }),
    });
  
    const data = await response.json();

    console.log("GPT summary response:", data);

    return data.choices[0].message.content;
  };
  
  export const extractMetadataFromText = (text) => {
    const wordCount = text.split(/\s+/).length;
    const readingTime = Math.ceil(wordCount / 200);
  
    const yearMatch = text.match(/(?:Year|Published|Date)[^\d]*(\b(19|20)\d{2}\b)/i);
    const authorsMatch = text.match(/Authors?:\s*(.+)/i);
  
    return {
      wordCount,
      estimatedReadingTime: readingTime,
      estimatedYear: yearMatch ? yearMatch[1] : "Not found",
      authors: authorsMatch ? authorsMatch[1].trim() : "Unknown",
    };
  };
  
  export const askQuestionAboutPaper = async (question, paperText, paperTitle) => {
    const apiKey = process.env.REACT_APP_OPENAI_API_KEY;
  
    const prompt = `
  You are an expert assistant helping someone understand the research paper titled: "${paperTitle}".
  
  The full paper is included below, and its sections are marked using headers like: ## [Introduction], ## [Methods], etc.
  
  When you answer the user's question:
  - Be specific
  - If relevant, cite the section where the information comes from using square brackets. Example: [Conclusion], [Results]
  
  Paper content:
  ${paperText}
  
  User's question:
  ${question}
  `;
  
    const response = await fetch("https://api.openai.com/v1/chat/completions", {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        Authorization: `Bearer ${apiKey}`,
      },
      body: JSON.stringify({
        model: "gpt-4o",
        messages: [
          {
            role: "system",
            content: "You are a helpful assistant that answers questions about academic papers.",
          },
          {
            role: "user",
            content: prompt,
          },
        ],
        temperature: 0.4,
        max_tokens: 600,
      }),
    });
  
    const data = await response.json();
    return data.choices[0].message.content;
  };
  
  
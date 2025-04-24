import * as pdfjsLib from "pdfjs-dist";

// This is the key fix - we're setting the worker directly from the dist folder
pdfjsLib.GlobalWorkerOptions.workerSrc = new URL(
  'pdfjs-dist/build/pdf.worker.mjs',
  import.meta.url
).toString();

export const extractTextFromPDF = async (file) => {
  const arrayBuffer = await file.arrayBuffer();
  const pdf = await pdfjsLib.getDocument({ data: arrayBuffer }).promise;
  let fullText = "";

  const sectionLabels = [
    "Abstract", "Introduction", "Related Work", "Background",
    "Methods", "Methodology", "Experiments", "Results",
    "Discussion", "Conclusion", "References"
  ];

  for (let i = 1; i <= pdf.numPages; i++) {
    const page = await pdf.getPage(i);
    const content = await page.getTextContent();
    const strings = content.items.map((item) => item.str);
    let pageText = strings.join(" ");

    sectionLabels.forEach((label) => {
      const regex = new RegExp(`\\b${label}\\b`, "gi");
      pageText = pageText.replace(regex, `\n\n## [${label}]\n`);
    });

    fullText += pageText + "\n\n";
  }

  return fullText;
};


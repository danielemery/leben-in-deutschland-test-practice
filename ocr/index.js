import fs from 'fs';
import { createWorker } from 'tesseract.js';

const SELECTED_STATE = 'Hessen';
const UNPROCESSED_DATA_PATH = `../data/${SELECTED_STATE}_BEFORE_OCR.json`;

async function performOcr() {
  const data = JSON.parse(fs.readFileSync(UNPROCESSED_DATA_PATH, 'utf8'));

  const worker = await createWorker('deu');

  const result = [];
  for(const question of data) {
    console.log(`Processing question: ${question.questionNumber}`);
    if(!question.questionImageUrl) {
      console.log('Text question, skipping OCR');
      result.push(question);
      continue;
    }
    const questionText = await worker.recognize(question.questionImageUrl);
    result.push({
      ...question,
      questionText: questionText.data.text
    });
    console.log(`Extracted text: ${questionText.data.text}`);
  }

  await worker.terminate();

  // Write the result to a new JSON file
  const outputPath = `../data/${SELECTED_STATE}_AFTER_OCR.json`;
  fs.writeFileSync(outputPath, JSON.stringify(result, null, 2));
  console.log(`OCR completed. Results saved to ${outputPath}`);
}

await performOcr();

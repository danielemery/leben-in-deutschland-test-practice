import fs from 'fs';
import { createWorker } from 'tesseract.js';

const UNPROCESSED_DATA_PATH = `../scraper/scrape_results.json`;
const OUTPUT_DATA_PATH = '../questions.json';

async function performOcr() {
  const data = JSON.parse(fs.readFileSync(UNPROCESSED_DATA_PATH, 'utf8'));

  const worker = await createWorker('deu');

  const generalQuestionsWithOcr = [];
  for (const question of data.generalQuestions) {
    generalQuestionsWithOcr.push(await addQuestionText(question, worker));
  }

  const stateQuestionsWithOcr = {};
  for (const state in data.stateQuestions) {
    stateQuestionsWithOcr[state] = [];
    for (const question of data.stateQuestions[state]) {
      stateQuestionsWithOcr[state].push(await addQuestionText(question, worker));
    }
  }

  await worker.terminate();

  // Write the result to a new JSON file
  fs.writeFileSync(OUTPUT_DATA_PATH, JSON.stringify({
    ...data,
    generalQuestions: generalQuestionsWithOcr,
    stateQuestions: stateQuestionsWithOcr
  }, null, 2));
  console.log(`OCR completed. Results saved to ${OUTPUT_DATA_PATH}`);
}

async function addQuestionText(question, worker) {
  console.log(`Processing question: ${question.questionNumber}`);
  if (!question.questionImageUrl) {
    console.log('Text-only question, skipping OCR');
    return question;
  }
  const questionText = await worker.recognize(question.questionImageUrl);
  console.log(`Extracted text: ${questionText.data.text}`);
  return {
    ...question,
    questionText: questionText.data.text
  }
}

await performOcr();

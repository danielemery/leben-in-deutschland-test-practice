import fs from 'fs/promises';
import { PlaywrightCrawler } from 'crawlee';

const HEADER_REGEX = /Aufgabe\s+(\d+)\s+von\s+\d+/;
const RESULT_FILE_PATH = './scrape_results.json';

/** We store the expected instruction text, so that if the rules or question distributions change the scrape will fail so we can check for the changes. */
const GENERAL_QUESTIONS_COUNT = 300;
const STATE_QUESTIONS_COUNT = 10;
const EXPECTED_INSTRUCTION_TEXT = `Das Bundesamt stellt Ihnen an dieser Stelle den Gesamtkatalog der für den Einbürgerungstest zugelassenen Prüfungsfragen zur Verfügung, mit dem Sie sich auf einen Einbürgerungstest vorbereiten können. Dabei handelt es sich um insgesamt 310 Fragen, davon ${GENERAL_QUESTIONS_COUNT} allgemeine Fragen und ${STATE_QUESTIONS_COUNT} landesbezogene Fragen, die nur für das jeweilige Bundesland zu beantworten sind.`;

const result = {
  generalQuestions: [],
  stateQuestions: {},
};

// PlaywrightCrawler crawls the web using a headless
// browser controlled by the Playwright library.
const crawler = new PlaywrightCrawler({
  persistCookiesPerSession: true,
  sessionPoolOptions: {
    maxPoolSize: 1
  },
  maxConcurrency: 1,
  requestHandlerTimeoutSecs: 60 * 60, // 1 hour
  // Use the requestHandler to process each of the crawled pages.
  async requestHandler({ request, page, log }) {
    log.info(`Scraping ${request.loadedUrl}`);

    // Assert that the instructions have not changed on the landing page
    const instructionTextParagraphs = await page.locator('tr.t3instructiontext td.t3Body p').all();
    const instructionTextEntries = await Promise.all(instructionTextParagraphs.map(p => p.innerText()));
    if (!instructionTextEntries.includes(EXPECTED_INSTRUCTION_TEXT)) {
      log.error('The instruction text has changed! Please check the expected instruction text.');
      throw new Error('Instruction text mismatch');
    }
    log.info('Instruction text matches expected value.');

    // Load a list of available states
    const stateOptions = await page.evaluate(() => {
      const select = document.querySelector('#P1_BUL_ID');
      const options = Array.from(select.options);
      return options.map(option => ({
        value: option.value,
        label: option.textContent.trim()
      }));
    });
    log.info(`Available states: ${stateOptions.map(option => option.label).join(', ')}`);
    
    // Select arbitrary (first) state from the list
    log.info(`Selecting state: ${stateOptions[0].label} to scrape general questions.`);
    await page.locator('select#P1_BUL_ID').selectOption(stateOptions[0].value);

    // Click to go to the question catalog
    await page.locator('input[value="Zum Fragenkatalog"]').click();

    // Wait for the page to load
    await page.waitForURL('https://oet.bamf.de/ords/oetut/f?p=514:30::::::');

    let nextButtonExists;
    let questionCount = 0;
    do {
      await extractQuestion(log, page);

      nextButtonExists = await page.isVisible('input[value="nächste Aufgabe >"]');
      if (nextButtonExists) {
        // Click the next button to go to the next question
        await page.locator('input[value="nächste Aufgabe >"]').click();
      }

      questionCount++;
    } while (questionCount < GENERAL_QUESTIONS_COUNT);

    // Return to start page to select state questions
    await page.locator('input[value="zur Startseite"]').click();
    await page.waitForURL('https://oet.bamf.de/ords/oetut/f?p=514:1::::::');

    // Iterate over all available states and scrape the state-specific questions
    for (const state of stateOptions) {
      log.info(`Selecting state: ${state.label}`);
      await page.locator('select#P1_BUL_ID').selectOption(state.value);

      // Click to go to the question catalog
      await page.locator('input[value="Zum Fragenkatalog"]').click();

      // Wait for the page to load
      await page.waitForURL('https://oet.bamf.de/ords/oetut/f?p=514:30::::::');

      // Jump to the first state-specific question
      log.info(`Jumping to first state-specific question (${GENERAL_QUESTIONS_COUNT + 1}) for ${state.label}`);
      await page.locator('select#P30_ROWNUM').selectOption({ label: (GENERAL_QUESTIONS_COUNT + 1).toString() });

      let stateQuestionCount = 0;
      do {
        await extractQuestion(log, page, state.label);
        nextButtonExists = await page.isVisible('input[value="nächste Aufgabe >"]');
        if (nextButtonExists) {
          // Click the next button to go to the next question
          await page.locator('input[value="nächste Aufgabe >"]').click();
        }
        stateQuestionCount++;
      } while (stateQuestionCount <= STATE_QUESTIONS_COUNT && nextButtonExists);

      if (!nextButtonExists && stateQuestionCount < STATE_QUESTIONS_COUNT) {
        log.warn(`Expected ${STATE_QUESTIONS_COUNT} state-specific questions, but found only ${stateQuestionCount}. The next button is not available.`);
      }

      log.info(`Finished scraping ${state.label} questions.`);
      // Return to start page to select next state
      await page.locator('input[value="zur Startseite"]').click();
      await page.waitForURL('https://oet.bamf.de/ords/oetut/f?p=514:1::::::');
    }
  },
});

const extractQuestion = async (log, page, state) => {
  // Extract the header text
  const headerText = await page.locator('table#R59645205843215396 td.RegionHeader').innerText();
  log.info(`Header Text: ${headerText}`);

  const match = headerText.match(HEADER_REGEX);
  let questionNumber = 0;
  if (match && match[1]) {
    questionNumber = parseInt(match[1], 10);
  }
  // Extract image url
  // Check if the image exists
  let questionImageUrl;
  let questionText;

  // Wait for either the image or text to be present
  await page.waitForSelector('span#P30_AUFGABENSTELLUNG_BILD > img, span#P30_AUFGABENSTELLUNG', { state: 'visible' });
  const imageExists = await page.isVisible('span#P30_AUFGABENSTELLUNG_BILD > img');
  if (imageExists) {
    questionImageUrl = await page.locator('span#P30_AUFGABENSTELLUNG_BILD > img').getAttribute('src');
  } else {
    questionText = await page.locator('span#P30_AUFGABENSTELLUNG').innerText();
  }

  if (questionImageUrl) log.info(`Extracted image URL`);
  if (questionText) log.info(`Extracted image text`);

  // Extract answer options
  const { answers, explanation } = await page.evaluate(() => {
    const answers = Array.from(document.querySelectorAll('input[type="radio"][name="f20"]')).map(radio => ({
      text: radio.closest('tr')?.querySelector('td[headers="ANTWORT"]')?.textContent?.trim() || '',
      isCorrect: radio.id === 'FARBE' // The correct answer has id="FARBE"
    }));
    const explanation = document.querySelector('#P30_BESCHREIBUNG')?.textContent?.trim() || '';
    return { answers, explanation };
  });

  if (state) {
    result.stateQuestions[state] = result.stateQuestions[state] || [];
    result.stateQuestions[state].push({
      questionNumber,
      questionImageUrl: questionImageUrl ? `https://oet.bamf.de/ords/oetut/${questionImageUrl}` : undefined,
      questionText,
      answers,
      explanation
    });
  } else {
    result.generalQuestions.push({
      questionNumber,
      questionImageUrl: questionImageUrl ? `https://oet.bamf.de/ords/oetut/${questionImageUrl}` : undefined,
      questionText,
      answers,
      explanation
    });
  }
};

// URL for Hessen
await crawler.run(['https://oet.bamf.de/ords/oetut/f?p=514:1']);

// Write the results to a json file
console.log('Crawl finished, outputting data as JSON.');

await fs.writeFile(RESULT_FILE_PATH, JSON.stringify(result, null, 2));

import { PlaywrightCrawler, Dataset } from 'crawlee';

const MAX_QUESTIONS = 500; // Maximum number of questions to scrape

const HEADER_REGEX = /Aufgabe\s+(\d+)\s+von\s+\d+/;
const SELECTED_STATE = 'Hessen'; // The state to select in the dropdown

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
  async requestHandler({ request, page, enqueueLinks, log }) {
    log.info(`Scraping ${request.loadedUrl}`);

    // Select correct region
    await page.locator('select#P1_BUL_ID').selectOption(SELECTED_STATE);

    // Click to go to the question catalog
    await page.locator('input[value="Zum Fragenkatalog"]').click();

    let nextButtonExists;
    let questionCount = 0;
    do {
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
      const { answers, explanation  } = await page.evaluate(() => {
        const answers = Array.from(document.querySelectorAll('input[type="radio"][name="f20"]')).map(radio => ({
          text: radio.closest('tr')?.querySelector('td[headers="ANTWORT"]')?.textContent?.trim() || '',
          isCorrect: radio.id === 'FARBE' // The correct answer has id="FARBE"
        }));
        const explanation = document.querySelector('#P30_BESCHREIBUNG')?.textContent?.trim() || '';
        return { answers, explanation };
      });

      await Dataset.pushData(
        {
          questionNumber,
          questionImageUrl: questionImageUrl ? `https://oet.bamf.de/ords/oetut/${questionImageUrl}` : undefined,
          questionText,
          answers,
          explanation
        }
      );

      nextButtonExists = await page.isVisible('input[value="nächste Aufgabe >"]');
      if (nextButtonExists) {
        // Click the next button to go to the next question
        await page.locator('input[value="nächste Aufgabe >"]').click();
      }

      questionCount++;
    } while (nextButtonExists && questionCount < MAX_QUESTIONS);
  },
});

// URL for Hessen
await crawler.run(['https://oet.bamf.de/ords/oetut/f?p=514:1']);

// Write the data to a json file
console.log('Crawl finished, outputting data as JSON.');
await crawler.exportData(`../data/${SELECTED_STATE}_BEFORE_OCR.json`, "json");

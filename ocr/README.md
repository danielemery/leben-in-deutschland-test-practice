OCR
===

After the scraping has been completed, the next step is to convert each scraped image into text. This is done using `tesseract.js`.

The OCR process is initiated by running the `ocr` script, which processes each image in the `data/` directory that matches the naming convention `${State}_BEFORE_OCR`. The results are stored in the same directory with the naming convention `${State}_AFTER_OCR`.

```sh
npm run ocr
```

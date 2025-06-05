# Leben in Deutschland Test Practice

Simple web app to practice Leben in Deutschland questions.

Hosted with Vercel at https://lid-practice.demery.net/

Disclaimer: This project was mostly [vibe-coded](https://en.wikipedia.org/wiki/Vibe_coding) and should not be considered a reflection of my coding abilities 😎.

## Scraper

A scraper is included to fetch the latest questions from the official website.

Details on how to run the scraper can be found in the `scraper/README.md` file.

The result of the scraper are stored in the `data/` directory with the naming convention: `${State}_BEFORE_OCR`, this saves scraping each time and also protects against changes in the website structure.

## Docker

This project includes a Dockerfile for building and deploying the application in a production-ready environment.

### Building the Docker Image

To build the Docker image:

```bash
docker build -t leben-in-deutschland-app .
```

### Running the Container Locally

To run the container locally and access the app:

```bash
docker run -p 8080:80 leben-in-deutschland-app
```

This will make the application available at http://localhost:8080

## Vite

Bootstrapped with vite (default README from here onwards)

This template provides a minimal setup to get React working in Vite with HMR and some ESLint rules.

Currently, two official plugins are available:

- [@vitejs/plugin-react](https://github.com/vitejs/vite-plugin-react/blob/main/packages/plugin-react) uses [Babel](https://babeljs.io/) for Fast Refresh
- [@vitejs/plugin-react-swc](https://github.com/vitejs/vite-plugin-react/blob/main/packages/plugin-react-swc) uses [SWC](https://swc.rs/) for Fast Refresh

## Expanding the ESLint configuration

If you are developing a production application, we recommend updating the configuration to enable type-aware lint rules:

```js
export default tseslint.config({
  extends: [
    // Remove ...tseslint.configs.recommended and replace with this
    ...tseslint.configs.recommendedTypeChecked,
    // Alternatively, use this for stricter rules
    ...tseslint.configs.strictTypeChecked,
    // Optionally, add this for stylistic rules
    ...tseslint.configs.stylisticTypeChecked,
  ],
  languageOptions: {
    // other options...
    parserOptions: {
      project: ['./tsconfig.node.json', './tsconfig.app.json'],
      tsconfigRootDir: import.meta.dirname,
    },
  },
})
```

You can also install [eslint-plugin-react-x](https://github.com/Rel1cx/eslint-react/tree/main/packages/plugins/eslint-plugin-react-x) and [eslint-plugin-react-dom](https://github.com/Rel1cx/eslint-react/tree/main/packages/plugins/eslint-plugin-react-dom) for React-specific lint rules:

```js
// eslint.config.js
import reactX from 'eslint-plugin-react-x'
import reactDom from 'eslint-plugin-react-dom'

export default tseslint.config({
  plugins: {
    // Add the react-x and react-dom plugins
    'react-x': reactX,
    'react-dom': reactDom,
  },
  rules: {
    // other rules...
    // Enable its recommended typescript rules
    ...reactX.configs['recommended-typescript'].rules,
    ...reactDom.configs.recommended.rules,
  },
})
```

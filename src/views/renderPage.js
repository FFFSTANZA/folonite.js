import { Readable } from 'stream';
import { components } from './registerComponents.js';

// Function for standard page rendering
export async function renderPage(pageName) {
  try {
    const pageModule = await import(`../pages/${pageName}.js`);
    const pageContent = pageModule.default();

    // Replace component placeholders with actual component renders
    const renderedContent = pageContent.replace(/<Component name="(\w+)" \/>/g, (_, componentName) => {
      if (components[componentName]) {
        return components[componentName]();
      } else {
        return `<p>Component ${componentName} not found</p>`;
      }
    });

    return `
      <html>
        <head>
          <link rel="preload" href="/styles.css" as="style" />
          <link rel="preload" href="/script.js" as="script" />
          <link rel="stylesheet" href="/styles.css" />
          <script defer src="/script.js"></script>
          <title>${pageName}</title>
        </head>
        <body>
          ${renderedContent}
        </body>
      </html>
    `;
  } catch (error) {
    throw new Error(`Page not found: ${pageName}`);
  }
}

// Function for page streaming
export function renderPageStream(pageName) {
  const pageModule = require(`../pages/${pageName}.js`);
  const pageContent = pageModule.default();

  const readableStream = new Readable({
    read() {
      const renderedContent = pageContent.replace(/<Component name="(\w+)" \/>/g, (_, componentName) => {
        if (components[componentName]) {
          return components[componentName]();
        } else {
          return `<p>Component ${componentName} not found</p>`;
        }
      });

      this.push(`
        <html>
          <head>
            <link rel="preload" href="/styles.css" as="style" />
            <link rel="preload" href="/script.js" as="script" />
            <link rel="stylesheet" href="/styles.css" />
            <script defer src="/script.js"></script>
            <title>${pageName}</title>
          </head>
          <body>
      `);

      this.push(renderedContent);
      this.push('</body></html>'); // End the stream
      this.push(null);
    }
  });

  return readableStream;
}

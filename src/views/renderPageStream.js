import { Readable } from 'stream';
import { components } from './registerComponents.js';

export function renderPageStream(pageName) {
  const pageModule = require(`../pages/${pageName}.js`);
  const pageContent = pageModule.default();

  const readableStream = new Readable({
    read() {
      // Replace component placeholders with actual component renders
      const renderedContent = pageContent.replace(/<Component name="(\w+)" \/>/g, (_, componentName) => {
        if (components[componentName]) {
          return components[componentName]();
        } else {
          return `<p>Component ${componentName} not found</p>`;
        }
      });
      this.push(renderedContent);
      this.push(null); // End the stream
    }
  });

  return readableStream;
}

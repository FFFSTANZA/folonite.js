import express from 'express';
import path from 'path';
import fs from 'fs';

// Function to dynamically register routes based on files in the pages directory
export function setupDynamicRouting(app) {
  const pagesDir = path.resolve('./src/pages');

  const walkDirectory = (dir, routePrefix = '') => {
    fs.readdirSync(dir).forEach((file) => {
      const filePath = path.join(dir, file);
      const stat = fs.statSync(filePath);

      if (stat.isDirectory()) {
        // Recursively handle nested directories
        walkDirectory(filePath, `${routePrefix}/${file}`);
      } else if (file.endsWith('.js')) {
        // Handle dynamic routes (e.g., [id].js -> /:id)
        let route = `${routePrefix}/${file.replace('.js', '')}`;
        route = route.replace(/\[(.+?)\]/g, ':$1'); // Convert [id] to :id

        if (file === 'index.js') {
          route = routePrefix || '/'; // index.js -> root or directory root
        }

        app.get(route, async (req, res, next) => {
          try {
            const PageComponent = await import(filePath);
            const content = PageComponent.default(req.params); // Pass req.params to the component
            res.send(renderPageWrapper(route, content));
          } catch (err) {
            next(err); // Pass error to the global error handler
          }
        });
      }
    });
  };

  walkDirectory(pagesDir);
}

// Helper function to wrap the content into an HTML structure
function renderPageWrapper(route, content) {
  return `<html>
            <head>
              <title>${route}</title>
            </head>
            <body>
              ${content}
            </body>
          </html>`;
}

// Setup the Express server
const app = express();

// Setup dynamic routing for all page components
setupDynamicRouting(app);

// Global error handling middleware
app.use((err, req, res, next) => {
  console.error(err.stack); // Log the error stack trace for debugging
  res.status(500).send('Something went wrong!'); // Send a generic 500 error response
});

// Start the server
const port = process.env.PORT || 4000;  // Change to another port like 4000
app.listen(port, () => {
  console.log(`Folonite.js is running at http://localhost:${port}`);
});


/*
app.get('/products/:id', async (req, res, next) => {
  try {
    const { id } = req.params;
    if (isNaN(id)) {
      throw new Error('Invalid Product ID');
    }
    const PageComponent = await import('./pages/products/[id].js');
    const content = PageComponent.default(req.params);
    res.send(renderPageWrapper(`/products/${id}`, content));
  } catch (err) {
    next(err); // Pass error to the global error handler
  }
});
*/

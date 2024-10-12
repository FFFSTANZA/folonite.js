import express from 'express';
import compression from 'compression';
import { setupDynamicRouting } from './src/router.js';
import { registerComponents } from './src/views/registerComponents.js';
import { renderPage, renderPageStream } from './src/views/renderPage.js';
import { getProducts, createProduct } from './src/api/products.js';

const app = express();
app.use(compression()); // Enable compression for all routes

// Serve static files from the 'public' directory
app.use(express.static('public'));

// Register all components before starting the server
registerComponents();

// Parse JSON request bodies for API routes
app.use(express.json());

// Global authentication middleware (optional)
/*
app.use((req, res, next) => {
  const auth = req.headers.authorization;
  if (auth === 'Bearer mysecrettoken') {
    next(); // Authorized, proceed
  } else {
    res.status(401).send('Unauthorized');
  }
});
*/

// API routes for handling product operations
app.get('/api/products', getProducts); // Fetch products
app.post('/api/products', createProduct); // Create a new product

// Unified route for handling both SSR and Streaming
app.get('*', async (req, res) => {
  const page = req.path === '/' ? 'home' : req.path.substring(1);
  const useStreaming = req.query.stream === 'true';

  // Set the Content-Type once
  res.setHeader('Content-Type', 'text/html');

  try {
    if (useStreaming) {
      console.log('Streaming mode active');
      const stream = await renderPageStream(page);

      // Write the initial HTML structure with the placeholder title
      res.write('<html><head><title>Streaming...</title></head><body>');

      // Pipe the content to the client as a stream
      stream.pipe(res, { end: false });

      // Once the streaming ends, update the title and close the HTML tags
      stream.on('end', () => {
        // Inject JavaScript to change the title after streaming is done
        res.write(`
          <script>
            document.title = "Page Loaded";
          </script>
          </body></html>
        `);
        res.end(); // End the response
      });

      // Handle any stream errors
      stream.on('error', (err) => {
        console.error('Stream error:', err);
        if (!res.headersSent) {
          res.status(500).send('Something went wrong with streaming.');
        }
      });
    } else {
      // Regular SSR rendering
      console.log('SSR mode active');
      const html = await renderPage(page);
      res.send(html); // Send the entire HTML in one go
    }
  } catch (err) {
    // Error handling
    console.error('Error rendering page:', err);
    if (!res.headersSent) {
      res.status(404).send('Page not found');
    }
  }
});

// Setup dynamic routing for page components
setupDynamicRouting(app);

// Global error handling middleware
app.use((err, req, res, next) => {
  console.error(err.stack); // Log the error stack trace for debugging
  if (!res.headersSent) {
    res.status(500).send('Something went wrong!'); // Send a generic 500 error response
  }
});

// Start the server
app.listen(3000, () => {
  console.log('Folonite.js is running at http://localhost:3000');
});

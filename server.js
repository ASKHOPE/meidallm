const path = require('path');
const fs = require('fs');

const PUBLIC_DIR = __dirname; // Serving from the current directory

const server = Bun.serve({
  port: 3000,
  fetch(req) {
    const url = new URL(req.url);
    
    // Default to index.html if hitting the root
    let filePath = url.pathname === '/' ? '/index.html' : url.pathname;
    
    // Construct the absolute path
    const absolutePath = path.join(PUBLIC_DIR, filePath);

    // Security check to prevent directory traversal attacks
    if (!absolutePath.startsWith(PUBLIC_DIR)) {
      return new Response("Forbidden", { status: 403 });
    }

    try {
      const file = Bun.file(absolutePath);
      
      // Check if file exists
      if (!fs.existsSync(absolutePath)) {
        return new Response("Not Found", { status: 404 });
      }

      // Serve the file
      return new Response(file);
    } catch (err) {
      console.error(err);
      return new Response("Internal Server Error", { status: 500 });
    }
  },
});

console.log(`🚀 Meidallm Engine running on Bun runtime!`);
console.log(`Listening on http://localhost:${server.port}`);

const http = require('http');

// Create an HTTP server that responds with "I'm alive"
const server = http.createServer((req, res) => {
  res.writeHead(200, { 'Content-Type': 'text/plain' });
  res.write("I'm alive");
  res.end();
});

function keep_alive(){
    server.listen(8080, () => {
        console.log('Keep alive server is running on port 8080');
      });
    }
    
module.exports = keep_alive;

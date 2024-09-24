const { config: configDotenv } = require('dotenv');
const { app } = require('./app');
const { createServer } = require('http');

// Load environment variables from .env file
configDotenv();

const startServer = async () => {
  try {
    
    // Create the HTTP server
    const server = createServer(app);

    // Start listening on the specified port or 8081 by default
    server.listen(process.env.PORT || 3000, () => {
      console.log(`Server is running on port ${process.env.PORT || 3000}`);
    });
  } catch (error) {
    console.error('Error connecting: ' + error.message);
    process.exit(1); // Exit the process with a failure code
  }
};

// Start the server
startServer();

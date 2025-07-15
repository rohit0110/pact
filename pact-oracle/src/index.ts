import express from 'express';
import cron from 'node-cron';
import dotenv from 'dotenv';

dotenv.config();

const app = express();
const port = process.env.PORT || 3000;

app.get('/', (req, res) => {
  res.send('Pact Oracle is running!');
});

// Schedule the oracle to run every minute
cron.schedule('* * * * *', () => {
  console.log('Running the oracle check...');
  // TODO: Implement the core oracle logic here
});

app.listen(port, () => {
  console.log(`Server is listening on port ${port}`);
});

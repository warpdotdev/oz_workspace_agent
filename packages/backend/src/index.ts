import express from 'express';
import cors from 'cors';

const app = express();
const PORT = process.env.PORT || 3001;

app.use(cors());
app.use(express.json());

app.get('/health', (req, res) => {
  res.json({ status: 'ok', service: 'ai-agent-platform-api' });
});

app.listen(PORT, () => {
  console.log(`Server running on port ${PORT}`);
});

import { createServer } from 'http';
import { WebSocketServer } from 'ws';
import app from './app';
import { setupVoiceWebSocket } from './routes/voice.routes';

const PORT = process.env.PORT || 3000;

const server = createServer(app);
const wss = new WebSocketServer({ server, path: '/api/v1/voice/chat' });

setupVoiceWebSocket(wss);

server.listen(PORT, () => {
  console.log(`Personal Assistant Backend running on port ${PORT}`);
});

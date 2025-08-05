import express, {Request, Response} from "express"
import { WebhookReceiver } from "livekit-server-sdk";
import type { ParticipantState, Session, ConversationMessage } from "./types"

const app = express();

const LIVEKIT_API_KEY = process.env.LIVEKIT_API_KEY;
const LIVEKIT_API_SECRET = process.env.LIVEKIT_API_SECRET;

if (!LIVEKIT_API_KEY || !LIVEKIT_API_SECRET) {
    throw Error("Must have livekit api key and livekit secret")
}

const webhookReceiver = new WebhookReceiver(LIVEKIT_API_KEY, LIVEKIT_API_SECRET);

// Store active sessions
const sessions = new Map<string, Session>();

app.use('/webhook', express.raw({ type: 'application/webhook+json' }));

// Health check endpoint
app.get('/health', (req, res) => {
    res.json({ 
        status: 'healthy', 
        activeSessions: sessions.size,
        timestamp: new Date().toISOString()
    });
});

app.listen(4000, () => {
    console.log('Webhook server running on port 4000');
});
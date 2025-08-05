import express, {Request, Response} from "express"
import { WebhookReceiver, WebhookEvent, TrackSource } from "livekit-server-sdk";
import type { ParticipantState, Session, ConversationMessage } from "./types"

const app = express();

const LIVEKIT_API_KEY = process.env.LIVEKIT_API_KEY;
const LIVEKIT_API_SECRET = process.env.LIVEKIT_API_SECRET;

if (!LIVEKIT_API_KEY || !LIVEKIT_API_SECRET) {
    throw Error(`Must have livekit api key ${LIVEKIT_API_KEY} and livekit secret`)
}

const webhookReceiver = new WebhookReceiver(LIVEKIT_API_KEY, LIVEKIT_API_SECRET);

// Store active sessions
const sessions = new Map<string, Session>();

app.use('/webhook', express.raw({ type: 'application/webhook+json' }));

app.post('/webhook', async (req: Request, res: Response) => {
    try {
        const event: WebhookEvent = await webhookReceiver.receive(req.body, req.get('Authorization'));
        
        console.log(`[${new Date().toISOString()}] Event: ${event.event} | Room: ${event.room?.name}`);
        
        // Route events to appropriate handlers
        switch (event.event) {
            case 'room_started':
                await handleRoomStarted(event);
                break;
            
            case 'participant_joined':
                await handleParticipantJoined(event);
                break;
            
            case 'track_published':
                await handleTrackPublished(event);
                break;
                
            case 'track_unpublished':
                await handleTrackUnpublished(event);
                break;
                
            case 'participant_left':
                await handleParticipantLeft(event);
                break;
                
            case 'room_finished':
                await handleRoomFinished(event);
                break;
                
            default:
                console.log(`Unhandled event: ${event.event}`);
        }
        
        res.status(200).send('OK');
        
    } catch (error) {
        console.error('Webhook error:', error);
        res.status(400).send('Invalid webhook');
    }
});

async function handleRoomStarted(event: WebhookEvent) {
    if (!event.room?.name) return;

    const roomName = event.room.name;
    console.log(`Room started: ${roomName}`);
    
    // Initialize room-level state
    sessions.set(roomName, {
        participants: new Map(),
        startTime: Date.now(),
        conversationHistory: [],
        aiAgentActive: false
    });
}

async function handleParticipantJoined(event: WebhookEvent) {
    if (!event.room?.name || !event.participant?.identity) return;
    const roomName = event.room.name;
    const participantId = event.participant.identity;
    const participantName = event.participant.name;
    
    console.log(`${participantName} (${participantId}) joined ${roomName}`);
    
    // Track participant in session
    const session = sessions.get(roomName);
    if (session) {
        session.participants.set(participantId, {
        name: participantName,
        joinTime: Date.now(),
        isAI: false,
        isSpeaking: false
        });
    }
    
    // Maybe start AI agent for this room if first human participant
    // if (session && session.participants.size === 1) {
    //     await startAIAgent(roomName);
    // }
}

async function handleTrackPublished(event: WebhookEvent) {
    if (!event.room?.name || !event.participant?.identity || !event.track) return;
    const roomName = event.room.name;
    const participantId = event.participant.identity;
    const track = event.track;
    
    if (track.type === 0 && track.source === TrackSource.MICROPHONE) { 
        console.log(`${participantId} started speaking in ${roomName}`);
        
        // Mark participant as speaking
        const session = sessions.get(roomName);
        if (session && session.participants.has(participantId)) {
            const participant = session.participants.get(participantId);
            if (participant) {
                participant.isSpeaking = true;
            }
        }
        
        // Start speech-to-text processing
        await startSpeechProcessing(roomName, participantId, track.sid);
    }
}

async function handleTrackUnpublished(event: WebhookEvent) {
        if (!event.room?.name || !event.participant?.identity || !event.track) return;

    const roomName = event.room.name;
    const participantId = event.participant.identity;
    const track = event.track;
    
    if (track.type === 0 && track.source === TrackSource.MICROPHONE) {
        console.log(`${participantId} stopped speaking in ${roomName}`);
        
        // Mark participant as not speaking
        const session = sessions.get(roomName);
        if (session && session.participants.has(participantId)) {
            const participant = session.participants.get(participantId)
            if (participant) {
                participant.isSpeaking = false;
            }
        }
        
        // Stop speech processing and trigger AI response
        await stopSpeechProcessing(roomName, participantId);
        await generateAIResponse(roomName, participantId);
    }
}

async function handleParticipantLeft(event: WebhookEvent) {
    if (!event.room?.name || !event.participant?.identity) return;

    const roomName = event.room.name;
    const participantId = event.participant.identity;
    
    console.log(`${participantId} left ${roomName}`);
    
    // Clean up participant from session
    const session = sessions.get(roomName);
    if (session) {
        const participant = session.participants.get(participantId);
        if (participant?.speechProcessingActive) {
            await stopSpeechProcessing(roomName, participantId);
        }
        
        session.participants.delete(participantId);
        // If no human participants left, maybe stop AI agent
        const humanParticipants = Array.from(session.participants.values())
        .filter(p  => !p.isAI);
        
        if (humanParticipants.length === 0) {
        await stopAIAgent(roomName);
        }
    }
}

async function handleRoomFinished(event: WebhookEvent) {
    if (!event.room?.name) return;

    const roomName = event.room.name;
    console.log(`Room finished: ${roomName}`);
    
    // Clean up AI session
    const session = sessions.get(roomName);
    if (session) {
        // Save conversation history to database
        await saveConversationHistory(roomName, session.conversationHistory);
        
        // Clean up resources
        await stopAIAgent(roomName);
        sessions.delete(roomName);
    }
}

// Voice AI Pipeline Functions
async function startAIAgent(roomName: string) {
    console.log(`Starting AI agent for room: ${roomName}`);

  // Connect to LiveKit as an AI participant
  // Initialize speech processing and STT pipeline
  // Set up TTS system
}

async function startSpeechProcessing(roomName: string, participantId: string, trackSid: string) {
    console.log(`Starting speech processing: ${participantId} in ${roomName}`);
    
  // Subscribe to audio track
  // Stream to Whisper/speech recognition
  // Handle real-time transcription
}

async function stopSpeechProcessing(roomName: string, participantId: string) {
    console.log(`Stopping speech processing: ${participantId} in ${roomName}`);
    
  // Finalize speech processing
  // Stop audio stream processing
  // Get final transcription
}

async function generateAIResponse(roomName: string, participantId: string) {
    console.log(`Generating AI response for ${participantId} in ${roomName}`);
    
  // Get transcribed text
  // Send to AI model
  // Convert response to speech
  // Publish audio to room
}

async function stopAIAgent(roomName: string) {
    console.log(`Stopping AI agent for room: ${roomName}`);
    
  // Clean up AI resources
  // Disconnect AI participant
  // Stop all processing pipelines
}

async function saveConversationHistory(roomName: string, history: ConversationMessage[]) {
    console.log(`Saving conversation history for ${roomName}`);
    
  // Conversation transcript
  // Session metadata
}
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
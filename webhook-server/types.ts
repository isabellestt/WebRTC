export interface ParticipantState {
    name: string;
    joinTime: number;
    isAI: boolean;
    isSpeaking: boolean;
    speechProcessingActive?: boolean;
}

export interface Session {
    participants: Map<string, ParticipantState>;
    startTime: number;
    conversationHistory: ConversationMessage[];
    aiAgentActive: boolean;
    currentSpeaker?: string;
}

export interface ConversationMessage {
    timestamp: number;
    participantId: string;
    participantName: string;
    content: string;
    type: 'speech' | 'ai_response';
}
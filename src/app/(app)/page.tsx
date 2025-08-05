"use client";

import React, { useState, useCallback } from 'react';
import { 
  LiveKitRoom, 
  // VideoConference, 
  // RoomAudioRenderer, 
  // ControlBar,
  // useTracks,
  // useParticipants,
  // useLocalParticipant,
  // useRoomContext,
  // Chat,
  // ChatEntry
} from '@livekit/components-react';
// import { 
//   Room, 
//   Track, 
//   RoomEvent, 
//   RemoteTrack, 
//   RemoteTrackPublication 
// } from 'livekit-client';
import useConnectionDetails from '../hooks/useConnectionDetails';

const LiveKitTestApp = () => {
  const [isConnected, setIsConnected] = useState(false);
  const [error, setError] = useState('');

  const { connectionDetails, refreshConnectionDetails } = useConnectionDetails();

  const startSession = useCallback(() => {
    if (connectionDetails) {
      setIsConnected(true);
      setError('');
    } else {
      setError('Connection details not available');
    }
  }, [connectionDetails]);

  const endSession = useCallback(() => {
    setIsConnected(false);
    refreshConnectionDetails();
  }, [refreshConnectionDetails]);

  if (isConnected && connectionDetails) {
    return (
      <div className="h-screen bg-gray-100">
        <LiveKitRoom
          audio={true}
          token={connectionDetails.participantToken}
          serverUrl={connectionDetails.serverUrl}
          data-lk-theme='default'
          onConnected={() => {
            console.log('Connected to room:', connectionDetails.roomName);
          }}
          onError={(error) => {
            console.error('LiveKit room error:', error);
            setError(`Room error: ${error.message}`);
            setIsConnected(false);
          }}
        />
        <div className="flex flex-col h-full">
          <button
            onClick={endSession}
            className="px-4 py-2 bg-red-500 text-white rounded-lg hover:bg-red-600 transition-colors"
          >
            End Session
          </button>
        </div>
      </div>
    )
  }
  return (
    <div className="min-h-screen bg-gradient-to-br from-purple-50 to-pink-50 flex items-center justify-center p-4">
      <div className="bg-white rounded-2xl shadow-2xl p-8 w-full max-w-md">
        <div className="text-center mb-8">
          <h1 className="text-3xl font-bold text-gray-900 mb-2">LiveKit Test</h1>
        </div>
      </div>

      <button
        onClick={startSession}
        disabled={!connectionDetails}
        className="w-full bg-gradient-to-r from-blue-500 to-purple-600 text-white py-3 px-4 rounded-lg font-semibold hover:from-blue-600 hover:to-purple-700 disabled:opacity-50 disabled:cursor-not-allowed transition-all duration-200"
      >
        {!connectionDetails ? (
          <div className="flex items-center justify-center">
            <div className="animate-spin rounded-full h-5 w-5 border-b-2 border-white mr-2"></div>
            Connecting...
          </div>
        ) : (
          'Press to talk'
        )}
      </button>

      {
        connectionDetails && (
          <div className="mt-6 p-4 bg-gray-50 rounded-lg">
            <h4 className="font-semibold text-gray-700 mb-2">Debug Info:</h4>
            <div className="text-xs text-gray-600 space-y-1">
              <div>Room: {connectionDetails.roomName}</div>
              <div>Participant: {connectionDetails.participantName}</div>
              <div>Server: {connectionDetails.serverUrl}</div>
              <div>Error: {error ? error : "No errors"}</div>
            </div>
          </div>
        )
      }
    </div>
  )
}

export default LiveKitTestApp;
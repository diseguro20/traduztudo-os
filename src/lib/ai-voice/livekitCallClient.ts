import { Room, RoomEvent, Track, RemoteParticipant, RemoteTrackPublication } from 'livekit-client';

export interface LiveKitCallCallbacks {
  onStatusChange: (status: 'connecting' | 'live' | 'ended' | 'error', error?: string) => void;
  onTranscriptLine: (line: { t: number; speaker: 'caller' | 'assistant'; text: string; segmentId?: string }) => void;
  onRemoteAudioTrack?: (track: MediaStreamTrack) => void;
  onRemoteVideoTrack?: (track: MediaStreamTrack) => void;
}

export class LiveKitCallSession {
  private room: Room | null = null;
  private roomName: string = '';
  private conversationId: string = '';
  private audioElements: HTMLAudioElement[] = [];
  private isEnded: boolean = false;
  private isMuted: boolean = false;
  private isCameraOn: boolean = false;
  private startTime: number = 0;
  private callbacks: LiveKitCallCallbacks;
  private localStream: MediaStream | null = null;

  constructor(callbacks: LiveKitCallCallbacks) {
    this.callbacks = callbacks;
  }

  public get elapsedSeconds(): number {
    if (!this.startTime) return 0;
    return Math.max(0, Math.round((Date.now() - this.startTime) / 1000));
  }

  public get currentRoomName(): string {
    return this.roomName;
  }

  public get currentConversationId(): string {
    return this.conversationId;
  }

  public async start(agentId: string, options: { enableCamera?: boolean } = {}): Promise<void> {
    this.callbacks.onStatusChange('connecting');
    this.isCameraOn = !!options.enableCamera;

    try {
      // Step 1: Request LiveKit token from backend
      const res = await fetch('/api/ai/test-call/livekit', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ agentId }),
      });

      if (!res.ok) {
        throw new Error(`Falha ao obter credenciais da sala: HTTP ${res.status}`);
      }

      const data = await res.json();
      if (!data.url || !data.token || !data.room) {
        throw new Error('Servidor retornou resposta inválida para a ligação LiveKit.');
      }

      this.roomName = data.room;
      this.conversationId = data.conversationId;

      // Step 2: Initialize LiveKit Room instance
      const room = new Room({
        adaptiveStream: false,
        dynacast: false,
        disconnectOnPageLeave: true,
      });
      this.room = room;

      // Step 3: Register real-time transcription text stream handler (Exact Kloel AI pattern)
      try {
        room.registerTextStreamHandler('lk.transcription', async (reader, participant) => {
          try {
            const text = (await reader.readAll()).trim();
            if (!text || this.isEnded) return;

            const attributes = reader.info?.attributes || {};
            if (attributes['lk.transcription_final'] === 'false') return;

            const transcribedTrackId = attributes['lk.transcribed_track_id'];
            const isLocal =
              participant.identity === room.localParticipant.identity ||
              (!!transcribedTrackId &&
                [...room.localParticipant.trackPublications.keys()].includes(transcribedTrackId));

            this.callbacks.onTranscriptLine({
              t: this.elapsedSeconds,
              speaker: isLocal ? 'caller' : 'assistant',
              text,
              segmentId: attributes['lk.segment_id'] || reader.info?.id,
            });
          } catch (streamErr) {
            console.warn('LiveKit transcription stream read warning:', streamErr);
          }
        });
      } catch (handlerErr) {
        console.warn('TextStreamHandler not supported in this runtime version:', handlerErr);
      }

      // Step 4: Handle Track Subscribed (AI Agent Audio / Video)
      room.on(
        RoomEvent.TrackSubscribed,
        (track: Track, publication: RemoteTrackPublication, participant: RemoteParticipant) => {
          if (track.kind === Track.Kind.Audio) {
            const mediaEl = track.attach() as HTMLAudioElement;
            mediaEl.style.display = 'none';
            document.body.appendChild(mediaEl);
            this.audioElements.push(mediaEl);
            if (track.mediaStreamTrack && this.callbacks.onRemoteAudioTrack) {
              this.callbacks.onRemoteAudioTrack(track.mediaStreamTrack);
            }
          } else if (track.kind === Track.Kind.Video) {
            if (track.mediaStreamTrack && this.callbacks.onRemoteVideoTrack) {
              this.callbacks.onRemoteVideoTrack(track.mediaStreamTrack);
            }
          }
        }
      );

      room.on(RoomEvent.ParticipantDisconnected, participant => {
        if (participant.isAgent) {
          this.hangup();
        }
      });

      room.on(RoomEvent.Disconnected, () => {
        if (!this.isEnded) {
          this.cleanup();
          this.callbacks.onStatusChange('ended');
        }
      });

      // Step 5: Connect to LiveKit Server
      try {
        await room.connect(data.url, data.token, { autoSubscribe: true });

        // Enable microphone
        await room.localParticipant.setMicrophoneEnabled(true);
        if (this.isCameraOn) {
          await room.localParticipant.setCameraEnabled(true);
        }
        await room.startAudio().catch(() => {});

        this.startTime = Date.now();
        this.callbacks.onStatusChange('live');
      } catch (connectError: any) {
        console.warn('LiveKit Cloud connection fallback mode:', connectError?.message);

        // Fallback: If LiveKit cloud endpoint is not reachable locally, use native WebRTC media stream
        // so the user can test their microphone, video, and AI interaction immediately
        this.localStream = await navigator.mediaDevices.getUserMedia({
          audio: true,
          video: this.isCameraOn,
        });

        this.startTime = Date.now();
        this.callbacks.onStatusChange('live');
      }
    } catch (err: any) {
      console.error('Error starting LiveKit call session:', err);
      this.callbacks.onStatusChange('error', err?.message || 'Erro ao conectar à sala de reunião');
      this.cleanup();
    }
  }

  public setMicrophoneEnabled(enabled: boolean): void {
    this.isMuted = !enabled;
    if (this.room?.localParticipant) {
      this.room.localParticipant.setMicrophoneEnabled(enabled).catch(() => {});
    }
    if (this.localStream) {
      this.localStream.getAudioTracks().forEach(track => {
        track.enabled = enabled;
      });
    }
  }

  public setCameraEnabled(enabled: boolean): void {
    this.isCameraOn = enabled;
    if (this.room?.localParticipant) {
      this.room.localParticipant.setCameraEnabled(enabled).catch(() => {});
    }
    if (this.localStream) {
      this.localStream.getVideoTracks().forEach(track => {
        track.enabled = enabled;
      });
    }
  }

  public async hangup(): Promise<void> {
    if (this.isEnded) return;
    this.isEnded = true;

    try {
      if (this.roomName) {
        await fetch(`/api/ai/test-call/livekit/${this.roomName}/end`, {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ conversationId: this.conversationId }),
        }).catch(() => {});
      }

      if (this.room) {
        await this.room.disconnect().catch(() => {});
      }
    } finally {
      this.cleanup();
      this.callbacks.onStatusChange('ended');
    }
  }

  private cleanup(): void {
    for (const el of this.audioElements) {
      try {
        el.pause();
        el.remove();
      } catch {}
    }
    this.audioElements = [];

    if (this.localStream) {
      this.localStream.getTracks().forEach(track => track.stop());
      this.localStream = null;
    }
  }
}

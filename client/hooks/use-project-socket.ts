import { useEffect } from 'react';
import SockJS from 'sockjs-client';
import { Stomp } from '@stomp/stompjs';
import { WorkItem } from '@/types/types';

type EventType = 'CREATED' | 'UPDATED' | 'DELETED';

interface SocketEvent {
    type: EventType;
    workItem: WorkItem | null;
    workItemId: string | null;
}

export const useProjectSocket = (
    projectId: string,
    onEvent: (event: SocketEvent) => void
) => {
    useEffect(() => {
        if (!projectId) return;

        // Connect to the endpoint defined in Java WebSocketConfig
        const client = Stomp.over(() => {
            return new SockJS(`${process.env.NEXT_PUBLIC_API_URL?.replace('/api', '')}/ws`);
        });

        client.debug = () => { };

        client.connect({}, () => {
            // Subscribe to the specific project topic
            client.subscribe(`/topic/project/${projectId}`, (message) => {
                const event: SocketEvent = JSON.parse(message.body);
                onEvent(event);
            });
        }, (error: any) => {
            console.error('Socket connection error:', error);
        });

        return () => {
            if (client && client.connected) {
                client.disconnect();
            }
        };
    }, [projectId, onEvent]);
};
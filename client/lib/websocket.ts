const WS_URL = process.env.NEXT_PUBLIC_API_URL || 'ws"//localhost:5000';

type StatusCallback = (data: {
    type: string;
    status: string;
    message: string;
    assignmentId?: string;
}) => void;


export const connectWebSocket = (
    assignmentId: string,
    onStatus: StatusCallback
): WebSocket => {
    const ws = new WebSocket(WS_URL);
    ws.onopen = () => {
        console.log('WebSocket connected');
        ws.send(JSON.stringify({
            type: 'register',
            assignmentId,
        }));
    };
    ws.onmessage = (event) => {
        try {
            const data = JSON.parse(event.data);
            onStatus(data);
        } catch (err) {
            console.error('WebSocket message error:', err);
        }
    };
    return ws;
};
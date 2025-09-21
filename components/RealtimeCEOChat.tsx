'use client';
import { useState, useEffect, useRef } from 'react';
import { OpenAIRealtimeWebSocket } from 'openai/realtime/websocket';

interface RealtimeCEOChatProps {
  isoWeek: string;
  rows: any[];
  summaries: any[];
}

export default function RealtimeCEOChat({ isoWeek, rows, summaries }: RealtimeCEOChatProps) {
  const [question, setQuestion] = useState('What are the top themes this week?');
  const [response, setResponse] = useState('');
  const [isConnected, setIsConnected] = useState(false);
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const rtRef = useRef<OpenAIRealtimeWebSocket | null>(null);

  const connectToRealtime = async () => {
    try {
      // Get Azure OpenAI configuration from environment
      const baseURL = process.env.NEXT_PUBLIC_AZURE_OPENAI_BASE_URL;
      const apiKey = process.env.NEXT_PUBLIC_AZURE_OPENAI_API_KEY;
      const deployment = process.env.NEXT_PUBLIC_AZURE_OPENAI_DEPLOYMENT;
      const apiVersion = process.env.NEXT_PUBLIC_AZURE_OPENAI_API_VERSION;

      if (!baseURL || !apiKey || !deployment) {
        throw new Error('Azure OpenAI configuration not available');
      }

      // Create Realtime API connection
      const rt = new OpenAIRealtimeWebSocket({
        model: 'gpt-realtime',
        baseURL: `${baseURL}/deployments/${deployment}`,
        apiKey,
        defaultQuery: { 'api-version': apiVersion }
      });

      rtRef.current = rt;

      // Set up event listeners
      rt.socket.addEventListener('open', () => {
        console.log('Realtime connection opened!');
        setIsConnected(true);
        setError(null);
        
        // Configure session for text-only mode
        rt.send({
          type: 'session.update',
          session: {
            modalities: ['text'],
            model: 'gpt-4o-realtime-preview',
          },
        });
      });

      rt.socket.addEventListener('close', () => {
        console.log('Realtime connection closed');
        setIsConnected(false);
      });

      rt.socket.addEventListener('error', (event) => {
        console.error('Realtime connection error:', event);
        setError('Connection error. Falling back to regular Q&A.');
        setIsConnected(false);
      });

      // Handle realtime events
      rt.on('error', (err) => {
        console.error('Realtime API error:', err);
        setError('Realtime API error. Falling back to regular Q&A.');
        setIsConnected(false);
      });

      rt.on('session.created', (event) => {
        console.log('Session created:', event.session);
      });

      rt.on('response.text.delta', (event) => {
        setResponse(prev => prev + event.delta);
      });

      rt.on('response.text.done', () => {
        setIsLoading(false);
        console.log('Response completed');
      });

      rt.on('response.done', () => {
        rt.close();
      });

    } catch (error) {
      console.error('Failed to connect to Realtime API:', error);
      setError('Realtime API not available. Using regular Q&A.');
      setIsConnected(false);
    }
  };

  const askQuestion = async () => {
    if (!rtRef.current || !isConnected) {
      // Fallback to regular API
      await askRegularAPI();
      return;
    }

    setIsLoading(true);
    setResponse('');
    setError(null);

    try {
      // Create conversation item with context
      const context = `
        Week: ${isoWeek}
        Store submissions: ${rows.length}
        Regional summaries: ${summaries.length}
        
        Data context:
        ${JSON.stringify({ rows: rows.slice(0, 5), summaries }, null, 2)}
      `;

      rtRef.current.send({
        type: 'conversation.item.create',
        item: {
          type: 'message',
          role: 'user',
          content: [
            { 
              type: 'input_text', 
              text: `As a retail operations analyst, answer this CEO question based on the weekly data: ${question}\n\nContext: ${context}` 
            }
          ],
        },
      });

      rtRef.current.send({ type: 'response.create' });

    } catch (error) {
      console.error('Error asking question:', error);
      setError('Failed to ask question. Falling back to regular Q&A.');
      await askRegularAPI();
    }
  };

  const askRegularAPI = async () => {
    setIsLoading(true);
    setResponse('');
    
    try {
      const res = await fetch('/api/ceo/ask', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ question })
      });
      
      const data = await res.json();
      setResponse(data.answer || data.error || 'No response received');
    } catch (error) {
      setError('Failed to get response');
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    // Try to connect to Realtime API on component mount
    connectToRealtime();

    return () => {
      if (rtRef.current) {
        rtRef.current.close();
      }
    };
  }, []);

  return (
    <div className="space-y-4">
      <div className="flex gap-2">
        <input
          value={question}
          onChange={(e) => setQuestion(e.target.value)}
          className="input flex-1"
          placeholder="Ask about themes, risks, regions…"
          disabled={isLoading}
        />
        <button
          onClick={askQuestion}
          className="btn-primary sheen"
          disabled={isLoading}
        >
          {isLoading ? 'Thinking...' : 'Ask'}
        </button>
      </div>

      {/* Connection Status */}
      <div className="flex items-center gap-2 text-sm">
        <div className={`w-2 h-2 rounded-full ${isConnected ? 'bg-green-500' : 'bg-red-500'}`} />
        <span className="opacity-70">
          {isConnected ? 'Realtime AI Connected' : 'Using Standard AI'}
        </span>
        {error && (
          <span className="text-yellow-500 text-xs">({error})</span>
        )}
      </div>

      {/* Response */}
      <div className="card p-4 min-h-[100px]">
        {isLoading && !response && (
          <div className="flex items-center gap-2 text-sm opacity-70">
            <div className="animate-spin w-4 h-4 border-2 border-white/30 border-t-white rounded-full" />
            {isConnected ? 'AI is thinking...' : 'Getting response...'}
          </div>
        )}
        
        {response && (
          <div className="whitespace-pre-wrap text-sm">
            {response}
          </div>
        )}
        
        {!response && !isLoading && (
          <div className="text-sm opacity-50">
            Ask a question about this week's data...
          </div>
        )}
      </div>

      {/* Help Text */}
      <div className="text-xs opacity-60">
        💡 Try asking: "How is North region performing?" or "What themes are trending?"
        {isConnected && (
          <span className="ml-2 text-green-400">✨ Real-time responses enabled</span>
        )}
      </div>
    </div>
  );
}

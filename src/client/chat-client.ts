/**
 * BeaverChat — Vanilla JS client for connecting to Cloudflare Agent DOs via WebSocket.
 * Bundled as an IIFE (window.BeaverChat) for use in server-rendered HTML pages.
 */

interface ChatMessage {
  id: string;
  role: 'user' | 'assistant';
  content: string;
  createdAt?: number;
}

interface ChatClientOptions {
  /** Agent class name: 'client-agent' or 'admin-agent' */
  agent: string;
  /** Instance name: 'public-{sessionId}' or 'customer-{id}' or 'admin-{id}' */
  instanceName: string;
  /** Called when a complete message is received or updated */
  onMessage?: (messages: ChatMessage[]) => void;
  /** Called when streaming text chunk arrives */
  onStream?: (partialText: string, messageId: string) => void;
  /** Called when connection status changes */
  onStatusChange?: (status: 'connecting' | 'connected' | 'disconnected' | 'error') => void;
}

class ChatClient {
  private ws: WebSocket | null = null;
  private options: ChatClientOptions;
  private messages: ChatMessage[] = [];
  private currentStreamId: string | null = null;
  private currentStreamText: string = '';
  private reconnectAttempts = 0;
  private maxReconnectAttempts = 3;

  constructor(options: ChatClientOptions) {
    this.options = options;
  }

  connect(): void {
    const protocol = window.location.protocol === 'https:' ? 'wss:' : 'ws:';
    const url = `${protocol}//${window.location.host}/agents/${this.options.agent}/${this.options.instanceName}`;

    this.options.onStatusChange?.('connecting');

    this.ws = new WebSocket(url);

    this.ws.onopen = () => {
      this.reconnectAttempts = 0;
      this.options.onStatusChange?.('connected');
      // Load persisted conversation history via HTTP
      this.loadHistory();
    };

    this.ws.onmessage = (event) => {
      this.handleMessage(event.data);
    };

    this.ws.onclose = () => {
      this.options.onStatusChange?.('disconnected');
      this.attemptReconnect();
    };

    this.ws.onerror = () => {
      this.options.onStatusChange?.('error');
    };
  }

  private loadHistory(): void {
    const url = `/agents/${this.options.agent}/${this.options.instanceName}/get-messages`;
    fetch(url)
      .then(res => res.ok ? res.json() : [])
      .then((msgs: any[]) => {
        if (msgs.length > 0) {
          this.messages = msgs.map((m: any) => ({
            id: m.id || crypto.randomUUID(),
            role: m.role,
            content: this.extractText(m),
            createdAt: m.createdAt,
          }));
          this.options.onMessage?.(this.messages);
        }
      })
      .catch(() => { /* ignore — fresh conversation */ });
  }

  private handleMessage(data: string): void {
    try {
      const parsed = JSON.parse(data);

      if (parsed.type === 'cf_agent_chat_messages' && Array.isArray(parsed.messages)) {
        // Full message history sync from agent
        this.messages = parsed.messages.map((m: any) => ({
          id: m.id || crypto.randomUUID(),
          role: m.role,
          content: this.extractText(m),
          createdAt: m.createdAt,
        }));
        this.options.onMessage?.(this.messages);
      } else if (parsed.type === 'cf_agent_use_chat_response') {
        // Streaming chunk or completion signal
        this.handleStreamChunk(parsed);
      }
    } catch {
      // Non-JSON message or unknown format — ignore
    }
  }

  private handleStreamChunk(msg: any): void {
    const { body, done, id } = msg;

    if (done) {
      // Stream finished — finalize current message
      if (this.currentStreamId) {
        const existing = this.messages.find(m => m.id === this.currentStreamId);
        if (existing) {
          existing.content = this.currentStreamText;
        } else if (this.currentStreamText) {
          this.messages.push({
            id: this.currentStreamId,
            role: 'assistant',
            content: this.currentStreamText,
          });
        }
        this.options.onMessage?.(this.messages);
      }
      this.currentStreamId = null;
      this.currentStreamText = '';
      return;
    }

    if (!body) return;

    // Parse the SSE data chunk — body is a JSON-stringified event object
    try {
      const event = JSON.parse(body);

      if (event.type === 'text-start') {
        // New text part starting — use the broadcast id as our stream message id
        this.currentStreamId = id || crypto.randomUUID();
        // Don't reset text — could be continuation
      } else if (event.type === 'text-delta' && event.delta) {
        if (!this.currentStreamId) {
          this.currentStreamId = id || crypto.randomUUID();
        }
        this.currentStreamText += event.delta;
        this.options.onStream?.(this.currentStreamText, this.currentStreamId);
      } else if (event.type === 'text-end') {
        // Text part ended (but stream may continue with tool calls etc.)
      }
    } catch {
      // body wasn't JSON — treat as raw text delta
      if (!this.currentStreamId) {
        this.currentStreamId = id || crypto.randomUUID();
      }
      this.currentStreamText += body;
      this.options.onStream?.(this.currentStreamText, this.currentStreamId);
    }
  }

  private extractText(message: any): string {
    if (typeof message.content === 'string') return message.content;
    if (Array.isArray(message.parts)) {
      return message.parts
        .filter((p: any) => p.type === 'text')
        .map((p: any) => p.text)
        .join('');
    }
    if (Array.isArray(message.content)) {
      return message.content
        .map((p: any) => {
          if (typeof p === 'string') return p;
          if (p?.text) return p.text;
          return '';
        })
        .join('');
    }
    return '';
  }

  send(text: string): void {
    if (!this.ws || this.ws.readyState !== WebSocket.OPEN) {
      console.warn('BeaverChat: WebSocket not connected');
      return;
    }

    // Add user message locally
    const userMsg: ChatMessage = {
      id: crypto.randomUUID(),
      role: 'user',
      content: text,
      createdAt: Date.now(),
    };
    this.messages.push(userMsg);
    this.options.onMessage?.(this.messages);

    // Prepare stream for assistant response
    this.currentStreamText = '';

    // Build full message history for the agent (it needs the full conversation)
    const allMessages = this.messages.map(m => ({
      role: m.role,
      content: m.content,
    }));

    // Send via the cf_agent_use_chat_request protocol
    const chatMessageId = crypto.randomUUID();
    this.currentStreamId = chatMessageId;
    this.ws.send(JSON.stringify({
      type: 'cf_agent_use_chat_request',
      id: chatMessageId,
      init: {
        method: 'POST',
        body: JSON.stringify({
          messages: allMessages,
        }),
      },
    }));
  }

  getMessages(): ChatMessage[] {
    return [...this.messages];
  }

  disconnect(): void {
    this.maxReconnectAttempts = 0; // prevent reconnection
    this.ws?.close();
    this.ws = null;
  }

  isConnected(): boolean {
    return this.ws?.readyState === WebSocket.OPEN;
  }

  private attemptReconnect(): void {
    if (this.reconnectAttempts >= this.maxReconnectAttempts) return;
    this.reconnectAttempts++;
    const delay = Math.min(1000 * Math.pow(2, this.reconnectAttempts), 10000);
    setTimeout(() => this.connect(), delay);
  }
}

/**
 * Get or create a session ID for public visitors.
 */
function getSessionId(): string {
  let id = sessionStorage.getItem('beaver_session_id');
  if (!id) {
    id = crypto.randomUUID();
    sessionStorage.setItem('beaver_session_id', id);
  }
  return id;
}

// Export for IIFE bundle
(window as any).BeaverChat = {
  Client: ChatClient,
  getSessionId,
};

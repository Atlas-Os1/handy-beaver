import { Context } from 'hono';
import { adminLayout } from './admin';

export const adminMessagesPage = async (c: Context) => {
  const content = `
    <div class="admin-messages">
      <div class="page-header">
        <h1>Messages</h1>
        <div class="filters">
          <select id="source-filter">
            <option value="">All Sources</option>
            <option value="website">Website</option>
            <option value="voice">Voice</option>
            <option value="whatsapp">WhatsApp</option>
            <option value="facebook">Facebook</option>
          </select>
          <label>
            <input type="checkbox" id="unread-only"> Unread only
          </label>
        </div>
      </div>
      
      <div class="messages-layout">
        <!-- Thread List -->
        <div class="thread-list" id="thread-list">
          <div class="loading">Loading conversations...</div>
        </div>
        
        <!-- Conversation View -->
        <div class="conversation-view" id="conversation-view">
          <div class="empty-state">
            <div style="font-size: 3rem; margin-bottom: 1rem;">💬</div>
            <h3>Select a conversation</h3>
            <p>Choose a thread from the left to view messages</p>
          </div>
        </div>
      </div>
    </div>
    
    <style>
      .admin-messages { height: calc(100vh - 120px); display: flex; flex-direction: column; }
      .page-header { display: flex; justify-content: space-between; align-items: center; margin-bottom: 1rem; }
      .filters { display: flex; gap: 1rem; align-items: center; }
      .filters select { padding: 0.5rem; border-radius: 4px; border: 1px solid #ddd; }
      .filters label { display: flex; align-items: center; gap: 0.5rem; cursor: pointer; }
      
      .messages-layout { display: grid; grid-template-columns: 350px 1fr; gap: 1rem; flex: 1; min-height: 0; }
      
      .thread-list { 
        background: white; 
        border-radius: 8px; 
        overflow-y: auto; 
        border: 1px solid #e0e0e0;
      }
      .thread-item {
        padding: 1rem;
        border-bottom: 1px solid #eee;
        cursor: pointer;
        transition: background 0.2s;
      }
      .thread-item:hover { background: #f8f9fa; }
      .thread-item.active { background: #e3f2fd; border-left: 3px solid #2196f3; }
      .thread-item.unread { background: #fff8e1; }
      .thread-item.unread.active { background: #e3f2fd; }
      .thread-name { font-weight: 600; display: flex; justify-content: space-between; }
      .thread-preview { color: #666; font-size: 0.85rem; margin-top: 0.25rem; white-space: nowrap; overflow: hidden; text-overflow: ellipsis; }
      .thread-meta { font-size: 0.75rem; color: #999; margin-top: 0.5rem; display: flex; justify-content: space-between; }
      .unread-badge { background: #f44336; color: white; border-radius: 10px; padding: 2px 8px; font-size: 0.75rem; }
      
      .conversation-view {
        background: white;
        border-radius: 8px;
        display: flex;
        flex-direction: column;
        border: 1px solid #e0e0e0;
        overflow: hidden;
      }
      .empty-state { text-align: center; padding: 3rem; color: #666; }
      
      .conv-header {
        padding: 1rem;
        border-bottom: 1px solid #eee;
        background: #f8f9fa;
      }
      .conv-header h3 { margin: 0; }
      .conv-header .meta { font-size: 0.85rem; color: #666; }
      
      .conv-messages {
        flex: 1;
        overflow-y: auto;
        padding: 1rem;
        display: flex;
        flex-direction: column;
        gap: 0.75rem;
      }
      .message {
        max-width: 70%;
        padding: 0.75rem 1rem;
        border-radius: 12px;
      }
      .message.customer {
        background: #e3f2fd;
        align-self: flex-start;
        border-bottom-left-radius: 4px;
      }
      .message.business {
        background: #e8f5e9;
        align-self: flex-end;
        border-bottom-right-radius: 4px;
      }
      .message .time { font-size: 0.7rem; color: #999; margin-top: 0.25rem; }
      .message .source { font-size: 0.65rem; color: #2196f3; text-transform: uppercase; }
      
      .conv-input {
        padding: 1rem;
        border-top: 1px solid #eee;
        display: flex;
        gap: 0.5rem;
      }
      .conv-input input {
        flex: 1;
        padding: 0.75rem;
        border: 1px solid #ddd;
        border-radius: 20px;
        outline: none;
      }
      .conv-input button {
        padding: 0.75rem 1.5rem;
        background: #2196f3;
        color: white;
        border: none;
        border-radius: 20px;
        cursor: pointer;
      }
      
      .loading { padding: 2rem; text-align: center; color: #666; }
    </style>
    
    <script>
      let selectedCustomerId = null;
      
      // Load threads
      async function loadThreads() {
        const source = document.getElementById('source-filter').value;
        const unreadOnly = document.getElementById('unread-only').checked;
        
        const params = new URLSearchParams();
        if (source) params.set('source', source);
        if (unreadOnly) params.set('unread', 'true');
        
        const res = await fetch('/api/admin/messages/threads?' + params);
        const data = await res.json();
        
        const container = document.getElementById('thread-list');
        
        if (!data.results?.length) {
          container.innerHTML = '<div class="loading">No conversations found</div>';
          return;
        }
        
        container.innerHTML = data.results.map(t => \`
          <div class="thread-item \${t.unread_count > 0 ? 'unread' : ''} \${selectedCustomerId == t.customer_id ? 'active' : ''}"
               onclick="selectThread(\${t.customer_id})">
            <div class="thread-name">
              <span>\${t.customer_name || 'Unknown'}</span>
              \${t.unread_count > 0 ? \`<span class="unread-badge">\${t.unread_count}</span>\` : ''}
            </div>
            <div class="thread-preview">\${t.last_message || ''}</div>
            <div class="thread-meta">
              <span>\${t.customer_phone || t.customer_email || ''}</span>
              <span>\${formatTime(t.last_message_at)}</span>
            </div>
          </div>
        \`).join('');
      }
      
      // Select a thread
      async function selectThread(customerId) {
        selectedCustomerId = customerId;
        
        // Update active state
        document.querySelectorAll('.thread-item').forEach(el => el.classList.remove('active'));
        event.currentTarget?.classList.add('active');
        
        // Load messages
        const res = await fetch('/api/admin/messages?customer_id=' + customerId);
        const data = await res.json();
        
        // Get customer info
        const custRes = await fetch('/api/admin/customers/' + customerId);
        const customer = await custRes.json();
        
        const container = document.getElementById('conversation-view');
        
        container.innerHTML = \`
          <div class="conv-header">
            <h3>\${customer.name || 'Unknown'}</h3>
            <div class="meta">
              \${customer.email ? '📧 ' + customer.email : ''} 
              \${customer.phone ? '📱 ' + customer.phone : ''}
            </div>
          </div>
          <div class="conv-messages" id="conv-messages">
            \${data.results.reverse().map(m => \`
              <div class="message \${m.sender}">
                <div class="source">\${m.source || 'website'}</div>
                <div>\${m.content}</div>
                <div class="time">\${formatTime(m.created_at)}</div>
              </div>
            \`).join('')}
          </div>
          <div class="conv-input">
            <input type="text" id="reply-input" placeholder="Type a message..." onkeypress="if(event.key==='Enter')sendReply()">
            <button onclick="sendReply()">Send</button>
          </div>
        \`;
        
        // Mark as read
        await fetch('/api/admin/messages/customer/' + customerId + '/read-all', { method: 'PATCH' });
        loadThreads();
        
        // Scroll to bottom
        const msgs = document.getElementById('conv-messages');
        msgs.scrollTop = msgs.scrollHeight;
      }
      
      // Send reply
      async function sendReply() {
        const input = document.getElementById('reply-input');
        const content = input.value.trim();
        if (!content || !selectedCustomerId) return;
        
        await fetch('/api/admin/messages', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ customer_id: selectedCustomerId, content })
        });
        
        input.value = '';
        selectThread(selectedCustomerId);
      }
      
      function formatTime(timestamp) {
        if (!timestamp) return '';
        const date = new Date(timestamp * 1000);
        const now = new Date();
        const diff = now - date;
        
        if (diff < 60000) return 'Just now';
        if (diff < 3600000) return Math.floor(diff/60000) + 'm ago';
        if (diff < 86400000) return Math.floor(diff/3600000) + 'h ago';
        return date.toLocaleDateString();
      }
      
      // Event listeners
      document.getElementById('source-filter').addEventListener('change', loadThreads);
      document.getElementById('unread-only').addEventListener('change', loadThreads);
      
      // Initial load
      loadThreads();
    </script>
  `;
  
  return c.html(adminLayout('Messages', content, 'messages'));
};

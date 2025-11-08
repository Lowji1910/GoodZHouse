import { useEffect, useMemo, useRef, useState } from 'react';
import { useSocket } from '../../context/SocketContext';
import { useAuth } from '../../context/AuthContext';
import { api } from '../../services/api';

export default function ChatModal() {
  const { socket } = useSocket();
  const { user } = useAuth();
  const [open, setOpen] = useState(false);
  const [input, setInput] = useState('');
  const [messages, setMessages] = useState([]);
  const endRef = useRef(null);

  const canSend = useMemo(() => !!user && !!socket && input.trim().length > 0, [user, socket, input]);

  useEffect(() => {
    if (!socket) return;
    const onMsg = (msg) => {
      if (!user) return;
      if (msg.from === user.id || msg.to === user.id) {
        setMessages((prev) => [...prev, msg]);
      }
    };
    socket.on('chat:message', onMsg);
    return () => socket.off('chat:message', onMsg);
  }, [socket, user?.id]);

  useEffect(() => { endRef.current?.scrollIntoView({ behavior: 'smooth' }); }, [messages, open]);

  // Reset messages when user changes (prevents seeing previous account's history)
  useEffect(() => {
    setMessages([]);
  }, [user?.id]);

  const send = () => {
    if (!canSend) return;
    // Send to support/admin by omitting toUserId
    socket.emit('chat:message', { content: input.trim() });
    setInput('');
  };

  // Expose imperative show via Bootstrap's attributes
  useEffect(() => {
    const el = document.getElementById('chatModal');
    if (!el) return;
    el.addEventListener('shown.bs.modal', () => setOpen(true));
    el.addEventListener('hidden.bs.modal', () => setOpen(false));
    return () => {
      el.removeEventListener('shown.bs.modal', () => setOpen(true));
      el.removeEventListener('hidden.bs.modal', () => setOpen(false));
    };
  }, []);

  if (!user) return null;

  return (
    <div className="modal fade" id="chatModal" tabIndex="-1" aria-hidden="true">
      <div className="modal-dialog modal-dialog-end modal-dialog-scrollable">
        <div className="modal-content">
          <div className="modal-header">
            <h5 className="modal-title">Hỗ trợ trực tuyến</h5>
            <button type="button" className="btn-close" data-bs-dismiss="modal" aria-label="Close" />
          </div>
          <div className="modal-body" style={{ maxHeight: '60vh', overflowY: 'auto', background: '#f8f9fa' }}>
            {/* Load history on open */}
            {open && messages.length === 0 && (
              <HistoryLoader onLoaded={setMessages} />
            )}
            {messages.length === 0 && (
              <div className="text-muted text-center my-3" style={{ fontSize: 14 }}>Bắt đầu cuộc trò chuyện với chúng tôi.</div>
            )}
            {messages.map((m, idx) => {
              const mine = m.from === user.id;
              return (
                <div key={idx} className={`d-flex ${mine ? 'justify-content-end' : 'justify-content-start'} mb-2`}>
                  <div className={`p-2 rounded ${mine ? 'bg-primary text-white' : 'bg-white border'}`} style={{ maxWidth: '75%' }}>
                    <div style={{ whiteSpace: 'pre-wrap' }}>{m.content}</div>
                    <div className="text-muted" style={{ fontSize: 11 }}>
                      {new Date(m.createdAt || Date.now()).toLocaleTimeString('vi-VN')}
                    </div>
                  </div>
                </div>
              );
            })}
            <div ref={endRef} />
          </div>
          <div className="modal-footer">
            <div className="input-group">
              <input
                type="text"
                className="form-control"
                placeholder="Nhập tin nhắn..."
                value={input}
                onChange={(e) => setInput(e.target.value)}
                onKeyDown={(e) => { if (e.key === 'Enter') send(); }}
              />
              <button className="btn btn-primary" onClick={send} disabled={!canSend}>Gửi</button>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}

function HistoryLoader({ onLoaded }) {
  useEffect(() => {
    let mounted = true;
    (async () => {
      try {
        const data = await api.listMessages();
        if (mounted) onLoaded(data);
      } catch {}
    })();
    return () => { mounted = false; };
  }, [onLoaded]);
  return null;
}

import { useEffect, useMemo, useRef, useState } from 'react';
import { api } from '../../services/api';
import { useSocket } from '../../context/SocketContext';
import { useAuth } from '../../context/AuthContext';

export default function AdminChat() {
  const { user } = useAuth();
  const { socket } = useSocket();
  const [conversations, setConversations] = useState([]);
  const [activeUserId, setActiveUserId] = useState(null);
  const [messages, setMessages] = useState([]);
  const [input, setInput] = useState('');
  const endRef = useRef(null);
  const [unreadMap, setUnreadMap] = useState({}); // { userId: true }

  const canSend = useMemo(() => !!activeUserId && input.trim().length > 0, [activeUserId, input]);

  const loadConversations = async () => {
    try {
      const convs = await api.listConversations();
      setConversations(convs);
      if (!activeUserId && convs.length) setActiveUserId(convs[0].userId);
    } catch {}
  };

  const loadMessages = async (uid) => {
    try {
      const data = await api.listMessages({ with: uid });
      setMessages(data);
    } catch {}
  };

  useEffect(() => { loadConversations(); }, []);
  useEffect(() => { if (activeUserId) loadMessages(activeUserId); }, [activeUserId]);
  useEffect(() => { endRef.current?.scrollIntoView({ behavior: 'smooth' }); }, [messages]);

  useEffect(() => {
    if (!socket) return;
    const onMsg = (msg) => {
      // If the message belongs to the active conversation, append
      if (activeUserId && (msg.from === activeUserId || msg.to === activeUserId)) {
        setMessages((prev) => [...prev, msg]);
      } else if (msg.from && (!user || msg.from !== user.id)) {
        // Mark unread for that user
        setUnreadMap((m) => ({ ...m, [msg.from]: true }));
      }
      // Refresh conv list (order + preview)
      loadConversations();
    };
    socket.on('chat:message', onMsg);
    return () => socket.off('chat:message', onMsg);
  }, [socket, activeUserId]);

  const send = async () => {
    if (!canSend) return;
    try {
      await api.sendMessage({ toUserId: activeUserId, content: input.trim() });
      setInput('');
      // Clear unread for this conversation upon reply
      setUnreadMap(m => ({ ...m, [activeUserId]: false }));
    } catch {}
  };

  if (!user || user.role !== 'admin') return <div className="p-3">Chỉ dành cho admin</div>;

  return (
    <div className="container-fluid mt-3">
      <div className="row">
        <div className="col-12 col-md-4 col-lg-3">
          <div className="card">
            <div className="card-header d-flex justify-content-between align-items-center">
              <strong>Cuộc hội thoại</strong>
              <button className="btn btn-sm btn-outline-secondary" onClick={loadConversations}>Làm mới</button>
            </div>
            <ul className="list-group list-group-flush" style={{ maxHeight: '70vh', overflowY: 'auto' }}>
              {conversations.length === 0 && (
                <li className="list-group-item text-muted">Chưa có cuộc hội thoại</li>
              )}
              {conversations.map(c => {
                const unread = !!unreadMap[c.userId];
                const title = c.fullName || c.email || `User ${c.userId.slice(-6)}`;
                const preview = c.lastMessage ? (c.lastMessage.length > 40 ? c.lastMessage.slice(0, 40) + '…' : c.lastMessage) : '—';
                const time = c.lastAt ? new Date(c.lastAt).toLocaleTimeString('vi-VN') : '';
                return (
                  <li key={c.userId} className={`list-group-item ${activeUserId === c.userId ? 'active' : ''}`} role="button" onClick={() => { setActiveUserId(c.userId); setUnreadMap(m => ({ ...m, [c.userId]: false })); }}>
                    <div className="d-flex justify-content-between align-items-start">
                      <div>
                        <div className="d-flex align-items-center">
                          <span className="fw-semibold" style={{ fontSize: 14 }}>{title}</span>
                          {unread && <span className="ms-2 badge bg-danger">●</span>}
                        </div>
                        <div className="text-muted" style={{ fontSize: 12 }}>{preview}</div>
                      </div>
                      <div className="text-muted" style={{ fontSize: 11 }}>{time}</div>
                    </div>
                  </li>
                );
              })}
            </ul>
          </div>
        </div>
        <div className="col-12 col-md-8 col-lg-9">
          <div className="card">
            <div className="card-header">
              <strong>{activeUserId ? `Chat với User ${activeUserId.slice(-6)}` : 'Chọn 1 cuộc hội thoại'}</strong>
            </div>
            <div className="card-body" style={{ height: '60vh', overflowY: 'auto', background: '#f8f9fa' }}>
              {!activeUserId && <div className="text-muted">Chưa chọn cuộc hội thoại.</div>}
              {activeUserId && messages.map((m, i) => {
                const mine = m.from === user.id;
                return (
                  <div key={i} className={`d-flex ${mine ? 'justify-content-end' : 'justify-content-start'} mb-2`}>
                    <div className={`p-2 rounded ${mine ? 'bg-primary text-white' : 'bg-white border'}`} style={{ maxWidth: '75%' }}>
                      <div style={{ whiteSpace: 'pre-wrap' }}>{m.content}</div>
                      <div className="text-muted" style={{ fontSize: 11 }}>{new Date(m.createdAt || Date.now()).toLocaleString('vi-VN')}</div>
                    </div>
                  </div>
                );
              })}
              <div ref={endRef} />
            </div>
            <div className="card-footer">
              <div className="input-group">
                <input type="text" value={input} onChange={(e)=>setInput(e.target.value)} onKeyDown={(e)=>{ if(e.key==='Enter') send(); }} className="form-control" placeholder="Nhập tin nhắn..." />
                <button className="btn btn-primary" disabled={!canSend} onClick={send}>Gửi</button>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}

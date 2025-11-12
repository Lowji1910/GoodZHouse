import { useEffect, useState } from 'react';
import { useAuth } from '../../context/AuthContext';
import { useSocket } from '../../context/SocketContext';

export default function ChatWidget() {
  const { user } = useAuth();
  const { socket } = useSocket();
  const [unread, setUnread] = useState(0);
  const [dockOffset, setDockOffset] = useState(false); // true when cart offcanvas is open

  useEffect(() => {
    if (!socket) return;
    const onMsg = (msg) => {
      if (!user) return;
      if (msg.from !== user.id) setUnread((u) => u + 1);
    };
    socket.on('chat:message', onMsg);
    return () => socket.off('chat:message', onMsg);
  }, [socket, user?.id]);

  // When the cart offcanvas opens, move the widget up (or hide) to avoid covering checkout button
  useEffect(() => {
    const cart = document.getElementById('offcanvasCart');
    if (!cart) return;
    const onShow = () => setDockOffset(true);
    const onHide = () => setDockOffset(false);
    cart.addEventListener('shown.bs.offcanvas', onShow);
    cart.addEventListener('hidden.bs.offcanvas', onHide);
    // Also set initial state in case opened programmatically
    if (cart.classList.contains('show')) setDockOffset(true);
    return () => {
      cart.removeEventListener('shown.bs.offcanvas', onShow);
      cart.removeEventListener('hidden.bs.offcanvas', onHide);
    };
  }, []);

  if (!user) return null;

  return (
    <div style={{ position: 'fixed', right: 16, bottom: dockOffset ? 96 : 16, zIndex: 1050 }}>
      <button
        className="btn btn-primary position-relative"
        onClick={() => {
          setUnread(0);
          const el = document.getElementById('chatModal');
          const bs = window.bootstrap;
          if (el && bs) {
            const inst = bs.Modal.getInstance(el) || new bs.Modal(el, { backdrop: true, keyboard: true });
            inst.show();
          }
        }}
      >
        Chat hỗ trợ
        {unread > 0 && (
          <span className="position-absolute top-0 start-100 translate-middle badge rounded-pill bg-danger">
            {unread}
          </span>
        )}
      </button>
    </div>
  );
}

import { createContext, useContext, useEffect, useMemo, useRef, useState } from 'react';
import { io } from 'socket.io-client';
import { useAuth } from './AuthContext';

const SocketContext = createContext(null);

export function SocketProvider({ children }) {
  const { user } = useAuth();
  const [socket, setSocket] = useState(null);
  const [connected, setConnected] = useState(false);
  const url = process.env.REACT_APP_API_BASE_URL || 'http://localhost:5000';
  const tokenRef = useRef(null);

  useEffect(() => {
    const token = localStorage.getItem('token');
    tokenRef.current = token;
    const s = io(url, { transports: ['websocket'], auth: { token } });
    setSocket(s);

    const onConnect = () => setConnected(true);
    const onDisconnect = () => setConnected(false);
    s.on('connect', onConnect);
    s.on('disconnect', onDisconnect);

    return () => {
      s.off('connect', onConnect);
      s.off('disconnect', onDisconnect);
      s.disconnect();
      setSocket(null);
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [user?.id]);

  // Expose socket for non-hook consumers (e.g., admin pages) for pragmatic realtime refresh
  useEffect(() => {
    if (typeof window !== 'undefined') {
      window.__socket = socket;
      return () => { window.__socket = null; };
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [socket]);

  const value = useMemo(() => ({ socket, connected }), [socket, connected]);
  return <SocketContext.Provider value={value}>{children}</SocketContext.Provider>;
}

export function useSocket() {
  const ctx = useContext(SocketContext);
  if (!ctx) throw new Error('useSocket must be used within SocketProvider');
  return ctx;
}

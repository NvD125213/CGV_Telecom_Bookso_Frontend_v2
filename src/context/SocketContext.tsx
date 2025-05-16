import React, {
  createContext,
  useContext,
  useEffect,
  useState,
  useRef,
} from "react";
import { io, Socket } from "socket.io-client";
import Cookies from "js-cookie";
import { useNavigate } from "react-router-dom";
import { useDispatch } from "react-redux";
import { logout } from "../store/authSlice";

interface AuthContextProps {
  socket: Socket | null;
  resetInactivityTimer: () => void;
  sendMessage?: (message: string) => void;
  logoutSocket?: () => void;
  isConnected: boolean;
}

const AuthContext = createContext<AuthContextProps>({
  socket: null,
  resetInactivityTimer: () => {},
  sendMessage: () => {},
  logoutSocket: () => {},
  isConnected: false,
});

export const useAuth = () => useContext(AuthContext);

export const AuthProvider: React.FC<{ children: React.ReactNode }> = ({
  children,
}) => {
  const [socket, setSocket] = useState<Socket | null>(null);
  const [isConnected, setIsConnected] = useState(false);
  const [token, setToken] = useState<string | undefined>(Cookies.get("token"));

  const navigate = useNavigate();
  const dispatch = useDispatch();

  const timerRef = useRef<NodeJS.Timeout | null>(null);
  const INACTIVITY_LIMIT = 5 * 60 * 1000;

  const sendMessage = (message: string) => {
    if (socket && isConnected) {
      console.log("[Socket] Sending message:", message);
      socket.emit("chat message", message);
    } else {
      console.warn("[Socket] Cannot send message - socket not connected");
    }
  };

  const clearSession = () => {
    console.log("[Auth] Clearing session...");
    dispatch(logout());
    if (socket) {
      console.log("[Auth] Disconnecting socket...");
      socket.disconnect();
      setSocket(null);
      setIsConnected(false);
    }
    navigate("/signin", { replace: true });
  };

  const logoutSocket = () => {
    if (socket) {
      console.log("[Socket] Emitting logout event");
      socket.emit("logout");
      clearSession();
    }
  };

  const startInactivityTimer = () => {
    if (timerRef.current) clearTimeout(timerRef.current);
    timerRef.current = setTimeout(() => {
      alert("Bạn đã không hoạt động trong 5 phút. Vui lòng đăng nhập lại.");
      clearSession();
    }, INACTIVITY_LIMIT);
  };

  const resetInactivityTimer = () => {
    if (token) startInactivityTimer();
  };

  // Theo dõi thay đổi token qua polling
  useEffect(() => {
    const interval = setInterval(() => {
      const currentToken = Cookies.get("token");
      if (currentToken !== token) setToken(currentToken);
    }, 1000);
    return () => clearInterval(interval);
  }, [token]);

  // Quản lý kết nối socket khi token thay đổi
  useEffect(() => {
    if (!token) {
      if (socket) {
        socket.disconnect();
        setSocket(null);
        setIsConnected(false);
      }
      return;
    }

    const newSocket = io("http://13.228.23.40:8000", {
      path: "/socket.io",
      auth: { token },
      transports: ["websocket", "polling"],
      reconnection: true,
      reconnectionAttempts: 5,
      reconnectionDelay: 1000,
      timeout: 5000,
      withCredentials: true,
      query: {
        token,
      },
    });

    newSocket.on("connect", () => {
      setIsConnected(true);
    });

    newSocket.on("disconnect", (reason) => {
      console.log("[Socket] Ngắt kết nối - Lý do:", reason);
      setIsConnected(false);
      if (reason === "io server disconnect") {
        newSocket.connect();
      }
    });

    newSocket.on("reconnect_attempt", (attempt) => {
      console.log("[Socket] Thử reconnect lần", attempt);
    });

    newSocket.on("reconnect", (attempt) => {
      setIsConnected(true);
    });

    newSocket.on("reconnect_failed", () => {
      console.log("[Socket] Reconnect thất bại sau 5 lần");
      clearSession();
    });

    newSocket.on("connect_error", (err) => {
      console.log("[Socket] Lỗi kết nối:", err.message);
    });

    setSocket(newSocket);
    startInactivityTimer();

    return () => {
      console.log("[Socket] Cleanup: Disconnect socket");
      newSocket.disconnect();
      setSocket(null);
      setIsConnected(false);
      if (timerRef.current) clearTimeout(timerRef.current);
    };
  }, [token]);

  return (
    <AuthContext.Provider
      value={{
        socket,
        resetInactivityTimer,
        sendMessage,
        logoutSocket,
        isConnected,
      }}>
      {children}
    </AuthContext.Provider>
  );
};

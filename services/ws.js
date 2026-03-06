const getWsUrl = () => {
  const base = process.env.NEXT_PUBLIC_WS_URL || "ws://localhost:15002";
  // Pastikan ada /ws/dashboard
  return base.includes('/ws/') ? base : `${base}/ws/dashboard`;
};

class WebSocketService {
  constructor() {
    this.wsUrl = getWsUrl();
    this.socket = null;
    this.reconnectAttempts = 0;
    this.maxReconnectAttempts = 5;
    this.reconnectDelay = 10000;
    this.subscriptions = new Map();
    this.isConnecting = false;
    this.heartbeatInterval = null;
    this.isServerAvailable = true;
    this.lastConnectionAttempt = 0;
    this.MIN_CONNECTION_INTERVAL = 5000;
    
    // 🔥 Tambahkan untuk rate limiting
    this.lastMessageTime = 0;
    this.messageCount = 0;
  }

  async connect() {
    console.log(`🔌 Connecting to: ${this.wsUrl}`);

    // 🔥 FIX: Gunakan Date.now() bukan variabel 'now'
    const currentTime = Date.now();
    
    // ⚠️ CEK: Jangan reconnect terlalu sering
    if (currentTime - this.lastConnectionAttempt < this.MIN_CONNECTION_INTERVAL) {
      console.log("⏸️ Skipping connect - too soon since last attempt");
      return;
    }

    this.lastConnectionAttempt = currentTime;

    if (this.isConnecting) {
      console.log("⏳ Already connecting, skipping...");
      return;
    }

    if (this.socket?.readyState === WebSocket.OPEN) {
      console.log("✅ Already connected, skipping...");
      return;
    }

    // ⚠️ CEK: Stop jika sudah max attempts
    if (this.reconnectAttempts >= this.maxReconnectAttempts) {
      console.log("⏹️ Max reconnection attempts reached, stopping");
      this.isServerAvailable = false;
      return;
    }

    this.isServerAvailable = true;
    this.isConnecting = true;

    try {
      console.log(`🔌 Attempting to connect to Dashboard WebSocket: ${this.wsUrl}`);
      this.socket = new WebSocket(this.wsUrl);

      this.socket.onopen = () => {
        console.log("✅ Dashboard WebSocket connected successfully");
        this.reconnectAttempts = 0;
        this.isConnecting = false;

        // Start heartbeat
        this.startHeartbeat();

        // Notify semua subscriber
        this.notifySubscribers("connection", {
          type: "connected",
          timestamp: new Date().toISOString(),
          server: "Dashboard WebSocket",
        });
      };

      this.socket.onmessage = (event) => {
        try {
          const data = JSON.parse(event.data);
          console.log(
            "📨 WebSocket message received:",
            data.type || data.event || 'data',
          );

          // ⚠️ RATE LIMITING: Skip jika terlalu banyak messages
          if (this.shouldSkipMessage()) {
            console.log("⏸️ Skipping message - rate limit");
            return;
          }

          // Handle berdasarkan event type dari backend
          if (data.event) {
            switch (data.event) {
              case "agent_connected":
              case "agent_disconnected":
              case "agent_status_update":
                this.notifySubscribers("agents", data);
                break;

              case "printer_status_update":
              case "printer_ink_update":
                this.notifySubscribers("printers", data);
                break;

              case "print_job":
                this.notifySubscribers("print_jobs", data);
                break;

              default:
                this.notifySubscribers("events", data);
            }
          }

          // Handle berdasarkan type (format dari backend kita)
          if (data.type) {
            switch (data.type) {
              case "agent_connected":
              case "agent_disconnected":
                this.notifySubscribers("agents", data);
                break;
                
              case "printer_update":
              case "ink_update":
                this.notifySubscribers("printers", data);
                break;
                
              case "initial_data":
                this.notifySubscribers("initial", data);
                break;
            }
          }

          // Broadcast ke semua subscriber
          this.notifySubscribers("broadcast", data);
        } catch (error) {
          console.error(
            "Failed to parse WebSocket message:",
            error,
            event.data?.substring?.(0, 100) || 'No data',
          );
        }
      };

      this.socket.onerror = (event) => {
        console.error("❌ Dashboard WebSocket error");
        this.isConnecting = false;

        this.notifySubscribers("connection", {
          type: "error",
          error: "WebSocket connection failed",
          timestamp: new Date().toISOString(),
        });
      };

      this.socket.onclose = (event) => {
        console.log(`🔌 Dashboard WebSocket disconnected. Code: ${event.code}`);
        this.isConnecting = false;
        this.stopHeartbeat();

        this.notifySubscribers("connection", {
          type: "disconnected",
          code: event.code,
          reason: event.reason || "Connection closed",
          wasClean: event.wasClean,
          timestamp: new Date().toISOString(),
        });

        // ⚠️ Auto-reconnect dengan exponential backoff
        if (
          this.isServerAvailable &&
          event.code !== 1000 && // Bukan normal closure
          this.reconnectAttempts < this.maxReconnectAttempts
        ) {
          // Exponential backoff dengan minimum 10 detik
          const delay = Math.max(
            this.reconnectDelay * Math.pow(1.5, this.reconnectAttempts),
            10000, // Minimal 10 detik
          );

          console.log(
            `⏱️ Will attempt reconnect in ${Math.round(delay / 1000)} seconds (attempt ${this.reconnectAttempts + 1}/${this.maxReconnectAttempts})`,
          );

          setTimeout(() => {
            this.reconnectAttempts++;
            this.connect();
          }, delay);
        } else {
          console.log("⏹️ No more reconnect attempts or clean closure");
        }
      };
    } catch (error) {
      console.error("❌ Failed to create WebSocket connection:", error);
      this.isConnecting = false;
      this.reconnectAttempts++;
    }
  }

  // ⚠️ Rate limiting untuk messages
  shouldSkipMessage() {
    const now = Date.now();
    if (this.lastMessageTime === 0) {
      this.lastMessageTime = now;
      this.messageCount = 1;
      return false;
    }

    // Reset counter jika lebih dari 1 detik
    if (now - this.lastMessageTime > 1000) {
      this.lastMessageTime = now;
      this.messageCount = 1;
      return false;
    }

    // Skip jika lebih dari 10 messages per detik
    this.messageCount++;
    if (this.messageCount > 10) {
      return true;
    }

    return false;
  }

  disconnect() {
    if (this.socket) {
      this.stopHeartbeat();
      this.socket.close(1000, "Client disconnected");
      this.socket = null;
    }
  }

  // ============ SUBSCRIPTION METHODS ============
  subscribe(channel, callback) {
    if (!this.subscriptions.has(channel)) {
      this.subscriptions.set(channel, []);
    }

    const callbacks = this.subscriptions.get(channel);
    if (!callbacks.includes(callback)) {
      callbacks.push(callback);
    }

    // Auto connect jika belum connect dan server available
    if (
      this.isServerAvailable &&
      (!this.socket || this.socket.readyState !== WebSocket.OPEN) &&
      !this.isConnecting
    ) {
      console.log(`🔄 Auto-connecting via subscribe to ${channel}`);
      this.connect().catch((err) => {
        console.error("Failed to auto-connect:", err);
      });
    }

    // Return unsubscribe function
    return () => this.unsubscribe(channel, callback);
  }

  unsubscribe(channel, callback) {
    if (this.subscriptions.has(channel)) {
      const callbacks = this.subscriptions.get(channel);
      const index = callbacks.indexOf(callback);
      if (index > -1) {
        callbacks.splice(index, 1);
      }
    }
  }

  notifySubscribers(channel, data) {
    const callbacks = this.subscriptions.get(channel) || [];
    callbacks.forEach((callback) => {
      try {
        callback(data);
      } catch (error) {
        console.error("Error in subscription callback:", error);
      }
    });
  }

  send(data) {
    if (this.socket?.readyState === WebSocket.OPEN) {
      try {
        const message = typeof data === "string" ? data : JSON.stringify(data);
        this.socket.send(message);
        return true;
      } catch (error) {
        console.error("Failed to send WebSocket message:", error);
        return false;
      }
    } else {
      console.warn("⚠️ WebSocket not connected, cannot send message");
      return false;
    }
  }

  startHeartbeat() {
    this.stopHeartbeat();

    this.heartbeatInterval = setInterval(() => {
      if (this.socket?.readyState === WebSocket.OPEN) {
        this.send({
          type: "ping",
          timestamp: Date.now(),
        });
      }
    }, 30000); // 30 detik sekali
  }

  stopHeartbeat() {
    if (this.heartbeatInterval) {
      clearInterval(this.heartbeatInterval);
      this.heartbeatInterval = null;
    }
  }

  isConnected() {
    return this.socket?.readyState === WebSocket.OPEN;
  }

  getConnectionState() {
    if (!this.isServerAvailable) return "server_unavailable";
    if (!this.socket) return "disconnected";

    switch (this.socket.readyState) {
      case WebSocket.CONNECTING:
        return "connecting";
      case WebSocket.OPEN:
        return "connected";
      case WebSocket.CLOSING:
        return "closing";
      case WebSocket.CLOSED:
        return "disconnected";
      default:
        return "unknown";
    }
  }

  // ============ SPECIFIC SUBSCRIPTION METHODS ============
  subscribeToAgents = (callback) => {
    return this.subscribe("agents", callback);
  };

  subscribeToPrinters = (callback) => {
    return this.subscribe("printers", callback);
  };

  subscribeToPrintJobs = (callback) => {
    return this.subscribe("print_jobs", callback);
  };

  subscribeToEvents = (callback) => {
    return this.subscribe("events", callback);
  };

  subscribeToConnection = (callback) => {
    return this.subscribe("connection", callback);
  };

  subscribeToBroadcast = (callback) => {
    return this.subscribe("broadcast", callback);
  };
}

// Singleton instance
const wsService = new WebSocketService();

export default wsService;
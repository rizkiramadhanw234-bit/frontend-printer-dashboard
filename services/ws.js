const getWsUrl = () => {
  const base = process.env.NEXT_PUBLIC_WS_URL || "ws://localhost:15002";
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

    this.lastMessageTime = 0;
    this.messageCount = 0;
  }

  async connect() {
    const currentTime = Date.now();

    if (currentTime - this.lastConnectionAttempt < this.MIN_CONNECTION_INTERVAL) {
      return;
    }

    this.lastConnectionAttempt = currentTime;

    if (this.isConnecting) {
      return;
    }

    if (this.socket?.readyState === WebSocket.OPEN) {
      return;
    }

    if (this.reconnectAttempts >= this.maxReconnectAttempts) {
      this.isServerAvailable = false;
      return;
    }

    this.isServerAvailable = true;
    this.isConnecting = true;

    try {
      this.socket = new WebSocket(this.wsUrl);

      this.socket.onopen = () => {
        this.reconnectAttempts = 0;
        this.isConnecting = false;

        this.startHeartbeat();

        this.notifySubscribers("connection", {
          type: "connected",
          timestamp: new Date().toISOString(),
          server: "Dashboard WebSocket",
        });
      };

      this.socket.onmessage = (event) => {
        try {
          const data = JSON.parse(event.data);

          if (this.shouldSkipMessage()) {
            return;
          }

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

          this.notifySubscribers("broadcast", data);
        } catch (error) {
          // Error handled silently
        }
      };

      this.socket.onerror = (event) => {
        this.isConnecting = false;

        this.notifySubscribers("connection", {
          type: "error",
          error: "WebSocket connection failed",
          timestamp: new Date().toISOString(),
        });
      };

      this.socket.onclose = (event) => {
        this.isConnecting = false;
        this.stopHeartbeat();

        this.notifySubscribers("connection", {
          type: "disconnected",
          code: event.code,
          reason: event.reason || "Connection closed",
          wasClean: event.wasClean,
          timestamp: new Date().toISOString(),
        });

        if (
          this.isServerAvailable &&
          event.code !== 1000 &&
          this.reconnectAttempts < this.maxReconnectAttempts
        ) {
          const delay = Math.max(
            this.reconnectDelay * Math.pow(1.5, this.reconnectAttempts),
            10000,
          );

          setTimeout(() => {
            this.reconnectAttempts++;
            this.connect();
          }, delay);
        }
      };
    } catch (error) {
      this.isConnecting = false;
      this.reconnectAttempts++;
    }
  }

  shouldSkipMessage() {
    const now = Date.now();
    if (this.lastMessageTime === 0) {
      this.lastMessageTime = now;
      this.messageCount = 1;
      return false;
    }

    if (now - this.lastMessageTime > 1000) {
      this.lastMessageTime = now;
      this.messageCount = 1;
      return false;
    }

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

  subscribe(channel, callback) {
    if (!this.subscriptions.has(channel)) {
      this.subscriptions.set(channel, []);
    }

    const callbacks = this.subscriptions.get(channel);
    if (!callbacks.includes(callback)) {
      callbacks.push(callback);
    }

    if (
      this.isServerAvailable &&
      (!this.socket || this.socket.readyState !== WebSocket.OPEN) &&
      !this.isConnecting
    ) {
      this.connect().catch((err) => {
        // Error handled silently
      });
    }

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
        // Error handled silently
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
        return false;
      }
    } else {
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
    }, 30000);
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

const wsService = new WebSocketService();

export default wsService;
import express, { type Request, Response, NextFunction } from "express";
import { registerRoutes } from "./routes";
import { setupVite, serveStatic, log } from "./vite";
import { WebSocket, WebSocketServer } from 'ws';

const app = express();
app.use(express.json());
app.use(express.urlencoded({ extended: false }));

// Enable CORS for all routes
app.use((req, res, next) => {
  res.header('Access-Control-Allow-Origin', '*');
  res.header('Access-Control-Allow-Methods', 'GET,PUT,POST,DELETE');
  res.header('Access-Control-Allow-Headers', 'Content-Type, Authorization');
  if (req.method === 'OPTIONS') {
    res.sendStatus(200);
  } else {
    next();
  }
});

// Request logging middleware
app.use((req, res, next) => {
  const start = Date.now();
  const path = req.path;
  let capturedJsonResponse: Record<string, any> | undefined = undefined;

  const originalResJson = res.json;
  res.json = function (bodyJson, ...args) {
    capturedJsonResponse = bodyJson;
    return originalResJson.apply(res, [bodyJson, ...args]);
  };

  res.on("finish", () => {
    const duration = Date.now() - start;
    if (path.startsWith("/api")) {
      let logLine = `${req.method} ${path} ${res.statusCode} in ${duration}ms`;
      if (capturedJsonResponse) {
        logLine += ` :: ${JSON.stringify(capturedJsonResponse)}`;
      }

      if (logLine.length > 80) {
        logLine = logLine.slice(0, 79) + "…";
      }

      log(logLine);
    }
  });

  next();
});

(async () => {
  const server = registerRoutes(app);

  // Initialize WebSocket server
  const wss = new WebSocketServer({ server });

  wss.on('connection', (ws: WebSocket) => {
    log('New WebSocket connection established');

    // Set up ping interval
    const pingInterval = setInterval(() => {
      if (ws.readyState === WebSocket.OPEN) {
        ws.ping();
      }
    }, 30000); // Send ping every 30 seconds

    ws.on('pong', () => {
      // Client responded to ping
      (ws as any).isAlive = true;
    });

    ws.on('error', (error) => {
      log(`WebSocket error: ${error.message}`);
    });

    ws.on('close', () => {
      clearInterval(pingInterval);
      log('Client disconnected');
    });
  });

  // Enhanced error handling middleware
  app.use((err: any, req: Request, res: Response, _next: NextFunction) => {
    console.error('Error:', err);
    
    let status = err.status || err.statusCode || 500;
    let message = err.message || "Internal Server Error";

    // Check for specific error types
    if (err.message?.includes('not configured') || err.message?.includes('API key')) {
      status = 500;
      message = 'Server configuration error: Required API keys are missing. Please check environment variables.';
    } else if (err.code === 'ECONNREFUSED' || err.code === 'ETIMEDOUT') {
      status = 503;
      message = 'Service temporarily unavailable. Please try again later.';
    }

    // Add request information for better debugging
    const requestInfo = {
      path: req.path,
      method: req.method,
      query: req.query,
      timestamp: new Date().toISOString(),
      requestId: `${Date.now()}-${Math.random().toString(36).substr(2, 9)}`
    };

    const errorResponse = {
      error: {
        message,
        status,
        request: requestInfo
      }
    };

    // Only include error details in development
    if (process.env.NODE_ENV === 'development') {
      (errorResponse.error as any).details = err.stack;
    }

    res.status(status).json(errorResponse);
  });

  if (app.get("env") === "development") {
    await setupVite(app, server);
  } else {
    serveStatic(app);
  }

  const PORT = process.env.PORT || 5000;
  server.listen(Number(PORT), "0.0.0.0", () => {
    log(`Server running on port ${PORT} in ${app.get("env")} mode`);
  });
})();

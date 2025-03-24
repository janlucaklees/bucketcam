import { serve } from "bun";

import html_index from "./index.html" with { type: "text" };
import html_send from "./send.html" with { type: "text" };

const PORT = 3000;

const server = serve({
  port: PORT,
  hostname: "0.0.0.0",
  fetch(req, server) {
    const url = new URL(req.url);
    const clientIP = server.requestIP(req)?.address;
    const timestamp = new Date().toISOString().replace("T", " ").split(".")[0];

    console.log(`[${timestamp}] ${clientIP} accessed ${url.pathname}`);

    // Serve the main HTML page at "/"
    if (url.pathname === "/") {
      return new Response(html_index, {
        headers: {
          "Content-Type": "text/html",
        },
      });
    } else if (url.pathname === "/send") {
      return new Response(html_send, {
        headers: {
          "Content-Type": "text/html",
        },
      });
    } else if (url.pathname === "/ws") {
      return (
        server.upgrade(req) || new Response("Upgrade failed", { status: 500 })
      );
    } else {
      return new Response("Not found", { status: 404 });
    }
  },
  websocket: {
    open(ws) {
      ws.subscribe("signals");
    },
    message(ws, message) {
      ws.publish("signals", message);
    },
    close(ws) {
      ws.unsubscribe("signals");
    },
  },
});

console.log(`Server running on http://localhost:${PORT}`);

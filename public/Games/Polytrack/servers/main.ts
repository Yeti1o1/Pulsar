// A very simple web socket client
function getClientHtml(domain) {
  return `<html>
    <body>
      <h1>WebSocket Example v2</h1>
      <pre id="pongs"></pre>

      <script>
        const ws = new WebSocket("wss://${domain}/");
        const output = document.querySelector("#pongs");
        const write = (msg) => output.append(msg + "\\n");

        // Print a "pong" when the server responds
        ws.onmessage = (e) => write(e.data);

        // Ping the server every second
        setInterval(() => {
          ws.send("ping");
        }, 1000);
      </script>
    </body>
  </html>`;
}

// A simple WebSocket server
Deno.serve((request: Request) => {
  if (request.headers.get("upgrade") === "websocket") {
    // Upgrade to a web socket response if requested
    const { socket, response } = Deno.upgradeWebSocket(request);

    // Listen for incoming messages
    socket.onmessage = (_e) => {
      console.log("ping");
      socket.send("pong");
    };

    return response;
  } else {
    // Normal HTTP requests receive the client HTML
    const url = new URL(request.url);
    const body = new TextEncoder().encode(getClientHtml(url.host));
    return new Response(body);
  }
});

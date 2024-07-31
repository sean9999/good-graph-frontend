const PORT = 8282;
const HOST = "localhost";
const WEBSOCKET_PREFIX = "ws";
const LOG_LEVEL = "info";

const websockUrl = () => {
    return `ws://${HOST}:${PORT}/${WEBSOCKET_PREFIX}`;
}

export { HOST, LOG_LEVEL, PORT, WEBSOCKET_PREFIX, websockUrl };

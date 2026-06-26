const hostname = window.location.hostname;
const isLocal = hostname === 'localhost' ||
    hostname === '127.0.0.1' ||
    hostname.startsWith('192.168.') ||
    hostname.startsWith('100.');

export const API_BASE_URL = isLocal ? `http://${hostname}:5000` : 'https://api.aquasafe.my.id';
export const WS_BASE_URL = isLocal ? `ws://${hostname}:5000` : 'wss://api.aquasafe.my.id';

import '../style.css';
import { generateRoast } from '../services/ai';
import { createOverlay } from './ui';

console.log("[DuckTator] Content script loaded!");

async function applyRoast(url: string) {
    const roastText = await generateRoast(url);
    createOverlay(roastText, () => applyRoast(url));
}

chrome.runtime.onMessage.addListener((request, _sender, sendResponse) => {
    if (request.action === 'ROAST_THE_USER') {
        console.log("[DuckTator] Received ROAST command for", request.url);
        applyRoast(request.url);
        sendResponse({ status: 'ACK' });
    }
});

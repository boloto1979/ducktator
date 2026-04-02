import '../style.css';
import { generateRoast, PageContext } from '../services/ai';
import { createOverlay } from './ui';
import { storage } from '../services/storage';

console.log("[DuckTator] Content script loaded!");

function getPageContext(url: string): PageContext {
    const parsed = new URL(url);
    return {
        hostname: parsed.hostname,
        title: document.title.slice(0, 120),
        path: parsed.pathname,
    };
}

async function applyRoast(url: string) {
    const context = getPageContext(url);
    const result = await storage.get(['sound_enabled', 'aggressiveness'])
        .then(r => generateRoast(url, context, (r.aggressiveness ?? 2) as 1 | 2 | 3)
            .then(text => ({ text, sound: r.sound_enabled !== false })));
    createOverlay(result.text, () => applyRoast(url), result.sound);
}

chrome.runtime.onMessage.addListener((request, _sender, sendResponse) => {
    if (request.action === 'ROAST_THE_USER') {
        console.log("[DuckTator] Received ROAST command for", request.url);
        applyRoast(request.url);
        sendResponse({ status: 'ACK' });
    }
});

import '../style.css';
import { generateRoast } from '../services/ai';
import { createOverlay } from './ui';
import { storage } from '../services/storage';

console.log("[DuckTator] Content script loaded!");

async function applyRoast(url: string) {
    const [roastText, storageResult] = await Promise.all([
        generateRoast(url),
        storage.get(['sound_enabled']),
    ]);
    const soundEnabled = storageResult.sound_enabled !== false;
    createOverlay(roastText, () => applyRoast(url), soundEnabled);
}

chrome.runtime.onMessage.addListener((request, _sender, sendResponse) => {
    if (request.action === 'ROAST_THE_USER') {
        console.log("[DuckTator] Received ROAST command for", request.url);
        applyRoast(request.url);
        sendResponse({ status: 'ACK' });
    }
});

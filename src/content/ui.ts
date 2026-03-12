export const createOverlay = (roastText: string, onRetry: () => void) => {
    if (document.getElementById('ducktator-overlay')) return;

    const overlay = document.createElement('div');
    overlay.id = 'ducktator-overlay';
    Object.assign(overlay.style, {
        position: 'fixed',
        top: '0',
        left: '0',
        width: '100vw',
        height: '100vh',
        backgroundColor: 'rgba(0, 0, 0, 0.95)',
        zIndex: '999999',
        display: 'flex',
        flexDirection: 'column',
        alignItems: 'center',
        justifyContent: 'center',
        fontFamily: '"Courier New", Courier, monospace',
        color: '#f58e0a',
        textAlign: 'center',
        padding: '2rem'
    });

    const img = document.createElement('img');
    img.src = chrome.runtime.getURL('images/duck.png');
    Object.assign(img.style, {
        width: '150px',
        height: '150px',
        marginBottom: '2rem',
        imageRendering: 'pixelated',
        border: '4px solid #f58e0a',
        borderRadius: '50%',
        padding: '10px',
        backgroundColor: '#2b2a2a'
    });

    const container = document.createElement('div');
    Object.assign(container.style, {
        maxWidth: '600px',
        backgroundColor: '#2b2a2a',
        padding: '3rem',
        border: '2px solid #5d4a3f',
        borderRadius: '8px',
        boxShadow: '0 0 20px rgba(245, 142, 10, 0.2)'
    });

    container.appendChild(img);

    const title = document.createElement('h1');
    title.innerText = "QUACK! GET BACK TO WORK!";
    Object.assign(title.style, {
        fontSize: '3rem',
        fontWeight: 'bold',
        marginBottom: '1rem',
        textTransform: 'uppercase',
        letterSpacing: '2px'
    });

    const roastP = document.createElement('p');
    roastP.innerText = `"${roastText}"`;
    Object.assign(roastP.style, {
        fontSize: '1.25rem',
        lineHeight: '1.6',
        marginBottom: '2rem',
        color: '#d1d5db',
        fontStyle: 'italic'
    });

    const closeBtn = document.createElement('button');
    closeBtn.innerText = "I am weak... let me stay (5min)";
    Object.assign(closeBtn.style, {
        backgroundColor: 'transparent',
        border: '1px solid #555',
        color: '#777',
        padding: '0.5rem 1rem',
        fontSize: '0.875rem',
        cursor: 'pointer',
        transition: 'all 0.2s',
        borderRadius: '4px'
    });
    
    closeBtn.onmouseover = () => {
        closeBtn.style.color = '#f58e0a';
        closeBtn.style.borderColor = '#f58e0a';
    };
    closeBtn.onmouseout = () => {
        closeBtn.style.color = '#777';
        closeBtn.style.borderColor = '#555';
    };

    closeBtn.onclick = () => {
        overlay.remove();
        setTimeout(onRetry, 5 * 60 * 1000);
    };

    container.appendChild(title);
    container.appendChild(roastP);
    container.appendChild(closeBtn);
    overlay.appendChild(container);

    document.body.appendChild(overlay);
};

export function startHeartbeat() {
    setInterval(async () => {
        try {
            await fetch('https://www.google.com', { mode: 'no-cors' });
            document.getElementById('connection-status').innerHTML = '<strong>Internet Connection:</strong> Connected';
        } catch (error) {
            document.getElementById('connection-status').innerHTML = '<strong>Internet Connection:</strong> Disconnected';
        }
    }, 5000); // Check every 5 seconds
}

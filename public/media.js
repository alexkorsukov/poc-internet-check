export async function testMedia() {
    try {
        const stream = await navigator.mediaDevices.getUserMedia({ video: true, audio: true });
        const video = document.getElementById('video');
        video.srcObject = stream;
        const videoTrack = stream.getVideoTracks()[0];
        const audioTrack = stream.getAudioTracks()[0];

        // Show video element
        video.style.display = 'block';

        // Initial video quality test
        const videoSettings = videoTrack.getSettings();
        const videoQuality = (videoSettings.width >= 1280 && videoSettings.height >= 720 && videoSettings.frameRate >= 30) ? 'Good' : 'Poor';
        document.getElementById('initial-video-quality-result').innerHTML = `
            <strong>Video Quality:</strong> ${videoSettings.width}x${videoSettings.height} at ${videoSettings.frameRate} FPS
        `;
        document.getElementById('qualitative-video-result').innerHTML = `
            <strong>Qualitative Evaluation:</strong> ${videoQuality}
        `;

        // Initial audio quality test
        const audioSettings = audioTrack.getSettings();
        const audioQuality = (audioSettings.sampleRate >= 44100 && audioSettings.channelCount >= 2) ? 'Good' : 'Poor';
        document.getElementById('initial-audio-quality-result').innerHTML = `
            <strong>Audio Quality:</strong> Sample Rate: ${audioSettings.sampleRate}, Channels: ${audioSettings.channelCount}
        `;
        document.getElementById('qualitative-audio-result').innerHTML = `
            <strong>Qualitative Evaluation:</strong> ${audioQuality}
        `;

        // Real-time quality metrics
        const pc = new RTCPeerConnection();
        pc.addTrack(videoTrack, stream);
        pc.addTrack(audioTrack, stream);

        // Check if webcam and mic are transmitting
        const audioContext = new (window.AudioContext || window.webkitAudioContext)();
        const analyser = audioContext.createAnalyser();
        const microphone = audioContext.createMediaStreamSource(stream);
        microphone.connect(analyser);
        analyser.fftSize = 256;
        const bufferLength = analyser.frequencyBinCount;
        const dataArray = new Uint8Array(bufferLength);

        setInterval(async () => {
            const stats = await pc.getStats();

            let videoStats = '';
            let audioStats = '';

            stats.forEach(report => {
                if (report.type === 'outbound-rtp' && report.kind === 'video') {
                    videoStats += `<strong>Real-Time Video Quality:</strong> 
                        Frame Rate: ${report.framesPerSecond || 'N/A'}, 
                        Bitrate: ${(report.bytesSent / 1000).toFixed(2)} kbps,
                        Packet Loss: ${report.packetsLost || 0}<br/>`;
                } else if (report.type === 'outbound-rtp' && report.kind === 'audio') {
                    audioStats += `<strong>Real-Time Audio Quality:</strong> 
                        Bitrate: ${(report.bytesSent / 1000).toFixed(2)} kbps,
                        Packet Loss: ${report.packetsLost || 0}<br/>`;
                }
            });

            // Check if the microphone is transmitting audio
            analyser.getByteFrequencyData(dataArray);
            const audioLevel = dataArray.reduce((sum, value) => sum + value, 0) / bufferLength;
            audioStats += `<strong>Microphone Level:</strong> ${audioLevel.toFixed(2)}<br/>`;

            // Check if the webcam is transmitting video
            if (videoTrack.readyState === 'live' && videoTrack.enabled) {
                videoStats += `<strong>Webcam transmitting video:</strong> YES`;
            } else {
                videoStats += `<strong>Webcam transmitting video:</strong> NO`;
            }

            document.getElementById('real-time-video-stats').innerHTML = videoStats;
            document.getElementById('real-time-audio-stats').innerHTML = audioStats;

        }, 1000); // Update every second

        updateStatuses(videoTrack, audioTrack);
    } catch (error) {
        console.error('Error accessing media devices.', error);
    }
}

function updateStatuses(videoTrack, audioTrack) {
    document.getElementById('video-status').innerHTML = `<strong>Video:</strong> ${videoTrack.enabled ? 'On' : 'Off'}`;
    document.getElementById('mic-status').innerHTML = `<strong>Mic:</strong> ${audioTrack.enabled ? 'On' : 'Off'}`;
}

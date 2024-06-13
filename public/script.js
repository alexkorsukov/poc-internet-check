$(document).ready(function () {
    let videoTrack, audioTrack;
    let videoUploadDuration = 5;  // Default to 5 seconds
    let downloadTestUrl = 'https://speed.hetzner.de/100MB.bin';  // Default URL

    async function fetchConfig() {
        try {
            const response = await fetch('/config');
            const config = await response.json();
            videoUploadDuration = config.videoUploadDuration;
            downloadTestUrl = config.downloadTestUrl;
        } catch (error) {
            console.error('Error fetching configuration:', error);
        }
    }

    async function testMedia() {
        try {
            const stream = await navigator.mediaDevices.getUserMedia({ video: true, audio: true });
            const video = $('#video')[0];
            video.srcObject = stream;
            videoTrack = stream.getVideoTracks()[0];
            audioTrack = stream.getAudioTracks()[0];

            // Show video element
            $('#video').show();

            // Initial video quality test
            const videoSettings = videoTrack.getSettings();
            const videoQuality = (videoSettings.width >= 1280 && videoSettings.height >= 720 && videoSettings.frameRate >= 30) ? 'Good' : 'Poor';
            $('#initial-video-quality-result').html(`
                <strong>Video Quality:</strong> 
                Width: ${videoSettings.width}, 
                Height: ${videoSettings.height}, 
                Frame Rate: ${videoSettings.frameRate} 
                <br/> <strong>Qualitative Evaluation:</strong> ${videoQuality}
            `);

            // Initial audio quality test
            const audioSettings = audioTrack.getSettings();
            const audioQuality = (audioSettings.sampleRate >= 44100 && audioSettings.channelCount >= 2) ? 'Good' : 'Poor';
            $('#initial-audio-quality-result').html(`
                <strong>Audio Quality:</strong> 
                Sample Rate: ${audioSettings.sampleRate}, 
                Channel Count: ${audioSettings.channelCount}
                <br/> <strong>Qualitative Evaluation:</strong> ${audioQuality}
            `);

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
                    videoStats += `<strong>Webcam is transmitting video.</strong>`;
                } else {
                    videoStats += `<strong>Webcam is not transmitting video.</strong>`;
                }

                $('#real-time-video-stats').html(videoStats);
                $('#real-time-audio-stats').html(audioStats);

            }, 1000); // Update every second

            updateStatuses();
        } catch (error) {
            console.error('Error accessing media devices.', error);
        }
    }

    async function checkInternetSpeed() {
        const speedTestResult = $('#internet-speed-result');
        const startTime = (new Date()).getTime();

        try {
            const response = await fetch(downloadTestUrl);
            if (!response.ok) throw new Error('Network response was not ok');
            const endTime = (new Date()).getTime();
            const duration = (endTime - startTime) / 1000;
            const bitsLoaded = response.headers.get('content-length') * 8; // Content-Length in bits
            const speedMbps = (bitsLoaded / duration) / (1024 * 1024);
            speedTestResult.html(`<strong>Download Speed:</strong> ${speedMbps.toFixed(2)} Mbps`);
        } catch (error) {
            speedTestResult.html(`<strong>Internet Speed Test Failed</strong>`);
            console.error('Error during speed test:', error);
        }

        // Fetch API endpoint from server
        const configResponse = await fetch('/config');
        const config = await configResponse.json();
        const uploadUrl = config.apiEndpoint;

        // Capture video for the specified duration and upload it
        const stream = await navigator.mediaDevices.getUserMedia({ video: true });
        const mediaRecorder = new MediaRecorder(stream);
        const chunks = [];

        mediaRecorder.ondataavailable = (event) => {
            chunks.push(event.data);
        };

        mediaRecorder.start();

        setTimeout(() => {
            mediaRecorder.stop();
        }, videoUploadDuration * 1000); // Duration specified in the configuration

        mediaRecorder.onstop = async () => {
            const blob = new Blob(chunks, { type: 'video/webm' });
            const uploadStartTime = (new Date()).getTime();

            try {
                const formData = new FormData();
                formData.append('file', blob, 'test-video.webm');

                const uploadResponse = await fetch(uploadUrl, {
                    method: 'POST',
                    body: formData,
                });

                if (!uploadResponse.ok) throw new Error('Network response was not ok');
                const uploadEndTime = (new Date()).getTime();
                const uploadDuration = (uploadEndTime - uploadStartTime) / 1000;
                const uploadBitsLoaded = blob.size * 8; // Content-Length in bits
                const uploadSpeedMbps = (uploadBitsLoaded / uploadDuration) / (1024 * 1024);
                $('#upload-speed-result').html(`<strong>Upload Speed:</strong> ${uploadSpeedMbps.toFixed(2)} Mbps`);

                // Analyze quality
                const analysisResult = await uploadResponse.json();
                $('#video-quality-analysis').html(`
                    <strong>Video Quality Analysis:</strong>
                    Width: ${analysisResult.videoQuality.width}, 
                    Height: ${analysisResult.videoQuality.height}, 
                    Frame Rate: ${analysisResult.videoQuality.frameRate}, 
                    Codec: ${analysisResult.videoQuality.codec}
                `);
                $('#audio-quality-analysis').html(`
                    <strong>Audio Quality Analysis:</strong>
                    Sample Rate: ${analysisResult.audioQuality.sampleRate}, 
                    Channels: ${analysisResult.audioQuality.channels}, 
                    Codec: ${analysisResult.audioQuality.codec}
                `);
            } catch (error) {
                $('#upload-speed-result').html(`<strong>Upload Speed Test Failed</strong>`);
                console.error('Error during upload speed test:', error);
            }
        };
    }

    function startHeartbeat() {
        setInterval(async () => {
            try {
                await fetch('https://www.google.com', { mode: 'no-cors' });
                $('#connection-status').html('<strong>Internet Connection:</strong> Connected');
            } catch (error) {
                $('#connection-status').html('<strong>Internet Connection:</strong> Disconnected');
            }
        }, 5000); // Check every 5 seconds
    }

    function updateStatuses() {
        $('#video-status').html(`<strong>Video:</strong> ${videoTrack.enabled ? 'On' : 'Off'}`);
        $('#mic-status').html(`<strong>Mic:</strong> ${audioTrack.enabled ? 'On' : 'Off'}`);
    }

    $('#toggle-video').on('click', function() {
        if (videoTrack) {
            videoTrack.enabled = !videoTrack.enabled;
            updateStatuses();
        }
    });

    $('#toggle-mic').on('click', function() {
        if (audioTrack) {
            audioTrack.enabled = !audioTrack.enabled;
            updateStatuses();
        }
    });

    fetchConfig().then(() => {
        testMedia();
        checkInternetSpeed();
        startHeartbeat();
    });
});

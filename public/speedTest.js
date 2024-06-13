import { fetchConfig } from './config.js';

export async function checkInternetSpeed() {
    const speedTestResult = document.getElementById('internet-speed-result');
    const uploadSpeedResult = document.getElementById('upload-speed-result');

    // Show initial labels
    speedTestResult.innerHTML = '<strong>Download Speed:</strong> Loading...';
    uploadSpeedResult.innerHTML = '<strong>Upload Speed:</strong> Loading...';

    const { videoUploadDuration, downloadTestUrl, apiEndpoint } = await fetchConfig();
    const startTime = (new Date()).getTime();

    try {
        const response = await fetch(downloadTestUrl);
        if (!response.ok) throw new Error('Network response was not ok');
        const endTime = (new Date()).getTime();
        const duration = (endTime - startTime) / 1000;
        const bitsLoaded = response.headers.get('content-length') * 8; // Content-Length in bits
        const speedMbps = (bitsLoaded / duration) / (1024 * 1024);
        speedTestResult.innerHTML = `<strong>Download Speed:</strong> ${speedMbps.toFixed(2)} Mbps`;
    } catch (error) {
        speedTestResult.innerHTML = `<strong>Download Speed:</strong> Failed`;
        console.error('Error during speed test:', error);
    }

    // Capture video for the specified duration and upload it
    const stream = await navigator.mediaDevices.getUserMedia({ video: true, audio: true }); // Ensure audio is included
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

            const uploadResponse = await fetch(apiEndpoint, {
                method: 'POST',
                body: formData,
            });

            if (!uploadResponse.ok) throw new Error('Network response was not ok');
            const uploadEndTime = (new Date()).getTime();
            const uploadDuration = (uploadEndTime - uploadStartTime) / 1000;
            const uploadBitsLoaded = blob.size * 8; // Content-Length in bits
            const uploadSpeedMbps = (uploadBitsLoaded / uploadDuration) / (1024 * 1024);
            uploadSpeedResult.innerHTML = `<strong>Upload Speed:</strong> ${uploadSpeedMbps.toFixed(2)} Mbps`;

            // Analyze quality
            const analysisResult = await uploadResponse.json();

            if (analysisResult.videoQuality) {
                document.getElementById('remote-video-stats').innerHTML = `
                    <strong>Remote Video Stats:</strong><br/>
                    Width: ${analysisResult.videoQuality.width}, 
                    Height: ${analysisResult.videoQuality.height}, 
                    Frame Rate: ${analysisResult.videoQuality.frameRate}, 
                    Codec: ${analysisResult.videoQuality.codec}
                `;
            } else {
                document.getElementById('remote-video-stats').innerHTML = `<strong>Remote Video Stats:</strong> No video track found`;
            }

            if (analysisResult.audioQuality) {
                document.getElementById('remote-audio-stats').innerHTML = `
                    <strong>Remote Audio Stats:</strong><br/>
                    Sample Rate: ${analysisResult.audioQuality.sampleRate}, 
                    Channels: ${analysisResult.audioQuality.channels}, 
                    Codec: ${analysisResult.audioQuality.codec}
                `;
            } else {
                document.getElementById('remote-audio-stats').innerHTML = `<strong>Remote Audio Stats:</strong> No audio track found`;
            }
        } catch (error) {
            uploadSpeedResult.innerHTML = `<strong>Upload Speed:</strong> Failed`;
            console.error('Error during upload speed test:', error);
        }
    };
}

import { fetchConfig } from './config.js';
import { testMedia } from './media.js';
import { checkInternetSpeed } from './speedTest.js';
import { startHeartbeat } from './heartbeat.js';

$(document).ready(function () {
    async function init() {
        await fetchConfig();
        await testMedia();
        await checkInternetSpeed();
        startHeartbeat();
    }

    init();

    $('#toggle-video').on('click', function() {
        const videoTrack = $('#video')[0].srcObject.getVideoTracks()[0];
        videoTrack.enabled = !videoTrack.enabled;
        updateStatuses(videoTrack, $('#video')[0].srcObject.getAudioTracks()[0]);
    });

    $('#toggle-mic').on('click', function() {
        const audioTrack = $('#video')[0].srcObject.getAudioTracks()[0];
        audioTrack.enabled = !audioTrack.enabled;
        updateStatuses($('#video')[0].srcObject.getVideoTracks()[0], audioTrack);
    });
});

function updateStatuses(videoTrack, audioTrack) {
    document.getElementById('video-status').innerHTML = `<strong>Video:</strong> ${videoTrack.enabled ? 'On' : 'Off'}`;
    document.getElementById('mic-status').innerHTML = `<strong>Mic:</strong> ${audioTrack.enabled ? 'On' : 'Off'}`;
}

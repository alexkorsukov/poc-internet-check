export async function fetchConfig() {
    let videoUploadDuration = 10;  // Default to 10 seconds
    let downloadTestUrl = 'https://listhub-reports.s3.amazonaws.com/test/test.zip';  // Default URL
    let apiEndpoint = '';

    try {
        const response = await fetch('/config');
        const config = await response.json();
        videoUploadDuration = config.videoUploadDuration;
        downloadTestUrl = config.downloadTestUrl;
        apiEndpoint = config.apiEndpoint;
    } catch (error) {
        console.error('Error fetching configuration:', error);
    }

    return { videoUploadDuration, downloadTestUrl, apiEndpoint };
}

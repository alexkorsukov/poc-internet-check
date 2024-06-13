import express from 'express';
import multer from 'multer';
import path from 'path';
import dotenv from 'dotenv';
import cors from 'cors';
import ffmpeg from 'fluent-ffmpeg';

dotenv.config();

const app = express();
const upload = multer({ dest: 'uploads/' });

const corsOptions = {
    origin: process.env.CORS_ORIGIN || '*',
};

// Configure CORS to allow requests from the specified origin
app.use(cors(corsOptions));

app.use(express.static(path.join(__dirname, '../public')));

app.post('/upload', upload.single('file'), (req, res) => {
    if (!req.file) {
        return res.status(400).send('No file uploaded.');
    }

    const filePath = req.file.path;

    // Analyze video and audio quality using ffmpeg
    ffmpeg.ffprobe(filePath, (err, metadata) => {
        if (err) {
            console.error('Error analyzing media file:', err);
            return res.status(500).send('Error analyzing media file');
        }

        // Extract relevant information
        const videoStream = metadata.streams.find(s => s.codec_type === 'video');
        const audioStream = metadata.streams.find(s => s.codec_type === 'audio');

        const videoQuality = videoStream ? {
            width: videoStream.width,
            height: videoStream.height,
            frameRate: videoStream.r_frame_rate,
            codec: videoStream.codec_name,
        } : null;

        const audioQuality = audioStream ? {
            sampleRate: audioStream.sample_rate,
            channels: audioStream.channels,
            codec: audioStream.codec_name,
        } : null;

        if (!videoQuality) {
            console.warn('Video quality data is missing');
        }

        if (!audioQuality) {
            console.warn('Audio quality data is missing');
        }

        res.status(200).json({
            videoQuality,
            audioQuality,
        });
    });
});

app.get('/config', (req, res) => {
    const videoUploadDuration = process.env.VIDEO_UPLOAD_DURATION || '10';  // Default to 10 seconds if undefined
    const downloadTestUrl = process.env.DOWNLOAD_TEST_URL || 'https://speed.hetzner.de/100MB.bin';  // Default URL if undefined

    res.json({
        apiEndpoint: process.env.API_ENDPOINT || '',
        videoUploadDuration: parseInt(videoUploadDuration, 10),
        downloadTestUrl: downloadTestUrl
    });
});

app.get('/', (req, res) => {
    res.sendFile(path.join(__dirname, '../public/index.html'));
});

const PORT = parseInt(process.env.PORT || '3000', 10);
app.listen(PORT, '0.0.0.0', () => {
    console.log(`Server is running on http://dd.com:${PORT}`);
});

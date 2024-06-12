import express from 'express';
import multer from 'multer';
import path from 'path';
import dotenv from 'dotenv';
import cors from 'cors';

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
    res.status(200).send('Upload successful');
});

app.get('/config', (req, res) => {
    res.json({ apiEndpoint: process.env.API_ENDPOINT });
});

app.get('/', (req, res) => {
    res.sendFile(path.join(__dirname, '../public/index.html'));
});

const PORT = parseInt(process.env.PORT || '3000', 10);
app.listen(PORT, '0.0.0.0', () => {
    console.log(`Server is running on http://dd.com:${PORT}`);
});

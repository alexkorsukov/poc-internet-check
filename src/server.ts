import express from 'express';
import multer from 'multer';
import path from 'path';
import dotenv from 'dotenv';

dotenv.config();

const app = express();
const upload = multer({ dest: 'uploads/' });

app.use(express.static(path.join(__dirname, '../public')));

app.post('/upload', upload.single('file'), (req, res) => {
    res.status(200).send('Upload successful');
});

app.get('/config', (req, res) => {
    res.json({ apiEndpoint: process.env.API_ENDPOINT });
});

const PORT = process.env.PORT || 3000;
app.listen(PORT, () => {
    console.log(`Server is running on http://localhost:${PORT}`);
});

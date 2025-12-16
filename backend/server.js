const express = require('express');
const multer = require('multer');
const cors = require('cors');
const pool = require('./db');
const path = require('path');
const fs = require('fs');

const app = express();

//200MB only limit here
const upload = multer({ 
    dest: 'uploads/',
    limits: { fileSize: 200 * 1024 * 1024 } 
});

app.use(cors());
app.use(express.json());

// Serve output files
app.use('/download', express.static(path.join(__dirname, 'outputs')));


app.post('/upload', upload.single('video'), async (req, res) => {
    const file = req.file;

    
    const variants = JSON.parse(req.body.variants || '["V1"]'); 
    const profiles = JSON.parse(req.body.profiles || '["P2"]');


    console.log(`Received Job: Variants=${variants}, Profiles=${profiles}`);

    if (!file) return res.status(400).send('No file uploaded or file too large (>200MB)');

    try {
        //  Save Video
        const videoRes = await pool.query(
            'INSERT INTO videos (filename, original_name) VALUES ($1, $2) RETURNING id',
            [file.filename, file.originalname]
        );
        const videoId = videoRes.rows[0].id;

        
        for (const v of variants) {
            for (const p of profiles) {
                await pool.query(
                    'INSERT INTO tasks (video_id, variant, resolution, status) VALUES ($1, $2, $3, $4)',
                    [videoId, v, p, 'QUEUED']
                );
            }
        }

        res.json({ message: 'Jobs created successfully' });
    } catch (err) {
        console.error(err);
        res.status(500).send('Server Error');
    }
});


app.get('/status', async (req, res) => {
    try {
        const result = await pool.query(`
            SELECT t.id AS task_id, v.original_name, t.variant, t.resolution, t.status, t.output_path, t.error_message
            FROM tasks t
            JOIN videos v ON t.video_id = v.id
            ORDER BY t.id DESC
        `);
        res.json(result.rows);
    } catch (err) {
        res.status(500).send(err.message);
    }
});

app.listen(3000, () => console.log('API Server running on port 3000'));
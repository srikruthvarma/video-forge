const { parentPort } = require('worker_threads');
const pool = require('./db');
const ffmpeg = require('fluent-ffmpeg');
const path = require('path');
const fs = require('fs');


const VARIANTS = {
    'V1': { 
        codec: 'libx264', 
        audio: 'aac', 
        ext: 'mp4',
        options: ['-preset ultrafast', '-threads 0'] 
    },
    'V2': { 
        codec: 'libvpx-vp9', 
        audio: 'libopus', 
        ext: 'webm',
        options: ['-deadline realtime', '-cpu-used 8', '-row-mt 1', '-threads 0'] 
    }
};

const PROFILES = {
    'P1': { size: '854x480', bitrate: '1000k' },
    'P2': { size: '1280x720', bitrate: '2500k' },
    'P3': { size: '1920x1080', bitrate: '5000k' }
};

async function processQueue() {
    const client = await pool.connect();
    
    try {
        const { rows } = await client.query(`
            UPDATE tasks 
            SET status = 'PROCESSING', updated_at = NOW()
            WHERE id = (
                SELECT id FROM tasks WHERE status = 'QUEUED' ORDER BY created_at ASC LIMIT 1
            )
            RETURNING *
        `);

        if (rows.length === 0) {
            console.log("Waiting for new tasks...");
            client.release(); 
            return setTimeout(processQueue, 2000);
        }

        const task = rows[0];
       
        client.release(); 

        console.log(`Starting Task #${task.id}: ${task.variant} @ ${task.resolution}`);

       
        const variantConfig = VARIANTS[task.variant]; 
        const profileConfig = PROFILES[task.resolution]; 

        
        const videoRes = await pool.query('SELECT filename FROM videos WHERE id = $1', [task.video_id]);
        
        if (!videoRes.rows[0]) {
             console.error("Video file record missing. Skipping.");
             await pool.query('UPDATE tasks SET status = $1 WHERE id = $2', ['FAILED', task.id]);
             return processQueue();
        }

        const actualInputFilename = videoRes.rows[0].filename;
        const actualInputPath = path.join(__dirname, 'uploads', actualInputFilename);
        
        const outputFilename = `job_${task.id}_${task.variant}_${task.resolution}.${variantConfig.ext}`;
        const outputPath = path.join(__dirname, 'outputs', outputFilename);

     
        ffmpeg(actualInputPath)
            .videoCodec(variantConfig.codec)
            .audioCodec(variantConfig.audio)
            .size(profileConfig.size)
            .videoBitrate(profileConfig.bitrate)
            .outputOptions(variantConfig.options)
            .output(outputPath)
            .on('end', async () => {
               
                try {
                    await pool.query(
                        'UPDATE tasks SET status = $1, output_path = $2, updated_at = NOW() WHERE id = $3',
                        ['COMPLETED', outputFilename, task.id]
                    );
                    console.log(`Task #${task.id} COMPLETED`);
                } catch (err) {
                    console.error("DB Update Error:", err);
                }
                processQueue();
            })
            .on('error', async (err) => {
              
                console.error(`Task #${task.id} Failed:`, err.message);
                try {
                    await pool.query(
                        'UPDATE tasks SET status = $1, error_message = $2, updated_at = NOW() WHERE id = $3',
                        ['FAILED', err.message, task.id]
                    );
                } catch (dbErr) {
                    console.error("DB Error Log Failed:", dbErr);
                }
                processQueue();
            })
            .run();

    } catch (err) {
        console.error("Worker Error:", err);
        
        try { client.release(); } catch (e) {} 
        setTimeout(processQueue, 5000);
    }
}


if (!fs.existsSync(path.join(__dirname, 'outputs'))) {
    fs.mkdirSync(path.join(__dirname, 'outputs'));
}

processQueue();
const path = require('path');
const fs = require('fs');
const busboy = require('busboy');
const { v4: uuidv4 } = require('uuid');
const { videoMetaQueue } = require('../utils/queues/videoMetaQueue');
const { audioMetaQueue } = require('../utils/queues/audioMetaQueue');


const TEMP_DIR = '/home/krazygenus/Desktop/Omi/backend/src/temp';
const FRAME_BASE_DIR = '/home/krazygenus/Desktop/Omi/backend/src/frames';
const AUDIO_BASE_DIR =  '/home/krazygenus/Desktop/Omi/backend/src/audio';

async function videoUpload(req, res) {
    return new Promise((resolve, reject) => {
        let userId = 0;
        const bb = busboy({ headers: req.headers });
        const uploadPromises = [];
        console.log('The request objet: ', req);
        if (req.user.decode.id){ userId = req.user.decode.id }
        else{ userId = req.user.id; }

        bb.on('file', (fieldname, file, fileInfo) => {
            const jobId = uuidv4();
            const safeName = fileInfo.filename.replace(/\s+/g, '_');
            const tempPath = path.join(TEMP_DIR, `${jobId}_${safeName}`);
            const frameDir = path.join(FRAME_BASE_DIR, `user_${userId}`, jobId);
            const audioDir = path.join(AUDIO_BASE_DIR, `user_${userId}`, jobId)
            const uniqueVideoURL = `user_${userId}:video:${jobId}`;
            fs.mkdirSync(path.dirname(tempPath), { recursive: true });
            fs.mkdirSync(frameDir, { recursive: true });
            fs.mkdirSync(audioDir, { recursive: true });
            const writeStream = fs.createWriteStream(tempPath);
        
            const filePromise = new Promise((resolve) => {
              let size = 0;
              file.on('data', chunk => size += chunk.length);
              file.pipe(writeStream)
                .on('finish', () => {
                  audioMetaQueue.add('process_audio', {
                  jobId,
                  userId,
                  notifyChannel: `user:${userId}`,
                  tempPath,
                  audioDir,
                  originalName: safeName,
                  size
                  });
                  videoMetaQueue.add('process_video', {
                    jobId,
                    userId,
                    tempPath,
                    frameDir,
                    uniqueVideoURL,
                    originalName: safeName,
                    size
                  });
                  resolve(`${userId}:${jobId}`);
                });
            });
        
            uploadPromises.push(filePromise);
          });

          bb.on('finish', async () => {
            const jobId = await Promise.all(uploadPromises);
            resolve({ status: 202, message: `${jobId.length} video(s) queued`, jobId: jobId });
          });
          bb.on('error', async(err) => reject(err));
        req.pipe(bb);
    })
}

module.exports = { videoUpload };

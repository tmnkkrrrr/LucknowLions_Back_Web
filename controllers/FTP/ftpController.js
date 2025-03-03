const express = require('express');
const router = express.Router();
const axios = require('axios');
const { Client } = require('basic-ftp');
const multer = require('multer');
const upload = multer({ dest: 'uploads/' });
const fs = require('fs');
const path = require('path');
const sharp = require('sharp');

// FTP servers configuration
const ftpServers = {
    dmta: {
        name: 'DEMT',
        des: 'Server 1',
        host: "162.241.85.74",
        user: "myadmin_pannel@assets.demtaccount.in",
        password: "myadmin_pannel",
        rootDir: 'demt_images',
        color: 'blue',
        domain: 'assets.demtaccount.in',
        secure: false
    },
    lkons: {
        name: 'LL',
        des: 'Server 2',
        host: "216.10.252.54",
        user: "myadmin_pannel@assets.lucknowlions.com",
        password: "myadmin_pannel",
        rootDir: 'lions_images',
        color: 'green',
        domain: 'assets.lucknowlions.com',
        secure: false // true for FTPS
    }

};

// Helper function to get FTP config for a server
function getFtpConfig(serverId) {
    const config = ftpServers[serverId];
    if (!config) {
        throw new Error('Invalid server ID');
    }
    return config;
}


// Get servers list
router.get('/servers', (req, res) => {
    const serversList = Object.entries(ftpServers).map(([id, config]) => ({
        id, name: config.name, des: config.des, base: config.rootDir, color: config.color, domain: config.domain
    }));
    res.json(serversList);
});



// Middleware to validate serverId
// router.use((req, res, next) => {
//     const serverId = req.query.serverId || req.body.serverId;
//     if (!serverId || !ftpServers[serverId]) {
//         return res.status(400).json({ error: 'Invalid or missing server ID' });
//     }
//     next();
// });

// List directory contents
router.get('/list', async (req, res) => {
    const client = new Client();
    try {
        await client.access(getFtpConfig(req.query.serverId));
        const path = req.query.path || '/';
        // const adjustedPath = path === '/' ? `/${getFtpConfig(req.query.serverId).rootDir}` : path;
        const list = await client.list(path);

        const files = list.map(item => ({
            name: item.name,
            size: item.size,
            isDirectory: item.type === 2,
            modifiedDate: item.modifiedDate,
            permissions: item.rawModifiedDate
        }));

        res.json(files);
    } catch (err) {
        res.status(500).json({ error: err.message });
    } finally {
        client.close();
    }
});

// Download file
router.get('/download', async (req, res) => {
    const client = new Client();
    try {
        await client.access(getFtpConfig(req.query.serverId));
        const filePath = req.query.path;
        if (!filePath) {
            throw new Error('File path is required');
        }

        const fileName = path.basename(filePath);
        res.setHeader('Content-Disposition', `attachment; filename="${fileName}"`);
        await client.downloadTo(res, filePath);
    } catch (err) {
        res.status(500).json({ error: err.message });
    } finally {
        client.close();
    }
});

// Upload files
router.post('/upload', upload.array('files'), async (req, res) => {
    const client = new Client();

    try {
        await client.access(getFtpConfig(req.body.serverId));
        let uploadPath = req.body.path || '/';

        uploadPath = '/' + uploadPath.replace(/\\/g, '/').replace(/^\/+/, '').replace(/\/+$/, '');

        for (const file of req.files) {
            try {
                const sanitizedName = file.originalname
                    .replace(/\\/g, '/')
                    .split('/')
                    .pop()
                    .replace(/[^a-zA-Z0-9.-]/g, '_');

                const ftpPath = `${uploadPath}/${sanitizedName}`.replace(/\/+/g, '/');
                const fileStream = fs.createReadStream(file.path);

                await client.uploadFrom(fileStream, ftpPath);
                fs.unlinkSync(file.path);
            } catch (fileErr) {
                console.error(`Error uploading file ${file.originalname}:`, fileErr);
            }
        }

        res.json({ message: 'Files uploaded successfully' });
    } catch (err) {
        console.error('FTP upload error:', err);
        res.status(500).json({ error: err.message });
    } finally {
        client.close();
    }
});


//Resize Image
router.put('/resize', async (req, res) => {
    const client = new Client();

    try {
        const { fileUrl, serverId, path, width, height } = req.body;

        if (!fileUrl) {
            return res.status(400).json({ error: 'File URL is required' });
        }

        await client.access(getFtpConfig(serverId));
        let uploadPath = '/' + (path || '').replace(/\\/g, '/').replace(/^\/+/, '').replace(/\/+$/, '');

        const parsedWidth = parseInt(width) || null;
        const parsedHeight = parseInt(height) || null;

        if (!parsedWidth && !parsedHeight) {
            throw new Error('Width or height must be specified');
        }

        // Download file from URL
        const response = await axios({
            method: 'GET',
            url: fileUrl,
            responseType: 'arraybuffer'
        });

        // Extract filename from URL
        const fileName = fileUrl.split('/').pop().replace(/[^a-zA-Z0-9.-]/g, '_');
        const ftpPath = `${uploadPath}/${fileName}`.replace(/\/+/g, '/');

        // Resize image
        const resizedBuffer = await sharp(response.data)
            .resize(parsedWidth, parsedHeight, {
                fit: 'contain',
                withoutEnlargement: true
            })
            .toBuffer();

        // Convert buffer to stream and upload to FTP
        const { Readable } = require('stream');
        const readableStream = Readable.from(resizedBuffer);
        await client.uploadFrom(readableStream, ftpPath);

        res.json({
            message: 'File resized and uploaded successfully',
            path: ftpPath
        });
    } catch (err) {
        console.error('Processing/Upload error:', err);
        res.status(500).json({ error: err.message });
    } finally {
        client.close();
    }
});
// Delete file or directory
router.delete('/delete', async (req, res) => {
    const client = new Client();
    try {
        await client.access(getFtpConfig(req.query.serverId));
        const filePath = req.query.path;
        if (!filePath) {
            throw new Error('File path is required');
        }

        const list = await client.list(path.dirname(filePath));
        const target = list.find(item => item.name === path.basename(filePath));

        if (target.type === 2) {
            await client.removeDir(filePath);
        } else {
            await client.remove(filePath);
        }

        res.json({ message: 'Deleted successfully' });
    } catch (err) {
        res.status(500).json({ error: err.message });
    } finally {
        client.close();
    }
});

// Create directory
router.post('/mkdir', async (req, res) => {
    const client = new Client();
    try {
        await client.access(getFtpConfig(req.body.serverId));
        const dirPath = req.body.path;
        if (!dirPath) {
            throw new Error('Directory path is required');
        }

        await client.ensureDir(dirPath);
        res.json({ message: 'Directory created successfully' });
    } catch (err) {
        res.status(500).json({ error: err.message });
    } finally {
        client.close();
    }
});

// Rename file or directory
router.post('/rename', async (req, res) => {
    const client = new Client();
    try {
        await client.access(getFtpConfig(req.body.serverId));
        const { oldPath, newPath } = req.body;
        if (!oldPath || !newPath) {
            throw new Error('Both old and new paths are required');
        }

        await client.rename(oldPath, newPath);
        res.json({ message: 'Renamed successfully' });
    } catch (err) {
        res.status(500).json({ error: err.message });
    } finally {
        client.close();
    }
});


module.exports = router;
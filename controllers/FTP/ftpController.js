const express = require('express');
const router = express.Router();
const { Client } = require('basic-ftp');
const multer = require('multer');
const upload = multer({ dest: 'uploads/' });
const fs = require('fs');
const path = require('path');

// FTP connection configuration
const ftpConfig = {
    host: "216.10.252.54",
    user: "myadmin_pannel@assets.lucknowlions.com",
    password: "myadmin-pannel",
    secure: false // true for FTPS
};

// Helper function to create FTP client connection
async function createFtpClient() {
    const client = new Client();
    client.ftp.verbose = true; // Enable logging for debugging
    try {
        await client.access(ftpConfig);
        return client;
    } catch (err) {
        throw new Error(`FTP Connection failed: ${err.message}`);
    }
}

// List directory contents
router.get('/list', async (req, res) => {
    const client = new Client();
    try {
        await client.access(ftpConfig);
        const path = req.query.path || '/';
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
        await client.access(ftpConfig);
        const filePath = req.query.path;
        if (!filePath) {
            throw new Error('File path is required');
        }

        // Get file name from path
        const fileName = path.basename(filePath);
        
        // Set headers for file download
        res.setHeader('Content-Disposition', `attachment; filename="${fileName}"`);
        
        // Stream the file directly to the response
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
        await client.access(ftpConfig);
        let uploadPath = req.body.path || '/';
        
        // Normalize upload path to use forward slashes and ensure it starts with '/'
        uploadPath = '/' + uploadPath.replace(/\\/g, '/').replace(/^\/+/, '').replace(/\/+$/, '');
        
        // Upload each file
        for (const file of req.files) {
            try {
                // Sanitize the filename
                const sanitizedName = file.originalname
                    .replace(/\\/g, '/') // Replace backslashes with forward slashes
                    .split('/')
                    .pop() // Get just the filename, no path
                    .replace(/[^a-zA-Z0-9.-]/g, '_'); // Replace special chars with underscore

                // Combine path and filename using forward slashes
                const ftpPath = `${uploadPath}/${sanitizedName}`.replace(/\/+/g, '/');
                
                const fileStream = fs.createReadStream(file.path);
                
                console.log(`Uploading to FTP path: ${ftpPath}`);
                await client.uploadFrom(fileStream, ftpPath);
                
                // Clean up temp file
                fs.unlinkSync(file.path);
            } catch (fileErr) {
                console.error(`Error uploading file ${file.originalname}:`, fileErr);
                // Continue with other files even if one fails
            }
        }
        
        res.json({ message: 'Files uploaded successfully' });
    } catch (err) {
        console.error('FTP upload error:', err);
        res.status(500).json({ error: err.message });
    } finally {
        await client.close();
    }
});

// Delete file or directory
router.delete('/delete', async (req, res) => {
    const client = new Client();
    try {
        await client.access(ftpConfig);
        const filePath = req.query.path;
        if (!filePath) {
            throw new Error('File path is required');
        }

        // Check if it's a directory
        const list = await client.list(path.dirname(filePath));
        const target = list.find(item => item.name === path.basename(filePath));
        
        if (target.type === 2) { // Directory
            await client.removeDir(filePath);
        } else { // File
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
        await client.access(ftpConfig);
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
        await client.access(ftpConfig);
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
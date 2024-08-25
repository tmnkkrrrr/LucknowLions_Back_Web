const fs = require('fs');
const path = require('path');

function readAndParseJson(filePath) {
    try {
        const absolutePath = path.resolve(__dirname, filePath);
        const jsonData = fs.readFileSync(absolutePath, 'utf-8');
        const data = JSON.parse(jsonData);
        return data;
    } catch (error) {
        console.error("Error reading or parsing the JSON file:", error);
        return null;
    }
}

function writeJson(filePath, content) {
    try {
        const absolutePath = path.resolve(__dirname, filePath);
        const jsonString = JSON.stringify(content, null, 2); // Pretty-print with 2 spaces
        fs.writeFileSync(absolutePath, jsonString, 'utf-8');
        console.log("File successfully written.");
    } catch (error) {
        console.error("Error writing to the JSON file:", error);
    }
}


module.exports ={ readAndParseJson, writeJson};

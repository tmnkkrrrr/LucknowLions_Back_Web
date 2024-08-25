const { exec } = require('child_process');
const path = require('path');
const { sendDbBackup } = require('../functions');

const backupDatabase = () => {
    return new Promise((resolve, reject) => {
      // Generate a filename based on the current date and time
      const filename = `${process.env.DB_NAME}_backup_${new Date().toISOString().replace(/[:.]/g, '-')}.sql`;
      const filepath = path.join(__dirname, filename);
  
      // Construct the mysqldump command
      const command = `mysqldump -h ${process.env.DB_HOST} -u ${process.env.DB_USER} -p${process.env.DB_PASS} ${process.env.DB_NAME} > ${filepath}`;
  
      // Execute the command
      exec(command, (error, stdout, stderr) => {
        if (error) {
          reject(`Error executing command: ${error.message}`);
          return;
        }
  
        if (stderr) {
          reject(`Error: ${stderr}`);
          return;
        }
        sendDbBackup(filename);
        resolve(`Backup successfully saved to ${filepath}`);
      });
    });
  };
  
  // Export the function
  module.exports = backupDatabase;
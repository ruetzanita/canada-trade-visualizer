import fs from 'fs';
import path from 'path';

const apiDir = path.join(process.cwd(), 'app', 'api');
const backupDir = path.join(process.cwd(), '.api_backup');

if (fs.existsSync(apiDir)) {
  if (fs.existsSync(backupDir)) {
    fs.rmSync(backupDir, { recursive: true, force: true });
  }
  fs.mkdirSync(backupDir, { recursive: true });
  fs.cpSync(apiDir, backupDir, { recursive: true });
  fs.rmSync(apiDir, { recursive: true, force: true });
  console.log('Successfully backed up and temporarily removed app/api for static build.');
}

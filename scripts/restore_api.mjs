import fs from 'fs';
import path from 'path';

const apiDir = path.join(process.cwd(), 'app', 'api');
const backupDir = path.join(process.cwd(), '.api_backup');

if (fs.existsSync(backupDir)) {
  if (fs.existsSync(apiDir)) {
    fs.rmSync(apiDir, { recursive: true, force: true });
  }
  fs.mkdirSync(apiDir, { recursive: true });
  fs.cpSync(backupDir, apiDir, { recursive: true });
  fs.rmSync(backupDir, { recursive: true, force: true });
  console.log('Successfully restored app/api directory for dev workflow.');
}

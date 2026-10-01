import fs from 'fs';
import path from 'path';
import https from 'https';

const globeDir = path.join(process.cwd(), 'public', 'assets', 'globe');

if (!fs.existsSync(globeDir)) {
  fs.mkdirSync(globeDir, { recursive: true });
}

function downloadFile(url, destPath) {
  return new Promise((resolve, reject) => {
    console.log(`Downloading ${url} -> ${destPath}...`);
    const file = fs.createWriteStream(destPath);
    https.get(url, (response) => {
      if (response.statusCode === 301 || response.statusCode === 302 || response.statusCode === 307 || response.statusCode === 308) {
        const redirectUrl = new URL(response.headers.location, url).toString();
        return downloadFile(redirectUrl, destPath).then(resolve).catch(reject);
      }
      if (response.statusCode !== 200) {
        return reject(new Error(`Failed to download ${url}: status code ${response.statusCode}`));
      }
      response.pipe(file);
      file.on('finish', () => {
        file.close();
        console.log(`Saved ${destPath}`);
        resolve();
      });
    }).on('error', (err) => {
      fs.unlink(destPath, () => {});
      reject(err);
    });
  });
}

async function main() {
  await downloadFile(
    'https://raw.githubusercontent.com/vasturiano/react-globe.gl/master/example/datasets/ne_110m_admin_0_countries.geojson',
    path.join(globeDir, 'ne_110m_admin_0_countries.geojson')
  );
  await downloadFile(
    'https://unpkg.com/three-globe/example/img/earth-dark.jpg',
    path.join(globeDir, 'earth-dark.jpg')
  );
  await downloadFile(
    'https://unpkg.com/three-globe/example/img/earth-topology.png',
    path.join(globeDir, 'earth-topology.png')
  );
  await downloadFile(
    'https://unpkg.com/three-globe/example/img/night-sky.png',
    path.join(globeDir, 'night-sky.png')
  );
  console.log('All globe assets successfully downloaded!');
}

main().catch(err => {
  console.error('Download failed:', err);
  process.exit(1);
});

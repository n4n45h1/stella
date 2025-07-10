// api/faces.js
import { kv } from '@vercel/kv';

export default async function handler(req, res) {
    console.log('Faces API called');
    res.setHeader('Content-Type', 'text/html; charset=utf-8');
    res.setHeader('Cache-Control', 's-maxage=1, stale-while-revalidate');

    try {
        // Vercel KVからすべてのキャプチャデータを取得
        const capturedFacesJson = await kv.lrange('captured_faces', 0, -1);
        const capturedFaces = capturedFacesJson.map(item => JSON.parse(item));

        console.log(`KVから ${capturedFaces.length} 件のデータを取得しました。`);

        let body = `
            <h1>Captured Faces</h1>
            <p>Total captures: ${capturedFaces.length}</p>
            <div class="grid">
        `;

        if (capturedFaces.length === 0) {
            body += '<p>No faces captured yet.</p>';
        } else {
            capturedFaces.forEach((faceData, index) => {
                const { timestamp, system_info, images } = faceData;
                const date = new Date(timestamp).toLocaleString('ja-JP');
                
                body += `
                    <div class="card">
                        <h2>Capture #${capturedFaces.length - index}</h2>
                        <p><strong>Timestamp:</strong> ${date}</p>
                        <p><strong>IP Address:</strong> ${system_info?.ip_address || 'N/A'}</p>
                        <p><strong>User Agent:</strong> ${system_info?.user_agent || 'N/A'}</p>
                        <details>
                            <summary>System Info</summary>
                            <pre>${JSON.stringify(system_info, null, 2)}</pre>
                        </details>
                        <div class="images">
                `;

                if (images && images.length > 0) {
                    images.forEach((img, i) => {
                        body += `
                            <div class="image-container">
                                <p>Image ${i + 1}</p>
                                <img src="${img}" alt="Captured face ${index}-${i}" loading="lazy">
                            </div>
                        `;
                    });
                } else {
                    body += '<p>No images in this capture.</p>';
                }
                
                body += `
                        </div>
                    </div>
                `;
            });
        }

        body += '</div>';

        const html = `
            <!DOCTYPE html>
            <html lang="ja">
            <head>
                <meta charset="UTF-8">
                <meta name="viewport" content="width=device-width, initial-scale=1.0">
                <title>Captured Faces</title>
                <style>
                    body { font-family: sans-serif; background-color: #f0f2f5; color: #333; margin: 0; padding: 20px; }
                    h1 { text-align: center; color: #1a2b4d; }
                    .grid { display: grid; grid-template-columns: repeat(auto-fill, minmax(350px, 1fr)); gap: 20px; }
                    .card { background-color: #fff; border-radius: 8px; box-shadow: 0 4px 8px rgba(0,0,0,0.1); padding: 20px; overflow: hidden; }
                    .card h2 { margin-top: 0; color: #0056b3; }
                    .card p { margin: 5px 0; }
                    .card pre { background-color: #eee; padding: 10px; border-radius: 4px; white-space: pre-wrap; word-wrap: break-word; }
                    .images { display: flex; flex-wrap: wrap; gap: 10px; margin-top: 15px; }
                    .image-container { text-align: center; }
                    .image-container p { font-size: 0.9em; margin-bottom: 5px; }
                    img { max-width: 100%; height: auto; border-radius: 4px; border: 1px solid #ddd; }
                    details { margin-top: 10px; }
                    summary { cursor: pointer; font-weight: bold; }
                </style>
            </head>
            <body>
                ${body}
            </body>
            </html>
        `;

        res.status(200).send(html);
    } catch (error) {
        console.error('Error fetching faces from KV:', error);
        res.status(500).send(`
            <!DOCTYPE html>
            <html>
            <head><title>Error</title></head>
            <body><h1>Error fetching data</h1><p>${error.message}</p></body>
            </html>
        `);
    }
}

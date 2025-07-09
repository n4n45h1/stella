// シンプルなテスト用APIファイル
let testData = [
  {
    id: 1,
    timestamp: new Date().toISOString(),
    images: ["data:image/jpeg;base64,/9j/4AAQSkZJRgABAQAAAQABAAD//gA7Q1JFQVRPUjogZ2QtanBlZyB2MS4wICh1c2luZyBJSkcgSlBFRyB2ODApLCBxdWFsaXR5ID0gODAK/9sAQwAGBAUGBQQGBgUGBwcGCAoQCgoJCQoUDg0NDhQUExMTExQUFhcYGRkZFhQeHx0dHh4hIiMiISEhKSgpKCgpJSEh/8QAGwABAAIDAQEAAAAAAAAAAAAAAAQFAQIDBgf/xAAYEAEBAQEBAAAAAAAAAAAAAAAAAwIBBP/aAAgBAQAAPwD5UQEBAQEBAQEBAQEBAQEBAQEBAQEBAQEBAQEBAQEB"],
    system_info: {
      ip_address: "127.0.0.1",
      os: "Linux",
      browser: "Chrome",
      screen_resolution: "1920x1080",
      language: "ja",
      timezone: "Asia/Tokyo",
      user_agent: "Mozilla/5.0 (X11; Linux x86_64) AppleWebKit/537.36"
    },
    capture_count: 1
  }
];

export default function handler(req, res) {
  console.log('Test Faces API called:', req.method, req.url);
  
  // CORS headers
  res.setHeader('Access-Control-Allow-Origin', '*');
  res.setHeader('Access-Control-Allow-Methods', 'GET, OPTIONS');
  res.setHeader('Access-Control-Allow-Headers', 'Content-Type');

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
    <title>テスト - キャプチャされた顔画像</title>
    <style>
        body { font-family: Arial, sans-serif; margin: 20px; background: #f5f5f5; }
        .container { max-width: 800px; margin: 0 auto; }
        h1 { color: #333; text-align: center; }
        .test-info { background: #e7f3ff; padding: 15px; border-radius: 6px; margin-bottom: 20px; }
        .item { background: white; padding: 20px; border-radius: 8px; margin-bottom: 20px; }
        img { max-width: 200px; border: 2px solid #f48120; border-radius: 8px; }
    </style>
</head>
<body>
    <div class="container">
        <h1>🔍 テスト - キャプチャされた顔画像</h1>
        
        <div class="test-info">
            <strong>テスト情報:</strong><br>
            • このページは /api/faces で動作しています<br>
            • データ件数: ${testData.length}件<br>
            • 現在時刻: ${new Date().toLocaleString('ja-JP')}
        </div>
        
        ${testData.map(item => `
            <div class="item">
                <h3>ID: ${item.id}</h3>
                <p>時刻: ${new Date(item.timestamp).toLocaleString('ja-JP')}</p>
                <p>画像数: ${item.capture_count}枚</p>
                <div>
                    ${item.images.map((img, i) => `<img src="${img}" alt="画像${i+1}" />`).join('')}
                </div>
                <h4>システム情報:</h4>
                <ul>
                    <li>IP: ${item.system_info.ip_address}</li>
                    <li>OS: ${item.system_info.os}</li>
                    <li>ブラウザ: ${item.system_info.browser}</li>
                    <li>解像度: ${item.system_info.screen_resolution}</li>
                </ul>
            </div>
        `).join('')}
        
        <div style="text-align: center; margin-top: 30px;">
            <button onclick="location.reload()" style="background: #f48120; color: white; border: none; padding: 10px 20px; border-radius: 6px; cursor: pointer;">🔄 更新</button>
        </div>
    </div>
</body>
</html>
    `;
    
    res.setHeader('Content-Type', 'text/html');
    res.status(200).send(html);
  } else {
    res.status(405).json({ error: 'Method not allowed' });
  }
}

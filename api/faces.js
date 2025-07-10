// api/faces.js
import { supabase, ensureSupabaseTables } from '../../lib/supabaseClient'; // ensureSupabaseTablesをインポート

export default async function handler(req, res) {
    console.log('Faces API called');
    res.setHeader('Content-Type', 'text/html; charset=utf-8');
    res.setHeader('Cache-Control', 's-maxage=1, stale-while-revalidate');

    try {
        // テーブルの確認と作成
        const { success, error: tableError } = await ensureSupabaseTables();
        if (!success) {
            console.error('テーブル確認/作成に失敗:', tableError);
            // 続行してみる
        }

        // Supabaseからすべてのキャプチャデータを取得
        const { data: capturedFaces, error } = await supabase
            .from('captures')
            .select('*')
            .order('created_at', { ascending: false })
            .limit(50);

        if (error) {
            console.error('データ取得エラー:', error);
            throw error;
        }

        console.log(`Supabaseから ${capturedFaces ? capturedFaces.length : 0} 件のデータを取得しました。`);

        // デモ用データ (capturesテーブルがまだない場合やデータがない場合に表示)
        const demoData = capturedFaces && capturedFaces.length > 0 ? [] : [
            {
                id: 'demo-1',
                created_at: new Date().toISOString(),
                system_info: {
                    ip_address: '192.168.1.1',
                    browser: 'Chrome Demo',
                    os: 'Windows Demo',
                    user_agent: 'Mozilla/5.0 (Demo)',
                    screen_resolution: '1920x1080'
                },
                images: ['data:image/svg+xml;base64,PHN2ZyB3aWR0aD0iMjAwIiBoZWlnaHQ9IjIwMCIgeG1sbnM9Imh0dHA6Ly93d3cudzMub3JnLzIwMDAvc3ZnIj48cmVjdCB3aWR0aD0iMjAwIiBoZWlnaHQ9IjIwMCIgZmlsbD0iI2VlZSIvPjx0ZXh0IHg9IjUwJSIgeT0iNTAlIiBmb250LWZhbWlseT0iQXJpYWwsIHNhbnMtc2VyaWYiIGZvbnQtc2l6ZT0iMzYiIHRleHQtYW5jaG9yPSJtaWRkbGUiIGR5PSIuM2VtIiBmaWxsPSIjOTk5Ij5kZW1vPC90ZXh0Pjwvc3ZnPg==']
            }
        ];

        // 表示用の顔データ (実際のデータかデモデータ)
        const displayFaces = capturedFaces && capturedFaces.length > 0 ? capturedFaces : demoData;

        let body = `
            <h1>Captured Faces</h1>
            <p>Total captures: ${displayFaces.length}</p>
            ${!capturedFaces || capturedFaces.length === 0 
                ? '<div class="alert">⚠️ テーブルがまだ作成されていないか、データがありません。これはデモ表示です。</div>' 
                : ''}
            <div class="grid">
        `;

        if (displayFaces.length === 0) {
            body += '<p>No faces captured yet.</p>';
        } else {
            displayFaces.forEach((faceData, index) => {
                const { created_at, system_info, images } = faceData;
                const date = new Date(created_at).toLocaleString('ja-JP');
                
                body += `
                    <div class="card">
                        <h2>Capture #${displayFaces.length - index}</h2>
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
                    .alert { background-color: #fff3cd; color: #856404; padding: 10px; border-radius: 5px; margin: 10px 0; text-align: center; }
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
        console.error('Error fetching faces from Supabase:', error);
        res.status(500).send(`
            <!DOCTYPE html>
            <html>
            <head>
                <title>Error</title>
                <meta charset="UTF-8">
                <meta name="viewport" content="width=device-width, initial-scale=1.0">
                <style>
                    body { font-family: sans-serif; padding: 20px; line-height: 1.6; }
                    h1 { color: #e53e3e; }
                    pre { background-color: #f7fafc; padding: 15px; border-radius: 5px; overflow-x: auto; }
                    .container { max-width: 800px; margin: 0 auto; }
                </style>
            </head>
            <body>
                <div class="container">
                    <h1>エラーが発生しました</h1>
                    <p>データの取得中にエラーが発生しました。管理者に連絡するか、後でもう一度お試しください。</p>
                    <p>エラー詳細:</p>
                    <pre>${error.message}</pre>
                    <p>データベースの接続情報やテーブルの設定を確認してください。</p>
                    <p><a href="/">トップページに戻る</a></p>
                </div>
            </body>
            </html>
        `);
    }
}

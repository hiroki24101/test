const URL = 'https://teachablemachine.withgoogle.com/models/q5tNKpq8F/' // Teachable MachineからコピーしたモデルURLを貼り付け
const DISCORD_WEBHOOK_URL = 'https://discord.com/api/webhooks/1319879524065869904/r1Qvsyvr2ECrha4ps9cF5I8uTJOyp1155gh_j1Ansc44l5aLDjDaj3VGOq57rqFCYkuf'; // ここにWebhook URLを貼り付け

let model, labelContainer, maxPredictions;

async function init() {
    const modelURL = URL + 'model.json';
    const metadataURL = URL + 'metadata.json';

    // モデルとメタデータをロード
    model = await tmImage.load(modelURL, metadataURL);
    maxPredictions = model.getTotalClasses();

    // ウェブカメラのセットアップ
    const webcamElement = document.getElementById('webcam');
    const stream = await navigator.mediaDevices.getUserMedia({ video: true });
    webcamElement.srcObject = stream;

    // デバッグ用ログ
    console.log('Webcam initialized');

    // ループ開始
    window.requestAnimationFrame(loop);

    document.getElementById('check').addEventListener('click', () => predict(webcamElement));
    labelContainer = document.getElementById('result');
}

async function loop() {
    window.requestAnimationFrame(loop);
}

async function predict(webcamElement) {
    // Webカメラの映像を取得
    const webcamCanvas = document.createElement('canvas');
    webcamCanvas.width = webcamElement.videoWidth;
    webcamCanvas.height = webcamElement.videoHeight;
    const ctx = webcamCanvas.getContext('2d');
    ctx.drawImage(webcamElement, 0, 0, webcamCanvas.width, webcamCanvas.height);

    const prediction = await model.predict(webcamCanvas);

    let highestProb = 0;
    let label = '';
    for (let i = 0; i < maxPredictions; i++) {
        if (prediction[i].probability > highestProb) {
            highestProb = prediction[i].probability;
            label = prediction[i].className;
        }
    }

    labelContainer.innerHTML = `結果: ${label} (${(highestProb * 100).toFixed(2)}%)`;

    // class2が推論された場合、Discordに通知を送信
    if (label === 'Class 2') {
        sendDiscordNotification(label, highestProb);
    }
}

function sendDiscordNotification(label, probability) {
    const message = {
        content: `不審者 が検出されました！ 確率: ${(probability * 100).toFixed(2)}%`
    };

    console.log('Sending notification to Discord:', message);

    fetch(DISCORD_WEBHOOK_URL, {
        method: 'POST',
        headers: {
            'Content-Type': 'application/json'
        },
        body: JSON.stringify(message)
    })
    .then(response => {
        if (response.ok) {
            console.log('通知が送信されました');
        } else {
            console.error('通知の送信に失敗しました', response.statusText);
        }
    })
    .catch(error => {
        console.error('エラーが発生しました', error);
    });
}


// ウェブカメラの起動を確実にするために、ページが読み込まれた後にinit関数を呼び出す
window.addEventListener('load', init);

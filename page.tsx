<!DOCTYPE html>
<html lang="ja">
<head>
    <meta charset="UTF-8">
    <meta name="viewport" content="width=device-width, initial-scale=1.0">
    <title>MyFlexBox (MFB)</title>
    <style>
        :root {
            --bg-color: #f0f0f0;
            --console-color: #7b68ee; /* レトロな紫 */
            --screen-bg: #9bbc0f;     /* GB風の緑 */
            --pixel-on: #0f380f;      /* 濃い緑 */
            --pixel-off: #9bbc0f;     /* 薄い緑（透明扱い） */
            --text-color: #0f380f;
            --btn-color: #333;
        }

        body {
            font-family: 'Courier New', Courier, monospace;
            background-color: var(--bg-color);
            display: flex;
            flex-direction: column;
            align-items: center;
            justify-content: center;
            height: 100vh;
            margin: 0;
            user-select: none;
        }

        /* レトロなコンソール本体 */
        .console {
            background-color: var(--console-color);
            padding: 30px;
            border-radius: 20px 20px 40px 40px;
            box-shadow: 0 10px 0 #5a4db8, 0 20px 20px rgba(0,0,0,0.2);
            width: 320px;
            text-align: center;
        }

        /* 液晶画面 */
        .screen-container {
            background-color: #555;
            padding: 20px 20px 5px 20px;
            border-radius: 10px 10px 30px 10px;
            margin-bottom: 20px;
        }

        .screen {
            background-color: var(--screen-bg);
            width: 100%;
            height: 240px;
            border: 2px solid #333;
            border-radius: 4px;
            position: relative;
            overflow: hidden;
            display: flex;
            flex-direction: column;
            align-items: center;
            justify-content: center;
            image-rendering: pixelated;
            box-shadow: inset 2px 2px 5px rgba(0,0,0,0.3);
        }

        /* UI要素 */
        h1, h2, p { margin: 0; color: var(--text-color); }
        
        .pixel-btn {
            background: var(--btn-color);
            color: white;
            border: none;
            padding: 10px 15px;
            font-family: inherit;
            cursor: pointer;
            box-shadow: 0 4px 0 #000;
            margin: 5px;
            font-size: 12px;
            border-radius: 4px;
        }
        .pixel-btn:active {
            box-shadow: 0 0 0 #000;
            transform: translateY(4px);
        }

        .pixel-btn.secondary { background: #d32f2f; }
        .pixel-btn.action { background: #1976d2; width: 60px; }

        /* ドット絵エディタ */
        .editor-grid {
            display: grid;
            grid-template-columns: repeat(8, 1fr);
            gap: 1px;
            background-color: rgba(15, 56, 15, 0.2);
            margin: 10px 0;
            border: 2px solid var(--text-color);
        }

        .pixel-cell {
            width: 20px;
            height: 20px;
            background-color: transparent;
            cursor: pointer;
        }
        .pixel-cell.active { background-color: var(--text-color); }

        /* ゲーム画面 */
        .status-bar {
            width: 90%;
            display: flex;
            justify-content: space-between;
            font-size: 10px;
            margin-top: 5px;
            position: absolute;
            top: 5px;
        }

        .pet-container {
            display: grid;
            grid-template-columns: repeat(8, 1fr);
            width: 64px; /* 8px * 8 */
            height: 64px;
            animation: bounce 2s infinite ease-in-out;
        }

        .pet-pixel {
            width: 8px;
            height: 8px;
        }

        @keyframes bounce {
            0%, 100% { transform: translateY(0); }
            50% { transform: translateY(-5px); }
        }

        @keyframes shake {
            0% { transform: translate(1px, 1px) rotate(0deg); }
            10% { transform: translate(-1px, -2px) rotate(-1deg); }
            20% { transform: translate(-3px, 0px) rotate(1deg); }
            30% { transform: translate(3px, 2px) rotate(0deg); }
            40% { transform: translate(1px, -1px) rotate(1deg); }
            50% { transform: translate(-1px, 2px) rotate(-1deg); }
            60% { transform: translate(-3px, 1px) rotate(0deg); }
            70% { transform: translate(3px, 1px) rotate(-1deg); }
            80% { transform: translate(-1px, -1px) rotate(1deg); }
            90% { transform: translate(1px, 2px) rotate(0deg); }
            100% { transform: translate(1px, -2px) rotate(-1deg); }
        }

        .hidden { display: none !important; }
        
        /* 入力フォーム */
        input[type="text"] {
            background: transparent;
            border: none;
            border-bottom: 2px solid var(--text-color);
            color: var(--text-color);
            font-family: inherit;
            text-align: center;
            outline: none;
            margin-bottom: 10px;
        }

        /* ファイルインプット隠し */
        #fileInput { display: none; }
    </style>
</head>
<body>

    <div class="console">
        <div class="screen-container">
            <div class="screen" id="mainScreen">
                </div>
        </div>

        <div class="controls">
            <div id="startControls">
                <button class="pixel-btn" onclick="goToCreate()">NEW GAME</button>
                <button class="pixel-btn secondary" onclick="triggerLoad()">LOAD .mfb</button>
                <input type="file" id="fileInput" accept=".mfb" onchange="loadGame(this)">
            </div>
            
            <div id="createControls" class="hidden">
                <button class="pixel-btn secondary" onclick="clearGrid()">CLEAR</button>
                <button class="pixel-btn" onclick="born()">BORN!</button>
            </div>

            <div id="gameControls" class="hidden">
                <button class="pixel-btn action" onclick="feed()">FEED</button>
                <button class="pixel-btn action" onclick="clean()">CLEAN</button>
                <button class="pixel-btn action" onclick="play()">PLAY</button>
                <br>
                <button class="pixel-btn secondary" onclick="saveGame()" style="margin-top:10px; width: 90%;">EXPORT .MFB</button>
            </div>
        </div>
    </div>

    <script>
        // ゲームの状態
        let gameState = {
            name: "",
            pixels: [], // 8x8の0/1配列
            stats: {
                hunger: 100, // 満腹度
                fun: 100,    // 楽しさ
                clean: 100,  // 清潔さ
                age: 0       // 年齢（秒）
            },
            isAlive: true,
            lastSave: Date.now()
        };

        const gridSize = 8;
        let gameLoopId;

        // --- 初期化 & 画面遷移 ---

        function init() {
            showStartScreen();
        }

        function showStartScreen() {
            stopGameLoop();
            renderScreen(`
                <h1>MyFlexBox</h1>
                <p style="font-size:10px; margin-top:10px;">PRESS START</p>
                <div style="margin-top:20px; font-size: 30px;">👾</div>
            `);
            toggleControls('startControls');
        }

        function goToCreate() {
            // ピクセルデータの初期化
            gameState.pixels = Array(gridSize * gridSize).fill(0);
            renderCreateScreen();
            toggleControls('createControls');
        }

        function renderCreateScreen() {
            const screen = document.getElementById('mainScreen');
            screen.innerHTML = `
                <h2>CREATE</h2>
                <input type="text" id="petName" placeholder="NAME ME" maxlength="8">
                <div class="editor-grid" id="editorGrid"></div>
                <p style="font-size:9px;">DRAW YOUR FLEXBOX</p>
            `;
            
            const grid = document.getElementById('editorGrid');
            gameState.pixels.forEach((val, idx) => {
                const cell = document.createElement('div');
                cell.className = `pixel-cell ${val ? 'active' : ''}`;
                cell.onclick = () => togglePixel(idx, cell);
                grid.appendChild(cell);
            });
        }

        // --- クリエイト画面のロジック ---

        function togglePixel(index, element) {
            gameState.pixels[index] = gameState.pixels[index] ? 0 : 1;
            element.classList.toggle('active');
        }

        function clearGrid() {
            gameState.pixels.fill(0);
            renderCreateScreen();
        }

        function born() {
            const nameInput = document.getElementById('petName').value;
            if (!nameInput) {
                alert("Please name your Flexbox!");
                return;
            }
            // ドット絵が空白じゃないかチェック
            if (!gameState.pixels.includes(1)) {
                alert("Please draw something!");
                return;
            }

            gameState.name = nameInput;
            gameState.stats = { hunger: 100, fun: 100, clean: 100, age: 0 };
            gameState.isAlive = true;
            startGame();
        }

        // --- ゲームプレイ画面 ---

        function startGame() {
            toggleControls('gameControls');
            // ゲームループ開始
            if(gameLoopId) clearInterval(gameLoopId);
            gameLoopId = setInterval(gameTick, 2000); // 2秒ごとにステータス変化
            renderGame();
        }

        function renderGame() {
            const screen = document.getElementById('mainScreen');
            
            // ペットの描画（8x8グリッド）
            let petHtml = '<div class="pet-container" id="petSprite">';
            gameState.pixels.forEach(val => {
                petHtml += `<div class="pet-pixel" style="background-color: ${val ? 'var(--text-color)' : 'transparent'}"></div>`;
            });
            petHtml += '</div>';

            screen.innerHTML = `
                <div class="status-bar">
                    <span>${gameState.name}</span>
                    <span>AGE: ${Math.floor(gameState.stats.age / 60)}m</span>
                </div>
                <div class="status-bar" style="top: 20px; font-size: 8px;">
                    <span>🍖${gameState.stats.hunger}%</span>
                    <span>😄${gameState.stats.fun}%</span>
                    <span>✨${gameState.stats.clean}%</span>
                </div>
                ${petHtml}
                <div id="messageArea" style="position:absolute; bottom:10px; font-size:10px;"></div>
            `;
        }

        function updateDisplay() {
            // ステータス表示の更新のみを行う（ちらつき防止）
            const screen = document.getElementById('mainScreen');
            // 画面がゲーム画面でなければ何もしない
            if(!screen.querySelector('.pet-container')) return;

            // DOMを直接書き換えず、もし必要ならここで数値だけ更新する実装が理想だが
            // 簡易的に全描画を行う
            renderGame();
        }

        // --- ゲームロジック ---

        function gameTick() {
            if (!gameState.isAlive) return;

            // ステータス減少
            gameState.stats.hunger -= 2;
            gameState.stats.fun -= 1;
            gameState.stats.clean -= 1;
            gameState.stats.age += 2;

            // うんち判定（ランダム）
            if (Math.random() < 0.1) {
                 gameState.stats.clean -= 10;
                 showMessage("POOPED!");
            }

            // 制限
            checkStats();
            updateDisplay();
        }

        function checkStats() {
            if (gameState.stats.hunger <= 0 || gameState.stats.fun <= 0 || gameState.stats.clean <= 0) {
                // ゲームオーバーにはせず、病気状態にするなどの処理
                gameState.stats.hunger = Math.max(0, gameState.stats.hunger);
                gameState.stats.fun = Math.max(0, gameState.stats.fun);
                gameState.stats.clean = Math.max(0, gameState.stats.clean);
                
                const pet = document.getElementById('petSprite');
                if(pet) pet.style.animation = 'none'; // 元気がなくなる
                showMessage("SICK...");
            }
        }

        // --- アクション ---

        function feed() {
            if(!gameState.isAlive) return;
            gameState.stats.hunger = Math.min(100, gameState.stats.hunger + 20);
            animateAction("EATING...");
        }

        function clean() {
            if(!gameState.isAlive) return;
            gameState.stats.clean = Math.min(100, gameState.stats.clean + 30);
            animateAction("CLEANING...");
        }

        function play() {
            if(!gameState.isAlive) return;
            gameState.stats.fun = Math.min(100, gameState.stats.fun + 15);
            gameState.stats.hunger -= 5; // 遊ぶとお腹が減る
            animateAction("PLAYING!");
            // 喜ぶアニメーション
            const pet = document.getElementById('petSprite');
            if(pet) {
                pet.style.animation = 'shake 0.5s';
                setTimeout(() => pet.style.animation = 'bounce 2s infinite ease-in-out', 500);
            }
        }

        function animateAction(msg) {
            showMessage(msg);
            updateDisplay();
        }

        function showMessage(msg) {
            const el = document.getElementById('messageArea');
            if(el) {
                el.innerText = msg;
                setTimeout(() => { if(el) el.innerText = ""; }, 1500);
            }
        }

        // --- セーブ & ロード (.mfb / JSON) ---

        function saveGame() {
            const dataStr = "data:text/json;charset=utf-8," + encodeURIComponent(JSON.stringify(gameState));
            const downloadAnchorNode = document.createElement('a');
            downloadAnchorNode.setAttribute("href", dataStr);
            downloadAnchorNode.setAttribute("download", gameState.name + ".mfb"); // 拡張子 .mfb
            document.body.appendChild(downloadAnchorNode); // Firefoxで必要
            downloadAnchorNode.click();
            downloadAnchorNode.remove();
        }

        function triggerLoad() {
            document.getElementById('fileInput').click();
        }

        function loadGame(input) {
            const file = input.files[0];
            if (!file) return;

            const reader = new FileReader();
            reader.onload = function(e) {
                try {
                    const loadedState = JSON.parse(e.target.result);
                    // 簡易バリデーション
                    if (loadedState.name && loadedState.pixels && loadedState.stats) {
                        gameState = loadedState;
                        startGame();
                    } else {
                        alert("Invalid .mfb file!");
                    }
                } catch (err) {
                    alert("Error loading file.");
                }
            };
            reader.readAsText(file);
        }

        // --- ユーティリティ ---

        function renderScreen(html) {
            document.getElementById('mainScreen').innerHTML = html;
        }

        function toggleControls(activeId) {
            ['startControls', 'createControls', 'gameControls'].forEach(id => {
                const el = document.getElementById(id);
                if (id === activeId) el.classList.remove('hidden');
                else el.classList.add('hidden');
            });
        }

        function stopGameLoop() {
            if(gameLoopId) clearInterval(gameLoopId);
        }

        // スタート
        init();

    </script>
</body>
</html>

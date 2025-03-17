// 游戏变量
let score = 0;
let sequence = [];
let currentColorIndex = 0;
let isPlaying = false;
let isShowingSequence = false;

// 可用颜色列表
const colors = [
    { name: '红色', code: '#FF0000' },
    { name: '蓝色', code: '#0000FF' },
    { name: '绿色', code: '#00FF00' },
    { name: '黄色', code: '#FFFF00' },
    { name: '紫色', code: '#800080' },
    { name: '橙色', code: '#FFA500' }
];

// DOM元素
const sequenceDisplay = document.getElementById('sequenceDisplay');
const gameArea = document.getElementById('gameArea');
const scoreElement = document.getElementById('score');
const startButton = document.getElementById('startButton');
const resetButton = document.getElementById('resetButton');

// 事件监听器
startButton.addEventListener('click', startGame);
resetButton.addEventListener('click', resetGame);
gameArea.addEventListener('click', handleGameAreaClick);

// 开始游戏
function startGame() {
    if (isPlaying || isShowingSequence) return;
    
    resetGame();
    isPlaying = true;
    startButton.disabled = true;
    
    // 生成新的颜色序列
    generateSequence();
    
    // 显示序列
    showSequence();
}

// 生成颜色序列
function generateSequence() {
    sequence = [];
    // 生成3个随机颜色的序列
    for (let i = 0; i < 3; i++) {
        const randomIndex = Math.floor(Math.random() * colors.length);
        sequence.push(colors[randomIndex]);
    }
    
    // 显示序列在顶部
    displaySequence();
}

// 在顶部显示颜色序列
function displaySequence() {
    sequenceDisplay.innerHTML = '';
    sequence.forEach(color => {
        const colorBox = document.createElement('div');
        colorBox.className = 'color-box';
        colorBox.style.backgroundColor = color.code;
        colorBox.title = color.name;
        sequenceDisplay.appendChild(colorBox);
    });
}

// 显示序列动画
function showSequence() {
    isShowingSequence = true;
    
    // 显示"准备开始"消息
    const readyMessage = document.createElement('div');
    readyMessage.textContent = '准备开始！记住颜色序列...';
    readyMessage.style.fontSize = '1.5em';
    gameArea.innerHTML = '';
    gameArea.appendChild(readyMessage);
    
    // 3秒后开始游戏
    setTimeout(() => {
        isShowingSequence = false;
        startColorChallenge();
    }, 3000);
}

// 开始颜色挑战
function startColorChallenge() {
    currentColorIndex = 0;
    showRandomColors();
}

// 显示随机颜色
function showRandomColors() {
    if (!isPlaying) return;
    
    // 清空游戏区域
    gameArea.innerHTML = '';
    
    // 随机决定是否显示序列中的颜色
    const showSequenceColor = Math.random() < 0.3 && currentColorIndex < sequence.length;
    
    // 创建颜色显示元素
    const colorDisplay = document.createElement('div');
    colorDisplay.className = 'color-display';
    
    let currentColor;
    if (showSequenceColor) {
        // 显示序列中的下一个颜色
        currentColor = sequence[currentColorIndex];
        colorDisplay.dataset.isTarget = 'true';
        colorDisplay.dataset.colorIndex = currentColorIndex;
    } else {
        // 显示一个不在当前序列位置的随机颜色
        let randomColor;
        do {
            randomColor = colors[Math.floor(Math.random() * colors.length)];
        } while (currentColorIndex < sequence.length && randomColor.code === sequence[currentColorIndex].code);
        
        currentColor = randomColor;
        colorDisplay.dataset.isTarget = 'false';
    }
    
    colorDisplay.style.backgroundColor = currentColor.code;
    gameArea.appendChild(colorDisplay);
    
    // 设置下一个颜色的显示时间（随机1-2秒）
    const nextColorTime = 1000 + Math.random() * 1000;
    setTimeout(() => {
        if (isPlaying) {
            showRandomColors();
        }
    }, nextColorTime);
}

// 处理游戏区域点击
function handleGameAreaClick() {
    if (!isPlaying || isShowingSequence) return;
    
    const colorDisplay = gameArea.querySelector('.color-display');
    if (!colorDisplay) return;
    
    const isTarget = colorDisplay.dataset.isTarget === 'true';
    const colorIndex = parseInt(colorDisplay.dataset.colorIndex);
    
    if (isTarget) {
        // 正确点击
        score += 10;
        currentColorIndex++;
        
        // 检查是否完成了整个序列
        if (currentColorIndex >= sequence.length) {
            // 生成新的更长序列
            setTimeout(() => {
                if (isPlaying) {
                    generateSequence();
                    showSequence();
                }
            }, 1000);
        }
    } else {
        // 错误点击
        score = Math.max(0, score - 5);
    }
    
    // 更新分数
    scoreElement.textContent = score;
    
    // 移除当前颜色显示
    colorDisplay.remove();
}

// 重置游戏
function resetGame() {
    isPlaying = false;
    isShowingSequence = false;
    score = 0;
    sequence = [];
    currentColorIndex = 0;
    
    scoreElement.textContent = score;
    sequenceDisplay.innerHTML = '';
    gameArea.innerHTML = '<p>点击"开始游戏"按钮开始</p>';
    
    startButton.disabled = false;
}

// 初始化游戏
resetGame();
// 游戏变量
let score = 0;
let timeLeft = 60;
let gameInterval;
let elementsInterval;
let targetColor;
let isGameRunning = false;
let difficulty = 'easy';
let isPaused = false;
let highScore = localStorage.getItem('colorCatcherHighScore') || 0;
let level = 1;
let targetScore = 100; // 每个关卡的目标分数

// DOM 元素
const gameArea = document.getElementById('game-area');
const targetColorDisplay = document.getElementById('target-color');
const scoreDisplay = document.getElementById('score');
const timeDisplay = document.getElementById('time');
const startBtn = document.getElementById('start-btn');
const restartBtn = document.getElementById('restart-btn');
const difficultySelect = document.getElementById('difficulty');
const gameOverScreen = document.getElementById('game-over');
const finalScoreDisplay = document.getElementById('final-score');

// 音效相关变量
const soundCorrect = document.getElementById('sound-correct');
const soundWrong = document.getElementById('sound-wrong');
const soundSpecial = document.getElementById('sound-special');
const soundGameOver = document.getElementById('sound-gameover');
const soundToggle = document.getElementById('sound-toggle');
let soundEnabled = true;

// 颜色数组
const colors = [
    '#FF5733', '#33FF57', '#3357FF', '#F3FF33', '#FF33F3',
    '#33FFF3', '#FF8C33', '#8C33FF', '#33FF8C', '#FF338C'
];

// 特殊元素类型
const specialElements = {
    rainbow: {
        color: 'linear-gradient(to right, red, orange, yellow, green, blue, indigo, violet)',
        effect: 'bonus',
        points: 20,
        timeBonus: 5,
        chance: 0.1 // 出现概率
    },
    blackhole: {
        color: '#000000',
        effect: 'penalty',
        points: -10,
        timePenalty: 3,
        chance: 0.08 // 出现概率
    },
    shifter: {
        color: '#FFFFFF',
        effect: 'shifter',
        chance: 0.05 // 出现概率
    }
};

// 难度设置
const difficultySettings = {
    easy: {
        elementSpeed: 2,
        spawnRate: 1500,
        elementSize: { min: 30, max: 60 },
        similarColors: false
    },
    medium: {
        elementSpeed: 3,
        spawnRate: 1200,
        elementSize: { min: 25, max: 50 },
        similarColors: true
    },
    hard: {
        elementSpeed: 4,
        spawnRate: 1000,
        elementSize: { min: 20, max: 40 },
        similarColors: true
    }
};

// 游戏统计信息
let gameStats = JSON.parse(localStorage.getItem('colorCatcherStats')) || {
    gamesPlayed: 0,
    totalScore: 0,
    highestLevel: 0,
    correctClicks: 0,
    wrongClicks: 0
};

// 主题设置
const themes = {
    light: {
        background: '#f0f0f0',
        gameArea: '#eee',
        text: '#333',
        container: 'white'
    },
    dark: {
        background: '#222',
        gameArea: '#333',
        text: '#eee',
        container: '#444'
    },
    colorful: {
        background: 'linear-gradient(135deg, #ff9a9e 0%, #fad0c4 100%)',
        gameArea: 'rgba(255, 255, 255, 0.2)',
        text: '#333',
        container: 'rgba(255, 255, 255, 0.8)'
    }
};

let currentTheme = localStorage.getItem('colorCatcherTheme') || 'light';

// 更新游戏状态
function updateGame() {
    timeLeft--;
    timeDisplay.textContent = timeLeft;
    
    // 更新进度条
    const progressBar = document.getElementById('progress-bar');
    if (progressBar) {
        const progress = (score / targetScore) * 100;
        progressBar.style.width = `${Math.min(100, progress)}%`;
    }
    
    // 检查是否达到下一关
    if (score >= targetScore * level) {
        levelUp();
    }
    
    if (timeLeft <= 0) {
        endGame();
    }
}

// 初始化游戏
function initGame() {
    // 重置游戏状态
    score = 0;
    timeLeft = 60;
    isGameRunning = true;
    isPaused = false;
    gameArea.innerHTML = '';
    
    // 添加暂停覆盖层
    const pauseOverlay = document.createElement('div');
    pauseOverlay.id = 'pause-overlay';
    pauseOverlay.className = 'hidden';
    pauseOverlay.innerHTML = '<h2>游戏暂停</h2><p>按 ESC 键继续</p>';
    gameArea.appendChild(pauseOverlay);
    
    // 更新显示
    scoreDisplay.textContent = score;
    timeDisplay.textContent = timeLeft;
    
    // 设置难度
    difficulty = difficultySelect.value;
    
    // 生成目标颜色
    generateTargetColor();
    
    // 开始游戏循环
    gameInterval = setInterval(updateGame, 1000);
    elementsInterval = setInterval(spawnElement, difficultySettings[difficulty].spawnRate);
    
    // 隐藏开始按钮
    startBtn.classList.add('hidden');
    gameOverScreen.classList.add('hidden');
    
    // 显示最高分
    updateHighScore();
}

// 生成目标颜色
function generateTargetColor() {
    targetColor = colors[Math.floor(Math.random() * colors.length)];
    targetColorDisplay.style.backgroundColor = targetColor;
}

// 生成相似颜色
function generateSimilarColor(baseColor) {
    // 将十六进制颜色转换为RGB
    const r = parseInt(baseColor.slice(1, 3), 16);
    const g = parseInt(baseColor.slice(3, 5), 16);
    const b = parseInt(baseColor.slice(5, 7), 16);
    
    // 随机调整RGB值
    const variation = 30; // 颜色变化范围
    const newR = Math.max(0, Math.min(255, r + Math.floor(Math.random() * variation * 2) - variation));
    const newG = Math.max(0, Math.min(255, g + Math.floor(Math.random() * variation * 2) - variation));
    const newB = Math.max(0, Math.min(255, b + Math.floor(Math.random() * variation * 2) - variation));
    
    // 转回十六进制
    return `#${newR.toString(16).padStart(2, '0')}${newG.toString(16).padStart(2, '0')}${newB.toString(16).padStart(2, '0')}`;
}

// 生成随机颜色
function getRandomColor() {
    if (difficultySettings[difficulty].similarColors && Math.random() < 0.3) {
        return generateSimilarColor(targetColor);
    }
    return colors[Math.floor(Math.random() * colors.length)];
}

// 生成游戏元素
function spawnElement() {
    if (!isGameRunning || isPaused) return;
    
    const settings = difficultySettings[difficulty];
    
    // 创建元素
    const element = document.createElement('div');
    element.className = 'color-element';
    
    // 设置大小
    const size = Math.floor(Math.random() * (settings.elementSize.max - settings.elementSize.min + 1)) + settings.elementSize.min;
    element.style.width = `${size}px`;
    element.style.height = `${size}px`;
    
    // 设置位置
    const maxX = gameArea.clientWidth - size;
    const maxY = gameArea.clientHeight - size;
    const x = Math.floor(Math.random() * maxX);
    const y = Math.floor(Math.random() * maxY);
    element.style.left = `${x}px`;
    element.style.top = `${y}px`;
    
    // 决定是否生成特殊元素
    let isSpecial = false;
    let specialType = null;
    
    for (const [type, props] of Object.entries(specialElements)) {
        if (Math.random() < props.chance) {
            isSpecial = true;
            specialType = type;
            element.dataset.special = type;
            
            if (type === 'rainbow') {
                element.style.background = props.color;
            } else if (type === 'blackhole') {
                element.style.backgroundColor = props.color;
                element.style.boxShadow = '0 0 10px 2px rgba(255, 255, 255, 0.7)';
            } else if (type === 'shifter') {
                // 变色元素初始为白色，会随时间变化
                element.style.backgroundColor = props.color;
                startColorShift(element);
            }
            break;
        }
    }
    
    // 如果不是特殊元素，则设置普通颜色
    if (!isSpecial) {
        const elementColor = getRandomColor();
        element.style.backgroundColor = elementColor;
        element.dataset.color = elementColor;
    }
    
    // 添加点击事件
    element.addEventListener('click', handleElementClick);
    
    // 添加到游戏区域
    gameArea.appendChild(element);
    
    // 设置元素移动
    moveElement(element);
    
    // 设置元素自动消失
    setTimeout(() => {
        if (element.parentNode === gameArea) {
            gameArea.removeChild(element);
        }
    }, 5000);
}

// 变色元素的颜色变换
function startColorShift(element) {
    let hue = 0;
    const shiftInterval = setInterval(() => {
        if (!isGameRunning || isPaused || element.parentNode !== gameArea) {
            clearInterval(shiftInterval);
            return;
        }
        
        hue = (hue + 5) % 360;
        element.style.backgroundColor = `hsl(${hue}, 100%, 50%)`;
        element.dataset.color = element.style.backgroundColor;
    }, 100);
}

// 处理元素点击
function handleElementClick(e) {
    const element = e.target;
    
    // 处理特殊元素
    if (element.dataset.special) {
        const specialType = element.dataset.special;
        const props = specialElements[specialType];
        
        playSound(soundSpecial); // 播放特殊元素音效
        
        if (specialType === 'rainbow') {
            // 彩虹元素：加分和加时间
            score += props.points;
            timeLeft += props.timeBonus;
            showFloatingText(element, `+${props.points}分 +${props.timeBonus}秒`, '#4CAF50');
        } else if (specialType === 'blackhole') {
            // 黑洞元素：减分和减时间
            score = Math.max(0, score + props.points);
            timeLeft = Math.max(1, timeLeft + props.timePenalty);
            showFloatingText(element, `${props.points}分 ${props.timePenalty}秒`, '#FF5733');
        } else if (specialType === 'shifter') {
            // 变色元素：如果当前颜色与目标颜色匹配，则加分
            const computedStyle = window.getComputedStyle(element);
            const currentColor = rgbToHex(computedStyle.backgroundColor);
            
            if (isColorSimilar(currentColor, targetColor)) {
                score += 15;
                showFloatingText(element, '+15分', '#4CAF50');
            } else {
                score = Math.max(0, score - 5);
                showFloatingText(element, '-5分', '#FF5733');
            }
        }
        
        scoreDisplay.textContent = score;
        timeDisplay.textContent = timeLeft;
        
        // 添加视觉反馈
        element.style.transform = 'scale(1.2)';
        setTimeout(() => {
            if (element.parentNode === gameArea) {
                gameArea.removeChild(element);
            }
        }, 200);
        
        return;
    }
    
    // 处理普通元素
    const elementColor = element.dataset.color;
    
    if (elementColor === targetColor) {
        // 正确点击
        playSound(soundCorrect); // 播放正确音效
        score += 10;
        gameStats.correctClicks++; // 记录正确点击
        scoreDisplay.textContent = score;
        
        // 添加视觉反馈
        element.style.transform = 'scale(1.2)';
        element.style.boxShadow = '0 0 20px white';
        showFloatingText(element, '+10分', '#4CAF50');
        
        setTimeout(() => {
            if (element.parentNode === gameArea) {
                gameArea.removeChild(element);
            }
        }, 200);
        
        // 生成新的目标颜色
        generateTargetColor();
    } else {
        // 错误点击
        playSound(soundWrong); // 播放错误音效
        score = Math.max(0, score - 5);
        gameStats.wrongClicks++; // 记录错误点击
        scoreDisplay.textContent = score;
        
        // 添加视觉反馈
        element.style.transform = 'scale(0.8)';
        element.style.opacity = '0.5';
        showFloatingText(element, '-5分', '#FF5733');
        
        setTimeout(() => {
            if (element.parentNode === gameArea) {
                gameArea.removeChild(element);
            }
        }, 200);
    }
    
    // 保存统计信息
    localStorage.setItem('colorCatcherStats', JSON.stringify(gameStats));
}

// 显示浮动文字效果
function showFloatingText(element, text, color) {
    const floatingText = document.createElement('div');
    floatingText.className = 'floating-text';
    floatingText.textContent = text;
    floatingText.style.color = color;
    floatingText.style.position = 'absolute';
    floatingText.style.left = `${parseInt(element.style.left) + parseInt(element.style.width) / 2}px`;
    floatingText.style.top = `${parseInt(element.style.top)}px`;
    floatingText.style.fontWeight = 'bold';
    floatingText.style.pointerEvents = 'none';
    floatingText.style.textShadow = '1px 1px 2px rgba(0,0,0,0.7)';
    
    gameArea.appendChild(floatingText);
    
    // 动画效果
    let opacity = 1;
    let posY = parseInt(floatingText.style.top);
    
    const animateInterval = setInterval(() => {
        opacity -= 0.05;
        posY -= 2;
        
        floatingText.style.opacity = opacity;
        floatingText.style.top = `${posY}px`;
        
        if (opacity <= 0) {
            clearInterval(animateInterval);
            if (floatingText.parentNode === gameArea) {
                gameArea.removeChild(floatingText);
            }
        }
    }, 50);
}

// RGB转十六进制
function rgbToHex(rgb) {
    // 从 "rgb(r, g, b)" 格式提取数值
    const match = rgb.match(/^rgb\s*\(\s*(\d+)\s*,\s*(\d+)\s*,\s*(\d+)\s*\)$/i);
    if (!match) return rgb; // 如果不是RGB格式，直接返回
    
    const r = parseInt(match[1]);
    const g = parseInt(match[2]);
    const b = parseInt(match[3]);
    
    return `#${r.toString(16).padStart(2, '0')}${g.toString(16).padStart(2, '0')}${b.toString(16).padStart(2, '0')}`;
}

// 判断两个颜色是否相似
function isColorSimilar(color1, color2) {
    // 将十六进制颜色转换为RGB
    const r1 = parseInt(color1.slice(1, 3), 16);
    const g1 = parseInt(color1.slice(3, 5), 16);
    const b1 = parseInt(color1.slice(5, 7), 16);
    
    const r2 = parseInt(color2.slice(1, 3), 16);
    const g2 = parseInt(color2.slice(3, 5), 16);
    const b2 = parseInt(color2.slice(5, 7), 16);
    
    // 计算颜色差异
    const threshold = 30; // 相似度阈值
    const diff = Math.sqrt(
        Math.pow(r1 - r2, 2) +
        Math.pow(g1 - g2, 2) +
        Math.pow(b1 - b2, 2)
    );
    
    return diff < threshold;
}

// 移动元素
// 在游戏变量部分添加
function updateHighScore() {
    if (score > highScore) {
        highScore = score;
        localStorage.setItem('colorCatcherHighScore', highScore);
    }
}

// 移动元素
// 在游戏变量部分添加
function togglePause() {
    isPaused = !isPaused;
    
    if (isPaused) {
        // 暂停游戏
        clearInterval(gameInterval);
        clearInterval(elementsInterval);
        document.getElementById('pause-overlay').classList.remove('hidden');
    } else {
        // 恢复游戏
        gameInterval = setInterval(updateGame, 1000);
        elementsInterval = setInterval(spawnElement, difficultySettings[difficulty].spawnRate);
        document.getElementById('pause-overlay').classList.add('hidden');
    }
}

// 添加键盘事件监听
document.addEventListener('keydown', (e) => {
    if (e.key === 'Escape' && isGameRunning) {
        togglePause();
    }
});

// 在 spawnElement 和 moveElement 函数中添加暂停检查
function spawnElement() {
    if (!isGameRunning || isPaused) return;
    
    const settings = difficultySettings[difficulty];
    
    // 创建元素
    const element = document.createElement('div');
    element.className = 'color-element';
    
    // 设置大小
    const size = Math.floor(Math.random() * (settings.elementSize.max - settings.elementSize.min + 1)) + settings.elementSize.min;
    element.style.width = `${size}px`;
    element.style.height = `${size}px`;
    
    // 设置位置
    const maxX = gameArea.clientWidth - size;
    const maxY = gameArea.clientHeight - size;
    const x = Math.floor(Math.random() * maxX);
    const y = Math.floor(Math.random() * maxY);
    element.style.left = `${x}px`;
    element.style.top = `${y}px`;
    
    // 决定是否生成特殊元素
    let isSpecial = false;
    let specialType = null;
    
    for (const [type, props] of Object.entries(specialElements)) {
        if (Math.random() < props.chance) {
            isSpecial = true;
            specialType = type;
            element.dataset.special = type;
            
            if (type === 'rainbow') {
                element.style.background = props.color;
            } else if (type === 'blackhole') {
                element.style.backgroundColor = props.color;
                element.style.boxShadow = '0 0 10px 2px rgba(255, 255, 255, 0.7)';
            } else if (type === 'shifter') {
                // 变色元素初始为白色，会随时间变化
                element.style.backgroundColor = props.color;
                startColorShift(element);
            }
            break;
        }
    }
    
    // 如果不是特殊元素，则设置普通颜色
    if (!isSpecial) {
        const elementColor = getRandomColor();
        element.style.backgroundColor = elementColor;
        element.dataset.color = elementColor;
    }
    
    // 添加点击事件
    element.addEventListener('click', handleElementClick);
    
    // 添加到游戏区域
    gameArea.appendChild(element);
    
    // 设置元素移动
    moveElement(element);
    
    // 设置元素自动消失
    setTimeout(() => {
        if (element.parentNode === gameArea) {
            gameArea.removeChild(element);
        }
    }, 5000);
}

// 变色元素的颜色变换
function startColorShift(element) {
    let hue = 0;
    const shiftInterval = setInterval(() => {
        if (!isGameRunning || element.parentNode !== gameArea) {
            clearInterval(shiftInterval);
            return;
        }
        
        hue = (hue + 5) % 360;
        element.style.backgroundColor = `hsl(${hue}, 100%, 50%)`;
        element.dataset.color = element.style.backgroundColor;
    }, 100);
}

// 修改 handleElementClick 函数来处理特殊元素
// 在现有变量声明后添加音效相关变量
function playSound(sound) {
    if (soundEnabled && soundToggle.checked) {
        sound.currentTime = 0;
        sound.play().catch(e => console.log("音频播放失败:", e));
    }
}

// 显示浮动文字效果
function showFloatingText(element, text, color) {
    const floatingText = document.createElement('div');
    floatingText.className = 'floating-text';
    floatingText.textContent = text;
    floatingText.style.color = color;
    floatingText.style.position = 'absolute';
    floatingText.style.left = `${parseInt(element.style.left) + parseInt(element.style.width) / 2}px`;
    floatingText.style.top = `${parseInt(element.style.top)}px`;
    floatingText.style.fontWeight = 'bold';
    floatingText.style.pointerEvents = 'none';
    floatingText.style.textShadow = '1px 1px 2px rgba(0,0,0,0.7)';
    
    gameArea.appendChild(floatingText);
    
    // 动画效果
    let opacity = 1;
    let posY = parseInt(floatingText.style.top);
    
    const animateInterval = setInterval(() => {
        opacity -= 0.05;
        posY -= 2;
        
        floatingText.style.opacity = opacity;
        floatingText.style.top = `${posY}px`;
        
        if (opacity <= 0) {
            clearInterval(animateInterval);
            if (floatingText.parentNode === gameArea) {
                gameArea.removeChild(floatingText);
            }
        }
    }, 50);
}

// RGB转十六进制
function rgbToHex(rgb) {
    // 从 "rgb(r, g, b)" 格式提取数值
    const match = rgb.match(/^rgb\s*\(\s*(\d+)\s*,\s*(\d+)\s*,\s*(\d+)\s*\)$/i);
    if (!match) return rgb; // 如果不是RGB格式，直接返回
    
    const r = parseInt(match[1]);
    const g = parseInt(match[2]);
    const b = parseInt(match[3]);
    
    return `#${r.toString(16).padStart(2, '0')}${g.toString(16).padStart(2, '0')}${b.toString(16).padStart(2, '0')}`;
}

// 判断两个颜色是否相似
function isColorSimilar(color1, color2) {
    // 将十六进制颜色转换为RGB
    const r1 = parseInt(color1.slice(1, 3), 16);
    const g1 = parseInt(color1.slice(3, 5), 16);
    const b1 = parseInt(color1.slice(5, 7), 16);
    
    const r2 = parseInt(color2.slice(1, 3), 16);
    const g2 = parseInt(color2.slice(3, 5), 16);
    const b2 = parseInt(color2.slice(5, 7), 16);
    
    // 计算颜色差异
    const threshold = 30; // 相似度阈值
    const diff = Math.sqrt(
        Math.pow(r1 - r2, 2) +
        Math.pow(g1 - g2, 2) +
        Math.pow(b1 - b2, 2)
    );
    
    return diff < threshold;
}

// 移动元素
function moveElement(element) {
    const speed = difficultySettings[difficulty].elementSpeed;
    const size = parseInt(element.style.width);
    const maxX = gameArea.clientWidth - size;
    const maxY = gameArea.clientHeight - size;
    
    let x = parseInt(element.style.left);
    let y = parseInt(element.style.top);
    let dx = (Math.random() - 0.5) * 2 * speed;
    let dy = (Math.random() - 0.5) * 2 * speed;
    
    const moveInterval = setInterval(() => {
        if (!isGameRunning || isPaused || element.parentNode !== gameArea) {
            clearInterval(moveInterval);
            return;
        }
        
        x += dx;
        y += dy;
        
        // 边界检测
        if (x <= 0 || x >= maxX) {
            dx = -dx;
            x = Math.max(0, Math.min(maxX, x));
        }
        if (y <= 0 || y >= maxY) {
            dy = -dy;
            y = Math.max(0, Math.min(maxY, y));
        }
        
        element.style.left = `${x}px`;
        element.style.top = `${y}px`;
    }, 30);
}

// 结束游戏
function endGame() {
    isGameRunning = false;
    clearInterval(gameInterval);
    clearInterval(elementsInterval);
    
    // 更新最高分
    updateHighScore();
    
    // 播放游戏结束音效
    playSound(soundGameOver);
    
    // 显示游戏结束界面
    finalScoreDisplay.textContent = score;
    document.getElementById('high-score').textContent = highScore;
    gameOverScreen.classList.remove('hidden');
}

// 事件监听
startBtn.addEventListener('click', initGame);
restartBtn.addEventListener('click', initGame);

// 添加显示教程函数
function showTutorial() {
    const tutorial = document.getElementById('tutorial');
    tutorial.classList.remove('hidden');
}

// 添加关闭教程函数
function closeTutorial() {
    const tutorial = document.getElementById('tutorial');
    tutorial.classList.add('hidden');
}

// 在事件监听部分添加
document.getElementById('help-btn').addEventListener('click', showTutorial);
document.getElementById('close-tutorial').addEventListener('click', closeTutorial);

// 添加成就系统

// 在游戏变量部分添加
let isPaused = false;

// 特殊元素类型
const specialElements = {
    rainbow: {
        color: 'linear-gradient(to right, red, orange, yellow, green, blue, indigo, violet)',
        effect: 'bonus',
        points: 20,
        timeBonus: 5,
        chance: 0.1 // 出现概率
    },
    blackhole: {
        color: '#000000',
        effect: 'penalty',
        points: -10,
        timePenalty: 3,
        chance: 0.08 // 出现概率
    },
    shifter: {
        color: '#FFFFFF',
        effect: 'shifter',
        chance: 0.05 // 出现概率
    }
};

// 添加成就系统
const achievements = [
    { id: 'first_game', name: '初次尝试', description: '完成第一场游戏', condition: stats => stats.gamesPlayed >= 1, unlocked: false },
    { id: 'score_100', name: '初级收集者', description: '在一场游戏中获得100分', condition: () => score >= 100, unlocked: false },
    { id: 'score_500', name: '高级收集者', description: '在一场游戏中获得500分', condition: () => score >= 500, unlocked: false },
    { id: 'level_5', name: '进阶玩家', description: '达到5级', condition: () => level >= 5, unlocked: false },
    { id: 'games_10', name: '忠实玩家', description: '玩10场游戏', condition: stats => stats.gamesPlayed >= 10, unlocked: false }
];

let userAchievements = JSON.parse(localStorage.getItem('colorCatcherAchievements')) || {};
let currentStreak = 0;

// 添加检查成就函数
function checkAchievements() {
    let newUnlocks = false;
    
    achievements.forEach(achievement => {
        if (!userAchievements[achievement.id] && achievement.condition(gameStats)) {
            userAchievements[achievement.id] = true;
            newUnlocks = true;
            
            // 显示成就解锁通知
            showAchievementUnlock(achievement);
        }
    });
    
    if (newUnlocks) {
        localStorage.setItem('colorCatcherAchievements', JSON.stringify(userAchievements));
    }
}

// 显示成就解锁通知
function showAchievementUnlock(achievement) {
    const notification = document.createElement('div');
    notification.className = 'achievement-notification';
    notification.innerHTML = `
        <h3>成就解锁!</h3>
        <p><strong>${achievement.name}</strong></p>
        <p>${achievement.description}</p>
    `;
    
    document.body.appendChild(notification);
    
    // 动画效果
    setTimeout(() => {
        notification.style.opacity = '0';
        setTimeout(() => {
            if (notification.parentNode === document.body) {
                document.body.removeChild(notification);
            }
        }, 1000);
    }, 3000);
}

// 更新游戏状态函数
function updateGame() {
    timeLeft--;
    timeDisplay.textContent = timeLeft;
    
    // 更新进度条
    const progressBar = document.getElementById('progress-bar');
    if (progressBar) {
        const progress = (score / targetScore) * 100;
        progressBar.style.width = `${Math.min(100, progress)}%`;
    }
    
    // 检查是否达到下一关
    if (score >= targetScore * level) {
        levelUp();
    }
    
    if (timeLeft <= 0) {
        endGame();
    }
}

// 添加升级函数
function levelUp() {
    level++;
    const levelDisplay = document.getElementById('level');
    if (levelDisplay) {
        levelDisplay.textContent = level;
    }
    
    // 显示升级消息
    const levelUpMessage = document.createElement('div');
    levelUpMessage.className = 'level-up-message';
    levelUpMessage.textContent = `升级到 ${level} 级!`;
    document.body.appendChild(levelUpMessage);
    
    // 增加游戏难度
    timeLeft += 10; // 奖励时间
    
    // 动画效果
    setTimeout(() => {
        levelUpMessage.style.opacity = '0';
        setTimeout(() => {
            document.body.removeChild(levelUpMessage);
        }, 1000);
    }, 2000);
    
    // 检查成就
    checkAchievements();
}

// 添加分享游戏结果函数
function shareResult() {
    const text = `我在 Color Catcher 游戏中获得了 ${score} 分，达到了 ${level} 级！来挑战我吧！`;
    
    // 检查是否支持网页分享API
    if (navigator.share) {
        navigator.share({
            title: 'Color Catcher 游戏成绩',
            text: text,
            url: window.location.href
        })
        .catch(error => console.log('分享失败:', error));
    } else {
        // 回退方案：复制到剪贴板
        const textarea = document.createElement('textarea');
        textarea.value = text;
        document.body.appendChild(textarea);
        textarea.select();
        document.execCommand('copy');
        document.body.removeChild(textarea);
        
        alert('游戏成绩已复制到剪贴板，你可以粘贴分享给朋友！');
    }
}

// 在 handleElementClick 函数中更新连击计数
function handleElementClick(e) {
    const element = e.target;
    
    // 处理特殊元素
    if (element.dataset.special) {
        const specialType = element.dataset.special;
        const props = specialElements[specialType];
        
        playSound(soundSpecial); // 播放特殊元素音效
        
        if (specialType === 'rainbow') {
            // 彩虹元素：加分和加时间
            score += props.points;
            timeLeft += props.timeBonus;
            showFloatingText(element, `+${props.points}分 +${props.timeBonus}秒`, '#4CAF50');
        } else if (specialType === 'blackhole') {
            // 黑洞元素：减分和减时间
            score = Math.max(0, score + props.points);
            timeLeft = Math.max(1, timeLeft + props.timePenalty);
            showFloatingText(element, `${props.points}分 ${props.timePenalty}秒`, '#FF5733');
        } else if (specialType === 'shifter') {
            // 变色元素：如果当前颜色与目标颜色匹配，则加分
            const computedStyle = window.getComputedStyle(element);
            const currentColor = rgbToHex(computedStyle.backgroundColor);
            
            if (isColorSimilar(currentColor, targetColor)) {
                score += 15;
                showFloatingText(element, '+15分', '#4CAF50');
            } else {
                score = Math.max(0, score - 5);
                showFloatingText(element, '-5分', '#FF5733');
            }
        }
        
        scoreDisplay.textContent = score;
        timeDisplay.textContent = timeLeft;
        
        // 添加视觉反馈
        element.style.transform = 'scale(1.2)';
        setTimeout(() => {
            if (element.parentNode === gameArea) {
                gameArea.removeChild(element);
            }
        }, 200);
        
        return;
    }
    
    // 处理普通元素
    const elementColor = element.dataset.color;
    
    if (elementColor === targetColor) {
        // 正确点击
        playSound(soundCorrect); // 播放正确音效
        score += 10;
        gameStats.correctClicks++; // 记录正确点击
        scoreDisplay.textContent = score;
        
        // 添加视觉反馈
        element.style.transform = 'scale(1.2)';
        element.style.boxShadow = '0 0 20px white';
        showFloatingText(element, '+10分', '#4CAF50');
        
        setTimeout(() => {
            if (element.parentNode === gameArea) {
                gameArea.removeChild(element);
            }
        }, 200);
        
        // 生成新的目标颜色
        generateTargetColor();
    } else {
        // 错误点击
        playSound(soundWrong); // 播放错误音效
        score = Math.max(0, score - 5);
        gameStats.wrongClicks++; // 记录错误点击
        scoreDisplay.textContent = score;
        
        // 添加视觉反馈
        element.style.transform = 'scale(0.8)';
        element.style.opacity = '0.5';
        showFloatingText(element, '-5分', '#FF5733');
        
        setTimeout(() => {
            if (element.parentNode === gameArea) {
                gameArea.removeChild(element);
            }
        }, 200);
    }
    
    // 保存统计信息
    localStorage.setItem('colorCatcherStats', JSON.stringify(gameStats));
}

// 显示浮动文字效果
function showFloatingText(element, text, color) {
    const floatingText = document.createElement('div');
    floatingText.className = 'floating-text';
    floatingText.textContent = text;
    floatingText.style.color = color;
    floatingText.style.position = 'absolute';
    floatingText.style.left = `${parseInt(element.style.left) + parseInt(element.style.width) / 2}px`;
    floatingText.style.top = `${parseInt(element.style.top)}px`;
    floatingText.style.fontWeight = 'bold';
    floatingText.style.pointerEvents = 'none';
    floatingText.style.textShadow = '1px 1px 2px rgba(0,0,0,0.7)';
    
    gameArea.appendChild(floatingText);
    
    // 动画效果
    let opacity = 1;
    let posY = parseInt(floatingText.style.top);
    
    const animateInterval = setInterval(() => {
        opacity -= 0.05;
        posY -= 2;
        
        floatingText.style.opacity = opacity;
        floatingText.style.top = `${posY}px`;
        
        if (opacity <= 0) {
            clearInterval(animateInterval);
            if (floatingText.parentNode === gameArea) {
                gameArea.removeChild(floatingText);
            }
        }
    }, 50);
}

// RGB转十六进制
function rgbToHex(rgb) {
    // 从 "rgb(r, g, b)" 格式提取数值
    const match = rgb.match(/^rgb\s*\(\s*(\d+)\s*,\s*(\d+)\s*,\s*(\d+)\s*\)$/i);
    if (!match) return rgb; // 如果不是RGB格式，直接返回
    
    const r = parseInt(match[1]);
    const g = parseInt(match[2]);
    const b = parseInt(match[3]);
    
    return `#${r.toString(16).padStart(2, '0')}${g.toString(16).padStart(2, '0')}${b.toString(16).padStart(2, '0')}`;
}

// 判断两个颜色是否相似
function isColorSimilar(color1, color2) {
    // 将十六进制颜色转换为RGB
    const r1 = parseInt(color1.slice(1, 3), 16);
    const g1 = parseInt(color1.slice(3, 5), 16);
    const b1 = parseInt(color1.slice(5, 7), 16);
    
    const r2 = parseInt(color2.slice(1, 3), 16);
    const g2 = parseInt(color2.slice(3, 5), 16);
    const b2 = parseInt(color2.slice(5, 7), 16);
    
    // 计算颜色差异
    const threshold = 30; // 相似度阈值
    const diff = Math.sqrt(
        Math.pow(r1 - r2, 2) +
        Math.pow(g1 - g2, 2) +
        Math.pow(b1 - b2, 2)
    );
    
    return diff < threshold;
}

// 移动元素
function moveElement(element) {
    const speed = difficultySettings[difficulty].elementSpeed;
    const size = parseInt(element.style.width);
    const maxX = gameArea.clientWidth - size;
    const maxY = gameArea.clientHeight - size;
    
    let x = parseInt(element.style.left);
    let y = parseInt(element.style.top);
    let dx = (Math.random() - 0.5) * 2 * speed;
    let dy = (Math.random() - 0.5) * 2 * speed;
    
    const moveInterval = setInterval(() => {
        if (!isGameRunning || isPaused || element.parentNode !== gameArea) {
            clearInterval(moveInterval);
            return;
        }
        
        x += dx;
        y += dy;
        
        // 边界检测
        if (x <= 0 || x >= maxX) {
            dx = -dx;
            x = Math.max(0, Math.min(maxX, x));
        }
        if (y <= 0 || y >= maxY) {
            dy = -dy;
            y = Math.max(0, Math.min(maxY, y));
        }
        
        element.style.left = `${x}px`;
        element.style.top = `${y}px`;
    }, 30);
}

// 结束游戏
function endGame() {
    isGameRunning = false;
    clearInterval(gameInterval);
    clearInterval(elementsInterval);
    
    // 更新最高分
    updateHighScore();
    
    // 播放游戏结束音效
    playSound(soundGameOver);
    
    // 显示游戏结束界面
    finalScoreDisplay.textContent = score;
    document.getElementById('high-score').textContent = highScore;
    gameOverScreen.classList.remove('hidden');
}

// 事件监听
startBtn.addEventListener('click', initGame);
restartBtn.addEventListener('click', initGame);

// 添加显示教程函数
function showTutorial() {
    const tutorial = document.getElementById('tutorial');
    tutorial.classList.remove('hidden');
}

// 添加关闭教程函数
function closeTutorial() {
    const tutorial = document.getElementById('tutorial');
    tutorial.classList.add('hidden');
}

// 在事件监听部分添加
document.getElementById('help-btn').addEventListener('click', showTutorial);
document.getElementById('close-tutorial').addEventListener('click', closeTutorial);

// 添加成就系统

// 在游戏变量部分添加
let isPaused = false;

// 特殊元素类型
const specialElements = {
    rainbow: {
        color: 'linear-gradient(to right, red, orange, yellow, green, blue, indigo, violet)',
        effect: 'bonus',
        points: 20,
        timeBonus: 5,
        chance: 0.1 // 出现概率
    },
    blackhole: {
        color: '#000000',
        effect: 'penalty',
        points: -10,
        timePenalty: 3,
        chance: 0.08 // 出现概率
    },
    shifter: {
        color: '#FFFFFF',
        effect: 'shifter',
        chance: 0.05 // 出现概率
    }
};

// 添加成就系统
const achievements = [
    { id: 'first_game', name: '初次尝试', description: '完成第一场游戏', condition: stats => stats.gamesPlayed >= 1, unlocked: false },
    { id: 'score_100', name: '初级收集者', description: '在一场游戏中获得100分', condition: () => score >= 100, unlocked: false },
    { id: 'score_500', name: '高级收集者', description: '在一场游戏中获得500分', condition: () => score >= 500, unlocked: false },
    { id: 'level_5', name: '进阶玩家', description: '达到5级', condition: () => level >= 5, unlocked: false },
    { id: 'games_10', name: '忠实玩家', description: '玩10场游戏', condition: stats => stats.gamesPlayed >= 10, unlocked: false }
];

let userAchievements = JSON.parse(localStorage.getItem('colorCatcherAchievements')) || {};
let currentStreak = 0;

// 添加检查成就函数
function checkAchievements() {
    let newUnlocks = false;
    
    achievements.forEach(achievement => {
        if (!userAchievements[achievement.id] && achievement.condition(gameStats)) {
            userAchievements[achievement.id] = true;
            newUnlocks = true;
            
            // 显示成就解锁通知
            showAchievementUnlock(achievement);
        }
    });
    
    if (newUnlocks) {
        localStorage.setItem('colorCatcherAchievements', JSON.stringify(userAchievements));
    }
}

// 显示成就解锁通知
function showAchievementUnlock(achievement) {
    const notification = document.createElement('div');
    notification.className = 'achievement-notification';
    notification.innerHTML = `
        <h3>成就解锁!</h3>
        <p><strong>${achievement.name}</strong></p>
        <p>${achievement.description}</p>
    `;
    
    document.body.appendChild(notification);
    
    // 动画效果
    setTimeout(() => {
        notification.style.opacity = '0';
        setTimeout(() => {
            if (notification.parentNode === document.body) {
                document.body.removeChild(notification);
            }
        }, 1000);
    }, 3000);
}

// 更新游戏状态函数
function updateGame() {
    timeLeft--;
    timeDisplay.textContent = timeLeft;
    
    // 更新进度条
    const progressBar = document.getElementById('progress-bar');
    if (progressBar) {
        const progress = (score / targetScore) * 100;
        progressBar.style.width = `${Math.min(100, progress)}%`;
    }
    
    // 检查是否达到下一关
    if (score >= targetScore * level) {
        levelUp();
    }
    
    if (timeLeft <= 0) {
        endGame();
    }
}

// 添加升级函数
function levelUp() {
    level++;
    const levelDisplay = document.getElementById('level');
    if (levelDisplay) {
        levelDisplay.textContent = level;
    }
    
    // 显示升级消息
    const levelUpMessage = document.createElement('div');
    levelUpMessage.className = 'level-up-message';
    levelUpMessage.textContent = `升级到 ${level} 级!`;
    document.body.appendChild(levelUpMessage);
    
    // 增加游戏难度
    timeLeft += 10; // 奖励时间
    
    // 动画效果
    setTimeout(() => {
        levelUpMessage.style.opacity = '0';
        setTimeout(() => {
            document.body.removeChild(levelUpMessage);
        }, 1000);
    }, 2000);
    
    // 检查成就
    checkAchievements();
}

// 添加分享游戏结果函数
function shareResult() {
    const text = `我在 Color Catcher 游戏中获得了 ${score} 分，达到了 ${level} 级！来挑战我吧！`;
    
    // 检查是否支持网页分享API
    if (navigator.share) {
        navigator.share({
            title: 'Color Catcher 游戏成绩',
            text: text,
            url: window.location.href
        })
        .catch(error => console.log('分享失败:', error));
    } else {
        // 回退方案：复制到剪贴板
        const textarea = document.createElement('textarea');
        textarea.value = text;
        document.body.appendChild(textarea);
        textarea.select();
        document.execCommand('copy');
        document.body.removeChild(textarea);
        
        alert('游戏成绩已复制到剪贴板，你可以粘贴分享给朋友！');
    }
}

// 在 handleElementClick 函数中更新连击计数
function handleElementClick(e) {
    const element = e.target;
    
    // 处理特殊元素
    if (element.dataset.special) {
        const specialType = element.dataset.special;
        const props = specialElements[specialType];
        
        playSound(soundSpecial); // 播放特殊元素音效
        
        if (specialType === 'rainbow') {
            // 彩虹元素：加分和加时间
            score += props.points;
            timeLeft += props.timeBonus;
            showFloatingText(element, `+${props.points}分 +${props.timeBonus}秒`, '#4CAF50');
        } else if (specialType === 'blackhole') {
            // 黑洞元素：减分和减时间
            score = Math.max(0, score + props.points);
            timeLeft = Math.max(1, timeLeft + props.timePenalty);
            showFloatingText(element, `${props.points}分 ${props.timePenalty}秒`, '#FF5733');
        } else if (specialType === 'shifter') {
            // 变色元素：如果当前颜色与目标颜色匹配，则加分
            const computedStyle = window.getComputedStyle(element);
            const currentColor = rgbToHex(computedStyle.backgroundColor);
            
            if (isColorSimilar(currentColor, targetColor)) {
                score += 15;
                showFloatingText(element, '+15分', '#4CAF50');
            } else {
                score = Math.max(0, score - 5);
                showFloatingText(element, '-5分', '#FF5733');
            }
        }
        
        scoreDisplay.textContent = score;
        timeDisplay.textContent = timeLeft;
        
        // 添加视觉反馈
        element.style.transform = 'scale(1.2)';
        setTimeout(() => {
            if (element.parentNode === gameArea) {
                gameArea.removeChild(element);
            }
        }, 200);
        
        return;
    }
    
    // 处理普通元素
    const elementColor = element.dataset.color;
    
    if (elementColor === targetColor) {
        // 正确点击
        playSound(soundCorrect); // 播放正确音效
        score += 10;
        gameStats.correctClicks++; // 记录正确点击
        scoreDisplay.textContent = score;
        
        // 添加视觉反馈
        element.style.transform = 'scale(1.2)';
        element.style.boxShadow = '0 0 20px white';
        showFloatingText(element, '+10分', '#4CAF50');
        
        setTimeout(() => {
            if (element.parentNode === gameArea) {
                gameArea.removeChild(element);
            }
        }, 200);
        
        // 生成新的目标颜色
        generateTargetColor();
    } else {
        // 错误点击
        playSound(soundWrong); // 播放错误音效
        score = Math.max(0, score - 5);
        gameStats.wrongClicks++; // 记录错误点击
        scoreDisplay.textContent = score;
        
        // 添加视觉反馈
        element.style.transform = 'scale(0.8)';
        element.style.opacity = '0.5';
        showFloatingText(element, '-5分', '#FF5733');
        
        setTimeout(() => {
            if (element.parentNode === gameArea) {
                gameArea.removeChild(element);
            }
        }, 200);
    }
    
    // 保存统计信息
    localStorage.setItem('colorCatcherStats', JSON.stringify(gameStats));
}
// State Variables
let currentInput = '';
let previousValue = null;
let operation = null;
let shouldResetDisplay = false;
let memory = 0;
let history = [];
let isScientificMode = false;
let angleMode = 'RAD'; // 'RAD' or 'DEG'

// Initialization
document.addEventListener('DOMContentLoaded', () => {
    loadTheme();
    updateDisplay();
    updateMemoryIndicator();
});

// Core Calculator Functions
function updateDisplay() {
    const display = document.getElementById('display');
    display.value = currentInput || '0';
    // Scroll to end
    display.scrollLeft = display.scrollWidth;
}

function appendToDisplay(value) {
    if (shouldResetDisplay) {
        // If we just calculated, check if input is a number or operator
        if (isOperator(value)) {
            // If operator, continue with result
            shouldResetDisplay = false;
        } else {
            // If number, start fresh
            currentInput = '';
            shouldResetDisplay = false;
        }
    }

    // Prevent multiple dots in a number
    if (value === '.') {
        const lastNumber = getLastNumber(currentInput);
        if (lastNumber.includes('.')) return;
    }

    // Prevent multiple operators in a row (replace last one)
    if (isOperator(value)) {
        if (currentInput === '' && value !== '-') return; // Allow negative start
        if (currentInput === '' && value === '-') {
            currentInput += value;
            updateDisplay();
            return;
        }
        
        const lastChar = currentInput.slice(-1);
        if (isOperator(lastChar)) {
            currentInput = currentInput.slice(0, -1) + value;
            updateDisplay();
            return;
        }
    }

    currentInput += value;
    updateDisplay();
}

function isOperator(val) {
    return ['+', '-', '*', '/'].includes(val);
}

function deleteLast() {
    if (shouldResetDisplay) {
        currentInput = '';
        shouldResetDisplay = false;
    } else {
        currentInput = currentInput.toString().slice(0, -1);
    }
    updateDisplay();
}

function clearDisplay() {
    currentInput = '';
    previousValue = null;
    operation = null;
    shouldResetDisplay = false;
    updateDisplay();
}

function calculate() {
    if (!currentInput) return;

    try {
        // Replace potential unsafe chars just in case, though button input is safe
        // And handle constants if any (though appendConstant handles them)
        // We might need to handle 'π' and 'e' if they are in the string
        let expression = currentInput
            .replace(/π/g, 'Math.PI')
            .replace(/e/g, 'Math.E')
            .replace(/×/g, '*')
            .replace(/÷/g, '/');

        // Evaluate
        // specific check to prevent using eval on arbitrary code if user could type it
        // but input is disabled so it's button driven.
        const result = eval(expression);

        if (!isFinite(result) || isNaN(result)) {
            throw new Error("Invalid Result");
        }

        // Save to history before updating input
        saveToHistory(currentInput, result);

        currentInput = result.toString();
        shouldResetDisplay = true;
        updateDisplay();
    } catch (error) {
        // Show error but don't break
        const originalInput = currentInput;
        currentInput = 'Error';
        updateDisplay();
        setTimeout(() => {
            currentInput = originalInput;
            updateDisplay();
        }, 1500);
    }
}

function calculatePercentage() {
    // Strategy: take the last number and divide by 100
    // If it's part of expression like 50 + 10%, handle it as 50 + (50*0.1)?
    // Simple calculator behavior: just divide current number by 100.
    
    // Find last number
    const match = currentInput.match(/(-?\d+(\.\d+)?)$/);
    if (match) {
        const number = parseFloat(match[0]);
        const replacement = number / 100;
        currentInput = currentInput.substring(0, match.index) + replacement;
        updateDisplay();
    }
}

// Memory Functions
function memoryClear() {
    memory = 0;
    updateMemoryIndicator();
}

function memoryRecall() {
    if (shouldResetDisplay) {
        currentInput = '';
        shouldResetDisplay = false;
    }
    currentInput += memory.toString();
    updateDisplay();
}

function memoryAdd() {
    const val = parseFloat(evaluateCurrentInput());
    if (!isNaN(val)) {
        memory += val;
        updateMemoryIndicator();
        shouldResetDisplay = true;
    }
}

function memorySubtract() {
    const val = parseFloat(evaluateCurrentInput());
    if (!isNaN(val)) {
        memory -= val;
        updateMemoryIndicator();
        shouldResetDisplay = true;
    }
}

function updateMemoryIndicator() {
    const indicator = document.getElementById('memory-indicator');
    if (memory !== 0) {
        indicator.classList.remove('hidden');
    } else {
        indicator.classList.add('hidden');
    }
}

function evaluateCurrentInput() {
    try {
        let expression = currentInput
            .replace(/π/g, 'Math.PI')
            .replace(/e/g, 'Math.E');
        return eval(expression);
    } catch (e) {
        return 0;
    }
}

// Scientific Functions
function scientificFunction(func) {
    // Find last number
    const regex = /(-?\d+(\.\d+)?(e[+-]?\d+)?)$/; // Include scientific notation
    const match = currentInput.match(regex);
    
    if (!match) {
        // Maybe trying to apply to 'PI' or 'e' if they are at end?
        // For simplicity, only apply to numeric literals.
        // If user wants sin(PI), they type PI then sin.
        // But currentInput might contain 'Math.PI' if we replaced it? 
        // No, currentInput has 'π'.
        const constMatch = currentInput.match(/(π|e)$/);
        if (constMatch) {
             // Handle constants
             let val = constMatch[0] === 'π' ? Math.PI : Math.E;
             let res = applyScientific(func, val);
             currentInput = currentInput.substring(0, constMatch.index) + res;
             updateDisplay();
             return;
        }
        return;
    }

    const numberStr = match[0];
    const number = parseFloat(numberStr);
    const index = match.index;

    const result = applyScientific(func, number);

    currentInput = currentInput.substring(0, index) + result;
    updateDisplay();
}

function applyScientific(func, val) {
    switch (func) {
        case 'sin':
            return angleMode === 'RAD' ? Math.sin(val) : Math.sin(val * Math.PI / 180);
        case 'cos':
            return angleMode === 'RAD' ? Math.cos(val) : Math.cos(val * Math.PI / 180);
        case 'tan':
            return angleMode === 'RAD' ? Math.tan(val) : Math.tan(val * Math.PI / 180);
        case 'log':
            return Math.log10(val);
        case 'ln':
            return Math.log(val);
        case 'sqrt':
            return Math.sqrt(val);
        case 'square':
            return Math.pow(val, 2);
        case 'cube':
            return Math.pow(val, 3);
        case 'pow10':
            return Math.pow(10, val);
        default:
            return val;
    }
}

function appendConstant(constant) {
    if (shouldResetDisplay) {
        currentInput = '';
        shouldResetDisplay = false;
    }

    // Implicit multiplication
    if (currentInput.length > 0) {
        const lastChar = currentInput.slice(-1);
        if (/\d/.test(lastChar) || lastChar === 'π' || lastChar === 'e' || lastChar === ')') {
             currentInput += '*';
        }
    }
    
    let val = '';
    if (constant === 'PI') val = 'π'; // Use symbol for display
    if (constant === 'E') val = 'e';
    
    currentInput += val;
    updateDisplay();
}

function toggleAngleMode() {
    angleMode = angleMode === 'RAD' ? 'DEG' : 'RAD';
    document.getElementById('angle-mode-indicator').innerText = angleMode;
    document.getElementById('angle-toggle').innerText = angleMode;
}

// UI Control Functions
function toggleScientific() {
    const sciButtons = document.getElementById('scientific-buttons');
    sciButtons.classList.toggle('hidden');
    isScientificMode = !isScientificMode;
    // Adjust layout width if needed, but flexbox handles it
}

function toggleTheme() {
    document.body.classList.toggle('dark-theme');
    document.body.classList.toggle('light-theme');
    const isDark = document.body.classList.contains('dark-theme');
    localStorage.setItem('theme', isDark ? 'dark' : 'light');
    document.getElementById('theme-toggle').innerText = isDark ? '☀️' : '🌙';
}

function loadTheme() {
    const savedTheme = localStorage.getItem('theme');
    if (savedTheme === 'dark') {
        document.body.classList.add('dark-theme');
        document.body.classList.remove('light-theme');
        document.getElementById('theme-toggle').innerText = '☀️';
    } else {
        document.body.classList.add('light-theme');
        document.body.classList.remove('dark-theme');
        document.getElementById('theme-toggle').innerText = '🌙';
    }
}

function toggleHistory() {
    const historyPanel = document.getElementById('history-panel');
    historyPanel.classList.toggle('hidden');
}

// History Tracking
function saveToHistory(expression, result) {
    history.push({ expression, result });
    updateHistoryDisplay();
}

function updateHistoryDisplay() {
    const historyList = document.getElementById('history-list');
    historyList.innerHTML = '';
    
    // Show latest first
    [...history].reverse().forEach((item, index) => {
        const div = document.createElement('div');
        div.className = 'history-item';
        div.innerHTML = `
            <div class="history-expression">${item.expression} =</div>
            <div class="history-result">${item.result}</div>
        `;
        div.onclick = () => {
            currentInput = item.result.toString();
            shouldResetDisplay = false; // Allow editing
            updateDisplay();
        };
        historyList.appendChild(div);
    });
}

function clearHistory() {
    history = [];
    updateHistoryDisplay();
}

// Helper for appendToDisplay
function getLastNumber(str) {
    const split = str.split(/[\+\-\*\/]/);
    return split[split.length - 1];
}

document.addEventListener('DOMContentLoaded', () => {
    const currentEl = document.getElementById('calc-current');
    const previousEl = document.getElementById('calc-previous');
    const keys = document.querySelector('.calc-keys');

    const SYMBOLS = { '+': '+', '-': '\u2212', '*': '\u00d7', '/': '\u00f7' };
    const MAX_DIGITS = 12;

    let current = '0';      
    let previous = null;   
    let operator = null;   
    let overwrite = false;  
    let error = false;

    function format(value) {
        if (value === 'Cannot divide by 0') return value;
        if (value === '-' || value === '') return value;
        const [whole, decimal] = value.split('.');
        const negative = whole.startsWith('-');
        const digits = negative ? whole.slice(1) : whole;
        const withCommas = digits.replace(/\B(?=(\d{3})+(?!\d))/g, ',');
        return (negative ? '-' : '') + withCommas + (decimal !== undefined ? '.' + decimal : '');
    }

    function updateDisplay() {
        currentEl.textContent = format(current);
        previousEl.textContent = previous !== null && operator
            ? format(previous) + ' ' + SYMBOLS[operator]
            : '';
    }

    function resetAll() {
        current = '0';
        previous = null;
        operator = null;
        overwrite = false;
        error = false;
    }

    function appendDigit(digit) {
        pendingOperand = false;
        if (error) resetAll();
        if (overwrite) {
            current = '0';
            overwrite = false;
        }
        if (current.replace(/[-.]/g, '').length >= MAX_DIGITS) return;
        current = current === '0' ? digit : current + digit;
        updateDisplay();
    }

    function appendDecimal() {
        pendingOperand = false;
        if (error) resetAll();
        if (overwrite) {
            current = '0';
            overwrite = false;
        }
        if (!current.includes('.')) current += '.';
        updateDisplay();
    }

    function calculate(a, b, op) {
        const x = parseFloat(a);
        const y = parseFloat(b);
        let result;
        switch (op) {
            case '+': result = x + y; break;
            case '-': result = x - y; break;
            case '*': result = x * y; break;
            case '/':
                if (y === 0) return null;
                result = x / y;
                break;
            default: return b;
        }
       
        return String(parseFloat(result.toPrecision(12)));
    }

    function showError() {
        current = 'Cannot divide by 0';
        previous = null;
        operator = null;
        error = true;
        updateDisplay();
    }

    let pendingOperand = false;

    function chooseOperator(op) {
        if (error) return;
        if (pendingOperand) {
            operator = op;
            previousEl.textContent = format(previous) + ' ' + SYMBOLS[operator];
            return;
        }
        if (operator && previous !== null) {
            const result = calculate(previous, current, operator);
            if (result === null) return showError();
            previous = result;
        } else {
            previous = current;
        }
        operator = op;
        current = '0';
        overwrite = false;
        currentEl.textContent = format(previous);
        previousEl.textContent = format(previous) + ' ' + SYMBOLS[operator];
        pendingOperand = true;
    }

    function equals() {
        if (error || operator === null || previous === null) return;
        const result = calculate(previous, current, operator);
        if (result === null) return showError();
        previousEl.textContent = format(previous) + ' ' + SYMBOLS[operator] + ' ' + format(current) + ' =';
        current = result;
        previous = null;
        operator = null;
        overwrite = true;
        pendingOperand = false;
        currentEl.textContent = format(current);
    }

    function deleteLast() {
        if (error) return resetAll(), updateDisplay();
        if (overwrite) return;
        current = current.length > 1 ? current.slice(0, -1) : '0';
        if (current === '-') current = '0';
        updateDisplay();
    }

    function percent() {
        if (error) return;
        current = String(parseFloat((parseFloat(current) / 100).toPrecision(12)));
        overwrite = false;
        updateDisplay();
    }

    function clearAll() {
        resetAll();
        pendingOperand = false;
        updateDisplay();
    }

    keys.addEventListener('click', (e) => {
        const btn = e.target.closest('button');
        if (!btn) return;

        if (btn.dataset.digit !== undefined) return appendDigit(btn.dataset.digit);
        if (btn.dataset.operator) return chooseOperator(btn.dataset.operator);

        switch (btn.dataset.action) {
            case 'clear': return clearAll();
            case 'delete': return deleteLast();
            case 'percent': return percent();
            case 'decimal': return appendDecimal();
            case 'equals': return equals();
        }
    });

    document.addEventListener('keydown', (e) => {
        if (e.ctrlKey || e.metaKey || e.altKey) return;
        const k = e.key;

        if (/^[0-9]$/.test(k)) appendDigit(k);
        else if (k === '.') appendDecimal();
        else if (['+', '-', '*', '/'].includes(k)) { e.preventDefault(); chooseOperator(k); }
        else if (k === 'Enter' || k === '=') { e.preventDefault(); equals(); }
        else if (k === 'Backspace') deleteLast();
        else if (k === 'Escape') clearAll();
        else if (k === '%') percent();
    });

    updateDisplay();
});

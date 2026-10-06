/**
 * tools/verify-logic.js - 逻辑引擎自检脚本
 * 用法：node tools/verify-logic.js
 *
 * 用一个与 ModelGen 完全独立的"AST 直接求值参考实现"，
 * 对每条逆波兰表达式在全部 2^n 个赋值下逐一对比真值，
 * 验证量词消除（∀/∃）与其他操作符的语义正确性。
 */
const fs = require('fs');
const path = require('path');

// 加载被测代码（纯函数，无 DOM 依赖）
const src = fs.readFileSync(path.join(__dirname, '..', 'LogicParser.js'), 'utf8');
eval(src);

// ---------- 独立参考实现：直接对 AST 求值 ----------
function collectVars(node, out, bound) {
    if (typeof node === 'string') {
        if (node !== '0' && node !== '1' && !(bound && bound.has(node))) out.add(node);
        return;
    }
    if (!node || typeof node !== 'object') return;
    if (node.Q) {
        const nb = new Set(bound || []); nb.add(node.V);
        collectVars(node.B, out, nb);
        return;
    }
    if (node.S !== undefined) {
        collectVars(node.S, out, bound);
        collectVars(node['0'], out, bound);
        collectVars(node['1'], out, bound);
    }
}

// valuation: {varName: bool}；对被约束变量，∀=两赋值都真，∃=任一赋值真
function evalAST(node, valuation) {
    if (typeof node === 'string') {
        if (node === '0') return false;
        if (node === '1') return true;
        return !!valuation[node];
    }
    if (node.Q) {
        const v0 = Object.assign({}, valuation); v0[node.V] = false;
        const v1 = Object.assign({}, valuation); v1[node.V] = true;
        const f0 = evalAST(node.B, v0);
        const f1 = evalAST(node.B, v1);
        return node.Q === 'A' ? (f0 && f1) : (f0 || f1);
    }
    // 决策树节点：S 为选择变量或子树
    var sVal;
    if (typeof node.S === 'string' && node.S !== '0' && node.S !== '1') {
        sVal = !!valuation[node.S];
    } else {
        sVal = evalAST(node.S, valuation);
    }
    return evalAST(node[sVal ? '1' : '0'], valuation);
}

// 对 ModelGen 输出（析取范式行 + 自由变量 order）求值
function evalModel(model, valuation) {
    if (model.order.length === 0) {
        return model.value.length === 1 && model.value[0]['.'] === '>';
    }
    for (const row of model.value) {
        if (row['.'] !== '>') continue; // 只收集为真的行
        let match = true;
        for (const k in row) {
            if (k === '.') continue;
            if (valuation[k] !== (row[k] === '>')) { match = false; break; }
        }
        if (match) return true;
    }
    return false;
}

// ---------- 测试用例 ----------
const cases = [
    // 基础五操作符（回归测试，确保未破坏原功能）
    ['a b .', 'AND'],
    ['a b ,', 'OR'],
    ['a <', 'NOT'],
    ['a b >', 'IMPLIES'],
    ['a b =', 'EQUALS'],
    ['a b . fe >', '原示例1'],
    ['a b . fe ge > =', '原示例2'],
    // 量词（新增功能）
    ['x y , x A', '∀x.(x∨y)'],
    ['x y . x E', '∃x.(x∧y)'],
    ['x y < , x A', '∀x.(x∨¬y)'],
    ['x y . x A', '∀x.(x∧y)'],
    ['x x < . x E', '∃x.(x∧¬x) 永假'],
    ['x x . x A', '∀x.(x∧x) 永假'],
    ['x x < . x A', '∀x.(x∧¬x) 永假'],
    ['x y > x E', '∃x.(x→y)'],
    ['x y > x A', '∀x.(x→y)'],
    ['x y . z , x A', '∀x.((x∧y)∨z)'],
    ['a b . x A', '∀x.(a∧b) x未出现'],
    ['x y , z . x A', '∀x.((x∨y)∧z)'],
    ['a x . b x > = x A', '∀x.((a∧x)=(b→x))'],
    ['x y . z , x A y E', '∃y.∀x.((x∧y)∨z) 量词嵌套'],
    ['x y , y A x E', '∃x.(∀y.(x∨y)) 内层先'],
];

let pass = 0, fail = 0;
for (const [expr, desc] of cases) {
    const ast = LogicParser(expr);
    if (typeof ast === 'string') {
        console.log(`FAIL ${expr} (${desc}): 解析错误: ${ast}`);
        fail++; continue;
    }
    const vars = new Set();
    collectVars(ast, vars, new Set());
    const allVars = Array.from(vars);
    const model = ModelGen(ast);

    let ok = true, detail = '';
    const total = 1 << allVars.length;
    for (let m = 0; m < total; m++) {
        const valuation = {};
        allVars.forEach((v, i) => { valuation[v] = ((m >> i) & 1) === 1; });
        const ref = evalAST(ast, valuation);
        const got = evalModel(model, valuation);
        if (ref !== got) {
            ok = false;
            detail = JSON.stringify(valuation) + ` 期望${ref} 实得${got}`;
            break;
        }
    }
    if (ok) { pass++; console.log(`PASS ${expr} (${desc})`); }
    else { fail++; console.log(`FAIL ${expr} (${desc}): ${detail}`); }
}

// 错误用例（应返回错误字符串而非崩溃）
const errCases = ['x A', '', 'a b . .', 'a b < < <'];
for (const e of errCases) {
    const r = LogicParser(e);
    if (typeof r === 'string') { pass++; console.log(`PASS-ERR "${e}" -> ${r}`); }
    else { fail++; console.log(`FAIL-ERR "${e}" 应报错但返回对象`); }
}

// 补充语义用例：x y , y E z A 合法（∀z.∃y.(x∨y) 应为常量）
const semiCase = LogicParser('x y , y E z A');
if (typeof semiCase !== 'string') {
    const mo = ModelGen(semiCase);
    const isConst = mo.order.length === 0;
    if (isConst && mo.value[0]['.'] === '>') { pass++; console.log('PASS x y , y E z A -> 恒真常量'); }
    else { fail++; console.log('FAIL x y , y E z A -> ' + JSON.stringify(mo) + '（期望恒真）'); }
}

console.log(`\n结果: ${pass} passed, ${fail} failed`);
process.exit(fail ? 1 : 0);

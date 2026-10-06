/**
 * LogicParser.js - 逻辑表达式解析器（增强版）
 * 
 * 支持的操作符:
 *   . : 逻辑与 (AND)       - a b .
 *   , : 逻辑或 (OR)        - a b ,
 *   < : 逻辑非 (NOT)       - a <
 *   > : 逻辑推出 (IMPLIES) - a b >
 *   = : 逻辑等价 (EQUALS)  - a b =
 *   A : 全称量词 ∀ (FORALL) - a A (新增)
 *   E : 存在量词 ∃ (EXISTS) - a E (新增)
 */

function LogicParser(npn) {
    var andM = function (a, b) {
        return {
            "S": a,
            "0": "0",
            "1": {
                "S": b,
                "0": "0",
                "1": "1"
            }
        }
    };
    var orM = function (a, b) {
        return {
            "S": a,
            "0": {
                "S": b,
                "0": "0",
                "1": "1"
            },
            "1": "1"
        }
    };
    var notM = function (a) {
        return {
            "S": a,
            "0": "1",
            "1": "0"
        }
    };
    var infM = function (a, b) {
        return {
            "S": a,
            "0": "1",
            "1": {
                "S": b,
                "0": "0",
                "1": "1"
            }
        }
    };
    var equalM = function (a, b) {
        return {
            "S": a,
            "0": {
                "S": b,
                "0": "1",
                "1": "0"
            },
            "1": {
                "S": b,
                "0": "0",
                "1": "1"
            }
        }
    };
    // 全称量词 ∀: Forall x. P(x)
    // 语义上：对变量 x 的所有赋值，子表达式都为真
    // 等价于 P(x=0) AND P(x=1)
    var forallM = function (expr, varName) {
        return {
            "Q": "A",        // quantifier type
            "V": varName,    // bound variable
            "B": expr        // body expression
        }
    };
    // 存在量词 ∃: Exists x. P(x)
    // 语义上：存在变量 x 的某个赋值，使子表达式为真
    // 等价于 P(x=0) OR P(x=1)
    var existsM = function (expr, varName) {
        return {
            "Q": "E",        // quantifier type
            "V": varName,    // bound variable
            "B": expr        // body expression
        }
    };

    var state = 0;
    var nstate = 0;

    if ("" == npn) { return "Empty String!" };

    for (var e = [], s = npn.split(/(\.|,|<|>|=|A|E|\s)/), t = 0;
        t < s.length; t++) {
        var n = s[t];
        if ("" == n) { }
        else if (n.match(/\s/)) {
            if (1 == state) { state = 0; nstate++; }
        }
        else if (n.match(/^\.$/)) {
            var temp1 = e.pop();
            var temp2 = e.pop();
            if (1 == state) {
                return "use wrong Name as variable"
            }
            else if (undefined == temp1 || undefined == temp2) {
                return "Format Error: arguments less than needed for AND"
            }
            else {
                e.push(andM(temp2, temp1));
                nstate--;
            }
        }
        else if (n.match(/^,$/)) {
            var temp1 = e.pop();
            var temp2 = e.pop();
            if (1 == state) {
                return "use wrong Name as variable"
            }
            else if (undefined == temp1 || undefined == temp2) {
                return "Format Error: arguments less than needed for OR"
            }
            else {
                e.push(orM(temp2, temp1));
                nstate--;
            }
        }
        else if (n.match(/^<$/)) {
            var temp1 = e.pop();
            if (1 == state) {
                return "use wrong Name as variable"
            }
            else if (undefined == temp1) {
                return "Format Error: arguments less than needed for NOT"
            }
            else {
                e.push(notM(temp1));
            }
        }
        else if (n.match(/^>$/)) {
            var temp1 = e.pop();
            var temp2 = e.pop();
            if (1 == state) {
                return "use wrong Name as variable"
            }
            else if (undefined == temp1 || undefined == temp2) {
                return "Format Error: arguments less than needed for IMPLIES"
            }
            else {
                e.push(infM(temp2, temp1));
                nstate--;
            }
        }
        else if (n.match(/^=$/)) {
            var temp1 = e.pop();
            var temp2 = e.pop();
            if (1 == state) {
                return "use wrong Name as variable"
            }
            else if (undefined == temp1 || undefined == temp2) {
                return "Format Error: arguments less than needed for EQUALS"
            }
            else {
                e.push(equalM(temp2, temp1));
                nstate--;
            }
        }
        // === 新增：全称量词 A (∀) ===
        else if (n.match(/^A$/)) {
            var varExpr = e.pop();
            var bodyExpr = e.pop();
            if (1 == state) {
                return "use wrong Name as variable"
            }
            else if (undefined == varExpr || undefined == bodyExpr) {
                return "Format Error: FORALL needs a body and a variable"
            }
            else {
                // varExpr should be a variable name (string)
                // bodyExpr is the expression to quantify over
                var varName = (typeof varExpr === 'string') ? varExpr : "x";
                e.push(forallM(bodyExpr, varName));
                nstate--;
            }
        }
        // === 新增：存在量词 E (∃) ===
        else if (n.match(/^E$/)) {
            var varExpr = e.pop();
            var bodyExpr = e.pop();
            if (1 == state) {
                return "use wrong Name as variable"
            }
            else if (undefined == varExpr || undefined == bodyExpr) {
                return "Format Error: EXISTS needs a body and a variable"
            }
            else {
                var varName = (typeof varExpr === 'string') ? varExpr : "x";
                e.push(existsM(bodyExpr, varName));
                nstate--;
            }
        }
        else {
            if (0 == state) {
                state = 1;
                e.push(n);
            }
        }
    };
    if (nstate > 1) { return "Format Error: arguments more than needed" };
    return e.pop();
};

/**
 * ModelGen - 从解析后的表达式生成真值表模型
 */
function ModelGen(np) {
    var result = {
        value: [],
        order: []
    };

    // 处理量词节点（量词消除：真值表投影法，穷举可靠）
    // ∀x.P(x) ≡ P(x=0) ∧ P(x=1)；∃x.P(x) ≡ P(x=0) ∨ P(x=1)
    // body 的 value 为析取范式行（每行一个使表达式为真的变量赋值组合）。
    // 对剩余自由变量的每个完整赋值，分别代入 x=0 / x=1 求值 body，
    // 按 ∧/∨ 规则得到量化后表达式在该赋值下的真值，再收集为真行。
    if (np && typeof np === 'object' && np.Q) {
        var varName = np.V;
        var body = ModelGen(np.B);

        // 被约束的变量在 body 中不出现，或 body 不依赖任何变量：量词无作用
        if (body.order.indexOf(varName) < 0 || body.order.length === 0) {
            return body;
        }

        var restOrder = body.order.filter(function (o) { return o !== varName; });

        // valuation 给 varName 赋 0/1（false/true）；仅 "." 为 ">" 的行才是真值见证
        function bodyTrueAt(valuation) {
            for (var i = 0; i < body.value.length; i++) {
                var row = body.value[i];
                if (row["."] !== ">") { continue; }
                var match = true;
                for (var kk in row) {
                    if (kk === ".") { continue; }
                    if (valuation[kk] !== (row[kk] === ">")) { match = false; break; }
                }
                if (match) { return true; }
            }
            return false;
        }

        var passing = [];
        var total = 1 << restOrder.length;
        for (var m = 0; m < total; m++) {
            var base = {};
            for (var j = 0; j < restOrder.length; j++) {
                base[restOrder[j]] = ((m >> j) & 1) === 1;
            }
            var v0 = {}; for (var k0 in base) { v0[k0] = base[k0]; } v0[varName] = false;
            var v1 = {}; for (var k1 in base) { v1[k1] = base[k1]; } v1[varName] = true;
            var f0 = bodyTrueAt(v0);
            var f1 = bodyTrueAt(v1);
            var pass = (np.Q === "A") ? (f0 && f1) : (f0 || f1);
            if (pass) { passing.push(m); }
        }

        // 量化结果为常量（全真/全假）时，按原格式返回单常量行
        if (passing.length === total) { return { value: [{ ".": ">" }], order: [] }; }
        if (passing.length === 0) { return { value: [{ ".": "<" }], order: [] }; }

        // 否则收集每个通过赋值的完整最小项（析取范式）
        var newRows = [];
        for (var p = 0; p < passing.length; p++) {
            var idx = passing[p];
            var newRow = { ".": ">" };
            for (var q = 0; q < restOrder.length; q++) {
                newRow[restOrder[q]] = ((idx >> q) & 1) === 1 ? ">" : "<";
            }
            newRows.push(newRow);
        }
        return { value: newRows, order: restOrder };
    }

    if ("string" == typeof (np)) {
        if ("1" == np) {
            result.value = [{ ".": ">" }];
            result.order = [];
        } else if ("0" == np) {
            result.value = [{ ".": "<" }];
            result.order = [];
        } else {
            var temp1 = { ".": ">" };
            var temp2 = { ".": "<" };
            temp1[np] = ">";
            temp2[np] = "<";
            result.value = [temp1, temp2];
            result.order = [np];
        }
    }
    else {
        var result1 = ModelGen(np.S);

        if (0 == result1.order.length) {
            if ("<" == result1.value[0]["."]) {
                result = ModelGen(np[0]);
            } else {
                result = ModelGen(np[1]);
            }
        }
        else {
            var myset = new Set(result1.order);
            var result2 = ModelGen(np[0]);
            var intersection2 = result2.order.filter(x => myset.has(x));
            var result3 = ModelGen(np[1]);
            var intersection3 = result3.order.filter(x => myset.has(x));

            var all0 = false;
            var all1 = false;

            for (let x of result1.value) {
                if ("<" == x["."]) {
                    for (let y of result2.value) {
                        var YesOrNot = true;
                        for (let z of intersection2) {
                            if (undefined != x[z] && undefined != y[z] && x[z] != y[z]) {
                                YesOrNot = false;
                                break;
                            }
                        };
                        if (YesOrNot) {
                            var newValue = {};
                            for (var k in x) {
                                var item = x[k];
                                newValue[k] = item;
                            }
                            for (let alpha of result2.order) {
                                if (undefined != y[alpha]) {
                                    newValue[alpha] = y[alpha];
                                }
                            };
                            newValue["."] = y["."];
                            if (">" == newValue["."]) {
                                all1 = true;
                            } else {
                                all0 = true;
                            };
                            result.value.push(newValue);
                        }
                    }
                }
                else {
                    for (let y of result3.value) {
                        var YesOrNot = true;
                        for (let z of intersection3) {
                            if (undefined != x[z] && undefined != y[z] && x[z] != y[z]) {
                                YesOrNot = false;
                                break;
                            }
                        };
                        if (YesOrNot) {
                            var newValue = {};
                            for (var k in x) {
                                var item = x[k];
                                newValue[k] = item;
                            }
                            for (let alpha of result3.order) {
                                if (undefined != y[alpha]) {
                                    newValue[alpha] = y[alpha];
                                }
                            };
                            newValue["."] = y["."];
                            if (">" == newValue["."]) {
                                all1 = true;
                            } else {
                                all0 = true;
                            };
                            result.value.push(newValue);
                        }
                    }
                }
            };
            if (all0 && !all1) {
                result = {
                    value: [{ ".": "<" }],
                    order: []
                }
            } else if (all1 && !all0) {
                result = {
                    value: [{ ".": ">" }],
                    order: []
                }
            }
            else {
                var tempOrder = new Set(
                    result1.order.concat(result2.order).concat(result3.order)
                );
                result.order = Array.from(tempOrder);
            }
        }
    }
    return result;
}

/**
 * ViewGen - 从模型生成可视化图形描述
 */
function ViewGen(pn) {
    var countKey = 2;
    var result = {
        nodeArray: [
            { "key": "0", "type": "0", "name": "Zero" },
            { "key": 1, "type": "1", "name": "One" },
            { "key": 2, "type": "Export", "name": "Out" }
        ],
        linkArray: []
    }
    function ViewGen0(pnp, NodeKey, PortId) {
        if (1 == pnp.value.length) {
            if ("<" == pnp.value[0]["."]) {
                return {
                    nodeArray: [],
                    linkArray: [{ "from": "0", "frompid": "OUT", "to": NodeKey, "topid": PortId }]
                };
            } else {
                return {
                    nodeArray: [],
                    linkArray: [{ "from": 1, "frompid": "OUT", "to": NodeKey, "topid": PortId }]
                };
            }
        }
        else {
            var CName = "";
            for (CName0 of pnp.order) {
                if (pnp.value.length == pnp.value.filter(function (x) { return undefined != x[CName0] }).length) {
                    CName = CName0;
                }
            }

            if ("" != CName) {
                var TempOrder = pnp.order.filter(function(x){
                    return x  != CName
                });

                var pnp1 = {
                    value: pnp.value.filter(function (x) { return "<" == x[CName] }),
                    order: TempOrder
                };
                var pnp2 = {
                    value: pnp.value.filter(function (x) { return ">" == x[CName] }),
                    order: TempOrder
                };

                countKey++;
                var NodeKeyNow = countKey;
                var NodeLink1 = ViewGen0(pnp1, NodeKeyNow, "0");
                var NodeLink2 = ViewGen0(pnp2, NodeKeyNow, "1");

                return {
                    nodeArray: [{ "key": NodeKeyNow, "type": "SEL" }].concat(NodeLink1.nodeArray, NodeLink2.nodeArray),
                    linkArray: [{ "from": NodeKeyNow, "frompid": "N", "to": NodeKey, "topid": PortId },
                    { "from": CName, "frompid": "OUT", "to": NodeKeyNow, "topid": "SI" }].concat(NodeLink1.linkArray, NodeLink2.linkArray)
                };
            }
        }
    };
    for (x of pn.order) {
        result.nodeArray = result.nodeArray.concat({ "key": x, "type": "Import", "name": x })
    }
    var temp = ViewGen0(pn, countKey, "OUT");
    result.nodeArray = result.nodeArray.concat(temp.nodeArray);
    result.linkArray = result.linkArray.concat(temp.linkArray);
    return result;
}

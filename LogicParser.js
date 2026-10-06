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

    // 处理量词节点
    if (np && typeof np === 'object' && np.Q) {
        var varName = np.V;
        var bodyResult = ModelGen(np.B);
        
        if (np.Q === "A") {
            // ∀: 全称量词 — 对变量所有赋值取 AND
            // 展开: body(var=0) AND body(var=1)
            var bodyWithVar = ModelGen(np.B);
            // 找到 body 的变量顺序中是否包含 varName
            var hasVar = bodyWithVar.order.indexOf(varName) >= 0;
            if (!hasVar) {
                // 变量不在 body 中，量词无作用，直接返回
                return bodyWithVar;
            }
            // 通过从真值表中消除该变量来实现全称量化
            // 对所有行取 AND（只保留两行都有的）
            var newResult = { value: [], order: bodyWithVar.order.filter(function(x) { return x !== varName; }) };
            var val0Rows = bodyWithVar.value.filter(function(row) { return row[varName] === "<" || row[varName] === undefined; });
            var val1Rows = bodyWithVar.value.filter(function(row) { return row[varName] === ">" || row[varName] === undefined; });
            
            // AND semantics: keep only rows present in both
            if (val0Rows.length > 0 && val1Rows.length > 0) {
                for (var r0 of val0Rows) {
                    for (var r1 of val1Rows) {
                        var compatible = true;
                        for (var v of newResult.order) {
                            if (r0[v] !== undefined && r1[v] !== undefined && r0[v] !== r1[v]) {
                                compatible = false;
                                break;
                            }
                        }
                        if (compatible) {
                            var newRow = {};
                            for (var v of newResult.order) {
                                if (r0[v] !== undefined) newRow[v] = r0[v];
                                else if (r1[v] !== undefined) newRow[v] = r1[v];
                            }
                            newRow["."] = (r0["."] === ">" && r1["."] === ">") ? ">" : "<";
                            newResult.value.push(newRow);
                        }
                    }
                }
                if (newResult.value.length === 0) {
                    return { value: [{ ".": "<" }], order: [] };
                }
            } else {
                return { value: [{ ".": "<" }], order: [] };
            }
            return newResult;
        }
        else if (np.Q === "E") {
            // ∃: 存在量词 — 对变量某赋值取 OR
            var bodyWithVar = ModelGen(np.B);
            var hasVar = bodyWithVar.order.indexOf(varName) >= 0;
            if (!hasVar) {
                return bodyWithVar;
            }
            // OR semantics: keep rows from either assignment
            var newResult = { value: [], order: bodyWithVar.order.filter(function(x) { return x !== varName; }) };
            for (var row of bodyWithVar.value) {
                var newRow = {};
                for (var v of newResult.order) {
                    if (row[v] !== undefined) newRow[v] = row[v];
                }
                newRow["."] = row["."];
                newResult.value.push(newRow);
            }
            // Deduplicate
            var seen = {};
            var unique = [];
            for (var row of newResult.value) {
                var key = JSON.stringify(row);
                if (!seen[key]) {
                    seen[key] = true;
                    unique.push(row);
                }
            }
            newResult.value = unique;
            if (newResult.value.length === 0) {
                return { value: [{ ".": "<" }], order: [] };
            }
            // Check if all true or all false
            var allTrue = newResult.value.every(function(r) { return r["."] === ">"; });
            var allFalse = newResult.value.every(function(r) { return r["."] === "<"; });
            if (allTrue) return { value: [{ ".": ">" }], order: [] };
            if (allFalse) return { value: [{ ".": "<" }], order: [] };
            return newResult;
        }
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

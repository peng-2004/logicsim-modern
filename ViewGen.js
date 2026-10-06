/**
 * ViewGen.js - 图形视图生成器（现代化版本）
 * 负责创建和操作 JointJS 图形元素
 */

var app = app || {};

var origin = {
    nodeArray: [],
    linkArray: []
};

var chosedElement = {
    Nodes: new Set([]),
    Links: new Set([]),
    Routing: new Set([])
}

// 初始化 JointJS 图形
var graph = new joint.dia.Graph;

var paper = new joint.dia.Paper({
    el: document.getElementById('paper'),
    model: graph,
    width: 800,
    height: 600,
    gridSize: 10,
    drawGrid: true,
    background: {
        color: 'rgba(150, 250, 200, 0.1)'
    }
});

var startPoint = { x: 0, y: 0 };
var newScale = 1;
var originSize = { height: 0, width: 0, tx: 0, ty: 0 };
var mainContainer = $("main");
var paperContainer = $("#paper-container");
var paperContent = $("#paper");

var VarPad = 50;

// 小地图
var miniScale = 0.15;
var miniMap = $(".mini-map");
var miniPaper = $("#mini-paper");
var miniPaperJ = new joint.dia.Paper({
    el: document.getElementById('mini-paper'),
    model: graph,
    width: 180,
    height: 120,
    background: {
        color: 'rgba(150, 250, 200, 0.1)'
    }
});
var miniView = $("#mini-view");
var miniResize = $("#mini-resize");

function setContainerAndMini() {
    var newWidth = paper.options.width + 200;
    var newHeight = paper.options.height + 100;
    var newTop = 0;
    var newLeft = 0;
    if (newWidth > (2 * newHeight)) {
        newHeight = newWidth / 2;
        newLeft = (newWidth - paper.options.width) / 2;
        newTop = (newHeight - paper.options.height) / 2;
    } else {
        newWidth = 2 * newHeight;
        newLeft = (newWidth - paper.options.width) / 2;
        newTop = (newHeight - paper.options.height) / 2;
    };
    paperContent.css({
        left: newLeft,
        top: newTop
    });

    miniScale = 180 / newWidth;
    paperContainer.css({ height: newHeight, width: newWidth });

    miniPaperJ.setDimensions(miniScale * paper.options.width, miniScale * paper.options.height);
    miniPaperJ.scaleContentToFit({ padding: VarPad * miniScale })

    miniPaper.css("left", miniScale * newLeft);
    miniPaper.css("top", miniScale * newTop);
    miniView.css({
        height: miniScale * mainContainer.height(), width: miniScale * mainContainer.width(),
        left: -1 * miniScale * paperContainer.position().left,
        top: -1 * miniScale * paperContainer.position().top
    });
}

// 小地图交互
miniMap.on({
    "mousedown": function (evt) {
        evt.preventDefault();
        evt.stopPropagation();
        miniView.css({
            left: Math.round(evt.pageX - (miniView.width() / 2)),
            top: Math.round(evt.pageY - (miniView.height() / 2)),
        });
        paperContainer.css({
            left: -1 * Math.round(miniView.position().left / miniScale),
            top: -1 * Math.round(miniView.position().top / miniScale)
        });
        $("body").on("mousemove", function (evt) {
            miniView.css({
                left: Math.round(evt.pageX - (miniView.width() / 2)),
                top: Math.round(evt.pageY - (miniView.height() / 2)),
            });
            paperContainer.css({
                left: -1 * Math.round(miniView.position().left / miniScale),
                top: -1 * Math.round(miniView.position().top / miniScale)
            });
        });
        $("body").on("mouseup", function (evt) {
            $(this).off("mousemove mouseup");
        })
    }
});

miniView.on({
    "mousedown": function (evt) {
        evt.preventDefault();
        evt.stopPropagation();
        var tempX = evt.pageX;
        var tempY = evt.pageY;
        var tempLT = miniView.position();
        $("body").on("mousemove", function (evt) {
            miniView.css({
                left: evt.pageX - tempX + tempLT.left,
                top: evt.pageY - tempY + tempLT.top,
            });
            paperContainer.css({
                left: -1 * Math.round(miniView.position().left / miniScale),
                top: -1 * Math.round(miniView.position().top / miniScale)
            });
        });
        $("body").on("mouseup", function (evt) {
            $(this).off("mousemove mouseup");
        })
    }
});

var contentSize = paper.getContentBBox();
var ERKeyNow = undefined;
const ERMask = joint.highlighters.mask;

// 高亮函数
const ERHighlightLink = function (id) {
    ERMask.add(paper.findViewByModel(id), 'body', 'highlight-red', {
        deep: true,
        attrs: {
            'stroke': '#3b82f6',
            'stroke-width': 2
        }
    });
    graph.getLinks().filter(function (cell) { 
        return cell.attributes.source.id == id || cell.attributes.target.id == id 
    }).forEach(function (cell) {
        chosedElement.Links.add(cell.id);
        ERMask.add(cell.findView(paper), 'line', 'highlight-yellow', {
            padding: 1,
            deep: true,
            attrs: {
                'stroke': '#f59e0b',
                'stroke-width': 2
            }
        });
    });
};

const ERUnhighlight = function (id) {
    if (undefined != graph.getCell(id)) {
        joint.dia.HighlighterView.remove(graph.getCell(id).findView(paper));
    }
};

// 画布事件
paper.on({
    'cell:pointerup': function (cellView) {
        var contentSize2 = paper.getContentBBox();
        var changex = Math.abs(contentSize2.width - contentSize.width);
        var changey = Math.abs(contentSize2.height - contentSize.height);

        if (changex > 20 * newScale || changey > 20 * newScale) {
            VarPad = 50 * newScale;
            paper.fitToContent({
                padding: VarPad,
                allowNewOrigin: "any"
            });
            setContainerAndMini();
            contentSize = contentSize2;
        }
    },
    'blank:pointerdown': function (evt) {
        startPoint.x = evt.clientX;
        startPoint.y = evt.clientY;
        var nowOffSet = paperContainer.position();
        $("body").on("mousemove", function (evt) {
            var changes = {
                x: evt.clientX - startPoint.x,
                y: evt.clientY - startPoint.y
            };
            var newtop = nowOffSet.top + changes.y;
            var newleft = nowOffSet.left + changes.x;

            paperContainer.css({
                top: newtop,
                left: newleft
            });

            miniView.css({
                height: miniScale * mainContainer.height(), 
                width: miniScale * mainContainer.width(),
                left: -1 * miniScale * paperContainer.position().left,
                top: -1 * miniScale * paperContainer.position().top
            });
        });
        $("body").on("mouseup", function (evt) {
            $(this).off("mousemove mouseup");
        });
    },
    'blank:pointerdblclick': function (evt) {
        chosedElement.Nodes.forEach(ERUnhighlight);
        chosedElement.Links.forEach(ERUnhighlight);
        chosedElement.Routing.forEach(ERUnhighlight);
        chosedElement.Nodes.clear();
        chosedElement.Links.clear();
        chosedElement.Routing.clear();
    },
    'element:mouseenter': function (elementView) {
        var model = elementView.model;
        var bbox = model.getBBox();
        var ellipseRadius = (1 - Math.cos(g.toRad(45)));
        var offset = model.attr(['pointers', 'pointerShape']) === 'ellipse'
            ? { x: -ellipseRadius * bbox.width / 2, y: ellipseRadius * bbox.height / 2 }
            : { x: -3, y: 3 };

        elementView.addTools(new joint.dia.ToolsView({
            tools: [
                new joint.elementTools.Remove({
                    useModelGeometry: true,
                    y: '0%',
                    x: '100%',
                    offset: offset
                }),
                new joint.elementTools.Boundary({
                    focusOpacity: 0.5,
                    padding: 10,
                    useModelGeometry: true
                })
            ]
        }));
    },
    'link:mouseenter': function (linkView) {
        linkView.addTools(new joint.dia.ToolsView({
            tools: [
                new joint.linkTools.Remove({
                    useModelGeometry: true,
                    y: '0%',
                    x: '100%',
                    offset: 1.0
                }),
                new joint.linkTools.Boundary({
                    focusOpacity: 0.5,
                    padding: 3,
                    useModelGeometry: true
                })
            ]
        }));
    },
    'element:pointerclick': function (elementView) {
        ERKeyNow = elementView.model.id;
        chosedElement.Nodes.add(ERKeyNow);
        ERHighlightLink(ERKeyNow);

        var ERName = document.getElementById("ERName");
        ERName.value = JSON.stringify(elementView.model.attr().label.text.split("\n"));

        var ERMemo = document.getElementById("ERMemo");
        ERMemo.value = elementView.model.attr().name.text;
    },
    'cell:mouseleave': function (cellView) {
        cellView.removeTools();
    }
});

// 缩放函数
function viewScale(rate) {
    originSize = {
        width: paper.options.width,
        height: paper.options.height,
        tx: paper.translate().tx,
        ty: paper.translate().ty
    };
    var centerX = mainContainer.width() / 2;
    var centerY = mainContainer.height() / 2;

    newScale = newScale * rate;
    if (newScale > 0.1 && newScale < 10) {
        originSize = {
            width: rate * originSize.width,
            height: rate * originSize.height,
            tx: rate * originSize.tx,
            ty: rate * originSize.ty
        };
        VarPad = 50 * newScale;
        paper.setDimensions(originSize.width, originSize.height);
        paper.scaleContentToFit({ padding: VarPad });

        setContainerAndMini();
        paperContainer.css({
            left: centerX - (centerX - paperContainer.position().left) * rate,
            top: centerY - (centerY - paperContainer.position().top) * rate
        });
    }
    else {
        newScale = newScale / rate;
    }
}

// 鼠标滚轮缩放
mainContainer.on('wheel', function (e) {
    e.preventDefault();
    var delta = Math.max(-1, Math.min(1, (e.originalEvent.deltaY || -e.originalEvent.detail))) / 10;
    var rate = (newScale + delta) / newScale;
    viewScale(rate);
});

// 小地图缩放
miniResize.on({
    "mousedown": function (evt) {
        evt.preventDefault();
        evt.stopPropagation();
        var centerPivot = {
            left: miniView.width() / 2 + miniView.position().left,
            top: miniView.height() / 2 + miniView.position().top
        };
        $("body").on("mousemove", function (evt) {
            var rate = miniView.width() / (2 * (evt.pageX - centerPivot.left));
            if ((10 / rate) > newScale) {
                viewScale(rate);
            } else {
                rate = 10 / newScale;
                viewScale(rate);
            }
        });
        $("body").on("mouseup", function (evt) {
            $(this).off("mousemove mouseup");
        })
    }
});

// 键盘快捷键
$("body").on('keydown', function (e) {
    if (e.altKey) {
        var delta = 0.2;
        if (38 == e.which) { // Alt + Up
            var rate = (newScale + delta) / newScale;
            viewScale(rate);
        } else if (40 == e.which) { // Alt + Down
            var rate = (newScale - delta) / newScale;
            viewScale(rate);
        } else if (219 == e.which || 221 == e.which) { // Alt + [ or ]
            togglePanel();
        }
    }
});

// 状态栏
const status = document.getElementById('status');

// 创建节点
app.makeNode = function (theKey, theLabel, theName, theColor, thePorts) {
    var portColor = "#61549c";
    var theWidth = 100;
    var theHeight = 80;
    return new joint.shapes.standard.Rectangle({
        id: theKey,
        size: { width: theWidth, height: theHeight },
        attrs: {
            label: {
                text: theLabel,
                fontSize: 14,
                fontFamily: 'monospace',
                fill: 'white',
                fontWeight: 'bold'
            },
            body: {
                fill: theColor,
                width: "100%",
                height: "100%",
                rx: 8,
                ry: 8,
                stroke: 'none'
            },
            name: {
                text: theName,
                fontSize: 11,
                fontFamily: 'monospace',
                fill: 'white',
                fontWeight: 'normal'
            }
        },
        markup: [
            {
                tagName: 'rect',
                selector: 'body',
            },
            {
                tagName: 'text',
                selector: 'label',
                attributes: {
                    y: theHeight / 3
                }
            },
            {
                tagName: 'text',
                selector: 'name',
                attributes: {
                    transform: "matrix(1,0,0,1," + theWidth / 2 + "," + 7 * theHeight / 10 + ")",
                    "text-anchor": "middle",
                }
            }],
        ports: {
            groups: {
                in: {
                    attrs: {
                        portBody: { magnet: true, fill: portColor, stokeWidth: 0 },
                        portLabel: { fill: portColor, fontSize: 10, fontWeight: "Normal" }
                    },
                    markup: [{
                        tagName: "rect",
                        selector: "portBody",
                        attributes: {
                            height: 10,
                            width: 10,
                            x: -5,
                            y: -5
                        }
                    },
                    {
                        tagName: "text",
                        selector: "portLabel",
                        attributes: {
                            x: 6,
                            y: 3
                        }
                    }],
                    position: { name: "left" }
                },
                out: {
                    attrs: {
                        portBody: { magnet: true, fill: portColor, stokeWidth: 0 },
                        portLabel: { fill: portColor, fontSize: 10, fontWeight: "Normal" }
                    },
                    markup: [{
                        tagName: "rect",
                        selector: "portBody",
                        attributes: {
                            height: 10,
                            width: 10,
                            x: -5,
                            y: -5
                        }
                    },
                    {
                        tagName: "text",
                        selector: "portLabel",
                        attributes: {
                            x: -6,
                            y: 3,
                            "text-anchor": "end"
                        }
                    }],
                    position: { name: "right" }
                }
            },
            items: thePorts
        }
    });
};

app.nodeCreate = function (theNode) {
    var result = {};
    if ("0" == theNode.type) {
        result = app.makeNode(
            theNode.key,
            "0",
            theNode.name,
            "#ef4444",
            [{ group: "out", id: "OUT", attrs: { portLabel: { text: "OUT" } } },]
        )
    }
    else if ("1" == theNode.type) {
        result = app.makeNode(
            theNode.key,
            "1",
            theNode.name,
            "#10b981",
            [{ group: "out", id: "OUT", attrs: { portLabel: { text: "OUT" } } },]
        )
    }
    else if ("Import" == theNode.type) {
        result = app.makeNode(
            theNode.key,
            "IN",
            theNode.name,
            "#3b82f6",
            [{ group: "out", id: "OUT", attrs: { portLabel: { text: "OUT" } } },]
        )
    }
    else if ("Export" == theNode.type) {
        result = app.makeNode(
            theNode.key,
            "OUT",
            theNode.name,
            "#8b5cf6",
            [{ group: "in", id: "OUT", attrs: { portLabel: { text: "OUT" } } },]
        )
    }
    else if ("SEL" == theNode.type) {
        result = app.makeNode(
            theNode.key,
            "SEL",
            "",
            "#f59e0b",
            [{
                group: "in", id: "SI",
                attrs: { portLabel: { text: "SI" } }
            },
            {
                group: "in", id: "0", attrs: { portLabel: { text: "0" } }
            },
            {
                group: "in", id: "1", attrs: { portLabel: { text: "1" } }
            },
            { group: "out", id: "SO", attrs: { portLabel: { text: "SO" } } },
            { group: "out", id: "N", attrs: { portLabel: { text: "N" } } },
            { group: "out", id: "P", attrs: { portLabel: { text: "P" } } }]
        );
    };
    return result;
};

app.linkCreate = function (theNode) {
    return new joint.shapes.standard.Link({
        source: { id: theNode.from, magnet: "portBody", port: theNode.frompid },
        target: { id: theNode.to, magnet: "portBody", port: theNode.topid },
        smooth: true,
        connector: { name: "rounded", args: { radius: 10 } },
        router: {
            name: 'metro',
            args: {
                step: 10,
                startDirections: ["right"],
                endDirections: ["left"]
            }
        },
        attrs: {
            line: {
                stroke: '#64748b',
                'stroke-width': 2
            }
        }
    })
};

app.ELCreate = function (GraphDesc) {
    var result = [];
    for (oneNode of GraphDesc.nodeArray) {
        result.push(app.nodeCreate(oneNode));
    }
    for (oneLink of GraphDesc.linkArray) {
        result.push(app.linkCreate(oneLink));
    }
    return result;
};

app.ELDump = function (JsonCells) {
    var result = {
        nodeArray: [],
        linkArray: []
    };
    for (oneElem of JsonCells) {
        if ("standard.Link" == oneElem.type) {
            result.linkArray.push({
                "from": oneElem.source.id,
                "frompid": oneElem.source.port,
                "to": oneElem.target.id,
                "topid": oneElem.target.port
            });
        }
        else {
            if("SEL" == oneElem.attrs.label.text){
                result.nodeArray.push({
                    "key":oneElem.id,
                    "type":"SEL"
                });
            }else{
                result.nodeArray.push({
                    "key":oneElem.id,
                    "type":oneElem.attrs.label.text,
                    "name":oneElem.attrs.name.text
                });
            }
        }
    };
    return result;
}

// 解析逻辑表达式
app.parseLogic = function () {
    var exprText = document.getElementById("ReversePol").value;
    var resultParsed = LogicParser(exprText);
    if ("string" == typeof (resultParsed)) {
        status.textContent = resultParsed;
        status.className = "error";
        showToast(resultParsed, 'error');
    } else {
        var viewModel = ViewGen(ModelGen(resultParsed));
        origin = viewModel;
        document.getElementById("myModel").value = JSON.stringify(origin, null, 2);
        status.textContent = "表达式解析成功";
        status.className = "success";
        showToast("表达式解析成功", 'success');
    }
};

// 更新图形
app.updateGraph = function () {
    graph.resetCells(app.ELCreate(origin));
    joint.layout.DirectedGraph.layout(graph, {
        setLinkVertices: false,
        nodeSep: 100,
        edgeSep: 50,
        rankSep: 100,
        rankDir: "LR"
    });
    newScale = 1;
    paper.fitToContent({
        padding: 50,
        allowNewOrigin: "any"
    });
    setContainerAndMini();
    paperContainer.css({
        left: Math.round((mainContainer.width() - paperContainer.width()) / 2),
        top: Math.round((mainContainer.height() - paperContainer.height()) / 2),
        position: "absolute"
    });
    miniView.css({
        height: miniScale * mainContainer.height(), 
        width: miniScale * mainContainer.width(),
        left: -1 * miniScale * paperContainer.position().left,
        top: -1 * miniScale * paperContainer.position().top
    });
}

// 从文本框载入
app.load = function() {
    try {
        origin = JSON.parse(document.getElementById("myModel").value);
        status.textContent = "模型载入成功";
        status.className = "success";
        showToast("模型载入成功", 'success');
    }
    catch (error) {
        origin = {
            nodeArray: [],
            linkArray: []
        };
        status.textContent = "JSON 格式错误，使用空格式";
        status.className = "error";
        showToast("JSON 格式错误", 'error');
        document.getElementById("myModel").value = JSON.stringify(origin, null, 2);
    }
    app.updateGraph();
};

app.save = function() {
    origin = app.ELDump(graph.toJSON().cells);
    document.getElementById("myModel").value = JSON.stringify(origin, null, 2);
    status.textContent = "模型已保存为 JSON 格式";
    status.className = "info";
    showToast("模型已保存", 'success');
};

// 文件操作
if (window.FileList && window.File && window.FileReader) {
    document.getElementById("fileToLoad").addEventListener('change', event => {
        status.textContent = '正在载入文件...';
        const fileToLoad = event.target.files[0];
        if (!fileToLoad.type) {
            status.textContent = '错误：浏览器不支持 File.type';
            status.className = "error";
            return;
        }
        const reader = new FileReader();
        reader.addEventListener('load', function (evt) {
            var textFromFileLoaded = evt.target.result;
            document.getElementById("myModel").value = textFromFileLoaded;
            app.load();
        });
        reader.readAsText(fileToLoad, "UTF-8");
    })
}

function destroyClickedElement(event) {
    document.body.removeChild(event.target);
};

app.saveTextAsFile = function () {
    var textToSave = document.getElementById("myModel").value;
    var textToSaveAsBlob = new Blob([textToSave], { type: "application/json" });
    var textToSaveAsURL = window.URL.createObjectURL(textToSaveAsBlob);
    var fileNameToSaveAs = document.getElementById("inputFileNameToSaveAs").value;

    var downloadLink = document.createElement("a");
    downloadLink.download = fileNameToSaveAs;
    downloadLink.innerHTML = "Download File";
    downloadLink.href = textToSaveAsURL;
    downloadLink.onclick = destroyClickedElement;
    downloadLink.style.display = "none";
    document.body.appendChild(downloadLink);

    downloadLink.click();
    showToast("文件已保存", 'success');
};

// 修改元素名称
app.ChangeName = function () {
    try {
        var sheets = JSON.parse(document.getElementById("ERName").value);
    } catch (e) {
        showToast("格式错误", 'error');
        return false;
    }
    if (!(sheets instanceof Array)) {
        showToast("格式错误", 'error');
        return false;
    };
    if (0 == sheets.length) {
        showToast("格式错误", 'error');
        return false;
    }
    var memoText = document.getElementById("ERMemo").value;
    ERUnhighlight(ERKeyNow);
    paper.findViewByModel(ERKeyNow).model.attr({
        label: { text: sheets.join("\n") }, 
        name: { text: memoText }
    });
    app.save();
    showToast("名称已更新", 'success');
}

// Toast 通知
function showToast(message, type) {
    var toast = document.createElement('div');
    toast.className = 'toast';
    if (type === 'error') {
        toast.style.background = '#ef4444';
    } else if (type === 'success') {
        toast.style.background = '#10b981';
    }
    toast.textContent = message;
    document.body.appendChild(toast);
    setTimeout(function() {
        toast.remove();
    }, 3000);
}

// 主题切换
document.getElementById('themeToggle').addEventListener('click', function() {
    document.documentElement.classList.toggle('dark');
    localStorage.setItem('theme', document.documentElement.classList.contains('dark') ? 'dark' : 'light');
});

// 初始化主题
if (localStorage.getItem('theme') === 'dark' || (!localStorage.getItem('theme') && window.matchMedia('(prefers-color-scheme: dark)').matches)) {
    document.documentElement.classList.add('dark');
}

// 帮助模态框
document.getElementById('helpBtn').addEventListener('click', function() {
    document.getElementById('helpModal').classList.remove('hidden');
});
document.getElementById('helpModalClose').addEventListener('click', function() {
    document.getElementById('helpModal').classList.add('hidden');
});
document.getElementById('helpModalBackdrop').addEventListener('click', function() {
    document.getElementById('helpModal').classList.add('hidden');
});

// 示例按钮
document.querySelectorAll('.example-btn').forEach(function(btn) {
    btn.addEventListener('click', function() {
        var expr = this.getAttribute('data-expr');
        document.getElementById('ReversePol').value = expr;
        app.parseLogic();
    });
});

// 按钮事件绑定
document.getElementById('parseBtn').addEventListener('click', app.parseLogic);
document.getElementById('loadBtn').addEventListener('click', app.load);
document.getElementById('saveBtn').addEventListener('click', app.saveTextAsFile);
document.getElementById('saveGraphBtn').addEventListener('click', app.save);
document.getElementById('changeNameBtn').addEventListener('click', app.ChangeName);

// 缩放按钮
document.getElementById('zoomInBtn').addEventListener('click', function() {
    viewScale(1.2);
});
document.getElementById('zoomOutBtn').addEventListener('click', function() {
    viewScale(0.8);
});
document.getElementById('zoomResetBtn').addEventListener('click', function() {
    newScale = 1;
    paper.scale(1, 1);
    paper.fitToContent({ padding: 50, allowNewOrigin: "any" });
    setContainerAndMini();
});

// 侧边栏切换
function togglePanel() {
    var panel = document.getElementById('rightPanel');
    var toggle = document.getElementById('panelToggle');
    var icon = document.getElementById('panelToggle-icon');
    
    if (panel.classList.contains('hidden')) {
        panel.classList.remove('hidden');
        toggle.style.right = '288px';
        icon.style.transform = 'rotate(0deg)';
    } else {
        panel.classList.add('hidden');
        toggle.style.right = '0';
        icon.style.transform = 'rotate(180deg)';
    }
}

document.getElementById('panelToggle').addEventListener('click', togglePanel);

// 初始化
app.load();

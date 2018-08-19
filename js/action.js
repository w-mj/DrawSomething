let ctx, cvs;
let drawing = false;
let myTurn = true;
let roomnum = "";
let nickname = "";
let ws = new WebSocket('ws://127.0.0.1:9394');

$(document).ready(function() {
    $('#canvas-container').height($("#text-window").height());
    CanvasAutoResize.initialize();
    cvs = $("#canvas-area");
    ctx = document.getElementById('canvas-area').getContext('2d');
    ctx.lineWidth = 2;
    ctx.lineJoin = "round";
    ctx.lineCap = "round";
    cvs.mousedown(function(event) {
        if (myTurn) {
            drawing = true;
            ctx.beginPath();
            let x = event.pageX - cvs.offset().left;
            let y = event.pageY - cvs.offset().top;
            let x_scale = Math.floor(x / cvs.width() * 1000);
            let y_scale = Math.floor(y / cvs.height() * 1000);
            ctx.moveTo(x, y);
            ws.send(JSON.stringify({c:'md', x:x_scale, y:y_scale}));
        }
    });
    cvs.mousemove(function(event) {
        if (drawing && myTurn) {
            let x = event.pageX - cvs.offset().left;
            let y = event.pageY - cvs.offset().top;
            let x_scale = Math.floor(x / cvs.width() * 1000);
            let y_scale = Math.floor(y / cvs.height() * 1000);
            ctx.lineTo(x, y);
            ws.send(JSON.stringify({c:'mm', x:x_scale, y:y_scale}));
            ctx.stroke();
        }
    });
    cvs.mouseup(function(event) {
        drawing = false;
        ws.send('{"c":"mu"}');
    });
    cvs.mouseleave(function(event) {
        drawing = false;
        ws.send('{"c":"mu"}');
    });
    $('#game-page').hide();
    $('#newroom').width($('#nickname').width()); // make login button as the same width.
});

function onMouseDown(x, y) {
    drawing = true;
    ctx.beginPath();
    ctx.moveTo(x / 1000 * cvs.width(), y / 1000 * cvs.height());
}

function onMouseMove(x, y) {
    if (drawing) {
        ctx.lineTo(x / 1000 * cvs.width(), y / 1000 * cvs.height());
        ctx.stroke();
    }
}

function setLineWidth(width) {
    ctx.lineWidth = width;
    ws.send(JSON.stringify({c:'sw', wd:width}));
}

function setLineColor(color) {
    ctx.strokeStyle = color;
    ws.send(JSON.stringify({c:'sc', co:color}));
}

function clearCanvas() {
    ctx.clearRect(0, 0, cvs.width(), cvs.height());
}

let CanvasAutoResize = {
    draw: function() {
        let ctx = document.getElementById('canvas-area').getContext('2d');
        let canvasContainer = document.getElementById('canvas-container');
        ctx.canvas.width  = canvasContainer.offsetWidth-2;
        ctx.canvas.height = canvasContainer.offsetHeight-2;
    },

    initialize: function(){
        let self = CanvasAutoResize;
        self.draw();
        $(window).on('resize', function(event){
            self.draw();
        });
    }
};


function createroom() {
    nickname = $('#nickname').val();
    ws.send(JSON.stringify({c:'r', n:nickname}));
    ws.send(JSON.stringify({c:'c'}));
    console.log('you are ' + nickname);
}

function joinroom() {
    roomnum = $('#roomnum').val();
    nickname = $('#nickname').val();
    ws.send(JSON.stringify({c:'r', n:nickname}));
    ws.send(JSON.stringify({c:'j', n:parseInt(roomnum)}));
    console.log('you are ' + nickname + 'join ' + roomnum);
}

function say() {
    let text = $('#input-box').val();
    ws.send(JSON.stringify({c:'s', t:text}));
}

let timer = class Timer {
    constructor() {
        this.time = 120;
        setInterval(function() {
            if (myTurn) {
                this.time -= 1;
                $('#timer').html(this.time);
                if (this.time === 0)
                    ws.send('{"c":"to"}');
                else
                    ws.send(JSON.stringify({c:'t', r:this.time}))
            }
        })
    }
    reset() {
        this.time = 120;
    }
};


ws.onmessage = function(event) {
    console.log(event.data);
    data = JSON.parse(event.data);
    switch (data.c) {
        case 'j':
            if (data.r === 's') {
                $('#welcome-page').hide();
                $('#game-page').show();
                roomnum = data.n;
                $('#show-room-number').html(roomnum);
            }
            else
                console.log('join room fail: ' + data.w);
            break;
        case 's': $("#text-window").append(data.n + ': ' + data.t + '\n'); break;
        case 'md': onMouseDown(data.x, data.y); break;
        case 'mm': onMouseMove(data.x, data.y); break;
        case 'mu': drawing = false; break;
        case 'sc': setLineColor(data.co); break;
        case 'sw': setLineWidth(data.wd); break;
        case 't': $('#timer').html(data.r); break;
        case 'c': if (data.r === 'e') {
            console.log('create room fail: ' + data.w);
        }
        break;
        case 'n':
        case 'q': $('#question').html(data.q); break;
        case 'h': $('#hint').html(data.q); break;
        case 'b':
            timer.reset();
            myTurn = true;
            break;
        case 'e': myTurn = false; break;
        case 'i': $("#text-window").append("welcome " + data.n + " join the room.\n"); break;
    }
};

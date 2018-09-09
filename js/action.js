let ctx, cvs;
let drawing = false;
let myTurn = false;
let roomnum = "";
let nickname = "";
let readyState = false;
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
        if (drawing) {
            drawing = false;
            ws.send('{"c":"mu"}');
        }
    });
    cvs.mouseleave(function(event) {
        if (drawing) {
            drawing = false;
            ws.send('{"c":"mu"}');
        }
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
    ws.send(JSON.stringify({c:'sw', wd:width}));
}

function setLineColor(color) {
    ws.send(JSON.stringify({c:'sc', co:color}));
}

function clearCanvas() {
    ws.send('{"c":"cl"}');
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
        // $(window).on('resize', function(event){
        //     self.draw();
        // });
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
let timer_time = 0;
let start_timer = false;
function resetTimer(time) {
    timer_time = time;
    $('#timer').html(timer_time);
}

setInterval(function() {
    if (myTurn && start_timer) {
        timer_time -= 1;
        $('#timer').html(timer_time);
        if (timer_time === 0) {
            start_timer = false;
            ws.send('{"c": "to"}');
        }
        ws.send(JSON.stringify({c:'t', r:timer_time}));
    }
}, 1000);

function ready() {
    readyState = !readyState;
    if (readyState) {
        $('#ready-button').html('Unready');
        ws.send('{"c":"sr"}');
    } else {
        $('#ready-button').html('Ready');
        ws.send('{"c":"cr"}');
    }
}


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
        case 'sc': ctx.strokeStyle = data.co; break;
        case 'sw': ctx.lineWidth = data.wd; break;
        case 't': $('#timer').html(data.r); break;
        case 'c': if (data.r === 'e') {
            console.log('create room fail: ' + data.w);
        }
        break;
        case 'n':
        case 'q': $('#question').html(data.q); break;
        case 'h': $('#hint').html(data.q); break;
        case 'b':
            clearCanvas();
            resetTimer(120);
            myTurn = true;
            start_timer = true;
            break;
        case 'e': myTurn = false; break;
        case 'i': $("#text-window").append("welcome " + data.n + " join the room.\n"); break;
        case 'l': $("#text-window").append(data.n + " leave the room.\n"); break;
        case 'cl': ctx.clearRect(0, 0, cvs.width(), cvs.height()); break;
        case 'p':
            let board = $("#score-board");
            board.html("name score state\n");
            for (let i = 0; i < data.p.length; i++) {
                // console.log(data.p);
                let player = data.p[i];
                console.log(player);
                board.append(('->' + player.n + ' ' + player.s) + (player.r ?' √\n':' X\n'));
            }
            break;
    }
};

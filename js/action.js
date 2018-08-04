let ctx, cvs;
let drawing = false;
let roomnum = "";
let nickname = "";

$(document).ready(function() {
    $('#canvas-container').height($("#text-window").height());
    CanvasAutoResize.initialize();
    cvs = $("#canvas-area");
    ctx = document.getElementById('canvas-area').getContext('2d');
    ctx.lineWidth = 2;
    ctx.lineJoin = "round";
    ctx.lineCap = "round";
    cvs.mousedown(function(event) {
        drawing = true;
        ctx.beginPath();
        ctx.moveTo(event.pageX - cvs.offset().left, event.pageY - cvs.offset().top);
    });
    cvs.mousemove(function(event) {
        if (drawing) {
            ctx.lineTo(event.pageX - cvs.offset().left, event.pageY - cvs.offset().top);
            ctx.stroke();
        }
    });
    cvs.mouseup(function(event) {
        drawing = false;
    });
    cvs.mouseleave(function(event) {
        drawing = false;
    });
    $('#game-page').hide();
    $('#newroom').width($('#nickname').width()); // make login button as the same width.
});

function setLineWidth(width) {
    ctx.lineWidth = width;
}

function setLineColor(color) {
    ctx.strokeStyle = color;
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
    $('#welcome-page').hide();
    $('#game-page').show();
    nickname = $('#nickname').val();
    console.log('you are ' + nickname);
}

function joinroom() {
    $('#welcome-page').hide();
    $('#game-page').show();
    nickname = $('#nickname').val();
    roomnum = $('#roomnum').val();
    console.log('you are ' + nickname + 'join ' + roomnum);
}

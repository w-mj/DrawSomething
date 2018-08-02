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
    let parameters = location.search.substr(1).split('&');
    parameters = parameters.map(function(x){return x.split('=')});
    for (x in parameters) {
        t = parameters[x];
        switch (t[0]) {
            case 'roomnum': roomnum = t[1]; break;
            case 'nickname': nickname = t[1];break;
            case 'newroom': newroom(); break;
            case 'join': joinroom(); break;
        }
    }
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

function newroom() {

}

function joinroom() {
    console.log('join' + roomnum);
}

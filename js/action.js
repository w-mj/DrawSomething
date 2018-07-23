let ctx, cvs;
let drawing = false;

$(document).ready(function() {
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
});

function setLineWidth(width) {
    console.log(width);
    ctx.lineWidth = width;
}

function setLineColor(color) {
    ctx.fillStyle = color;
}
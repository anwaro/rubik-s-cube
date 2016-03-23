var DE = Math.PI / 180;
var PI = Math.PI;
var PI4 = Math.PI / 4;
var PI34 = 3 * Math.PI / 4;
var PI2 = Math.PI / 2;
var D = 3 * Math.sqrt(3);

var rotateCubeAxis = new Vector(1, 1, 0);
var rotatePartAxis = new Vector(0, 0, 0);
var dragCube = new Vector();
var dragPart = new Vector();
var planeVec = new Vector(0, 1, 0);
var rotateCubeAngle = 0;
var rotatePartAngle = 0;
var rotateEndAngle = 0;
var angleStep = 0;
var rotateCount = 0;
var supportElipse = false;

var canvas, ctx;
var canvasWidth = 900;
var canvasHeight = 600;
var centerX = canvasWidth / 2;
var centerY = canvasHeight / 2;
var scaleMax = 0;
var scale = 0;
var radius = 0.3;
var lineWidth = 4;

var shakeRepetCount = 20;
var shakeCount = 0;
var shakeAngleEnd = 0;
var shakeAngleStep = 0;
var startFontSize = 2 * scale;


var colors = {
    red: "#BF1E2E",
    green: "#00A652",
    blue: "#303193",
    orange: "#F6941D",
    yellow: "#FFF100",
    white: "#FFFFFF",
    bg1: "#DADADA",
    bg2: "#848484",
    bg3: "#505050",
    line: "#282828",
    black: "#403F3F",
    bgGradient:null
};

var mouse = {
    pos: new Point(),
    lazy : new Point(),
    click: new Point(),
    leftPress: false,
    scrollPress: false,
    rightPress: false,
    inercion : false,
    block: false,
    animationProcess: false,
    shakeProcess: false,
    updateLazy : function(){
        this.lazy.x += (this.pos.x - this.lazy.x)*0.3;
        this.lazy.y += (this.pos.y - this.lazy.y)*0.3;
    },
    resetLazy : function(){
        this.lazy.set(this.pos);
    },
    update : function () {
        if(this.shakeProcess) return false;   
        
        this.updateLazy();
        
        if(this.inercion){
            if(this.pos.distance(this.lazy) < 5){
                this.inercion = false;
                if(mouse.leftPress){
                    mouse.animationProcess = true;
                    cube.calculateAngle();
                    cube.rotateAnimation();
                }
                else if(mouse.scrollPress){
                    cube.updatePosition();
                    mouse.scrollPress = false;
                    rotateCubeAngle = 0;                    
                }
                
            }
        }
        
        if (this.scrollPress) {
            dragCube.set(this.lazy.x - this.click.x, this.click.y - this.lazy.y);
            rotateCubeAxis.set(-dragCube.y, dragCube.x);
            rotateCubeAxis.norm();
            rotateCubeAngle = dragCube.len() / 100 * 36;
        }
        else if (this.leftPress && !this.animationProcess) {
            var dx = this.lazy.x - this.click.x;
            var dy = this.click.y - this.lazy.y;
            dragPart.set(dx, dy);

            if(cube.dragDirection === 1)       rotatePartAngle =  dy / 70 * 36;
            else if(cube.dragDirection === 2 ) rotatePartAngle = -dy / 70 * 36;
            else if(cube.dragDirection === 3 ) rotatePartAngle = -dx / 70 * 36;
            else                               rotatePartAngle =  dx / 70 * 36;
        }
        
    }
};

var rotateCubeMatrix = new RotateMatrix(new Vector(), new Vector(), new Vector());
var rotatePartMatrix = new RotateMatrix(new Vector(), new Vector(), new Vector());

var vertex1 = new Vector(-3, 3, 3);
var vertex2 = new Vector(3, 3, 3);
var vertex3 = new Vector(3, -3, 3);
var vertex4 = new Vector(-3, -3, 3);
var vertex5 = new Vector(-3, 3, -3);
var vertex6 = new Vector(3, 3, -3);
var vertex7 = new Vector(3, -3, -3);
var vertex8 = new Vector(-3, -3, -3);

var faceA = new Face(vertex1, vertex2, vertex3, vertex4, colors.blue, 0);
var faceB = new Face(vertex2, vertex6, vertex7, vertex3, colors.green, 1);
var faceC = new Face(vertex6, vertex5, vertex8, vertex7, colors.orange, 2);
var faceD = new Face(vertex5, vertex1, vertex4, vertex8, colors.red, 3);
var faceE = new Face(vertex5, vertex6, vertex2, vertex1, colors.white, 4);
var faceF = new Face(vertex4, vertex3, vertex7, vertex8, colors.yellow, 5);

var wallA = [faceA, createWall(vertex1, vertex3, colors.blue, 0), new Neighbor(4, 5, 3, 1, 2)];
var wallB = [faceB, createWall(vertex2, vertex7, colors.green, 1), new Neighbor(4, 5, 0, 2, 3)];
var wallC = [faceC, createWall(vertex6, vertex8, colors.orange, 2), new Neighbor(4, 5, 1, 3, 0)];
var wallD = [faceD, createWall(vertex5, vertex4, colors.red, 3), new Neighbor(4, 5, 2, 0, 1)];
var wallE = [faceE, createWall(vertex5, vertex2, colors.white, 4), new Neighbor(2, 0, 3, 1, 5)];
var wallF = [faceF, createWall(vertex4, vertex7, colors.yellow, 5), new Neighbor(0, 2, 3, 1, 4)];

var cube = new Cube([wallA, wallB, wallC, wallD, wallE, wallF]);


function mouseMove(event) {
    if(mouse.inercion) return 1;
    var rect = canvas.getBoundingClientRect();
    mouse.pos.set(event.clientX - rect.left, event.clientY - rect.top);
}

function canvasCursor(type){
    canvas.style.cursor = type;
}

function mouseUp(event) {
    if (mouse.leftPress && event.button === 0) {
        mouse.inercion = true;
        canvasCursor("default");
    }
    if (mouse.scrollPress && event.button === 1) {
        mouse.inercion = true;
        canvasCursor("default");
    }
}

function mouseDown(event) {
    if (mouse.scrollPress || mouse.leftPress || mouse.rightPress
            || mouse.animationProcess || mouse.shakeProcess || mouse.inercion) {
        return false;
    }
    var rect = canvas.getBoundingClientRect();
    mouse.click.set(event.clientX - rect.left, event.clientY - rect.top);
    mouse.pos.set(event.clientX - rect.left, event.clientY - rect.top+1e-9);
    mouse.resetLazy();

    if (event.button === 0){
        mouse.leftPress   = true;
        canvasCursor("move");
    }
    else if (event.button === 1){
        mouse.scrollPress = true;
        canvasCursor("move");
    }
}


function draw() {
    ctx.fillStyle = colors.bgGradient;
    ctx.fillRect(0, 0, canvasWidth, canvasHeight);
    
    rotateCubeMatrix.updateMatrix(rotateCubeAxis, rotateCubeAngle * DE);
    cube.rotateAll(rotateCubeMatrix);
    
    if(mouse.leftPress || mouse.shakeProcess){
        cube.activeElement(mouse.click);
        cube.rotatePart();        
    }
    
    supportElipse&&cube.printShadow();
    cube.fillFaces();
    
    mouse.shakeProcess || mouse.update();
    mouse.shakeProcess && countdown();
    
}

function testLog() {
    ctx.beginPath();
    ctx.fillStyle = "red";
    ctx.moveTo(mouse.click.x, mouse.click.y);
    ctx.lineTo(mouse.pos.x, mouse.pos.y);
    ctx.stroke();

}

function Cube(walls) {
    this.walls = walls;
    this.showed = [];
    this.elementRotate = [];
    this.blackFill =  {fir:[],sec:[]};
    this.blackFillFace = {id:-1,pid: -1};
    this.blackFace = new Face(new Vector(), new Vector(), new Vector(), new Vector(), colors.black);
    this.dragDirection = -1; // 1-top 2-down 3-left 4-right
    this.faceNormal = -1;
    this.clickFacesIndex = -1;
    this.clickElementIndex = -1;
    this.moveTo = -1;
    this.extrema = {min: new Vector(), max: new Vector()};
    this.shadow = new Vector();
    
    this.getFace= function (id) {   
        return this.walls[id][0];
    };
    
    this.getChild = function (id) {
        return this.walls[id][1];
    };
    
    this.getNeigh= function (id) {
        return this.walls[id][2];
    };
    
    this.normalPos = function (move) {
        return parseInt("3421".split('')[move - 1]);
    };
    
    this.rotateAll = function (rotateCubeMatrix) {
        for (var i = 0; i < this.walls.length; i++) {
            this.walls[i][0].rotate(rotateCubeMatrix);
            for (var j = 0; j < this.walls[i][1].length; j++) {
                this.walls[i][1][j].rotate(rotateCubeMatrix);
            }
        }
    };

    this.printEdge = function () {
        for (var i = 0; i < this.walls.length; i++) {
            for (var j = 0; j < this.walls[i][1].length; j++) {
                this.walls[i][1][j].printEdge();
            }
        }
    };
    this.updatePosition = function () {
        for (var i = 0; i < this.walls.length; i++) {
            this.walls[i][0].update();
            for (var j = 0; j < this.walls[i][1].length; j++) {
                this.walls[i][1][j].update();
            }
        }
    };
    this.fillFaces = function () {
        if(this.faceNormal === -1){
            var maxZ = this.nearestVertex();
            this.showed = [];
            for (var i = 0; i < this.walls.length; i++) {
                var face = this.walls[i][0];
                if (Math.max(face.v1.z, face.v2.z, face.v3.z, face.v4.z) + 0.1 > maxZ) {
                    this.showed.push(i);
                }
                for (var j = 0; j < this.walls[i][1].length; j++) {
                    this.walls[i][1][j].fill();
                    this.walls[i][1][j].printEdge();
                }
            }
        }
        else{
            var dist = 0;
            for (var i = 0; i < this.walls.length; i++) {
                for (var j = 0; j < this.walls[i][1].length; j++) {
                    if(this.distance(this.walls[i][1][j].average()) < 2){
                        this.walls[i][1][j].fill();
                        this.walls[i][1][j].printEdge();
                        this.blackFillCorr(this.walls[i][1][j], 1.5);                        
                    }
                }
            }            
            this.sort();
            this.fillBlack();            
            for (var i = 0; i < this.walls.length; i++) {
                for (var j = 0; j < this.walls[i][1].length; j++) {
                    dist = this.distance(this.walls[i][1][j].average());
                    if(dist < 3.5 && dist > 2){
                        this.walls[i][1][j].fill();
                        this.walls[i][1][j].printEdge(); 
                        this.blackFillCorr(this.walls[i][1][j], 3);                        
                    }
                }
            }            
            this.sort();
            this.fillBlack();            
            for (var i = 0; i < this.walls.length; i++) {
                for (var j = 0; j < this.walls[i][1].length; j++) {
                    if(this.distance(this.walls[i][1][j].average()) > 4){
                        this.walls[i][1][j].fill();
                        this.walls[i][1][j].printEdge();                        
                    }
                }
            }
        }
    };
    
    this.fillBlack = function(){
        var fir = this.blackFill.fir;
        var sec = this.blackFill.sec;
        this.blackFace.v1.set(fir[0][0], fir[0][1]);
        this.blackFace.v2.set(fir[fir.length-1][0],fir[fir.length-1][1]);
        this.blackFace.v3.set(sec[sec.length-1][0],sec[sec.length-1][1]);
        this.blackFace.v4.set(sec[0][0], sec[0][1]);
        this.blackFace.fill(colors.black);
        this.blackFace.printEdge();
        this.blackFill = {fir:[], sec:[]};
        this.blackFillFace.id = -1;
        this.blackFillFace.pid = -1;        
    };
    
    this.blackFillCorr = function(face, dist){
        if(this.distance(face.v1) > dist ) this.addToBlackFace(face, face.v1);
        if(this.distance(face.v2) > dist ) this.addToBlackFace(face, face.v2);
        if(this.distance(face.v3) > dist ) this.addToBlackFace(face, face.v3);
        if(this.distance(face.v4) > dist ) this.addToBlackFace(face, face.v4);        
    };
    
    this.addToBlackFace = function(face, point){
        if(this.blackFillFace.id === -1){
            this.blackFillFace.id = face.parentId;
            this.blackFillFace.pid = this.getNeigh(face.parentId).parall;
        }        
        if(this.blackFillFace.id === face.parentId){
            this.blackFill.fir.push([point.x, point.y]);            
        }
        else if(this.blackFillFace.pid === face.parentId){
            this.blackFill.sec.push([point.x, point.y]);     
        }  
    };
    
    this.sort = function(){
        var sortX = function(a, b){if (a[0] < b[0]) return -1;if (a[0] > b[0]) return 1; return 0;};
        var sortY = function(a, b){if (a[1] < b[1]) return -1;if (a[1] > b[1]) return 1; return 0;};
        this.blackFill.fir.sort(sortX);
        this.blackFill.sec.sort(sortX);
        if(this.blackFill.fir[0][0] === this.blackFill.fir[this.blackFill.fir.length-1][0]){
            this.blackFill.fir.sort(sortY);
            this.blackFill.sec.sort(sortY);
        }        
    };
    
    this.distance = function(point){
        var faceNorm = this.getFace(this.faceNormal);
        var index = faceNorm.normal.z < 0 
                    ? this.getNeigh(this.faceNormal).parall 
                    : this.faceNormal;
        var nor = this.getFace(index).normal;//A, B, C
        var poi = this.getFace(index).v1; //Xo, Yo, Zo
        return Math.abs(nor.x * point.x + nor.y * point.y + nor.z * point.z
                       +nor.x * poi.x + nor.y * poi.y + nor.z * poi.z)/ 
                       Math.sqrt(nor.x * nor.x + nor.y * nor.y + nor.z * nor.z);
    };

    this.nearestVertex = function () {
        var max = {x:-10, y:-10, z:-10};
        var min = {x: 10, y: 10, z: 10};
        
        for (var i = 0; i < this.walls.length; i++) {
            var face = this.walls[i][0];
            max.x = Math.max(face.v1.x, face.v2.x, face.v3.x, face.v4.x, max.x);
            max.y = Math.max(face.v1.y, face.v2.y, face.v3.y, face.v4.y, max.y);
            max.z = Math.max(face.v1.z, face.v2.z, face.v3.z, face.v4.z, max.z);
            
            min.x = Math.min(face.v1.x, face.v2.x, face.v3.x, face.v4.x, min.x);
            min.y = Math.min(face.v1.y, face.v2.y, face.v3.y, face.v4.y, min.y);
            min.z = Math.min(face.v1.z, face.v2.z, face.v3.z, face.v4.z, min.z);
        }
        this.extrema.max.setV(max);
        this.extrema.min.setV(min);
        return this.extrema.max.z;
    };

    this.rotatePart = function () {
        if (this.dragDirection === -1 && dragPart.len() > 10) {
            this.setDragDirection();
            this.faceNormal = this.choseNormalFace();
            if (this.faceNormal !== -1) {
                var face = this.getFace(this.faceNormal);
                var v1 = face.v1.toVector(face.v4);
                rotatePartAxis.setV(v1.crossProduct(face.v1.toVector(face.v2)));
                rotatePartAxis.norm();
                rotatePartMatrix.updateMatrix(rotatePartAxis, rotatePartAngle* DE);
                this.checkElementToRotate();
            }            
        }
        else if(this.clickFacesIndex !==-1){
            rotatePartMatrix.updateMatrix(rotatePartAxis, rotatePartAngle * DE);
            for(var i =0; i<this.elementRotate.length; i++){
                var index = this.elementRotate[i];
                this.walls[index[0]][1][index[1]].rotate(rotatePartMatrix);
            }
        }
    };
    
    this.setDragDirection = function(){
        if(this.clickFacesIndex === -1) return false;
        var face = this.getFace(this.clickFacesIndex);
        var angle = dragPart.angle2D();
        var angle1 = face.horizontalVector.angle2D();
        var angle2 = face.verticalVector.angle2D();
        
        var dAngle = angle2-angle1;
        dAngle = dAngle < 0 ? dAngle + 2*PI : dAngle;
        
        var g1 = angle1 + 0.5*(dAngle);
        var g2 = g1+PI2;        
        var g3 = g1+2*PI2;     
        var g4 = g1+3*PI2;  
       
        if(this.isBetween(angle, g4, g1))      this.moveTo =4;
        else if(this.isBetween(angle, g1, g2)) this.moveTo =1;
        else if(this.isBetween(angle, g2, g3)) this.moveTo =3;
        else if(this.isBetween(angle, g3, g4)) this.moveTo =2;
        
        if      (this.isBetween(angle, PI4,   3*PI4)) this.dragDirection = 1;
        else if (this.isBetween(angle, 3*PI4, 5*PI4)) this.dragDirection = 3;
        else if (this.isBetween(angle, 5*PI4, 7*PI4)) this.dragDirection = 2;
        else                                          this.dragDirection = 4; 
    };
    
    this.isBetween = function(angle, start, stop){
        if (start < 0   ) start+=2*PI;
        if (start > 2*PI) start-=2*PI;
        if (stop  < 0   ) stop +=2*PI;
        if (stop  > 2*PI) stop -=2*PI;
        
        if(start <= stop) return start <= angle && angle <= stop;
        if(start >  stop) return start <  angle || angle <  stop;
    };

   
    this.checkElementToRotate = function(){
        var index = this.clickElementIndex;
        var face = this.clickFacesIndex;
        var move = this.moveTo;
        this.elementRotate = [];
        
        if(([3,4].indexOf(move) !== -1) && face < 4){
            this.pushZX(index);
        }
        else if (([1,2].indexOf(move) !== -1)
                && ([0,2,4,5].indexOf(face) !== -1)){
            index = face === 2 ? 8-index : index;
            this.pushZY(index);
        }
        else{
            if(face === 4){
                index = [6, 3, 0, 7, 4, 1, 8, 5, 2].indexOf(index);
            }
            else if(face === 3){
                index  = 8-index;
            }
            else if(face === 5){
                index = [2, 5, 8, 1, 4, 7, 0, 3, 6].indexOf(index);
            }  
            this.pushXY(index);
        }
        
    };   
    
    this.pushZX = function (index) {
        var basic = index > 2 ? (index > 5 ? 6 :3) : 0; 
        var seq = [0,1,2,3,0];        
        if(index<3) this.pushFace(4);
        if (index>5) this.pushFace(5);  
        
        for(var i =0; i<seq.length;i++){
            this.pushGroup(seq[i], basic, basic+1, basic+2);
        }

    };
    this.pushXY = function (index) {
        var col = index%3;        
        
        if(index%3 ===0) this.pushFace(0);
        if ((index+1)%3 ===0) this.pushFace(2);  
        this.pushGroup(1, col, col+3, col+6);
        this.pushGroup(4, 3*(2-col), 3*(2-col)+1, 3*(2-col)+2);
        this.pushGroup(3, 8-col, 5-col, 2-col);
        this.pushGroup(5, 3*col+2, 3*col+1, 3*col);
        this.pushGroup(1, col, col+3, col+6);

    };
    this.pushZY = function (index) {
        var col = index%3;        
        if(index%3 ===0) this.pushFace(3);
        if ((index+1)%3 ===0) this.pushFace(1);    
            this.pushGroup(0, col, col+3, col+6);
            this.pushGroup(4, col, col+3, col+6);
            this.pushGroup(2, 8-col, 5-col, 2-col);
            this.pushGroup(5, col, col+3, col+6);
            this.pushGroup(0, col, col+3, col+6);
    };    
    
   
    this.pushGroup = function(face, el1, el2, el3){
        this.elementRotate.push([face, el1]);  
        this.elementRotate.push([face, el2]);
        this.elementRotate.push([face, el3]);      
    };
    
    this.pushFace = function(face){
        for (var i = 0; i < 9; i++) {
            this.elementRotate.push([face, i]);
        }
    };
    
    this.reset = function () {
        this.dragDirection = -1; // 1-top 2-down 3-left 4-right
        this.faceNormal = -1; // Face to calculate normal vector
        this.clickFacesIndex = -1;
        this.clickElementIndex = -1;
        this.moveTo = -1;
        this.elementRotate = [];

    };

    this.choseNormalFace = function () {
        if (this.clickFacesIndex === -1) return -1;
        return this.getNeigh(this.clickFacesIndex).get(this.normalPos(this.moveTo));
    };

    this.activeFaceIndex = function (point) {
        for (var i = 0; i < this.showed.length; i++) {
            var index = this.showed[i];
            var face = this.walls[index][0];
            if (this.pointInideFace(face, point)) {
                return index;
            }
        }
        return -1;
    };

    this.activeElement = function (point) {
        if(this.clickElementIndex !==-1){
            return true;
        }
        this.clickFacesIndex = this.activeFaceIndex(point);
        if (this.clickFacesIndex === -1) {
            return false;
        }
        var elem = this.walls[this.clickFacesIndex][1];
        for (var i = 0; i < elem.length; i++) {
            if (this.pointInideFace(elem[i], point)) {
                this.clickElementIndex = i;
            }
        }
    };

    this.pointInideFace = function (face, point) {
        var linePoint1 = {x: point.x, y: point.y};
        var linePoint2 = {x: point.x + 1000, y: point.y};
        var sum = this.lineIntersection(face.v1.ctxPos(), face.v2.ctxPos(), linePoint1, linePoint2);
        sum += this.lineIntersection(face.v2.ctxPos(), face.v3.ctxPos(), linePoint1, linePoint2);
        sum += this.lineIntersection(face.v3.ctxPos(), face.v4.ctxPos(), linePoint1, linePoint2);
        sum += this.lineIntersection(face.v4.ctxPos(), face.v1.ctxPos(), linePoint1, linePoint2);
        return sum % 2;
    };

    this.lineIntersection = function (p1, p2, p3, p4){
        var s1_x = p2.x - p1.x;
        var s1_y = p2.y - p1.y;
        var s2_x = p4.x - p3.x;
        var s2_y = p4.y - p3.y;
        var s = (-s1_y * (p1.x - p3.x) + s1_x * (p1.y - p3.y)) / (-s2_x * s1_y + s1_x * s2_y);
        var t = (s2_x * (p1.y - p3.y) - s2_y * (p1.x - p3.x)) / (-s2_x * s1_y + s1_x * s2_y);
        if (s >= 0 && s <= 1 && t >= 0 && t <= 1) {
            return 1;
        }
        return 0; // No collision
    };
    
    this.rotateAnimation = function(){
        if(this.clickElementIndex === -1){
            mouse.animationProcess = false;
            rotatePartAngle = rotateEndAngle;
            this.reset();
            dragPart.set(0, 0);
            mouse.leftPress = false;
            rotateCubeAngle = 0;
            rotatePartAngle = 0;              
        }
        else if(Math.abs(rotateEndAngle - rotatePartAngle) < 1){
            mouse.animationProcess = false;
            rotatePartAngle = rotateEndAngle;
            this.transform();
            this.reset();
            dragPart.set(0, 0);
            mouse.leftPress = false;
            rotateCubeAngle = 0;
            rotatePartAngle = 0;            
        }
        else if(mouse.animationProcess){
            rotatePartAngle += angleStep;
            setTimeout(function(){cube.rotateAnimation();}, 30);
        }
        
    };
    
    this.calculateAngle = function(){
        var angle = rotatePartAngle;
        while(angle<0){
            angle+=360;
        }
        angle = angle%360;
        rotateCount = Math.round(angle/90);        
        rotateEndAngle = Math.round(rotatePartAngle/90) *90;
        angleStep  = (rotateEndAngle - rotatePartAngle)/5;        
    };
    
    this.transform = function(){
        var index = this.clickElementIndex;
        var face = this.clickFacesIndex;
        var move = this.moveTo;
        
        if(([3,4].indexOf(move) !== -1) && face < 4){
            for (var i = 0; i < rotateCount; i++) { 
                this.moveZX(index, this.moveTo === 3);
            }
        }
        else if (([1,2].indexOf(move) !== -1)
                && ([0,2,4,5].indexOf(face) !== -1)){
            var top = (move === 1);
            top = face === 2 ? !top : top;
            index = face === 2 ? 8-index : index;
                
            for (var i = 0; i < rotateCount; i++) { 
                this.moveZY(index, top);                
            }
        }
        else{
            var top = move === 1;
            if(face === 4){
                top = move === 3;
                index = [6, 3, 0, 7, 4, 1, 8, 5, 2].indexOf(index);
            }
            else if(face === 3){
                top = move === 2;
                index  = 8-index;
            }
            else if(face === 5){
                top = move === 4;
                index = [2, 5, 8, 1, 4, 7, 0, 3, 6].indexOf(index);
            }  
            for (var i = 0; i < rotateCount; i++) { 
                this.moveXY(index, top);
            }
        }
        
    };   
    
    this.moveZX = function (index, left) {
        var color = [null, null, null];
        var basic = index > 2 ? (index > 5 ? 6 :3) : 0; 
        var seq = left?[0,1,2,3,0].reverse():[0,1,2,3,0];
        
        if(index<3) this.rotateFace(4, left);
        if (index>5) this.rotateFace(5, !left);         
        
        for(var i =0; i<seq.length;i++){
            color = this.replaceGroup(seq[i], [basic, basic+1, basic+2], color);
        }

    };
    this.moveXY = function (index, top) {
        var color = [null, null, null];
        var col = index%3;        
        
        if(index%3 ===0) this.rotateFace(0, !top);
        if ((index+1)%3 ===0) this.rotateFace(2, top);         
        
        if(top){  
            color = this.replaceGroup(1, [col, col+3, col+6], color);
            color = this.replaceGroup(4, [3*(2-col), 3*(2-col)+1, 3*(2-col)+2], color);
            color = this.replaceGroup(3, [8-col, 5-col, 2-col], color);
            color = this.replaceGroup(5, [3*col+2, 3*col+1, 3*col], color);
            color = this.replaceGroup(1, [col, col+3, col+6], color);
        }
        else{
            color = this.replaceGroup(1, [col, col+3, col+6], color);
            color = this.replaceGroup(5, [3*col+2, 3*col+1, 3*col], color);
            color = this.replaceGroup(3, [8-col, 5-col, 2-col], color);
            color = this.replaceGroup(4, [3*(2-col), 3*(2-col)+1, 3*(2-col)+2], color);
            color = this.replaceGroup(1, [col, col+3, col+6], color);            
        }

    };
    this.moveZY = function (index, top) {
        var color = [null, null, null];
        var col = index%3;
        
        if(index%3 ===0) this.rotateFace(3, !top);
        if ((index+1)%3 ===0) this.rotateFace(1, top);     
        
        if(top){  
            color = this.replaceGroup(0, [col, col+3, col+6], color);
            color = this.replaceGroup(4, [col, col+3, col+6], color);
            color = this.replaceGroup(2, [8-col, 5-col, 2-col], color);
            color = this.replaceGroup(5, [col, col+3, col+6], color);
            color = this.replaceGroup(0, [col, col+3, col+6], color);
        }
        else{
            color = this.replaceGroup(0, [col, col+3, col+6], color);
            color = this.replaceGroup(5, [col, col+3, col+6], color);
            color = this.replaceGroup(2, [8-col, 5-col, 2-col], color);
            color = this.replaceGroup(4, [col, col+3, col+6], color);            
            color = this.replaceGroup(0, [col, col+3, col+6], color);            
        }
    };    
    
    this.rotateFace = function(face, clockwise){
        if(face === -1) return false;
        var seq1 = [0, 2, 8, 6, 0, 2];
        var seq2 = [1, 5, 7, 3, 1, 5];
        var len = seq1.length;
        var index1, index2, 
            color1 =null, color2 =null;
        for (var i = 0; i < len-1; i++) {
            index1 = clockwise ? seq1[i] : seq1[len-1-i];
            index2 = clockwise ? seq2[i] : seq2[len-1-i];
            color1 = this.replaceColor(face, index1, color1);
            color2 = this.replaceColor(face, index2, color2);
        }
    };
    
    this.replaceGroup = function(face, index, color){
        return [
            this.replaceColor(face, index[0], color[0]),
            this.replaceColor(face, index[1], color[1]),
            this.replaceColor(face, index[2], color[2])
        ];
    };
    
    this.replaceColor = function(face, index, newColor){  
        var color = this.walls[face][1][index].color;
        this.walls[face][1][index].color = newColor;
        return color;
    };
    
    this.setVariableToShake = function(index, element, drag){
        this.clickFacesIndex = index;
        this.clickElementIndex = element;
        this.dragDirection = drag;
        this.moveTo = drag;
        this.faceNormal = this.choseNormalFace();
        var face = this.getFace(this.faceNormal);
        var v1 = face.v1.toVector(face.v4);
        var v2 = face.v1.toVector(face.v2);
        var v = v1.crossProduct(v2);
        rotatePartAxis.setV(v);
        rotatePartAxis.norm();
        rotatePartMatrix.updateMatrix(rotatePartAxis, rotatePartAngle* DE);
        this.checkElementToRotate();
    };
    
    this.printShadow = function(){        
        var pos = this.shadow.scale({x:0, y:-1.2*D, z:0});        
        var rX = this.extrema.max.x*scale;
        var rY = 0.1*this.extrema.max.z*scale;
        for (var i = 0; i < 20; i++) {
            ctx.beginPath();
            ctx.fillStyle = 'rgba(100, 100, 100, 0.1)';
            ctx.ellipse(pos.x, pos.y,rX-i*rX/25 ,rY-i*rY/25, 0, 0, 2*PI, 1);
            ctx.fill();
            
        }
    };  
}

function Face(v1, v2, v3, v4, color, id, pId) {
    this.v1 = v1;
    this.v2 = v2;
    this.v3 = v3;
    this.v4 = v4;
    this.verticalVector = new Vector(v1.x - v4.x, v1.y - v4.y, v1.z - v4.z);
    this.horizontalVector = new Vector(v2.x - v1.x, v2.y - v1.y, v2.z - v1.z);
    this.angle = 0;
    this.color = color;
    this.id = id || 0;
    this.parentId = pId;
    this.show = true;
    this.normal = new Vector();
    this.setNormal = function(){
        var v1 = this.v1.toVector(this.v4);
        var v2 = this.v1.toVector(this.v2);
        this.normal.setV(v1.crossProduct(v2));        
    };
    this.showToggle = function(){
        this.setNormal();
        this.show = this.normal.z > 0 ?true:false;
    };
    this.average = function () {
            return {x :(this.v1.x + this.v2.x + this.v3.x + this.v4.x) / 4,
                    y : (this.v1.y + this.v2.y + this.v3.y + this.v4.y) / 4,
                    z : (this.v1.z + this.v2.z + this.v3.z + this.v4.z) / 4};
        
    };  

    this.rotate = function (rotateCubeMatrix) {
        this.v1.rotate(rotateCubeMatrix);
        this.v2.rotate(rotateCubeMatrix);
        this.v3.rotate(rotateCubeMatrix);
        this.v4.rotate(rotateCubeMatrix);
        this.verticalVector.set(v1.x - v4.x, v1.y - v4.y, v1.z - v4.z);
        this.horizontalVector.set(v2.x - v1.x, v2.y - v1.y, v2.z - v1.z);
        this.showToggle();
    };
    this.update = function () {
        this.v1.updatePos();
        this.v2.updatePos();
        this.v3.updatePos();
        this.v4.updatePos();
    };
    this.printEdge = function () {
        if(this.show){
            ctx.beginPath();
            ctx.strokeStyle = colors.line;
            ctx.lineWidth = lineWidth;
            ctx.lineCap = 'round';
            ctx.lineJoin = "round";
            ctx.moveTo(this.v1.ctxPos().x, this.v1.ctxPos().y);
            ctx.lineTo(this.v2.ctxPos().x, this.v2.ctxPos().y);
            ctx.lineTo(this.v3.ctxPos().x, this.v3.ctxPos().y);
            ctx.lineTo(this.v4.ctxPos().x, this.v4.ctxPos().y);
            ctx.lineTo(this.v1.ctxPos().x, this.v1.ctxPos().y);
            ctx.stroke();
        }
    };

    this.fill = function (color) {
        if(this.show){
            ctx.beginPath();
            ctx.fillStyle = color || colors.line;
            ctx.moveTo(this.v1.ctxPos().x, this.v1.ctxPos().y);
            ctx.lineTo(this.v2.ctxPos().x, this.v2.ctxPos().y);
            ctx.lineTo(this.v3.ctxPos().x, this.v3.ctxPos().y);
            ctx.lineTo(this.v4.ctxPos().x, this.v4.ctxPos().y);
            ctx.lineTo(this.v1.ctxPos().x, this.v1.ctxPos().y);
            ctx.fill();
            color || this.fillRound();
        }
    };
    
    this.fillRound = function(){
        var edge1 = this.v2.subtract(this.v1);
        var edge2 = this.v3.subtract(this.v2);
        var edge3 = this.v4.subtract(this.v3);
        var edge4 = this.v1.subtract(this.v4);
        
        var v1_1 = this.v4.add(edge4.multiply(1-radius));
        var v1_2 = this.v1.add(edge1.multiply(radius));
        
        var v2_1 = this.v1.add(edge1.multiply(1-radius));
        var v2_2 = this.v2.add(edge2.multiply(radius));
        
        var v3_1 = this.v2.add(edge2.multiply(1-radius));
        var v3_2 = this.v3.add(edge3.multiply(radius));
        
        var v4_1 = this.v3.add(edge3.multiply(1-radius));
        var v4_2 = this.v4.add(edge4.multiply(radius));
        
        ctx.beginPath();
        ctx.fillStyle = this.color;
        
        ctx.moveTo(v1_2.ctxPos().x, v1_2.ctxPos().y);
        ctx.lineTo(v2_1.ctxPos().x, v2_1.ctxPos().y);
        ctx.quadraticCurveTo(this.v2.ctxPos().x, this.v2.ctxPos().y,
                v2_2.ctxPos().x, v2_2.ctxPos().y);
        ctx.lineTo(v3_1.ctxPos().x, v3_1.ctxPos().y);
        ctx.quadraticCurveTo(this.v3.ctxPos().x, this.v3.ctxPos().y,
                v3_2.ctxPos().x, v3_2.ctxPos().y);
        ctx.lineTo(v4_1.ctxPos().x, v4_1.ctxPos().y);
        ctx.quadraticCurveTo(this.v4.ctxPos().x, this.v4.ctxPos().y,
                v4_2.ctxPos().x, v4_2.ctxPos().y);
        ctx.lineTo(v1_1.ctxPos().x, v1_1.ctxPos().y);
        ctx.quadraticCurveTo(this.v1.ctxPos().x, this.v1.ctxPos().y,
                v1_2.ctxPos().x, v1_2.ctxPos().y);
        ctx.fill();
                
    };

}

function Point(x, y, z) {
    this.x = x || 0;
    this.y = y || 0;
    this.z = z || 0;
    this.set = function(x, y, z){
        if(typeof x === 'number'){
            this.x = x || 0;
            this.y = y || 0;
            this.z = z || 0;
        }
        else{
            this.x = x.x;
            this.y = x.y;
            this.z = x.z;
            
        }
    };
    this.distance = function(point){
        return Math.sqrt(Math.pow(point.x-this.x,2) + Math.pow(point.y-this.y,2));
    };
}

function Vector(x, y, z) {
    this.x = x || 0;
    this.y = y || 0;
    this.z = z || 0;
    this.pos = new Point(x, y, z);
    this.angle2D = function () {
        var a = Math.atan2(this.y, this.x);        
        return a>0?a:2*PI+a;
    };
    this.ctxPos = function () {
        return this.scale(this);
    };
    this.scale = function(point){
        return {x: centerX + point.x * scale, y: centerY - point.y * scale};
    };
    this.rotate = function (rotateCubeMatrix) {
        this.setCurrentPos(rotateCubeMatrix.dotProduct(this.pos));
    };
    this.len = function () {
        return Math.sqrt(Math.pow(this.x, 2) + Math.pow(this.y, 2) + Math.pow(this.z, 2));
    };
    this.norm = function () {
        var len = this.len();
        this.x /= len;
        this.y /= len;
        this.z /= len;
    };
    this.dotProduct = function (vector) {
        return this.x * vector.x
             + this.y * vector.y
             + this.z * vector.z;
    };
    this.crossProduct = function (vector) {
        return new Vector(this.y * vector.z - vector.y * this.z,
                          this.z * vector.x - vector.z * this.x,
                          this.x * vector.y - vector.x * this.y);
    };
    this.set = function (x, y, z) {
        this.x = x || 0;
        this.y = y || 0;
        this.z = z || 0;
    };
    this.setV = function (vector) {
        this.setCurrentPos(vector);
    };
    this.setCurrentPos = function (point) {
        this.x = point.x;
        this.y = point.y;
        this.z = point.z;
    };
    this.setStartPoss = function (point) {
        this.pos.x = point.x;
        this.pos.y = point.y;
        this.pos.z = point.z;
    };
    this.updatePos = function () {
        this.pos.x = this.x;
        this.pos.y = this.y;
        this.pos.z = this.z;
    };
    this.toVector = function (vector) {
        return new Vector(vector.x - this.x,
                        vector.y - this.y,
                        vector.z - this.z);
    };
    this.add = function(vector){
        return new Vector(vector.x + this.x,
                        vector.y + this.y,
                        vector.z + this.z);
    };
    this.subtract = function(vector){
        return new Vector(this.x -vector.x,
                          this.y- vector.y,
                          this.z -vector.z);
    };
    this.multiply = function(scalar){
        return new Vector(scalar * this.x, scalar * this.y, scalar * this.z);
    };
    this.str = function(){
        return " x: " + this.x + " y: " + this.y + " z: " + this.z;
    };
    

}

/**
 * 
 * @param {type} v1 Vector first row of matrix 
 * @param {type} v2 Vector second row of matrix
 * @param {type} v3 Vector third row of matrix
 * @returns {Matrix} 
 */
function Matrix(v1, v2, v3) {
    this.v1 = v1;
    this.v2 = v2;
    this.v3 = v3;

    this.result = new Point();
    this.dotProduct = function (vector) {
        this.result.x = this.v1.x * vector.x + this.v1.y * vector.y + this.v1.z * vector.z;
        this.result.y = this.v2.x * vector.x + this.v2.y * vector.y + this.v2.z * vector.z;
        this.result.z = this.v3.x * vector.x + this.v3.y * vector.y + this.v3.z * vector.z;
        return this.result;
    };
}


/**
 * 
 * @param {type} v1
 * @param {type} v2
 * @param {type} v3
 * @returns {RotateMatrix}
 */
function RotateMatrix(v1, v2, v3) {
    Matrix.call(this, v1, v2, v3);

    this.updateMatrix = function (rotateAxis, angle) {
        var c = cos(angle);
        var s = sin(angle);
        var t = 1 - c;
        var x = rotateAxis.x;
        var y = rotateAxis.y;
        var z = rotateAxis.z;
        this.v1.set(t * x * x + c, t * x * y - z * s, t * x * z + y * s);
        this.v2.set(t * x * y + z * s, t * y * y + c, t * y * z - x * s);
        this.v3.set(t * x * z - y * s, t * y * z + x * s, t * z * z + c);
    };

}

RotateMatrix.prototype = Object.create(Matrix.prototype);
RotateMatrix.prototype.constructor = RotateMatrix;


function Neighbor(t, b, l, r, p) {
    this.top = t;
    this.bottom = b;
    this.left = l;
    this.right = r;
    this.parall = p;
    this.get = function (id) {
        if (id === 1)
            return this.top;
        if (id === 2)
            return this.bottom;
        if (id === 3)
            return this.left;
        if (id === 4)
            return this.right;
    };
}

function createWall(v1, v3, color, pId) {
    var dx = (v3.x - v1.x) / 3;
    var dy = (v3.y - v1.y) / 3;
    var dz = (v3.z - v1.z) / 3;
    var squares = [];
    if (dx === 0) {
        for (var i = 0; i < 3; i++) {
            for (var j = 0; j < 3; j++) {
                var sv1 = new Vector(v1.x, v1.y + i * dy, v1.z + j * dz);
                var sv2 = new Vector(v1.x, v1.y + i * dy, v1.z + (1 + j) * dz);
                var sv3 = new Vector(v1.x, v1.y + (1 + i) * dy, v1.z + (1 + j) * dz);
                var sv4 = new Vector(v1.x, v1.y + (1 + i) * dy, v1.z + j * dz);                
                squares.push(new Face(sv1, sv2, sv3, sv4, color, (i * 3) + j, pId));
            }
        }
    }
    if (dy === 0) {
        for (var i = 0; i < 3; i++) {
            for (var j = 0; j < 3; j++) {
                var sv1 = new Vector(v1.x + j * dx, v1.y, v1.z + i * dz);
                var sv2 = new Vector(v1.x + (1 + j) * dx, v1.y, v1.z + i * dz);
                var sv3 = new Vector(v1.x + (1 + j) * dx, v1.y, v1.z + (1 + i) * dz);
                var sv4 = new Vector(v1.x + j * dx, v1.y, v1.z + (1 + i) * dz);
                squares.push(new Face(sv1, sv2, sv3, sv4, color || randomColor(), (i * 3) + j, pId));
            }
        }
    }
    if (dz === 0) {
        for (var i = 0; i < 3; i++) {
            for (var j = 0; j < 3; j++) {
                var sv1 = new Vector(v1.x + j * dx, v1.y + i * dy, v1.z);
                var sv2 = new Vector(v1.x + (1 + j) * dx, v1.y + i * dy, v1.z);
                var sv3 = new Vector(v1.x + (1 + j) * dx, v1.y + (1 + i) * dy, v1.z);
                var sv4 = new Vector(v1.x + j * dx, v1.y + (1 + i) * dy, v1.z);
                squares.push(new Face(sv1, sv2, sv3, sv4,  color ||randomColor(), (i * 3) + j, pId)); //color ||
            }
        }
    }
    return squares;
}

function randomColor() {
    var letters = '0123456789ABCDEF'.split('');
    var color = '#';
    for (var i = 0; i < 6; i++) {
        color += letters[Math.floor(Math.random() * 16)];
    }
    return color;
}

function cos(angle) {
    return Math.cos(angle);
}

function sin(angle) {
    return Math.sin(angle);
}

function hexToRgba(hex, a) {
    hex = hex.replace("#", '');
    var bigint = parseInt(hex, 16);
    var r = (bigint >> 16) & 255;
    var g = (bigint >> 8) & 255;
    var b = bigint & 255;

    return "rgba(" + r + ", " + g + ", " + b + ", " + (a || 1) + ")";
}

document.addEventListener("DOMContentLoaded", init);
window.addEventListener("resize", resize);

function resize() {
    canvasHeight = window.innerHeight;
    canvasWidth = window.innerWidth;
    centerX = canvasWidth / 2;
    centerY = canvasHeight / 2;
    canvas.height = canvasHeight;
    canvas.width = canvasWidth;
    scale = Math.round((canvasHeight<canvasWidth?canvasHeight:canvasWidth)*0.08-6);
    scale = Math.min(Math.max(scale, 5), 55);
    colors.bgGradient = ctx.createLinearGradient(0,0,0,canvasHeight);
    colors.bgGradient.addColorStop(0,colors.bg1);
    colors.bgGradient.addColorStop(.66,colors.bg2);
    colors.bgGradient.addColorStop(.75,colors.bg3);
    colors.bgGradient.addColorStop(.85,colors.bg2);
    colors.bgGradient.addColorStop(1,colors.bg1);
    startFontSize = scale * 4;
    if(scale > 40) lineWidth = 4;
    else if(scale > 30) lineWidth = 3;
    else if(scale > 20) lineWidth = 2;
    else lineWidth = 1;
    
}

function init(){
    canvas = document.getElementById('cubic');   
    ctx = canvas.getContext('2d'); 
    if(typeof ctx.ellipse === 'function'){
        supportElipse = true;
    }
    resize();
    setInfoELement();
    scaleMax = scale;
    scale = 2;
    setInterval(draw, 50);    
    zoom();      
}

function setInfoELement() {
    var w = 0.25*canvasWidth+"px";
    var h = (4/3.3 *0.25*canvasWidth)+"px";
    document.getElementById('info').style.width = w;
    document.getElementById('info').style.height =h;
    document.getElementById('info').style.backgroundSize = w + " " + h;
}

function zoom(){
    if(scale<scaleMax){
        rotateCubeAngle+=1;
        scale+=2;
        setTimeout(zoom, 50);
    }
    else{
        cube.updatePosition();
        rotateCubeAngle=0;
        10?shake():start();
    }
}

function shake(){
    if(shakeCount < shakeRepetCount){
        shakeCount++;
        var rep = randInt(1, 4);
        shakeAngleEnd = rep * 90;   
        shakeAngleStep= shakeAngleEnd/10;         
        cube.setVariableToShake(randInt(0,6), randInt(0,9), randInt(1,5));
        mouse.shakeProcess = true;        
        shakeRotate();        
    }
    else{
        mouse.shakeProcess = false;
        start();
    }
}

function shakeRotate() {
    if(Math.abs(rotatePartAngle - shakeAngleEnd)>1){
        rotatePartAngle += shakeAngleStep;       
        setTimeout(shakeRotate, 50);
    }else{
        rotatePartAngle = shakeAngleEnd;
        cube.calculateAngle();
        cube.transform();
        cube.reset();
        rotatePartAngle = 0;
        setTimeout(shake, 200);
    }
}

function countdown() {
    if(rotatePartAngle !== 0){
        var procent = Math.abs(rotatePartAngle - shakeAngleEnd)/shakeAngleEnd;
        ctx.font = ((2-procent)*startFontSize)+"px Comic Sans MS";
        ctx.fillStyle = "rgba(70,70,70,"+(procent)+")";
        ctx.textAlign = "center";
        ctx.textBaseline = "middle";
        ctx.fillText(shakeRepetCount - shakeCount +1, centerX, centerY);
    }
}

function randInt(start, stop){
    return Math.floor(Math.random()*(stop-start))+start;
}

function start() {
    document.getElementById('info').classList.add('hidden');
    document.addEventListener('mouseup', mouseUp);
    canvas.addEventListener('mousedown', mouseDown);
    canvas.addEventListener('mouseup', mouseUp);
    canvas.addEventListener('mousemove', mouseMove);
}

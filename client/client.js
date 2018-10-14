//#region Website Design
var user = "";
var warning = document.getElementById("warning-text");
var canvas = document.getElementById("ctx");
canvas.width = window.innerWidth - 8;
canvas.height = window.innerHeight - 2;
var fullscreen = document.getElementById("fullscreen");
var b_lockscreen = document.getElementById("lockscreen");
var WIDTH = window.innerWidth - 8;
var HEIGHT = window.innerHeight - 2;
var socket = io();
var elem = document.documentElement;
var togglescreen = false;
var cam_y = 0;
var cam_x = 0;
var signedin = false;
var refreshrate = 100;
function Warning(text){
    warning.innerHTML = '<div>' + text + '</div>';
}
function Lockscreen() {
    if (lockscreen === true){
        b_lockscreen.style.backgroundColor=  "white"		
        b_lockscreen.style.color="black"
        lockscreen = false;	
    }
    else{
        
        b_lockscreen.style.backgroundColor= "#4CAF50"			
        b_lockscreen.style.color= "white"
        lockscreen = true;
    }
    b_lockscreen.blur();
}
function openFullscreen() {
    if (togglescreen === false) {
        togglescreen = true;
        fullscreen.style.backgroundColor= "#4CAF50"			
        fullscreen.style.color= "white"	
        if (elem.requestFullscreen) {
            elem.requestFullscreen();
        } else if (elem.mozRequestFullScreen) { /* Firefox */
            elem.mozRequestFullScreen();
        } else if (elem.webkitRequestFullscreen) { /* Chrome, Safari and Opera */
            elem.webkitRequestFullscreen();
        } else if (elem.msRequestFullscreen) { /* IE/Edge */
            elem.msRequestFullscreen();
        }

    }
    else {
        fullscreen.style.backgroundColor=  "white"		
        fullscreen.style.color="black"
        if (document.exitFullscreen) {
            document.exitFullscreen();
        } else if (document.mozCancelFullscreen) { /* Firefox */
            document.mozCancelFullScreen();
        } else if (document.webkitExitFullscreen) { /* Chrome, Safari and Opera */
            document.webkitExitFullscreen();
        } else if (document.msExitFullscreen) { /* IE/Edge */
            document.msExitFullscreen();
        }
        togglescreen = false;
    }
    fullscreen.blur();
}

window.onload = window.onresize = function () {

    canvas.width = window.innerWidth;
    canvas.height = window.innerHeight;
    WIDTH = window.innerWidth;
    HEIGHT = window.innerHeight;
}
//#endregion

//#region Sign in
var signDiv = document.getElementById('signDiv');
var signDivUsername = document.getElementById('signDiv-username');
var signDivSignIn = document.getElementById('signDiv-signIn');
var signDivSignUp = document.getElementById('signDiv-signUp');
var signDivPassword = document.getElementById('signDiv-password');

signDivSignIn.onclick = function () {
    if (signDivPassword.value.length == 0)
        Warning("Give a password!");
    else {
        socket.emit('signIn', { username: signDivUsername.value, password: signDivPassword.value });
        user = signDivUsername.value;
    }
}
signDivSignUp.onclick = function () {
    if (signDivPassword.value.length == 0)
        Warning("Give a password!");
    else
        socket.emit('signUp', { username: signDivUsername.value, password: signDivPassword.value });
}
socket.on('signInResponse', function (data) {
    if (data.success) {
        signDiv.style.display = 'none';
        gameDiv.style.display = 'inline-block';
        chatText.innerHTML += '<div>' + "Welcome back! " + user + '</div>';
        signedin = true;
    } else
    Warning("Double-check!");
});
socket.on('signUpResponse', function (data) {
    if (data.success) {
        Warning("Hooray! Successful creation!");
    } else
        Warning("Oh no! The username is taken");
});
//#endregion

//#region Chat
var chatText = document.getElementById('chat-text');
var chatInput = document.getElementById('chat-input');
var chatForm = document.getElementById('chat-form');

socket.on('addToChat', function (data) {
    chatText.innerHTML += '<div>' + data + '</div>';
    chatText.scrollTop = chatText.scrollHeight;
});
socket.on('evalAnswer', function (data) {
    console.log(data);
});


chatForm.onsubmit = function (e) {
    e.preventDefault();
    if (chatInput.value[0] === '/')
        socket.emit('evalServer', chatInput.value.slice(1));
    else if (chatInput.value.length > 0) {
        chatInput.blur();
        socket.emit('sendMsgToServer', chatInput.value);
        chatInput.value = '';
    }
}
//#endregion

//#region Resource collection
var Img = {};
Img.player_left = new Image();
Img.player_left.src = '/client/img/player-left.png';
Img.player_right = new Image();
Img.player_right.src = '/client/img/player-right.png';
Img.bullet = new Image();
Img.bullet.src = '/client/img/bullet.png';

Img.map = {};
Img.map['field'] = new Image();
Img.map['field'].src = '/client/img/map.png';
Img.map['forest'] = new Image();
Img.map['forest'].src = '/client/img/map2.png';
Img.map['grass'] = new Image();
Img.map['grass'].src = '/client/img/grass.jpg';
Img.map['forest1'] = new Image();
Img.map['forest1'].src = '/client/img/forest1.png';
Img.map['forest2'] = new Image();
Img.map['forest2'].src = '/client/img/forest2.png';
//#endregion

//#region Text Caching
var ctx = document.getElementById("ctx").getContext("2d");
ctx.font = '30px Arial';

function measureText(text, fontSize, fontFamily) {
    var w, h, div = measureText.div || document.createElement('div');
    div.style.font = fontSize + 'px/' + fontSize + 'px ' + fontFamily;
    div.style.padding = '0';
    div.style.margin = '0';
    div.style.position = 'absolute';
    div.style.visibility = 'hidden';
    div.innerHTML = text;
    if (!measureText.div) document.body.appendChild(div);
    w = div.clientWidth;
    h = div.clientHeight;
    measureText.div = div;
    return { width: w, height: h };
}
//#endregion

//#region Camera Movement	
var updateCamera = function () {
    if (lockscreen === false) {
        if (Player.list[selfId].x - cam_x > WIDTH * 0.7) {
            cam_x = Player.list[selfId].x - (WIDTH * 0.7);


        }
        if (Player.list[selfId].x - cam_x < WIDTH * 0.3) {
            cam_x = Player.list[selfId].x - (WIDTH * 0.3);

        }
    }
    else
        cam_x = Player.list[selfId].x - WIDTH/2;
    
        if (Player.list[selfId].y< 1700 - HEIGHT * 0.8) 
            cam_y = Player.list[selfId].y - (HEIGHT * 0.2);
        else
        cam_y = 1700 - HEIGHT;
}
//#endregion

//#region Object Player Initialization
var Player = function (initPack) {
    var self = {};
    self.id = initPack.id;
    self.number = initPack.number;
    self.x = initPack.x;
    self.y = initPack.y;
    self.hp = initPack.hp;
    self.hpMax = initPack.hpMax;
    self.score = initPack.score;
    self.map = initPack.map;
    self.username = initPack.username;
    self.counter = 0;
    self.frame = 0;
    self.animation = "idle";
    self.startFrame = 1.0;
    self.endFrame = 4.0;
    self.frameTime = 100;
    self.direction = 1;
    self.animationOld = "idle"
    self.combo = 0;
    var textBuffer = document.createElement('canvas');
    var text = self.username;
    var fontSize = 20;
    var fontFamily = 'Courier-New';
    var m = measureText(text, fontSize, fontFamily);
    textBuffer.width = m.width+20;
    textBuffer.height = m.height;
    var temp = textBuffer.getContext('2d');
    temp.font = fontSize + 'px/' + fontSize + 'px ' + fontFamily;
    temp.textBaseline = 'middle';
    temp.fillStyle="rgba(0,0,0,0.6)";
    temp.fillRect(0,0,m.width+20,m.height)
    temp.fillStyle='white';
    temp.fillText(text, 10, m.height / 2 - 2);
    //#endregion

//#region Object Player Animation
    self.animationMiddle =function (startFrames,endFrames,frameTimes){
        self.counter = 0;
        self.startFrame = startFrames;
        self.endFrame = endFrames;
        self.frameTime = frameTimes;
    }

    self.animationHandler = function(){
    if(self.animation != self.animationOld || self.animation == "attack")
    {
    switch(self.animation)
    {
    case("idle"):
    self.animationMiddle(0,4,175);
    break;
    case("walking"):
    self.animationMiddle(8,14,100);
    break;
    case("jumping"):
    self.animationMiddle(16,22,100);
    break;
    case("falling"):
    self.animationMiddle(22,24,100);
    break;
    case("attack"):
    self.animationMiddle(97+self.combo,97+self.combo,33);
    break;
    }
    self.animationOld = self.animation;
    }
}
    //#endregion

//#region Object Player Update and Drawing
    self.update= function(){
        self.animationHandler();
        self.draw();
    }

    self.draw = function () {
        if(self.endFrame != self.startFrame)
        {
        self.counter = (self.counter+((1000/refreshrate)/self.frameTime))%(self.endFrame-self.startFrame);
        self.frame = self.startFrame + self.counter;
        }
        else
        {
        self.frame = self.startFrame;
        }
        var x = self.x - cam_x;
        var y = self.y - cam_y;
        //hp bar
        var hpWidth = 30 * self.hp / self.hpMax;
        ctx.fillStyle = 'red';
        ctx.fillRect(x - hpWidth / 2, y - 40, hpWidth, 4);
        //name
        ctx.drawImage(textBuffer, x - (m.width / 2) - 10, y + 50);
        //sprite
        var framesPerRow = 7;
        var numberOfRows= 16;
        var width = 50;
        var height = 37;
        var col = Math.floor(self.frame/framesPerRow);
        var row = Math.floor(self.frame%framesPerRow);
        if(self.direction == -1){
        ctx.drawImage(Img.player_left,
        (framesPerRow-row-1)*width , col*height, width, height,	
            x - width, y - height, width*2.2, height*2.2);
        }
        else{
            ctx.drawImage(Img.player_right,
            row*width , col*height, width, height,	
            x - width-4, y - height, width*2.2, height*2.2);
        }

        //ctx.fillText(self.score,self.x,self.y-60);
    }

    Player.list[self.id] = self;


    return self;
}
Player.list = {};

 //#endregion

//#region Object bullet
var Bullet = function (initPack) {
    var self = {};
    self.id = initPack.id;
    self.x = initPack.x;
    self.y = initPack.y;
    self.map = initPack.map;

    self.draw = function () {
        if (Player.list[selfId].map !== self.map)
            return;
        var width = Img.bullet.width / 2;
        var height = Img.bullet.height / 2;

        var x = self.x - cam_x;
        var y = self.y - cam_y;

        ctx.drawImage(Img.bullet,
            0, 0, Img.bullet.width, Img.bullet.height,
            x - width / 2, y - height / 2, width, height);
    }

    Bullet.list[self.id] = self;
    return self;
}
Bullet.list = {};
//#endregion

//#region Packets
var selfId = null;

socket.on('init', function (data) {
    if (data.selfId)
        selfId = data.selfId;
    //{ player : [{id:123,number:'1',x:0,y:0},{id:1,number:'2',x:0,y:0}], bullet: []}
    for (var i = 0; i < data.player.length; i++) {
        new Player(data.player[i]);
    }
    for (var i = 0; i < data.bullet.length; i++) {
        new Bullet(data.bullet[i]);
    }
});

socket.on('update', function (data) {
    //{ player : [{id:123,x:0,y:0},{id:1,x:0,y:0}], bullet: []}
    for (var i = 0; i < data.player.length; i++) {
        var pack = data.player[i];
        var p = Player.list[pack.id];
        if (p) {
            if (pack.x !== undefined)
                p.x = pack.x;
            if (pack.y !== undefined)
                p.y = pack.y;
            if (pack.hp !== undefined)
                p.hp = pack.hp;
            if (pack.score !== undefined)
                p.score = pack.score;
            if (pack.animation !== undefined)
                p.animation = pack.animation;
            if (pack.direction !== undefined)
                p.direction = pack.direction;
            if (pack.combo !== undefined)
                p.combo = pack.combo;
                
        }
    }
    for (var i = 0; i < data.bullet.length; i++) {
        var pack = data.bullet[i];
        var b = Bullet.list[data.bullet[i].id];
        if (b) {
            if (pack.x !== undefined)
                b.x = pack.x;
            if (pack.y !== undefined)
                b.y = pack.y;
        }
    }
});

socket.on('remove', function (data) {
    //{player:[12323],bullet:[12323,123123]}
    for (var i = 0; i < data.player.length; i++) {
        delete Player.list[data.player[i]];
    }
    for (var i = 0; i < data.bullet.length; i++) {
        delete Bullet.list[data.bullet[i]];
    }
});

socket.on('changeMap', function (data) {
    Player.list[selfId].map = data
});
//#endregion

//#region Update
setInterval(function () {
    if (!selfId)
        return;
    ctx.clearRect(0, 0, WIDTH, HEIGHT);
    updateCamera();
    drawMap();
    drawScore();
    for (var i in Player.list)
        Player.list[i].update();
    for (var i in Bullet.list)
        Bullet.list[i].draw();
}, 1000/refreshrate);
//#endregion

//#region Map drawing
var drawMap = function () {
    var player = Player.list[selfId];
    var x = -cam_x;
    var y = -cam_y;
    var multiplier = Math.floor(-x / 1200);
    ctx.drawImage(Img.map[player.map], x, y-40);

}
 //#endregion 

//#region draw Score
var drawScore = function () {
    ctx.fillStyle = 'white';
    ctx.fillText(Player.list[selfId].score, 0, 30);
}
 //#endregion

//#region KeyInput
document.onkeydown = function (event) {

    if (chatInput != document.activeElement) {
        // Invalid... Box is empty
        if (event.keyCode === 68)	//d
            socket.emit('keyPress', { inputId: 'right', state: true });
        else if (event.keyCode === 83)	//s
            socket.emit('keyPress', { inputId: 'down', state: true });
        else if (event.keyCode === 65) //a
            socket.emit('keyPress', { inputId: 'left', state: true });
        else if (event.keyCode === 87 || event.keyCode === 32) // w
            socket.emit('keyPress', { inputId: 'up', state: true });
        else if (event.keyCode === 13) {
            chatInput.focus();
        }


    }

}
 
document.onkeyup = function (event) {
    if (event.keyCode === 68)	//d
        socket.emit('keyPress', { inputId: 'right', state: false });
    else if (event.keyCode === 83)	//s
        socket.emit('keyPress', { inputId: 'down', state: false });
    else if (event.keyCode === 65) //a
        socket.emit('keyPress', { inputId: 'left', state: false });
    else if (event.keyCode === 87 || event.keyCode === 32) // w
        socket.emit('keyPress', { inputId: 'up', state: false });

}

document.onmousedown = function (event) {
    socket.emit('keyPress', { inputId: 'attack', state: true });
}
document.onmouseup = function (event) {
    socket.emit('keyPress', { inputId: 'attack', state: false });
}
document.onmousemove = function (event) {
    if (signedin === true) {
        var x = cam_x - Player.list[selfId].x + event.clientX - 8;
        var y = cam_y - Player.list[selfId].y + event.clientY - 8;
        var angle = Math.atan2(y, x) / Math.PI * 180;
        socket.emit('keyPress', { inputId: 'mouseAngle', state: angle });
    }
}

document.oncontextmenu = function (event) {
    event.preventDefault();
}

//#endregion
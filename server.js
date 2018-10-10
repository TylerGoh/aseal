//#region initialization
var MongoClient = require('mongodb').MongoClient;
var url = "mongodb+srv://tyler:tyler@testproject-h7nqf.mongodb.net/test?retryWrites=true";
var express = require('express');
var app = express();
var serv = require('http').Server(app);
const client = new MongoClient(url,{ useNewUrlParser: true });
var account;
var refreshrate = 100;

client.connect(function (err) {
    account = client.db("PassTest").collection("Account");
    console.log('Successful connection');
});


app.get('/', function (req, res) {
    res.sendFile(__dirname + '/client/index.html');
});
app.use('/client', express.static(__dirname + '/client'));

serv.listen(80);
console.log("Server started.");

var SOCKET_LIST = {};
//#endregion 


//#region Object Entity
var Entity = function (param) {
    var self = {
        width:50*2.2,
        height:37*2.2,
        x: 250,
        y: 250,
        spdX: 0,
        spdY: 0,
        id: "",
        map: 'forest'
    };
    if (param) {
        if (param.x)
            self.x = param.x;
        if (param.y)
            self.y = param.y;
        if (param.map)
            self.map = param.map;
        if (param.id)
            self.id = param.id;
    }

    self.update = function () {
        self.updatePosition();
    };
    self.updatePosition = function () {
        self.x += self.spdX / refreshrate;
        self.y += self.spdY / refreshrate;
    };
    self.getDistance = function (pt) {
        return Math.sqrt(Math.pow(self.x - pt.x, 2) + Math.pow(self.y - pt.y, 2));
    };
    return self;
};
//#endregion


//#region Player:Entity
var Player = function (param) {
    //#region Player:Initialization
    var self = Entity(param);
    self.username = param.username;
    self.number = "" + Math.floor(10 * Math.random());
    self.onGround = false;
    self.pressingRight = false;
    self.pressingLeft = false;
    self.pressingUp = false;
    self.pressingDown = false;
    self.pressingAttack = false;
    self.mouseAngle = 0;
    self.maxSpd = 300;
    self.jumpSpd = 1000;
    self.direction = 1;
    self.animation = "";
    self.hp = 10;
    self.hpMax = 10;
    self.score = 0;
    self.cooldown = 0;
    self.gravity = 2000;
    self.combo = 0;
    self.queueAttack = false;
    self.isWalking = false;
    self.isAttacking = false;
    self.stunDuration = 0;
    var super_update = self.update;
    //#endregion
    //#region Player:Update
    self.update = function () {
        self.updateSpd();
        self.updateCd();
        self.updateAnim();
        super_update();

        if (self.pressingAttack || self.queueAttack) {
            self.basicattack();
            self.isAttacking = true;
        }
        else if(self.cooldown == 0)
        {
        self.combo = 0;
        self.isAttacking = false;
        }
    };
    //#endregion
    //#region Player:Attack
    self.basicattack = function(){
        if(self.cooldown === 0)
        {
            self.cooldown = 0.1*refreshrate;
            self.combo = (self.combo+1)%12;
            self.animation = "attack";
            self.queueAttack = false;
            if(self.combo % 3 == 2)
            self.damage();
        }
        else
        self.queueAttack=true;

    }
    self.damage = function(){
        console.log(self.combo);
        for (var i in Player.list) {
            var p = Player.list[i];
            if (self.map === p.map && self.getCollision(p) === true && self.id !== p.id) {
                p.hp -= 1;
                if(self.combo == 8)
                {
                p.onGround = false;
                p.spdX=500*self.direction
                p.spdY=-1200
                p.stunDuration= 0.5*refreshrate;
                }
                if (p.hp <= 0) {
                    p.hp = p.hpMax;
                    p.x = Math.random() * 500;
                    p.y = Math.random() * 500;
                    p.onGround = false;
                }
            }
    }
}
    self.getCollision =function(pt){
        if((pt.y + pt.height/2) > self.y && (pt.y - pt.height)<self.y && (pt.x - self.x)*self.direction < 70 && (pt.x - self.x)*self.direction > -20)
        return true;
        else
        return false;
    }
    //#endregion
    //#region Player:Bullet
    self.shootBullet = function (angle) {
        if (self.cooldown === 0) {
            self.cooldown = 0.2*refreshrate;
            Bullet({
                velocity: 1000,
                parent: self.id,
                angle: angle,
                x: self.x,
                y: self.y,
                map: self.map
            });
        }
    };
    //#endregion
    //#region Animation 

    self.updateAnim =function(){
        if(self.spdX>0 && self.stunDuration == 0)
        {
            self.direction = 1;
        }
        else if(self.spdX<0 && self.stunDuration == 0){
            self.direction = -1;
        }
        if(self.isAttacking == false)
        {
        if(self.spdX>0)
        {
            self.isWalking = true;
        }
        else if(self.spdX<0){
            self.isWalking = true;
        }
        else
        {
            self.isWalking=false;
            self.animation="idle";
        }
        if (self.spdY<0)
        {
            self.animation="jumping"
        }
        if (self.spdY>0)
        {
            self.animation="falling"
        }
        if(self.isWalking==true && self.onGround==true)
        {
            self.animation="walking";
        }
        if(self.stunDuration>0)
        {
            self.animation="idle";
        }
    }
    }
    //#endregion
    //#region Update
    self.updateCd = function () {
        if(self.cooldown > 0)
        self.cooldown--;
        if(self.stunDuration > 0)
        self.stunDuration--;
    };
    self.updateSpd = function () {
        if (self.y > 900) {
            self.y = 900;
            self.spdY = 0;
            self.onGround = true;
        }
        //gravity//
        if (self.onGround === false) self.spdY += self.gravity/refreshrate;
        if (self.pressingRight && self.stunDuration == 0)
            self.spdX = self.maxSpd;
        else if (self.pressingLeft && self.stunDuration == 0)
            self.spdX = -self.maxSpd;
        else if (self.stunDuration == 0)
            self.spdX = 0;
        if (self.pressingUp && self.onGround && self.stunDuration == 0)
        { 
        self.spdY = -self.jumpSpd;
        self.onGround = false;
    }
    };

    self.getInitPack = function () {
        return {
            id: self.id,
            x: self.x,
            y: self.y,
            number: self.number,
            hp: self.hp,
            hpMax: self.hpMax,
            score: self.score,
            animation:self.animation,
            direction:self.direction,
            map: self.map,
            username: self.username,
            combo:self.combo
        };
    };
    self.getUpdatePack = function () {
        return {
            id: self.id,
            animation:self.animation,
            direction:self.direction,
            x: self.x,
            y: self.y,
            hp: self.hp,
            score: self.score,
            combo:self.combo
            
        };
        
    };

    Player.list[self.id] = self;

    initPack.player.push(self.getInitPack());
    return self;
    //#endregion
};
 //#endregion


//#region Player Data Input
Player.list = {};
Player.onConnect = function (socket,username) {
    var listCount = 0;  
    for (var i in SOCKET_LIST)
    listCount++;
    console.log(listCount + " people currently in server");
    //checking
    var map = 'grass';
    var player = Player({
        id: socket.id,
        map: map,
        username: username
       
    });
    socket.on('keyPress', function (data) {
        if (data.inputId === 'left')
            player.pressingLeft = data.state;
        else if (data.inputId === 'right')
            player.pressingRight = data.state;
        else if (data.inputId === 'up')
            player.pressingUp = data.state;
        else if (data.inputId === 'down')
            player.pressingDown = data.state;
        else if (data.inputId === 'attack')
            player.pressingAttack = data.state;
        else if (data.inputId === 'mouseAngle')
            player.mouseAngle = data.state;
    });

    socket.on('sendMsgToServer', function (data) {
        for (var i in SOCKET_LIST) {
            SOCKET_LIST[i].emit('addToChat', player.username + ': ' + data);
        }
    });

    socket.emit('init', {
        selfId: socket.id,
        player: Player.getAllInitPack(),
        bullet: Bullet.getAllInitPack()
    });
};
Player.getAllInitPack = function () {
    var players = [];
    for (var i in Player.list)
        players.push(Player.list[i].getInitPack());
    return players;
};

Player.onDisconnect = function (socket) {
    delete Player.list[socket.id];
    removePack.player.push(socket.id);
};
Player.update = function () {
    var pack = [];
    for (var i in Player.list) {
        var player = Player.list[i];
        player.update();
        pack.push(player.getUpdatePack());
    }
    return pack;
};
//#endregion


//#region Object Bullet
var Bullet = function (param) {
    var self = Entity(param);
    self.id = Math.random();
    self.velocity = param.velocity;
    self.angle = param.angle;
    self.spdX = Math.cos(param.angle / 180 * Math.PI) * self.velocity;
    self.spdY = Math.sin(param.angle / 180 * Math.PI) * self.velocity;
    self.parent = param.parent;

    self.timer = 0;
    self.toRemove = false;
    var super_update = self.update;
    self.update = function () {
        if (self.timer++ > 0.5*refreshrate)
            self.toRemove = true;
        super_update();

        for (var i in Player.list) {
            var p = Player.list[i];
            if (self.map === p.map && self.getDistance(p) < 32 && self.parent !== p.id) {
                p.hp -= 1;

                if (p.hp <= 0) {
                    var shooter = Player.list[self.parent];
                    if (shooter)
                        shooter.score += 1;
                    p.hp = p.hpMax;
                    p.x = Math.random() * 500;
                    p.y = Math.random() * 500;
                }
                self.toRemove = true;
            }
        }
    };
    self.getInitPack = function () {
        return {
            id: self.id,
            x: self.x,
            y: self.y,
            map: self.map,
            username: self.username
        };
    };
    self.getUpdatePack = function () {
        return {
            id: self.id,
            x: self.x,
            y: self.y
        };
    };

    Bullet.list[self.id] = self;
    initPack.bullet.push(self.getInitPack());
    return self;
};
//#endregion


//#region Bullet Packet
Bullet.list = {};

Bullet.update = function () {
    var pack = [];
    for (var i in Bullet.list) {
        var bullet = Bullet.list[i];
        bullet.update();
        if (bullet.toRemove) {
            delete Bullet.list[i];
            removePack.bullet.push(bullet.id);
        } else
            pack.push(bullet.getUpdatePack());
    }
    return pack;
};

Bullet.getAllInitPack = function () {
    var bullets = [];
    for (var i in Bullet.list)
        bullets.push(Bullet.list[i].getInitPack());
    return bullets;
};
//#endregion


//#region Login and Logout
var isValidPassword = function (data, cb) {
    account.find({ username: data.username, password: data.password }).toArray(function (err, res) {
        if (res.length > 0)
            cb(true);
        else
            cb(false);
    });
};
var isUsernameTaken = function (data, cb) {
    account.find({ username: data.username }).toArray(function (err, res) {
        if (res.length > 0)
            cb(true);
        else
            cb(false);
    });
};
var addUser = function (data, cb) {
    account.insert({ username: data.username, password: data.password }, function (err) {
        cb();
    });
};

var io = require('socket.io')(serv, {});
io.sockets.on('connection', function (socket) {
    socket.id = Math.random();
    SOCKET_LIST[socket.id] = socket;

    socket.on('signIn', function (data) {
        isValidPassword(data, function (res) {
            if (res) {
                console.log("Sign in from " + data.username);
                Player.onConnect(socket, data.username);
                socket.emit('signInResponse', { success: true });
            } else {
                socket.emit('signInResponse', { success: false });
            }
        });
    });
    socket.on('signUp', function (data) {
        isUsernameTaken(data, function (res) {
            if (res) {
                socket.emit('signUpResponse', { success: false });
            } else {
                addUser(data, function () {
                    socket.emit('signUpResponse', { success: true });
                });
            }
        });
    });


    socket.on('disconnect', function () {
        delete SOCKET_LIST[socket.id];
        var listCount = 0;  
        for (var i in SOCKET_LIST)
        listCount++;
        console.log(listCount + " people currently in server");
        Player.onDisconnect(socket);
        
    });



});

var initPack = { player: [], bullet: [] };
var removePack = { player: [], bullet: [] };
//#endregion


//#region Pulse
setInterval(function () {
    var pack = {
        player: Player.update(),
        bullet: Bullet.update()
    };
    for (var i in SOCKET_LIST) {
        var socket = SOCKET_LIST[i];
        socket.emit('init', initPack);
        socket.emit('update', pack);
        socket.emit('remove', removePack);
    }
    initPack.player = [];
    initPack.bullet = [];
    removePack.player = [];
    removePack.bullet = [];

}, 1000 / refreshrate);
//#endregion










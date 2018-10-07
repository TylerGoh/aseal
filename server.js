var MongoClient = require('mongodb').MongoClient;
var url = "mongodb+srv://tyler:tyler@testproject-h7nqf.mongodb.net/test?retryWrites=true";
var express = require('express');
var app = express();
var serv = require('http').Server(app);
const client = new MongoClient(url);
var account;

client.connect(function (err) {
    account = client.db("PassTest").collection("Account");
    console.log('Successful connection');
});


app.get('/', function (req, res) {
    res.sendFile(__dirname + '/client/index.html');
});
app.use('/client', express.static(__dirname + '/client'));

serv.listen(process.env.PORT || 1337);
console.log("Server started.");

var SOCKET_LIST = {};

var Entity = function (param) {
    var self = {
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
        self.x += self.spdX;
        self.y += self.spdY;
    };
    self.getDistance = function (pt) {
        return Math.sqrt(Math.pow(self.x - pt.x, 2) + Math.pow(self.y - pt.y, 2));
    };
    return self;
};

var Player = function (param) {
    var self = Entity(param);
    self.jumpSpd = 45;
    self.username = param.username;
    self.number = "" + Math.floor(10 * Math.random());
    self.onGround = false;
    self.pressingRight = false;
    self.pressingLeft = false;
    self.pressingUp = false;
    self.pressingDown = false;
    self.pressingAttack = false;
    self.mouseAngle = 0;
    self.maxSpd = 10;
    self.hp = 10;
    self.hpMax = 10;
    self.score = 0;
    self.cooldown = 0;
    console.log(param.username);
    var super_update = self.update;
    self.update = function () {
        self.updateSpd();
        self.updateCd();
        super_update();

        if (self.pressingAttack) {
            self.shootBullet(self.mouseAngle);
        }
    };
    self.shootBullet = function (angle) {
        if (self.cooldown === 0) {
            self.cooldown = 10;
            Bullet({
                parent: self.id,
                angle: angle,
                x: self.x,
                y: self.y,
                map: self.map
            });
        }
    };

    self.updateCd = function () {
        if(self.cooldown > 0)
        self.cooldown--;
    };
    self.updateSpd = function () {
        if (self.y > 600) {
            self.y = 600;
            self.spdY = 0;
            self.onGround = true;
        }
        if (self.onGround === false) self.spdY += 3;
        if (self.pressingRight)
            self.spdX = self.maxSpd;
        else if (self.pressingLeft)
            self.spdX = -self.maxSpd;
        else
            self.spdX = 0;

        if (self.pressingUp && self.onGround)
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
            map: self.map,
            username: self.username
        };
    };
    self.getUpdatePack = function () {
        return {
            id: self.id,
            x: self.x,
            y: self.y,
            hp: self.hp,
            score: self.score
        };
    };

    Player.list[self.id] = self;

    initPack.player.push(self.getInitPack());
    return self;
};
Player.list = {};
Player.onConnect = function (socket,username) {
    var map = 'grass';
    console.log(username + "registered");
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


var Bullet = function (param) {
    var self = Entity(param);
    self.id = Math.random();
    self.angle = param.angle;
    self.spdX = Math.cos(param.angle / 180 * Math.PI) * 30;
    self.spdY = Math.sin(param.angle / 180 * Math.PI) * 30;
    self.parent = param.parent;

    self.timer = 0;
    self.toRemove = false;
    var super_update = self.update;
    self.update = function () {
        if (self.timer++ > 20)
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
                    p.onGround = false;
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

var DEBUG = true;

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
        console.log('Sign in request');
        isValidPassword(data, function (res) {
            if (res) {
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
        Player.onDisconnect(socket);
    });


    socket.on('evalServer', function (data) {
        if (!DEBUG)
            return;
        var res = eval(data);
        socket.emit('evalAnswer', res);
    });



});

var initPack = { player: [], bullet: [] };
var removePack = { player: [], bullet: [] };


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

}, 1000 / 25);











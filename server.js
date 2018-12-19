//#region initialization
var fs = require('fs');
var MongoClient = require('mongodb').MongoClient;
var url = "mongodb+srv://tyler:tyler@testproject-h7nqf.mongodb.net/test?retryWrites=true";
var express = require('express');
var app = express();
var serv = require('http').Server(app);
const client = new MongoClient(url, { useNewUrlParser: true });
var account;
refreshrate = 100;
updaterate = 50;
var read = fs.readFileSync('maps/maps.json')
map = JSON.parse(read);
tilesize = 48;
require('./entity');
require('./client/Inventory');


client.connect(function (err) {
    account = client.db("PassTest").collection("Account");
    console.log('Successful connection');
});


app.get('/rpg', function (req, res) {
    res.sendFile(__dirname + '/client/index.html');
});
app.get('/orbit', function (req, res) {
    res.sendFile(__dirname + '/client/orbit.html');
});
app.use('/client', express.static(__dirname + '/client'));

serv.listen(80);
console.log("Server started.");

SOCKET_LIST = {};
LocalPlayer = {};
Player.list = {};
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

initPack = { player: [], bullet: [] };
removePack = { player: [], bullet: [] };

//#endregion


//#region Pulse
setInterval(function () {
    for (var map in LocalPlayer)
    {
    var pack = {
        player: Player.getPack(map),
        bullet: Bullet.update()
    };
    for (var i in LocalPlayer[map]) {
        var socket = SOCKET_LIST[i];
        socket.emit('init', initPack);
        socket.emit('update', pack);
        socket.emit('remove', removePack);
    }
    initPack.player = [];
    initPack.bullet = [];
    removePack.player = [];
    removePack.bullet = [];
    }
}, 1000 / updaterate);

setInterval(function () {
    Player.update();

}, 1000 / refreshrate);
//#endregion









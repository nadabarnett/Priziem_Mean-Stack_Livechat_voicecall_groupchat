//const HTTP_PORT = 80;
//const HTTPS_PORT = 443;
const express = require('express');
const config = require('../config.std');
const fs = require('fs');
const http = require('http');
const https = require('https');
const uuidv4 = require('uuid/v4');
const forceSsl = require('express-force-ssl');
const path = require('path');
const formidable = require('formidable');
const resolvePath = require('resolve-path');

//---------------------------------------------------------------//
// connected clients
var clients = {};
var connections = {};
var teams = [];
// teams.push({action:"create_team",public:"on",team:"Public",name:"Public",collab:[],creator:"#public"});
//---------------------------------------------------------------//

// Certificate
const options = {
    key: fs.readFileSync(config.server.key, 'utf8'),
    cert: fs.readFileSync(config.server.cert, 'utf8')
};

var app = express();

app.use(express.static(__dirname, { dotfiles: 'allow' } ));

// the public directory
var webAppDir = path.join(__dirname, '../desktop');

// app.use(forceSsl);
// app.set('forceSSLOptions', {
//     enable301Redirects: true,
//     trustXFPHeader: false,
//     httpsPort: 443,
//     sslRequiredMessage: 'SSL Required.'
// });
app.use('/', express.static(__dirname + '/../desktop'));
app.get('/*', function(req, res){
    console.log("/",req.url)
    var webAppUrl = resolvePath(webAppDir, req.url);
    console.log('WebApp URL: ' + webAppUrl);
    res.sendFile(webAppUrl);
});
app.get('/socket.io/*', function(req, res){
    console.log("/socket.io/"+req.url)
    var webAppUrl = resolvePath(webAppDir, req.url);
    console.log('WebApp URL: ' + webAppUrl);
    res.sendFile(webAppUrl);
});
//----------------------------------------------------------------------//
//----------------------------------------------------------------------//
//----------------------------------------------------------------------//
// upload
app.post('/upload', function(req, res) {
    console.log('upload');
    var outfilename = "";
    // create an incoming form object
    var form = new formidable.IncomingForm();
    // specify that we want to allow the user to upload multiple files in a single request
    form.multiples = true;
    // store all uploads in the /uploads directory
    form.uploadDir = path.join(__dirname, '/../desktop/uploads');
    console.log(form.uploadDir);
    if (!fs.existsSync(form.uploadDir)){
        fs.mkdirSync(form.uploadDir);
    }
    // every time a file has been uploaded successfully,
    // rename it to it's orignal name
    form.on('file', function(field, file) {
        outfilename = Date.now() + '_' + file.name;
        console.log(outfilename);
        fs.rename(file.path, path.join(form.uploadDir, outfilename),function(err){
            if( err ) throw err;
            console.log('Rename complete!');
        });
    });
    // log any errors that occur
    form.on('error', function(err) {
        res.json({result:0,name:'fail'});
        console.log('An error has occured: \n' + err);
    });
    // once all the files have been uploaded, send a response to the client
    form.on('end', function() {
        res.end(outfilename);
    });
    // parse the incoming request containing the form data
    form.parse(req);
});
//----------------------------------------------------------------------//
//----------------------------------------------------------------------//
//----------------------------------------------------------------------//

var httpServer = http.createServer(app);
var httpsServer = https.createServer(options, app);
httpsServer.listen(config.server.httpsPort, function() {
    console.log((new Date()) + ' HTTPS: Server is listening on port ' + config.server.httpsPort);
});
httpServer.listen(config.server.httpPort, function() {
    console.log((new Date()) + ' HTTP: Server is listening on port ' + config.server.httpPort);
});

//---------------------------------------------------------------//
//---------------------------------------------------------------//
//---------------------------------------------------------------//
var default_team = "Public";

var io = require('socket.io').listen(httpsServer);
// var io = require('socket.io').listen(httpServer);
var getTeamMembers = function(team) {
    var counts = 0;
    if( !io.sockets.adapter.rooms[team] ) {
        counts = 0;
    }
    else {
        counts = io.sockets.adapter.rooms[team].length;
    }
    return counts;
}
io.sockets.on('connection', function (socket) {
    var id = uuidv4();
    connections[id] = socket;
    clients[id] = {};
    console.log("socket connected " + id)
    socket.emit('connection',{id:id});
    sendClients(socket,"");

    // disconnect 
    socket.on('disconnect', function () {
        console.log("socket disconnected " + id)
        socket.leave(default_team);
        if(clients[id].isPresenter)
        {
            socket.broadcast.to(default_team).emit('message',{action:'stopStreaming',data:id,type:1,team:clients[id].team})
        }
        let team = clients[id].team;
        delete connections[id];
        delete clients[id];
        sendClients(socket,team);

        // updateTeams();

    });
    socket.on('message', function (ms) {
        var team = ms.team;
        console.log( ms );
        switch(ms.action) {
            case 'login':
                delete ms['action'];
                clients[id] = ms;
                clients[id].isPresenter = false;
                socket.emit('message',{action:'uuid',data:id});

                io.sockets.emit('message',{action:'login',id:id});

                sendTeams(socket);
                
                break;
            case 'join_team':
                socket.join(team);
                
                var counts = getTeamMembers(team);
                console.log("room count = " + counts );

                clients[id].team = team;
                ms.id = id;
                socket.broadcast.to(team).emit('message',ms);
                sendClients(socket,team);
                break;
            case 'leave_team':
                socket.leave(team);
                clients[id].isPresenter = false;
                ms.id = id;
                socket.broadcast.to(team).emit('message',ms);
                sendClients(socket,team);

                // var counts = getTeamMembers(team);
                // console.log("room count = " + counts );
                // updateTeams();

                break;
            case 'create_team':
                ms.team = ms.name;
                io.sockets.emit('message',ms);
                teams.push(ms);
                break;
            case 'remove_team':
                ms.team = ms.name;
                for( idx = 0; idx < teams.length; idx++ ) {
                    if( teams[idx].team == ms.team ) 
                        break;
                }
                if( idx != teams.length ) {
                    teams.splice( udx,1 );
                }
                io.sockets.emit('message',ms);
                break;
            case 'create_collab':
                var idx = -1
                for( idx = 0; idx < teams.length; idx++ ) {
                    if( teams[idx].team == ms.team ) 
                        break;
                }
                if( idx == teams.length )
                    break;
                var i;
                console.log( teams[idx]);
                for( i = 0; i < teams[idx].collab.length; i++ ) {
                    if( teams[idx].collab[i].url == ms.url ) 
                        break;
                }
                if( i ==  teams[idx].collab.length) {
                    teams[idx].collab.push( ms );
                    io.sockets.emit('message',ms);
                }
                break;
            case 'rename_collab':
                var idx = -1
                for( idx = 0; idx < teams.length; idx++ ) {
                    if( teams[idx].team == ms.team ) 
                        break;
                }
                if( idx == teams.length )
                    break;
                var i;
                for( i = 0; i < teams[idx].collab.length; i++ ) {
                    if( teams[idx].collab[i].url == ms.url ) 
                        break;
                }
                if( i !=  teams[idx].collab.length) {
                    teams[idx].collab[i].name = ms.name;
                    io.sockets.emit('message',ms);
                }
                break;
            case 'remove_collab':
                var idx = -1
                for( idx = 0; idx < teams.length; idx++ ) {
                    if( teams[idx].team == ms.team ) 
                        break;
                }
                if( idx == teams.length )
                    break;
                var i;
                for( i = 0; i < teams[idx].collab.length; i++ ) {
                    if( teams[idx].collab[i].url == ms.url ) 
                        break;
                }
                if( i !=  teams[idx].collab.length) {
                    teams[idx].collab.splice(i,1);
                }
                io.sockets.emit('message',ms);

                break;
            case 'relay':
                ms.from = id;
                if( connections[ms.to] == undefined ) {
                    console.log("undefined:" + ms.to);
                    break;
                }
                connections[ms.to].emit('message',ms);
                break;
            case 'readyToStream':
            case 'stopStreaming':
            case 'wbSync':
                ms.data = id;
                switch( ms.action ) {
                    case 'readyToStream':
                        clients[id].isPresenter = true;
                        sendClients(socket,team);
                        break;
                    case 'stopStreaming':
                        clients[id].isPresenter = false;
                        sendClients(socket,team);
                        break;
                    case 'wbSync':
                        // if((!!ms.sync && !!ms.sync.clear) || (ms.data.type=='undo-all'))
                        // {
                        //     wbSync=[];
                        //     console.log('clear wbSync');
                        // }
                        // else
                        // {
                        //     wbSync.push(ms);
                        //     console.log('pushing to wbSync');
                        // }
                        break;
                }
                socket.broadcast.to(team).emit('message',ms);

                break;
            case 'ice':
            case 'sdp':
            case 'sendMeOffer':
                ms.data=id;
                connections[ms.to].emit('message',ms);
                break;
            case 'text':
                ms.from = id;
                socket.broadcast.to(team).emit('message',ms);
                break;
            case 'startVoice':
            case 'stopVoice':
                ms.from = id;
                socket.broadcast.to(team).emit('message',ms);
                break;
        }
    })
})
//---------------------------------------------------------------//
//---------------------------------------------------------------//
//---------------------------------------------------------------//

function sendClients(socket,team) {
    var data=[];
    for(var uid in clients) {
        var client = clients[uid];
        if( client.team != team )
            continue;
        client.uid = uid;
        data.push(client);
    }
    socket.broadcast.to(team).emit('message',{action:'clients',data:data});
    socket.emit('message',{action:'clients',data:data});
}

function sendTeams(socket) {
    for( var idx = 0; idx < teams.length; idx++ ) {
        socket.emit('message',teams[idx]);
    }

    for( var idx = 0; idx < teams.length; idx++ ) {
        for( var i = 0; i < teams[idx].collab.length; i++ ) {
            socket.emit('message',teams[idx].collab[i]);
            console.log(teams[idx].collab[i]);
        }
    }
}

function updateTeams() {
    for( var idx = 0; idx < teams.length; ) {
        if( getTeamMembers(teams[idx].name) == 0 ) {
            var team = teams[idx].name;
            io.sockets.emit('message',{action:'remove_team',team:team});
            teams.splice(idx,1);
            continue;
        }
        idx++;
    }    
}
// var shell = require('shelljs');
// // const collab_server = require('../collab_server/node/server.js')
// if (shell.exec('node ../collab_server/node/server.js').code !== 0) {
//     shell.echo('Error: Run Collab server');
//     shell.exit(1);
//   }

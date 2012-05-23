var app = require('http').createServer(handler)
  , io = require('socket.io').listen(app)
  , fs = require('fs')

app.listen(8888);

function handler (req, res) {
  fs.readFile(__dirname + '/index.html',
  function (err, data) {
    if (err) {
      res.writeHead(500);
      return res.end('Error loading index.html');
    }

    res.writeHead(200);
    res.end(data);
  });
}


var players = {};
var rooms = new Array();
var ri=0;
var pi = 0;

io.set('log level', false);

io.sockets.on('connection', function (socket) {
  
  
  var np = {
		  	id: socket.id,
		  	username: '',
		  	bussy: false
	 		}

  players[socket.id] = np;


  socket.emit('id',{id:socket.id,pi:pi,users:players});



  socket.on('letsplay',function (data){

  	

    if(players[data.oponent])
    {
    	if(players[data.oponent].bussy)
    	{
    		socket.emit('ups',{code:0})
    		return;
    	}
    }
    else
    { 
      console.log('Plyers: \n 1-> '+data.oponent+'\n '+socket.id+'2-> '+data.me);
       io.sockets.socket(socket.id).emit('letu');
       io.sockets.emit('useroff',{id:data.oponent,users:players});
      return;
    }

  		setStatus({
	  				p1:data.oponent,
	  				p2:data.me
	  			},true);
  	

  	var room = 
  	{
  		player1: data.oponent,
  		player2: data.me
  	}
  	
  	rooms.push(room);

  	ri = rooms.length -1;


	 io.sockets.socket(data.oponent).emit('invite',{opp:data.me,p:0});
  });

	socket.on('figure',function (data){
		io.sockets.socket(data.oponent).emit('choosedf',data.fig);
	});

  	socket.on('move',function (data){
		  	io.sockets.socket(data.oponent).emit('moved',data.coords);
	});

  socket.on('iwin',function(data){
    io.sockets.socket(data.o).emit('ulose',data.op);
  });

  socket.on('setusername',function (data){
    console.log('\n\nUsuario: ',players[data.id],'\nNombre de usuario: ',data.username)
    
    if(players[data.id] && data.username)
      players[data.id].username = data.username;
    
    io.sockets.emit('newuser',{tnew:players[data.id],all:players});
  });

  socket.on('unloaduser', function (data) {
  	console.log("Usuario desconectado: " + data.id)
    delete players[data.id]; 
    io.sockets.emit('useroff',{id:data.id,users:players});
  });

  socket.on('requeat',function(data){
      io.sockets.socket(data.o).emit('invite',{opp:data.m,p:1});
  });

  socket.on('leave',function(data)
  {
    setStatus({
        p1:data.o,
        p2:data.s},
        false);
    io.sockets.socket(data.o).emit('letu');
  });

/*
  socket.on('disconnect', function (data) 
  {
    console.log("Usuario desconectado2: " + data.id);
    delete players[data.id]; 
    io.sockets.emit('useroff',{id:data.id,users:players});
  });*/


});



function setStatus(data,status)
{
  console.log('\n\nUsuario1: ',players[data.p1],'Usuario2: ',players[data.p2]);

  io.sockets.emit('userCstatus',{p:data.p1,s:status});
  io.sockets.emit('userCstatus',{p:data.p2,s:status});

  if(players[data.p1])
	 players[data.p1].bussy = status;
  else
    io.sockets.emit('useroff',{id:data.p1,users:players});

  if(players[data.p2])
    players[data.p2].bussy = status;
  else
    io.sockets.emit('useroff',{id:data.p2,users:players});
}

var waiting = true;
var myf = 'x';
var iid=0,pii=0;
var avusers = {};
var loadedusers = -1;
var oponente;
var oppname = '';
var musername;
var mvs = 0;
var wol = false;
var logictoe = [['-','-','-'],['-','-','-'],['-','-','-']];
var playingmode = false;

var mysocket = io.connect('http://vp1.quodgraphic.com:8888');
//var mysocket = io.connect('http://localhost:8888');

mysocket.on('ups',function(data){
		
		console.log(data);
		switch(data.code)
		{
			case 0: // Usuario Ocupado
				$('#notifications').fadeIn().html('<span class="noti">'+oppname+' no se encuentra disponible</span>');
				setTimeout('resetNotifications()',4000);
			break;
			case 1: 
			break:
			default:
				showInfobox('Error en la Aplicación, recarga la página');
			break;
		}

	})

mysocket.on('id',function (data){
	iid = data.id;
	avusers = data.users;
});


mysocket.on('newuser', function(data){
	loadedusers++;
	avusers = data.all;

	if(loadedusers)
		$('<article id="'+data.tnew.id+'" class="player"><span>'+data.tnew.username+'</span></article>').appendTo('#players');
	else
		for(i in avusers) 
		{
			if(avusers[i].username !== '' && avusers[i].bussy === false)
			{
				$('<article id="'+avusers[i].id+'" class="player"><span>'+avusers[i].username+'</span></article>').appendTo('#players');
			}
		}
	hideInfobox();
	confPlayer();
});

mysocket.on('useroff',function(data){

	if(playingmode && data.id === oponente)
		mysocket.emit('leave',{o:oponente,s:iid});

	$('#'+data.id).fadeOut('fast',function(){
		$('#'+data.id).remove();
	});

	avusers = data.users;
});

mysocket.on('userCstatus',function(data){
	if(data.s)
		$('#'+data.o).hide();
	else
		$('#'+data.o).show();
});

mysocket.on('invite',function(data){

	changeStage();

	if(data.p)
	{
		hideInfobox();
		$('#gops,#stage').fadeOut();
		resetDash();
	}

	oponente = data.opp;
	oppname = avusers[oponente].username;
	

	$('#setF').fadeIn().children('h2').css('font-size','1em').html(oppname+' te ha invitado a jugar. <br /> Selecciona tú figura');
	$('#setF a').on('click',function(e){
		e.preventDefault();	
		var ops = $(this).attr('class');

		if(ops === 'xo')
		{	
			mysocket.emit('leave', {o:oponente,s:oponente});
			leaveGame();
			return;
		}

		myf = ops;
		var info = {oponent:oponente,fig:ops}
		mysocket.emit('figure',info);
		waiting = true;
		$('#statusBar #playername').text('Oponente: ' + oppname);
		$('#statusBar #status').text('Estado: Es el turno de ' + oppname);
		$('#statusBar .leavea').text('Salir de la partida');
		document.title = 'Jugando con '+oppname+' || Gato/Tic-tac-toe/Triqui/etc by RND';
		ready2play();
	});

	playingmode = true;

});

mysocket.on('letu',function(){
	$('#notifications').fadeIn().html('<span class="noti">'+oppname+' abandonó la partida</span>');
	leaveGame();
	resetDash();
	setTimeout("resetNotifications()",5000);
});

function resetNotifications()
{
	$('#notifications').text('').fadeOut();
}

mysocket.on('choosedf',function(data){
	hideInfobox();
	ready2play();
	playingmode = true;
	waiting = false;
	$('#statusBar #status').text('Estado: Tu turno');
	if(data === 'x')
		myf = 'o';
	else
		myf = 'x';
});

mysocket.on('moved',function(data){
	setReponse(data);
});

mysocket.on('ulose',function(data){
	wol = true;
	var msg;

	if(data)
		msg = 'Empate';
	else
		msg = 'Haz Perdido';

	showInfobox(msg);
	gameover();
});

$(function (){

	$('.square').on('click',function (){
		
		var sqelf = $(this);

		if(waiting || sqelf.css('background-image') !== 'none')
			return;
		
		sqelf.addClass('used');
		sqelf.css('background','url(http://vp1.quodgraphic.com/gato/img/g'+myf+'.png) 16px 16.2px no-repeat');
		waiting = true;

		sendMove(sqelf.attr('id'));
	});

	$('.leavea').on('click',function (e)
	{	
		e.preventDefault();
		mysocket.emit('leave', {o:oponente,s:oponente});
		leaveGame();
	});

	$('#setUsername').on('submit',function (e){
		e.preventDefault();

		var me = $(this).children('#name').val();
		musername = me;
		if(check_availability(me))
		   $(this).children('#name').val('Usuario no disponible, intenta con otro');
		else
		{
			$('#setUsername').fadeOut('fast',function (){
				$('#players').fadeIn('fast');
			});
			mysocket.emit('setusername',{id: iid,username:me});
			document.title = 'Cuarto de Jugadores || Gato/Tic-tac-toe/Triqui/etc by RND';
		}
		   
	});
});

function confPlayer() //Agrega evento 'click' a cada jugador
{
	$('.player').on('click',function(){
		
		var op = $(this);
		oppname = op.text();

		if(musername === oppname)
			return;
		
		oponente = op.attr('id');
		$('#statusBar #playername').text('Oponente: ' + oppname);	
		$('#statusBar #status').text('Estado: Esperando respuesta de '+oppname);
		$('#statusBar .leavea').text('Salir de la partida');
		changeStage();

		mysocket.emit('letsplay',{oponent:oponente,me:iid});					
	});
}

function sendMove(coords)
{
	var unc = coords.split('');
	mvs++;

	logictoe[unc[1]][unc[2]] = myf;

	if(checkwin())
	{
		showInfobox('Haz Ganado');
		gameover();
		mysocket.emit('iwin', {o:oponente,op:0});
	}
	else
	  $('#statusBar #status').text('Estado: Es el turno de '+oppname);
	
	mysocket.emit('move',{oponent:oponente , coords: coords});
}

function setReponse(coords)
{
	var unc = coords.split('');

	$('#statusBar #status').text('Estado: Tu turno');
	mvs++; //Incremente movimientos realizados

	var opf = '';
	if(myf === 'x') //Evalua cual es la figura del oponente para agregarla al escenario
		opf = 'o';
	else
		opf = 'x';

	logictoe[unc[1]][unc[2]] = opf; //Se guarda la figura del jugador

	var square = $('#'+coords);
	square.css('background','url(http://vp1.quodgraphic.com/gato/img/g'+opf+'.png) 16px 16.2px no-repeat');

	square.addClass('used');

	waiting = false; //Turno del jugador

	if(wol) // Un jugador ya gano
	{
		gameover();
		return;
	}

	if(mvs>=9) // No es posible hacer mas movimiento, por logica.
	{
		mysocket.emit('iwin',{o:oponente,op:1}); // op:1 indica al servidor que fue empate
		showInfobox('Empate');
		gameover();
		return;
	}

	hideInfobox();
}

function check_availability(iam) // Comprobar si el nombre de usuario esta disponible
{
	var i=0;
	for(i in avusers)
		if(avusers[i].username === iam)
		 return true;
}

function changeStage() // Quitar escenario de usuarios
{
	$('.welcome').fadeOut('fast');
}

function showInfobox(msg) // Lo contrario a ocultarla :P
{
	$('#infobox p').text(msg);
	$('#infobox').fadeIn();
}

function hideInfobox() // Ocultar caja de informacion
{
	$('#infobox').slideUp();
}

function ready2play() // Cambiar escenario a modo juego
{
	
	$('#setF').fadeOut('fast',function (){
		$('#stage').fadeIn('fast');
	});
}

function gameover() // Preguntar si desea salir de la partida o volver a jugar
{
	$('#gops').fadeIn('fast',function()
	{
		$('#gops a').on('click',function (e){
			e.preventDefault();
			var op = $(this);
			if(op.attr('class') === 'again')
			{
				mysocket.emit('requeat',{o:oponente,m:iid});

				showInfobox('Esperando confirmación');
				$('#gops').fadeOut();
				waiting = true;
				console.log('Revancha');
			}
			else
			{
				mysocket.emit('leave',{o:oponente,s:iid});
				leaveGame();
			}

		});
	});
}

function resetDash() // Reiniciar elementos logicos (Variables,css,etc)
{
	$('.square').css('background','none');
	$('.square').removeClass('used');
	logictoe = [['-','-','-'],['-','-','-'],['-','-','-']];
	mvs = 0;
	wol = false;
	oppname = '';
}

function leaveGame() // Reiniciar escenario
{
	$('#gops,#setF').fadeOut();	
	$('#stage').fadeOut('fast',function(){
		$('#players,.welcome').fadeIn('fast');
		hideInfobox();
	});

	$('#statusBar #status').text('Estado: Conectado');
	$('#statusBar .leavea,#playername').text('');
	

	document.title = 'Cuarto de Jugadores || Gato/Tic-tac-toe/Triqui/etc by RND';
	resetDash();
	playingmode = false;
}

function checkwin() // Checa si hay combinacion ganadora.
{
	if(logictoe[0][0] === myf && logictoe[1][1] === myf && logictoe[2][2] === myf)
		return true;
	else if(logictoe[2][0] === myf && logictoe[1][1] === myf && logictoe[0][2] === myf)
		return true;
	else
	{
		var z = 0;
		for(z;z<3;z++)
			if(logictoe[0][z] === myf && logictoe[1][z] === myf && logictoe[2][z] === myf)
				return true;

		for(z = 0;z<3;z++)
			if(logictoe[z][0] === myf && logictoe[z][1] === myf && logictoe[z][2] === myf)
				return true;
	}

	return false;
}

window.onbeforeunload = limpiarUsuario;  

function limpiarUsuario()
{  
	if(playingmode)
		mysocket.emit('leave',{o:oponente,s:iid});

	mysocket.emit('unloaduser',{id:iid,pi:pii});
	return ;
}
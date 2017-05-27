var $ = require("jquery"); 
var socket = require('socket.io-client')(); 


var clientId = -1;
var ballId = 0;
var brushPositions = {};
var ballPositions =[];
var clients={};
var type="";
var type2="";
//envoi de message "connection" lors de la connexion
socket.emit('connection', {msg: "client"}); 

//message reçu par le client contenant son "id" et la position 
socket.on('hello', function(data) { 
 clientId = data.id;
 brushPositions[clientId]={x:data.x,y:data.y};
 type = data.type;
 console.log("client> connection reussi, id = "+clientId);		
});
// quand un nouveau client se connecte tout les autres clients reçoivent ce type de message pour faire le update 
socket.on('newconnection', function(data){
 brushPositions = data.brushPositions;
 clients = data.clients;
 type2 = data.type;
});
// événement lors d'un click sur le canvas
$(document).on("mousedown", function(event){
 socket.emit('mousedown',{x: brushPositions[clientId].x, y: brushPositions[clientId].y, id: clientId, xCurseur: event.clientX, yCurseur: event.clientY, ballID: ballId});
 ballId++;
});
// événement lors de l'appuie d'une touche de direction 
$(document).on("keyup", function(event){
 socket.emit('keyupdown',{x: brushPositions[clientId].x, y: brushPositions[clientId].y, id: clientId,keycode: event.keyCode});
});
// événement lors de du maintient de l'appuie sur une touche de direction 
$(document).on("keydown", function(event){
 socket.emit('keyupdown',{x: brushPositions[clientId].x, y: brushPositions[clientId].y, id: clientId,keycode: event.keyCode});
});
//message envoyé lors de la déconnexion d'un joueur.
socket.emit('disconnect');
//-----------------------------------------------------------------------------------------------------
var canvas = document.getElementById('main');
var context = canvas.getContext('2d');

var img = new Image();
img.src = '/mur_30.png';

var chat = new Image();
chat.src = "/chat.png";

var ball = new Image();
ball.src = "/magic_ball.png";

context.drawImage(chat,100,300);
//-----------------------------------------------------------------------------------------------------
// methode qui permet de dessiner les murs et les obstacles defini statiquement
function dessiner_mur(){

	for(var i = 0; i < 800; i += 30){ 	//parcourir le x du canvas
		for(var j = 0; j < $("#main").height(); j += 30){ 	//parcourir le y du canvas
			if(j==0 || j>= $("#main").height()-30){ 
				context.drawImage(img,i,j); 	// dessiner les deux lignes horizontales en haut et en bas du murs 				
			}else{
				context.drawImage(img,0,j); 	// dessiner le murs verticale gauche	
				context.drawImage(img,780,j);	// dessiner le murs verticale droite	
			}
		}	
	}
	// dessiner d'autre obstacles à l'interieur du canvas
	context.drawImage(img,120,30);
	context.drawImage(img,120,60);
	context.drawImage(img,240,270);	
	context.drawImage(img,240,300);	
}
//--------------------------------------------------------------------------------------
//méthode pour dessiner les éléments du canvas 
function frameUpdate(){	
	
	if(type=="uBrushP" || type=="initialisation" ){	      // le type de message est update ball positio// le type de message est update brush position ou initialisation 	
		context.clearRect(0,0,canvas.width,canvas.height); 	// supprimer tout les éléments du canvas 
		context.fillStyle = "DodgerBlue"; 	// colorier le fond avec un bleu 
		context.fillRect(0, 0, 1000, 600);
		dessiner_mur(); 	// méthode pour déssiner les murs en brique et les obstacles 
				
		for(var i in brushPositions){ 	// parcourir les positions des joueurs une par une 
			context.drawImage(chat,brushPositions[i].x, brushPositions[i].y); 	// dessiner l'image chat (joueur) en fonction de son x et y attribut par le serveur	
			context.font = '10pt Calibri';
		        context.fillStyle = 'black';
			context.fillText("joueur: "+i, brushPositions[i].x-10, brushPositions[i].y+40);		// rajouter l'identifiant du joueur sous son image 
		}

		if(type2 == "newclient"){
			var y = 40; 	// position sur la quelle on écrit la ligne du score 
	 
			for(var i in clients){	// parcourirs tout les clients connecté pour avoir à chaque tour de boucle une ligne qui s'ajoute
				var id = clients[i].clientId;
				var nbrpoints = clients[i].nbrPoints;
				context.font = '13pt Calibri';
				if(id==clientId){
					context.fillStyle = 'red'; 	// ecrire en rouge la ligne du score du joueur lorsqu'il est sur ça page 
				}else{
					context.fillStyle = 'white'; 	// ecrire en blanc toutes les autres lignes 
				}			
				context.fillText("le joueur '"+id+"' a : "+nbrpoints+" points",820,y);		// ecrire la ligne qui contient l'id du joueur et son score
				y = y+20; 	// incrémenté le y par 20 pixel à chaque fois pour espacer les lignes	
			}
	        }
	}else if(type=="uBallP") {	// le type de message est update ball position
	
		context.clearRect(0,0,canvas.width,canvas.height);
		context.fillStyle = "DodgerBlue";
		context.fillRect(0, 0, 1000, 600);
		dessiner_mur();

		for(var i in brushPositions){	
			context.drawImage(chat,brushPositions[i].x, brushPositions[i].y);
			context.font = '10pt Calibri';
		        context.fillStyle = 'black';
			context.fillText("joueur: "+i, brushPositions[i].x-10, brushPositions[i].y+40);
		}
		if(type2 == "newclient"){
			var y = 40;
	 
			for(var i in clients){
				var id = clients[i].clientId;
				var nbrpoints = clients[i].nbrPoints;
				context.font = '13pt Calibri';
				if(id==clientId){
					context.fillStyle = 'red';
				}else{
					context.fillStyle = 'white';
				}	
				context.fillText("le joueur '"+id+"' a : "+nbrpoints+" points",820,y);	
				y = y+20;			
			}
	        }		
		for(var i in ballPositions){ 	// parcourir les positions des balles une par une 
			for(var j in ballPositions[i]){
				context.drawImage(ball,ballPositions[i][j].x, ballPositions[i][j].y);	// dessiner l'image balle 
			}
		}
	}
	window.requestAnimationFrame(frameUpdate);
}
frameUpdate();
//-----------------------------------------------------------------------------------------------------
//message envoyé par le serveur contenant les nouvelles positions des joueurs
socket.on('updatePosition', function(data) { 
	brushPositions = data.brushPositions;
	type = data.type;
});
//-----------------------------------------------------------------------------------------------------
//message envoyé par le serveur contenant les nouvelles positions des balles 
socket.on('updateballPosition', function(data) { 
	ballPositions = data.ballPositions;
	type = data.type;
	clients = data.clients;
});
//-----------------------------------------------------------------------------------------------------
//message envoyé par le serveur quand un client se déconnecte pour faire un update de des positions des joueurs, balles et pour mettre à jour la partie scores
socket.on('updatePoints', function(data) { 
	brushPositions = data.brushPositions;	
	ballPositions = data.ballPositions;
	type = data.type;
	clients = data.clients;
});

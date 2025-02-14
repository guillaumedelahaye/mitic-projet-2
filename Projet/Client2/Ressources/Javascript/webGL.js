
			function getParameterByName(name)
			{
		  		name = name.replace(/[\[]/, "\\\[").replace(/[\]]/, "\\\]");
		  		var regexS = "[\\?&]" + name + "=([^&#]*)";
			  	var regex = new RegExp(regexS);
			  	var results = regex.exec(window.location.search);
			  	if(results == null) return "";
		  		else return decodeURIComponent(results[1].replace(/\+/g, " "));
			}
		
			function getImageMaterial( url, geom )
			{
				var image = new Image();
				var material = new THREE.MeshBasicMaterial( { map : new THREE.Texture( image ) } );
				with ( { material : material } )
				{
	    			image.onload = function()
		    		{
		        		this.loaded = true;
	    	    		material.map.image = this;
	    			};
				}
				image.src = url;
				return material;
			}
		
			function getLineMaterial(score){

				var c = new THREE.Color(0x000000);

				if (score > 0.99){
					score = 0.99;
				}

				var tmp = 1-score;
				
				if (tmp <= 0.4){//dans les tons rouge
					if (tmp <0.2){//pour eviter de passer dans le noir
						tmp = 0.2;
					}
					c.r = Math.round(tmp*255);
					c.g = 255;
				}
				else if ((tmp > 0.4)&&(tmp <= 0.7)){//dans les tons orange
					c.r = 255;
					c.g = Math.round((1-tmp)*230);
				}
				else if ((tmp > 0.7)&&(tmp <= 0.9)){//dans les tons jaune
					c.r = 255;
					c.g = Math.round((1-tmp)*140);
				}
				else if ((tmp > 0.9)){//dans les tons vert
					if (tmp>0.95){//pour eviter de passer dans le rouge
						tmp = 0.95;
					}
					c.r = Math.round(tmp*255);
					c.g = Math.round((1-tmp)*140);
				}
				
				c.b = 0;//dans tout les cas le bleu est a 0
				return new THREE.LineBasicMaterial({
				    color: c.getHex(),
				    opacity: controller == "distance" ? 0.3 : 1/*0.6*/,
				    blending: THREE.AdditiveBlending,
				    transparent: true,
				    linewidth: 2
				} );	
			}
			
			var PI2 = Math.PI * 2;
			var particleMaterial = new THREE.ParticleCanvasMaterial( {
				color: 0xFF0000,
				program: function ( context ) {
					context.beginPath();
					context.arc( 0, 0, 1, 0, PI2, true );
					context.closePath();
					context.fill();
				}
			} );
			
			var container, stats;
			var camera, scene, renderer, images, root, lignes;
			var imagesObjects = [], liensObjects = [], projector, keyValues = new Array();// pour le picking
			var mouseX = 0, mouseY = 0, ctrlPressed = false;// inputs
			var windowHalfX = window.innerWidth / 2;
			var windowHalfY = window.innerHeight / 2;
			var liens, positions;
			var timer, timerEnabled = 0, step = 0, nextImage = 1, nextImagePosition = new THREE.Vector3(0, 0, 0);// animation
			var cameraLookAt = new THREE.Vector3(0, 0, 0);
			var lastCameraLookAt = new THREE.Vector3(0, 0, 0);
			var hoveredImage = [];var hoveredImageTimers = [];
			var minScore = 1, maxScore = 0;
			var contoller = 'score';
			var action = "";
			
			function explodeGraph() {
				if(!timerEnabled) {
					for(var i in positions){
						var imgNode = images.getChildByName("img_" + positions[i][0]);
						if(imgNode == undefined)break;
						imgNode.scale.x = 1;
						imgNode.scale.y = 1;
						imgNode.scale.z = 1;
					}
					timerEnabled = true;
					drawImages();
					drawLiens();
					explode();	
				}
			}
			
			function explode(){
				for(var i in positions){
					var imgName = "img_" + positions[i][0];
					var imgNode = images.getChildByName(imgName, false);
					imgNode.position.x += (positions[i][1] * 0.1);
					imgNode.position.y += (positions[i][2] * 0.1);
					imgNode.position.z += (positions[i][3] * 0.1);
					for(var j in liens){
						if (liens[j][0] == positions[i][0]) {
							lignes.getChildByName("link_" + j).geometry.vertices[0].position = imgNode.position;
							continue;
						}
						if(liens [j][1] == positions[i][0]) {
							lignes.getChildByName("link_" + j).geometry.vertices[1].position = imgNode.position;
						}
					}
				}
				updateImagesLookAt();
				step++;
				if(step == 10){
					timerEnabled = false;
					step = 0;
				}
				else{
					timer = setTimeout('explode()', 50);
				}
			}
			
			function clearGraph() {
				positions = [];
				tmpPositions = [];
				for(var i = 0;i<imagesObjects.length;i++) {
					images.remove(imagesObjects[i]);// ici voir Ã©ventuelle fuite mÃ©moire (cf doc Three.js)
				}
				imagesObjects = [];
				keyValues = new Array();
			}
			
			function clearLiens(){
				for(var i = 0;i<liensObjects.length;i++){
					lignes.remove(liensObjects[i]);
				}
				liens = [];
				liensObjects = [];		
			}
			
			function moveToNextImage(){
				if(!timerEnabled){
					timerEnabled = true;
					move();
				}
			}
			
			function move(){
				var imgNode;
				for(var i in positions){
					if(positions[i][0] == nextImage){
						// on recentre l'image
						var imgNode = images.getChildByName("img_" + nextImage, false);// positions[i][0], false);
						imgNode.position.x += (-(positions[i][1] * 0.1));
						imgNode.position.y += (-(positions[i][2] * 0.1));
						imgNode.position.z += (-(positions[i][3] * 0.1));
						break;
					}
				}
				
				cameraLookAt.x -= nextImagePosition.x * 0.1;//(cameraLookAt.x - nextImagePosition.x) * 0.04;
				cameraLookAt.y -= nextImagePosition.y * 0.1;//(cameraLookAt.y - nextImagePosition.y) * 0.04;
				cameraLookAt.z -= nextImagePosition.z * 0.1;
				updateImagesLookAt();
				
				
				step++;
				if(step == 10) {
					timerEnabled = false;
					step = 0;
					clearGraph();
					requestGraph(nextImage, nbVoisins);
				}else{
					timer = setTimeout('move()', 50);
				}
			}
			
			function implode(){
				for(var i in positions){
					if(positions[i][0] == nextImage) {
						continue;
					}
					var imgNode = images.getChildByName("img_" + positions[i][0], false);
					imgNode.position.x += (-(positions[i][1] * 0.1));
					imgNode.position.y += (-(positions[i][2] * 0.1));
					imgNode.position.z += (-(positions[i][3] * 0.1));
					for(var j in liens){
						if (liens[j][0] == positions[i][0]) {
							lignes.getChildByName("link_" + j).geometry.vertices[0].position = imgNode.position;
							continue;
						}
						if(liens [j][1] == positions[i][0]) {
							lignes.getChildByName("link_" + j).geometry.vertices[1].position = imgNode.position;
						}
					}
				}

				cameraLookAt.x += (nextImagePosition.x) * 0.1;
				cameraLookAt.y += (nextImagePosition.y) * 0.1;
				cameraLookAt.z += (nextImagePosition.z) * 0.1;
				
				updateImagesLookAt();
				
				step++;
				if(step == 10){
					timerEnabled = false;
					step = 0;
					moveToNextImage();
				}
				else{
					timer = setTimeout('implode()', 50);
				}
			}
			
			function implodeGraph() {
				if(!timerEnabled) {
					timerEnabled = true;
					for(var i in positions){
						var imgNode = images.getChildByName("img_" + positions[i][0]);
						imgNode.scale.x = 1;
						imgNode.scale.y = 1;
						imgNode.scale.z = 1;
						if(positions[i][0] == nextImage){
							nextImagePosition.x = positions[i][1];
							nextImagePosition.y = positions[i][2];
							nextImagePosition.z = positions[i][3];
							break;
						}
					}
					implode();	
				}
			}
			
			function init() {
				$('body').append("<div id='container'></div>");
				nextImage = getParameterByName("id") == "" ? 678 : getParameterByName("id");
				nbVoisins = getParameterByName("n") == "" ? 20 : getParameterByName("n");
				controller = getParameterByName("controller") == "" ? "score" : getParameterByName("controller");
				if(controller == "distance"){
					action = getParameterByName("action") == "" ? "getDistances" : getParameterByName("action");	
				}
				
				projector = new THREE.Projector();
				camera = new THREE.PerspectiveCamera( 75, window.innerWidth / window.innerHeight, 1, 3000 );
				camera.position.z = 600;
				
				scene = new THREE.Scene();
				scene.add( camera );
				
				var PI2 = Math.PI * 2;
				var program = function ( context ) {
					context.beginPath();
					context.arc( 0, 0, 1, 0, PI2, true );
					context.closePath();
					context.fill();
				}
				root = new THREE.Object3D();
				scene.add(root);
				
				images = new THREE.Object3D();
				root.add(images);

				lignes = new THREE.Object3D();
				root.add(lignes);
				
				requestGraph(nextImage, nbVoisins);
				
				renderer = new THREE.CanvasRenderer();
				renderer.setSize( window.innerWidth, window.innerHeight );
				//renderer.setClearColor(new THREE.Color(0x888888), 100);
				
				stats = new Stats();
				stats.domElement.style.position = 'absolute';
				stats.domElement.style.top = '0px';
				
				var html5logo = new Image();
				html5logo.src = "Ressources/Images/HTML5_Logo_64.png";
				var jQuerylogo = new Image();
				jQuerylogo.src = "Ressources/Images/jquery12.gif";
				var webGLlogo = new Image();
				webGLlogo.src = "Ressources/Images/webgl-logo.png";
				$("#container").append(renderer.domElement).append(stats.domElement).append("<div id='logos'></div>");
				$("#logos").append("<br /><span class='red'>Powered By</span><br/>").append(webGLlogo).append(html5logo).append(jQuerylogo).append("<br /><br /><span class='red'>Use Z, S, Q, D to move inside 3d scene</span>");
				
			}
			
			function drawImages(){
				for(var i in positions){
			    	  var o = new THREE.Object3D();
			    	  //o.matrixWorld = matrix;
			    	  var id = positions[i][0];
			    	  o.name = "img_" + id;
					  o.position = new THREE.Vector3(0, 0, 0);
			    	  var imageUrl = "../Server/index.php?controller=image&action=getImg&id="+id+"&t=300";
			    	  var geom = new THREE.CubeGeometry(100, 100, 1);
			    	  geom.dynamic = true;
					  geom.__dirtyVertices = true;
			    	  var cube = new THREE.Mesh(
			    				geom,
			    				//new THREE.MeshLambertMaterial( { color: 0xFF0000 } )
			    				getImageMaterial( imageUrl )
							);
			    	  o.add(cube);
					  images.add(o);
					  imagesObjects.push(o);
					  keyValues[o.id] = o.name;
			      }
			}
			
			function drawLiens() {
				for(var i in liens) {
					var img0 = images.getChildByName("img_" + liens[i][0], false);
					var img1 = images.getChildByName("img_" + liens[i][1], false);
					var geom = new THREE.Geometry();
					var vertice0 = new THREE.Vertex( new THREE.Vector3(0, 0, 0));
					var vertice1 = new THREE.Vertex( new THREE.Vector3(0, 0, 0));
					geom.vertices.push(vertice0);
					geom.vertices.push(vertice1);
					var o = new THREE.Line(geom, getLineMaterial(liens[i][2]));
					o.geometry.dynamic = true;
					o.geometry.__dirtyVertices = true;
					o.name = "link_" + i;
					lignes.add(o);
					liensObjects.push(o);
				}
			}
			
			function getMinMaxScore(){
				for(var i in liens){
					maxScore = liens[i][2] > maxScore ? liens[i][2] : maxScore;
					minScore = liens[i][2] < minScore ? liens[i][2] : minScore;
				}
			}
			
			function requestGraph(id_ref, nbVoisins) {
				if(controller == 'score'){
					$.ajax({
					  	url: '../Server/index.php',
						  dataType: 'json',
						  cache: true,
						  data:  {"controller" : "score", "id" : id_ref, "nn" : nbVoisins, "action" : "getScoreV3", "w": window.innerWidth, "h": window.innerHeight, "s": "1", "coords3D" : "1" },
						  success: function(data) {
							liens = data.liens;
							positions = data.positions;	
							getMinMaxScore();
							explodeGraph();
					  }
					});	
				}else if (controller == 'distance'){
					$.ajax({
						url : '../Server/index.php',
						dataType : 'json',
						cache : true,
						data : {
							"controller" : "distance",
							"id" : id_ref,
							"nn" : nbVoisins,
							"action" : action,
							"w": window.innerWidth, "h": window.innerHeight,
						},
						success : function(data) {
							liens = data.liens;
							positions = data.positions;	
							getMinMaxScore();
							explodeGraph();

						}
					});
				}
			}
			
			function animate() {
				requestAnimationFrame( animate );
				render();
				stats.update();
			}

			function render() {
				camera.lookAt(cameraLookAt);
				renderer.render( scene, camera );
			}	
			
			function updateImagesLookAt(){
				for(var i in imagesObjects){
					imagesObjects[i].lookAt(camera.position);
				}
			}
			
// 			function zoomOut(id, time){
// 				var o = images.getChildByName("img_" + hoveredImage); 
// 				o.position.z -= time / 2;
// 				time -= 50;
// 				if (time == 0) {
// 					delete hoveredImageTimers[o.name];
// 				}
// 				else {
// 					hoveredImageTimers[o.name] = setTimeout('function() { zoomOut(' + id + ',' + time + ') }', 50);
// 				}
// 			}
			
// 			function zoomOutImage(id, time){
// 				if(hoveredImageTimers == undefined){
// 					zoomOut(id, time);
// 				}
// 			}
			
// 			function zoomIn(id, time){
// 				var o = images.getChildByName("img_" + hoveredImage);
// 				o.position.z += time / 2;
// 				time -= 50;
// 				if (time == 0) {
// 					delete hoveredImageTimers[o.name];
// 				}
// 				else {
// 					hoveredImageTimers[o.name] = setTimeout('function() { zoomIn(' + id+ ',' + time+ ') }', 50);
// 					//setTimeout(function(){myFunction(parameter)}, myTimeout);
// 				}
// 			}
			
// 			function zoomInImage(id, time){
// 				if (hoveredImageTimers == undefined){
// 					zoomIn(id, time);	
// 				}
// 			}
			
			$(document).ready(function(){
				init();
				animate();
				
				$(document).bind('mousemove', function ( event ) {
					event.preventDefault();
						if(timerEnabled)return;
						var vector = new THREE.Vector3( ( event.clientX / window.innerWidth ) * 2 - 1, - ( event.clientY / window.innerHeight ) * 2 + 1, 0.5 );
						projector.unprojectVector( vector, camera );
						var ray = new THREE.Ray( camera.position, vector.subSelf( camera.position ).normalize() );
						var intersects = ray.intersectObjects(imagesObjects);
						hoveredImage = [];
						
						if ( intersects.length > 0 ) {
							var o = intersects[0].object;
							hoveredImage.push(keyValues[parseInt(o.id) - 1].substring(4));
						}
						
						for(var i in positions){
							var found = false;
							for (var j in hoveredImage){
								if(positions[i][0] == hoveredImage[j])
								{
									var imgNode = images.getChildByName("img_" + positions[i][0]);
									imgNode.scale.x = 3;
									imgNode.scale.y = 3;
									imgNode.scale.z = 3;
									found = true;
									break; 
								}
							} 
							if (found) continue;
							else {
								var imgNode = images.getChildByName("img_" + positions[i][0]);
								if(imgNode == undefined)return;
								imgNode.scale.x = 1;
								imgNode.scale.y = 1;
								imgNode.scale.z = 1;
							}
						}
						
				}).click(function(event){
						event.preventDefault();
						var vector = new THREE.Vector3( ( event.clientX / window.innerWidth ) * 2 - 1, - ( event.clientY / window.innerHeight ) * 2 + 1, 0.5 );
						projector.unprojectVector( vector, camera );
						var ray = new THREE.Ray( camera.position, vector.subSelf( camera.position ).normalize() );
						var intersects = ray.intersectObjects(imagesObjects);

						if ( intersects.length > 0 ) {
							var o = intersects[0].object;
							nextImage = keyValues[parseInt(o.id) - 1].substring(4);

							implodeGraph();
						}
				}).bind("keydown", function(event){
					switch (event.which) {
						case 17:
							ctrlPressed = true;
							event.preventDefault();
							break;
						case 37://Left Arrow
// 							var deltaAngle = (PI2/imagesObjects.length);
// 							root.rotation.z += deltaAngle; 
// 							updateImagesLookAt();
							event.preventDefault();
//							images.rotation.z += .1;
							//images.position.z += 0.1:
							break;
						case 38://Up Arrow
							
							event.preventDefault();
							//camera.position.z += 10;
							//images.position.z += 100:
							break;
						case 39://Right Arrow
// 							var deltaAngle = (PI2/imagesObjects.length);
// 							root.rotation.z -= deltaAngle;
// 							updateImagesLookAt();
							event.preventDefault();
							//camera.position.x -= 10;
							break;
						case 40://Down Arrow
							
							event.preventDefault();
							//camera.position.x += 10;
							break;						

					}
				}).bind("keyup", function(event){
					
					if (event.keyCode == 17){
						event.preventDefault();
						ctrlPressed = false;
					}
				}).keypress(function(event){
					console.log(event);
					
					switch(event.which){
						case 122://Z
							camera.position.z -= 10;
							updateImagesLookAt();
							console.log(camera.position.x + " " + camera.position.y + " " + camera.position.z);
							event.preventDefault();
							break;
						case 115://S
							camera.position.z += 10;
							updateImagesLookAt();
							console.log(camera.position.x + " " + camera.position.y + " " + camera.position.z);
							event.preventDefault();
							break;
						case 113://Q
							camera.position.x -= 10;
							updateImagesLookAt();
							console.log(camera.position.x + " " + camera.position.y + " " + camera.position.z);
							event.preventDefault();
// 							images.rotation.y -= .1;
// 							lignes.rotation.y -= .1;
							break;
						case 100://D
							camera.position.x += 10;
							updateImagesLookAt();
							event.preventDefault();
// 							images.rotation.y += .1;
// 							lignes.rotation.y += .1;
							break;
					}
				});
			
				document.addEventListener('touchstart',function(event){
					event.preventDefault();
					var vector = new THREE.Vector3( ( event.pageX / window.innerWidth ) * 2 - 1, - ( event.pageY / window.innerHeight ) * 2 + 1, 0.5 );
					projector.unprojectVector( vector, camera );
					var ray = new THREE.Ray( camera.position, vector.subSelf( camera.position ).normalize() );
					var intersects = ray.intersectObjects(imagesObjects);

					if ( intersects.length > 0 ) {
						var o = intersects[0].object;
						nextImage = keyValues[parseInt(o.id) - 1].substring(4);

						implodeGraph();
					}
				},false);
				/* * 
				 * function touchEvent(){ if(isClicked){ setTimeout(function(){
				 * graphCenter.x -= 25; draw(); touchEvent(); },100); }else isClicked =
				 * true; }
				 * 
				 * document.getElementById("fg").addEventListener('touchend',function(){
				 * isClicked = false; },false);*/
			
			});

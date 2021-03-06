BlobApp.LevelLoader = (function() {
	var that = {},

	tileset,
	mapData,
	currentLoadedOverID,
	_globalStateHandler,
	_gameState,
	owID,
	/* need to be extracted from json!*/
	_createRequestObject = {
		"sprite" : undefined,
		"userData" : undefined
	},

	init = function(lvlID, overID, globalStateHandler){
		var levelID = lvlID;
		owID = overID;
		_globalStateHandler = globalStateHandler;
		_gameState = _globalStateHandler.getGameState();

		_initBackground(owID);
		_getLevelMapData(levelID, owID);


		mapData = mapDataJson;

		// create EaselJS image for tileset
		tileset = new Image();

		// getting imagefile from first tileset
		tileset.src = "res/img/Tileset_alt.png"//mapData.tilesets[0].image;

		// callback for loading layers after tileset is loaded
		tileset.onLoad = _initLayers();

		return that;
	},

	_initBackground = function(owID){
		var background;
		switch(owID){
			case 0:
				background = new createjs.Bitmap("res/img/LevelBackground/BackgroundGreenMenu.png");
				break;
			
			case 1:
			case 2:
				background = new createjs.Bitmap("res/img/LevelBackground/BackgroundGreen.png");
				break;

			case 3:
			case 4:
				background = new createjs.Bitmap("res/img/LevelBackground/BackgroundOrange.png");
				break;

			case 5:
			case 6:
				background = new createjs.Bitmap("res/img/LevelBackground/BackgroundNight.png");
				break;

			case 7:
			case 8:
				background = new createjs.Bitmap("res/img/LevelBackground/BackgroundCave.png");
				break;

			case 9:
				background = new createjs.Bitmap("res/img/LevelBackground/BackgroundOrangeVictory.png");
				break;
		}
		$('body').trigger('backgroundAdded', background);
	}

	_initLayers = function() {
		var width = mapData.tilesets[0].tilewidth;
		var height = mapData.tilesets[0].tileheight;

		var imageData = {
			images : [ tileset ],
			frames : {
				width : width,
				height : height
			}
		};

		// create spritesheet for generic objects (ground e.g.)
		var tilesetSheet = new createjs.SpriteSheet(imageData);
		
		// loading each layer at a time
		for (var i = 0; i < mapData.layers.length; i++) {
			var layerData = mapData.layers[i];
			if (layerData.type == 'tilelayer') {
				_initLayer(layerData, tilesetSheet, mapData.tilewidth, mapData.tileheight);
			}
		}
	},

	// layer initialization
	_initLayer = function(layerData, tilesetSheet, tilewidth, tileheight) {
		borders = new Array();

		//Testvariable zur Übergabe von Infos(Doors)
		var doorCount = 0, buttonCount = 0, levelDoorCount = 0, movingGroundCount = 0;

		if(layerData.hasOwnProperty('properties') && layerData.properties.hasOwnProperty('OverWorldID')) {
			currentLoadedOverID = layerData.properties.CurrentOverID;
		}

		for ( var y = 0; y < layerData.height; y++) {
			borders.push(new Array());

			for ( var x = 0; x < layerData.width; x++) {
				borders[y][x] = false;

				//get tile id
					var idx = x + y * layerData.width;

					xcoords = x * 25;
					ycoords = y * 25;

					switch(layerData.data[idx]) {
						case EntityConfig.REDBLOBID:
							_createRedBlob(xcoords,ycoords);
						break;

						case EntityConfig.REDBLOBLOWERID: 
						case EntityConfig.DOORLOWERID:
						case EntityConfig.EMPTYTILEID: 
						case EntityConfig.GOADLLOWERID:
						case EntityConfig.NEWGAMEDOORLOWERID:
						case EntityConfig.CONTINUEDOORLOWERID:
						case EntityConfig.LEVELDOORLOWERID:
						case EntityConfig.MOVINGGROUNDMIDDLEID:
						case EntityConfig.MOVINGGROUNDRIGHTID:
						break;

						case EntityConfig.GREENBLOBID:
							_createGreenBlob(xcoords, ycoords);
						break;

						case EntityConfig.DOORID:
							_createDoor(xcoords,ycoords,layerData,doorCount);
							doorCount++;
						break;
		
						case EntityConfig.BUTTONID:
							_createButton(xcoords,ycoords,layerData, buttonCount);
							buttonCount++;
						break;

						case EntityConfig.KEYID:
							_createKey(xcoords, ycoords);
						break;

						case EntityConfig.GOALID:
							_createGoal(xcoords, ycoords);
						break;

						case EntityConfig.NEWGAMEDOOR:
							_createMenuDoor(xcoords, ycoords, 0);
						break;

						case EntityConfig.CONTINUEDOOR:
							_createMenuDoor(xcoords, ycoords, 1);
						break;

						case EntityConfig.MOVINGGROUNDID:
							_createMovingGround(xcoords, ycoords,movingGroundCount);
							movingGroundCount++;
						break;


						case EntityConfig.LEVELDOOR:
							_createLevelDoor(xcoords, ycoords, layerData, levelDoorCount);
							levelDoorCount++;
						break;

						case EntityConfig.HELITILE:
						case EntityConfig.HELISTOPTILE:
						case EntityConfig.SPHERETILE:
						case EntityConfig.TELE:
						case EntityConfig.BRIDGELEFTTILE:
						case EntityConfig.BRIDGERIGHTTILE:
						case EntityConfig.SLINGSHOTTILELEFT:
						case EntityConfig.SLINGSHOTTILERIGHT:
							_createTriggerZone(xcoords, ycoords, layerData.data[idx]+1000, idx);
							borders[y][x] = true;
							_loadGenericData(layerData, tilesetSheet, xcoords, ycoords, idx);
						break;


						case EntityConfig.UPSPIKEID:
						case EntityConfig.DOWNSPIKEID:
						case EntityConfig.LEFTSPIKEID:
						case EntityConfig.RIGHTSIKEID:
							_loadSpikes(layerData, tilesetSheet, xcoords, ycoords, idx);
						break;

						default:
							borders[y][x] = true;
							_loadOnlyViewData(layerData, tilesetSheet, xcoords, ycoords, idx);
						break;
					}
				}
			}

		_initBorders(borders);
	},

	_loadSpikes = function(layerData, tilesetSheet, x, y, idx) {
		_createRequestObject["userData"] = [EntityConfig.SPIKEID];
		_createRequestObject["x"] = x;
		_createRequestObject["y"] = y;
		_createRequestObject["height"] = 6;
		_createRequestObject["width"] = 6;

		$('body').trigger('entityRequested', _createRequestObject);

		var messageToView = {
			generic : true,
			x : x,
			y : y,
			positionInSprite : layerData.data[idx] - 1
		};

		$('body').trigger("requestViewEntity", messageToView);
	},

	_informModel = function(layerData, doorCount) {
		var doorNumber = layerData.properties.Doors[doorCount];
		var buttonNumber = layerData.properties.Doors[doorCount];
		var eventPackage = {
			"doorNumber": doorNumber,
			"buttonNumber": buttonNumber
		};

		$('body').trigger("doorCreated", eventPackage);
	},

	_initBorders = function(borders) {
		// Horizontal borders
		// Variables have: x, y, width, height
		hBorders = new Array();
		currentHBorder = undefined;

		for(var rowNum = 0; rowNum < borders.length; rowNum++) {
			currentHBorder = undefined;

			for(var colNum = 0; colNum < borders[0].length; colNum++) {
				if(borders[rowNum][colNum]) {
					if(!currentHBorder) {

						// UNLESS: Would be a single item AND is in a vertical line
						singleHorizontal = !((colNum != 0 && borders[rowNum][colNum - 1]) || (colNum != borders[0].length - 1 && borders[rowNum][colNum + 1]));
						verticalLine = ((rowNum != 0 && borders[rowNum - 1][colNum]));
						
						if(!(singleHorizontal && verticalLine)) {
							hBorders.push({
								"x" : colNum * 25,
								"y" : rowNum * 25,
								"width" : 12.5,
								"height" : 12.5,
								"userData" : [EntityConfig.HORIZONTALBORDERID, undefined]
							});

							currentHBorder = true;
						}

					} else {
						hBorders[hBorders.length - 1].width += 12.5;
						hBorders[hBorders.length -1].x += 12.5;
					}

				} else {
					currentHBorder = false;
				}
			}
		}

		for(var i = 0; i < hBorders.length; i++) {
			$('body').trigger('entityRequested', hBorders[i]);
		}

		// Vertical borders
		vBorders = new Array();
		currentVBorder = undefined;
		addStuff = undefined;

		for(var colNum = 0; colNum < borders[0].length; colNum++) {
			currentVBorder = undefined;

			for(var rowNum = 0; rowNum < borders.length; rowNum++) {
				if(borders[rowNum][colNum]) {
					if(!currentVBorder) {

						// IF: not already a horizontal line AND will be a vertical line
						verticalLine = ((rowNum != borders.length - 1 && borders[rowNum + 1][colNum]) || (rowNum != 0 && borders[rowNum - 1][colNum]));
						horizontalLine = ((colNum != 0 && borders[rowNum][colNum - 1]) || (colNum != borders[0].length - 1 && borders[rowNum][colNum + 1]));
						
						if(verticalLine && !horizontalLine){
							vBorders.push({ 
								"x" : colNum * 25,
								"y" : rowNum * 25,
								"width" : 12.5,
								"height" : 12.5,
								"userData" : [EntityConfig.VERTICALBORDERID, undefined]
							});

							currentVBorder = true;
						}

					} else {
						vBorders[vBorders.length - 1].height += 12.5;
						vBorders[vBorders.length -1].y += 12.5;
					}

				} else {
					currentVBorder = false;
				}
			}
		}

		for(var i = 0; i < vBorders.length; i++) {
			$('body').trigger('entityRequested', vBorders[i]);
		}
	},

	_loadGenericData = function(layerData, tilesetSheet, x, y, idx) {
		entityID = layerData.data[idx];

		if(layerData.data[idx] == EntityConfig.HELITILE || layerData.data[idx] == EntityConfig.HELISTOPTILE
			|| layerData.data[idx] == EntityConfig.SPHERETILE 
			|| layerData.data[idx] == EntityConfig.TELE
			|| layerData.data[idx] == EntityConfig.SLINGSHOTTILELEFT 
			|| layerData.data[idx] == EntityConfig.SLINGSHOTTILERIGHT
			) {
			entityID = 2;
		} else if(layerData.data[idx] == EntityConfig.BRIDGELEFTTILE) {
			entityID = 88;
		} else if(layerData.data[idx] == EntityConfig.BRIDGERIGHTTILE) {
			entityID = 84;
		}

		var messageToView = {
			generic : true,
			x : x,
			y : y,
			positionInSprite : entityID - 1
		};

		$('body').trigger("requestViewEntity", messageToView);
	},

	_loadOnlyViewData = function(layerData, tilesetSheet, x, y, idx) {
		var messageToView = {
			generic : true,
			x : x,
			y : y,
			positionInSprite : layerData.data[idx] - 1
		};

		$('body').trigger("requestViewEntity", messageToView);
	},


	_createRedBlob = function(x, y) {
		_createRequestObject["userData"] = [EntityConfig.REDBLOBID,undefined];
		_createRequestObject["width"] = 25;
		_createRequestObject["height"] = 50;
		_createRequestObject["x"] = x;
		_createRequestObject["y"] = y;

		$('body').trigger('blobRequested', _createRequestObject);

		var messageToView = {
			generic : false,
			x : x,
			y : y,
			entityID : EntityConfig.REDBLOBID
		};

		$('body').trigger("requestViewEntity", messageToView);

		_createRequestObject["width"] = 1;
	},

	_createGreenBlob = function(x, y) {
		_createRequestObject["userData"] = [EntityConfig.GREENBLOBID,undefined];
		_createRequestObject["width"] = 25;
		_createRequestObject["height"] = 25;
		_createRequestObject["x"] = x;
		_createRequestObject["y"] = y;

		$('body').trigger('blobRequested', _createRequestObject);

			var messageToView = {
			generic : false,
			x : x,
			y : y,
			entityID : EntityConfig.GREENBLOBID
		};

		_createRequestObject["width"] = 1;
		$('body').trigger("requestViewEntity", messageToView);
	},


	_createButton = function(x, y,layerData,buttonCount){
		var buttonNumber = layerData.properties.Buttons[buttonCount];

		_createRequestObject["width"] = 12.5;
		_createRequestObject["height"] = 12.5;
		_createRequestObject["x"] = x;
		_createRequestObject["y"] = y;
		_createRequestObject["userData"] = [EntityConfig.BUTTONID, buttonNumber, layerData.properties.Doors[buttonCount]];

		$('body').trigger('entityRequested', _createRequestObject);
		_createRequestObject["width"] = 1;

		var messageToView = {
			generic : false,
			x : x,
			y : y,
			entityID : EntityConfig.BUTTONID,
			buttonID : buttonNumber
		};

		$('body').trigger("requestViewEntity", messageToView);
	},

	_createDoor = function(x, y, layerData, doorCount){
		var doorNumber = layerData.properties.Doors[doorCount];
		
		_informModel(layerData, doorCount);

		_createRequestObject["userData"] = [EntityConfig.DOORID, doorNumber];
		_createRequestObject["width"] = 12.5;
		_createRequestObject["height"] = 25;
		_createRequestObject["x"] = x;
		_createRequestObject["y"] = y+12.5;
	
		$('body').trigger('entityRequested', _createRequestObject);

		_createRequestObject["width"] = 1;

		var messageToView = {
			generic : false,
			x : x,
			y : y,
			entityID : EntityConfig.DOORID,
			doorID : doorNumber
		};

		$('body').trigger("requestViewEntity", messageToView);
	},

	_createMenuDoor = function(x, y, type){
		_createRequestObject["width"] = 15;
		_createRequestObject["height"] = 37.5;
		_createRequestObject["x"] = x;
		_createRequestObject["y"] = y;

		if(type == 0){
			_createRequestObject["userData"] = [EntityConfig.NEWGAMEDOOR];
		} else if (type == 1){
			_createRequestObject["userData"] = [EntityConfig.CONTINUEDOOR];
		}

		$('body').trigger('sensorRequested', _createRequestObject);

		var messageToView = {
			generic : false,
			x : x,
			y : y,
			entityID : _createRequestObject["userData"][0]
		};

		$('body').trigger("requestViewEntity", messageToView);
	},

	_createMovingGround = function(x, y, movingGroundCount){
		var messageToView = {
			generic : false,
			x : x,
			y : y,
			entityID : EntityConfig.MOVINGGROUNDID,
			num : movingGroundCount
		};

		$('body').trigger("requestViewEntity", messageToView);
		

		_createRequestObject["width"] = 37.5;
		_createRequestObject["height"] = 12.5;
		_createRequestObject["x"] = x;
		_createRequestObject["y"] = y;

		_createRequestObject["userData"] = [EntityConfig.MOVINGGROUNDID, movingGroundCount];
		_createRequestObject["num"] = movingGroundCount;

		$('body').trigger('entityRequested', _createRequestObject);

		_createRequestObject["width"] = 1;
	},

	_createLevelDoor = function(x, y, layerData, levelDoorCount) {
		var levelDoorLevelID = layerData.properties.LevelDoorID[levelDoorCount];
		var levelDoorOverID = layerData.properties.OverWorldID[levelDoorCount];

		_createRequestObject["width"] = 12.5;
		_createRequestObject["height"] = 25;
		_createRequestObject["x"] = x;
		_createRequestObject["y"] = y+12.5;

		if(currentLoadedOverID < _gameState.currentOverworldMapID){
			_createRequestObject["userData"] = [EntityConfig.LEVELDOOR, levelDoorLevelID, levelDoorOverID, true];
		} else {
			if(levelDoorLevelID <= _gameState.currentLevel){
				_createRequestObject["userData"] = [EntityConfig.LEVELDOOR, levelDoorLevelID, levelDoorOverID, true];
			} else {
				_createRequestObject["userData"] = [EntityConfig.LEVELDOOR, levelDoorLevelID, levelDoorOverID, false];
			}
		}

		$('body').trigger('sensorRequested', _createRequestObject);

		_createRequestObject["width"] = 1;

		var messageToView = {
			generic : false,
			x : x,
			y : y,
			entityID : EntityConfig.LEVELDOOR,
			levelID : levelDoorLevelID,
			owID : levelDoorOverID,
			generalOverID : owID
		};

		$('body').trigger("requestViewEntity", messageToView);
	},
	
	_createKey = function(x, y) {

		_createRequestObject["userData"] = [EntityConfig.KEYID];

		_createRequestObject["width"] = 15;
		_createRequestObject["height"] = 15;
		_createRequestObject["x"] = x;
		_createRequestObject["y"] = y;

		$('body').trigger("sensorRequested", _createRequestObject);

		var messageToView = {
			generic : false,
			x : x,
			y : y,
			entityID : EntityConfig.KEYID,
			keyID : 0
		};

		$('body').trigger("requestViewEntity", messageToView);
	},

	_createGoal = function(x, y) {
		_createRequestObject["width"] = 12.5;
		_createRequestObject["height"] = 30;
		_createRequestObject["x"] = x;
		_createRequestObject["y"] = y + 10;

		_createRequestObject["userData"] = [EntityConfig.GOALID];

		$('body').trigger("sensorRequested", _createRequestObject);

		_createRequestObject["width"] = 1;

		var messageToView = {
			generic : false,
			x : x,
			y : y,
			entityID : EntityConfig.GOALID,
			goalID : 0
		};

		$('body').trigger("requestViewEntity", messageToView);
	},

	_createTriggerZone = function(x, y, entityID, idx) {

		_createRequestObject["userData"] = [entityID, idx];

		_createRequestObject["width"] = 15;
		_createRequestObject["height"] = 15;
		_createRequestObject["x"] = x;
		_createRequestObject["y"] = y - 25;

		$("body").trigger("sensorRequested", _createRequestObject);

		_createRequestObject["width"] = 1.0;

		var messageToView = {
			generic : false,
			x : x,
			y : y,
			entityID : entityID,
			uniqueID : idx
		};

		$('body').trigger("requestViewEntity", messageToView);
	},

	// utility function for loading assets from server
	_httpGet = function(theUrl) {
		var xmlHttp = null;

		xmlHttp = new XMLHttpRequest();
		xmlHttp.open("GET", theUrl, false);
		xmlHttp.send(null);

		return xmlHttp.responseText;
	},

	// utility function for loading json data from server
	_httpGetData = function(theUrl) {
		var responseText = httpGet(theUrl);
		
		return JSON.parse(responseText);
	},

	_getLevelMapData = function(levelNumber, overworldNumber) {
		var levelName = "_" + overworldNumber + levelNumber;
		mapDataJson = LevelConfig[levelName];
	},

	that.init = init;
	
	return that;
})();
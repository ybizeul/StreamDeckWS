var websocket = null;  // Websocket to Streamdeck
var connections = {};  // Dictionary maintaining connections for each key

function addPositionForServer(server,position) {
	index=connections[server].positions.indexOf(position)
	if (index == -1) {
		connections[server].positions.push(position)
	}
}
function removePositionForServer(server,position) {
	index=connections[server].positions.indexOf(position)
	if (index != -1) {
		connections[server].positions.splice(index,1)
	}
}
function positionFromCoordinates(c) {
	return c.column + "-" + c.row
}
function connect(remoteServer,position,message,backend_only=false) {
	// Close connection if it already exists
	if (connections.hasOwnProperty(remoteServer) && (backend_only == false)) {
		addPositionForServer(remoteServer,position)
		if (connections[remoteServer].websocket.readyState == 0) {
			setTimeout(() => {
				connections[remoteServer].websocket.send(JSON.stringify(message))
			},1000)
		}
		else {
			connections[remoteServer].websocket.send(JSON.stringify(message))
		}
		return
	}

	// Create a new connection to the remote websocket
	c = new WebSocket(remoteServer)
	if (backend_only) {
		connections[remoteServer].websocket=c
	}
	else {
		connections[remoteServer] = {positions: [position],websocket: c}
	}

	// send willAppear message when connection is ready
	c.onopen = function(evt) {
		console.log("Remote socket opened")
		if (message) {
			c.send(JSON.stringify(message))
		}
	}

	// Forward to StreamDeck incoming messages
	c.onmessage = function(evt) {
		j=JSON.parse(evt.data)
		console.log("Forwarding message")
		if (websocket && websocket.readyState) {
			console.log(evt)
			websocket.send(JSON.stringify(j))
		}
	}
	c.onclose = function() {
		if (connections.hasOwnProperty(key)) {
			connect(remoteServer,null,null,true)
		}
	}
}

function disconnect(remoteServer,position,message) {

	if (connections.hasOwnProperty(remoteServer)) {
		c=connections[remoteServer].websocket;
		if (c.readyState == 1) {
			c.send(JSON.stringify(message))
		}
		removePositionForServer(remoteServer,position)
		if (connections[remoteServer].positions.length == 0) {
			delete connections[remoteServer]
			c.onclose=null
			c.close()
		}
	}
}
function connectElgatoStreamDeckSocket(inPort, inPluginUUID, inRegisterEvent, inInfo) {
	pluginUUID = inPluginUUID

	// Open the web socket to streamdeck
	websocket = new WebSocket("ws://127.0.0.1:" + inPort);
	
	function registerPlugin(inPluginUUID)
	{
		var json = {
			"event": inRegisterEvent,
			"uuid": inPluginUUID
		};

		websocket.send(JSON.stringify(json));
	};

	websocket.onopen = function()
	{
		// WebSocket is connected, send message
		registerPlugin(pluginUUID);
	};

	websocket.onmessage = function (evt) { 
		// Received message from Stream Deck
		console.log(evt)
		var jsonObj = JSON.parse(evt.data);
		var event = jsonObj['event'];
	
		if(event == "didReceiveSettings")
		{
			var jsonPayload = jsonObj['payload'];
			var settings = jsonPayload['settings'];
			var coordinates = jsonPayload['coordinates'];

			connect(settings.remoteServer,positionFromCoordinates(coordinates))
		}
		else if(event == "willAppear")
		{
			var jsonPayload = jsonObj['payload'];
			var settings = jsonPayload['settings'];
			var coordinates = jsonPayload['coordinates'];
			if (settings.hasOwnProperty("remoteServer")) {
				connect(settings.remoteServer,positionFromCoordinates(coordinates),jsonObj)
			}
		}
		else if(event == "willDisappear")
		{
			var jsonPayload = jsonObj['payload'];
			var settings = jsonPayload['settings'];
			var coordinates = jsonPayload['coordinates'];

			disconnect(settings.remoteServer,positionFromCoordinates(coordinates),jsonObj)
		}
		// If there is a key associated with the message, forward to remote websocket
		else if (jsonObj.hasOwnProperty("payload")) {
			if (jsonObj['payload'].hasOwnProperty("settings")) {
				key = jsonObj['payload']['settings']['remoteServer']
				if (connections.hasOwnProperty(key)) {
					c=connections[key].websocket
					if (c && c.readyState == 1) {
						console.log(jsonObj)
						c.send(JSON.stringify(jsonObj))
					}
				}
			}
		}		
	};

	websocket.onclose = function()
	{ 
		// Websocket is closed
	};
};
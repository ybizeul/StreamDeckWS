var websocket = null;  // Websocket to Stream Deck

/*
// Dictionary maintaining connections for each key
The structure is the following :

{
	"ws://mysocket1/path" : {
		"websocket": websocket1,
		"positions": ["position1","position2"]
	},
	"ws://mysocket2/path" : {
		"websocket": websocket2,
		"positions": ["position3"]
	},
}

Each socket maintains an array of positions it is configured for so that
when there is no positions left we can disconnect, but as long as there
is at least one position listed, we leave the connection open. The format
of the position string is "<column>-<row>" but the actual value is never used,
it is there just to maintain count of how many keys are using the socket.
*/
var connections = {};

// Adds the given position in the "positions" array for the server
function addPositionForServer(server,position) {
	index=connections[server].positions.indexOf(position)
	if (index == -1) {
		connections[server].positions.push(position)
	}
}

// Removes the given position from the "positions" array for the server
// After calling this, the caller usually checks if there is any positions
// left and if not, disconnects the socket and removes the entry from then
// connections object.
function removePositionForServer(server,position) {
	index=connections[server].positions.indexOf(position)
	if (index != -1) {
		connections[server].positions.splice(index,1)
	}
}

// Converts positions dict as given by Stream Deck SDK to a simple string used
// in the connections object
function positionFromCoordinates(c) {
	return c.column + "-" + c.row
}

/*
Connects to a given server.

This is usually triggered by an willAppear message coming from Stream Deck.

If there is an existing websocket, it will be used instead of creating a new
one, and the position will be added to its "positions" array.

message is used to send an initial message after connection is established.
Used with the initial `willAppear`message coming from the Stream Deck.

backend_only is used to handle server side disconnect, when it happens, we
call this method with backend_only to true, which creates a new socket without
changing any of the positions already registered.
*/
function connect(remoteServer,position,message,backend_only=false) {
	if (!remoteServer || remoteServer.length == 0)
		return

	// Make sure that key is disconnected from other connections
	for (var s in connections) {
		if (s === remoteServer) {
			continue
		}
		disconnect(s,position)
	}

	// The connection to this server already exists
	if (connections.hasOwnProperty(remoteServer) && (backend_only == false)) {
		addPositionForServer(remoteServer,position)
		if (!message)
			return

		// When starting up, all the keys are rapidly sent but the connection is
		// not available when keys after the very first one are added, so we
		// simply wait a bit and retry the send message
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

	// No socket exists (or it does and backend_only is true), so we create a
	// new one
	c = new WebSocket(remoteServer)
	if (backend_only) {
		// We are reconnecting, so keep existing object and just update
		// websocket
		connections[remoteServer].websocket=c
	}
	else {
		// This is a brand new connection, add the connection object to
		// connections
		connections[remoteServer] = {positions: [position],websocket: c}
	}

	// Connection handlers.

	// When the connection is established, we might have a message to send.
	// This is usually the "willAppear" message that triggered the connection
	c.onopen = function(evt) {
		console.log("Remote socket opened")
		if (message) {
			c.send(JSON.stringify(message))
		}
	}

	// Forward any incomming message to Stream Deck
	c.onmessage = function(evt) {
		j=JSON.parse(evt.data)
		console.log("Forwarding message")
		if (websocket && websocket.readyState) {
			console.log(evt)
			websocket.send(JSON.stringify(j))
		}
	}

	// Looks like server disconnected, reconnect with backend_only=true
	c.onclose = function() {
		if (connections.hasOwnProperty(key)) {
			connect(remoteServer,null,null,true)
		}
	}
}

/*
Disconnects a websocket

This method is usually called from a `willDisappear` message.

It does not actually disconnects the server unless there is no
positions listed for it.

We also send the message if the socket is available, usually the
`willDisappear` message.
*/
function disconnect(remoteServer,position,message=null) {
	if (connections.hasOwnProperty(remoteServer)) {
		c=connections[remoteServer].websocket;
		if (c.readyState == 1 && message) {
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

/*
Initial communication with the Stream Deck software.
*/
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
		/*
		willAppear usually triggers a connection to the remote socket, or
		reuse an existing one.
		*/
		else if(event == "willAppear")
		{
			var jsonPayload = jsonObj['payload'];
			var settings = jsonPayload['settings'];
			var coordinates = jsonPayload['coordinates'];
			if (settings.hasOwnProperty("remoteServer")) {
				connect(settings.remoteServer,positionFromCoordinates(coordinates),jsonObj)
			}
		}
		/*
		willDisappear usually triggers a disconnection from the remote socket,
		or unregister this key fromt the connection.
		*/
		else if(event == "willDisappear")
		{
			var jsonPayload = jsonObj['payload'];
			var settings = jsonPayload['settings'];
			var coordinates = jsonPayload['coordinates'];

			disconnect(settings.remoteServer,positionFromCoordinates(coordinates),jsonObj)
		}
		/*
		Every other message is simply forwarded to node-red, the condition is
		that the message must have a settings.remoteServer setting, which is the
		case for any key-related events.
		*/
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
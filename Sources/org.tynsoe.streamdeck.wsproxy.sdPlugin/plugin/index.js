var websocket = null;  // Websocket to Streamdeck
var connections = {};  // Dictionary maintaining connections for each key

function connect(coordinates,remoteServer,message) {
	row=coordinates.row;
	column=coordinates.column;

	key=row + "-" + column;

	// Close connection if it already exists
	if (connections.hasOwnProperty(key)) {
		c=connections[key];
		c.close()
	}

	// Create a new connection to the remote websocket
	c = new WebSocket(remoteServer)
	connections[key]=c

	// send willAppear message when connection is ready
	c.onopen = function() {
		console.log("Remote socket opened")
		if (message) {
			c.send(JSON.stringify(message))
		}
	}

	// Forward to StreamDeck incoming messages
	c.onmessage = function(evt) {
		console.log(evt)
		j=JSON.parse(evt.data)
		if (websocket && websocket.readyState) {
			websocket.send(JSON.stringify(j))
		}
	}
}

function disconnect(coordinates,message) {
	row=coordinates.row;
	column=coordinates.column;
	key=row + "-" + column;

	if (connections.hasOwnProperty(key)) {
		c=connections[key];
		if (c.readyState == 1) {
			c.send(JSON.stringify(message))
		}
		c.close()
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
		var action = jsonObj['action'];
		var context = jsonObj['context'];
	
		if(event == "didReceiveSettings")
		{
			var jsonPayload = jsonObj['payload'];
			var settings = jsonPayload['settings'];
			var coordinates = jsonPayload['coordinates'];

			connect(coordinates,settings.remoteServer,null)
		}
		else if(event == "willAppear")
		{
			var jsonPayload = jsonObj['payload'];
			var settings = jsonPayload['settings'];
			var coordinates = jsonPayload['coordinates'];
			if (settings.hasOwnProperty("remoteServer")) {
				connect(coordinates,settings.remoteServer,jsonObj)
			}
		}
		else if(event == "willDisappear")
		{
			var jsonPayload = jsonObj['payload'];
			var settings = jsonPayload['settings'];
			var coordinates = jsonPayload['coordinates'];

			disconnect(coordinates,jsonObj)
		}
		// If there is a key associated with the message, forward to remote websocket
		else if (jsonObj.hasOwnProperty("payload")) {
			if (jsonObj['payload'].hasOwnProperty("coordinates")) {
				key = jsonObj['payload']['coordinates']['row'] + "-" + jsonObj['payload']['coordinates']['column']
				c=connections[key]
				if (c && c.readyState == 1) {
					console.log(jsonObj)
					c.send(JSON.stringify(jsonObj))
				}
			}
		}		
	};

	websocket.onclose = function()
	{ 
		// Websocket is closed
	};
};
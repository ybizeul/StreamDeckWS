## About

StreamDeckWS is a WebSocket proxy for Elgato Stream Deck.

Now you can send and receive messages for your StreamDeck from remote servers
like Node-RED websocket plugin.

Not only will you receive key and other events in Node-RED, but you will also
be able to build messages to change button title, image, etc.

## Configuration

Simply put the address of the remote server as `ws://remote_server`

![screen1](screen1.png)

`id` can be used to identify each button. It can be found in the `settings` object of the payload to the remote server.

Do not set something in "Title" unless you don't want to be able to change it through the remote server

## Node-RED

TODO : add samples of configuration with Node-RED websocket node
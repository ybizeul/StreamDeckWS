## About

`node-red-contrib-streamdeck-ws` is a [Node-RED](https://nodered.org) module intended to be used in conjuction with [Stream Deck WS](https://github.com/ybizeul/StreamDeckWS) module for [Stream Deck](https://www.elgato.com/en/gaming/stream-deck)

## Purpose

[Stream Deck WS](https://github.com/ybizeul/StreamDeckWS) acts like a proxy and forwards key events from the [Stream Deck](https://www.elgato.com/en/gaming/stream-deck) to a Web Socket service of your choice. A very popular way to run a quick and flexible Web Socket server is by using [Node-RED](https://nodered.org) and its standard `websocket in/out` node.

You can set it all up in [Node-RED](https://nodered.org) without using `node-red-contrib-streamdeck-ws`, but it makes things a little bit harder.

With `node-red-contrib-streamdeck-ws`, you place a `sd input` node after your `websocket in` and format the response event in a `sd output` node before `websocket out`, and you can configure the returned key state in the node properties.

![ScreenShot 1](https://github.com/ybizeul/StreamDeckWS/raw/main/doc/images/nodered_plugin_02.png)

![ScreenShot 2](https://github.com/ybizeul/StreamDeckWS/raw/main/doc/images/nodered_plugin_01.png)
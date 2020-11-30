module.exports = function(RED) {
    function Output(config) {
        RED.nodes.createNode(this,config);
        var node = this;
        node.on('input', function(msg) {
            fcontext = this.context().flow

            // Payload
            if (typeof(msg.payload) != "object") {
                msg.payload={}
            }
            if (!msg.payload.hasOwnProperty("payload") || typeof(msg.payload.payload) != "object") {
                msg.payload.payload={}
            }
            if (config["streamdeckID"]) {
                msg.payload.context = fcontext.streamdeckContexts[config["streamdeckID"]]
            }
            else {
                if (!fcontext.hasOwnProperty("streamdeckContexts") || !fcontext.streamdeckContexts.hasOwnProperty(msg.streamdeckID)) {
                    this.status({fill:"red",shape:"ring",text:"Context is unknown"});
                    return
                }
                msg.payload.context = fcontext.streamdeckContexts[msg.streamdeckID]
            }

            // State

            if (!(config["title"] || config["image"])) {
                msg.payload.event = "setState"
            }

            var t = null
            if (config["state-type"] == "msg") {
                t = msg
            }
            else if (config["state-type"] == "flow") {
                t = this.context().flow
            }
            else if (config["state-type"] == "global") {
                t = this.context().global
            }

            if (t != null) {
                v = t[config["state"]]
            }
            else {
                v = config["state"]
            }

            if (typeof(v) == "string") {
                if (v === "on") {
                    msg.payload.payload.state = 1
                }
                else if (v === "off") {
                    msg.payload.payload.state = 0
                }
                else {
                    v=Number(v)
                    if (isNaN(v)){
                        this.status({fill:"red",shape:"ring",text:"Cannot convert state to number"});
                        console.log("Cannot convert state to number")
                    }
                    else {
                        if (v === 0) {
                            msg.payload.payload.state = 0
                        }
                        else {
                            msg.payload.payload.state = 1
                        }
                    }
                }
            }
            else if (typeof(v) == "number") {
                if (v === 0) {
                    msg.payload.payload.state=0
                }
                else {
                    msg.payload.payload.state=1
                }
            }
            else if (typeof(v) == "boolean") {
                if (v === true) {
                    msg.payload.payload.state=1
                }
                else {
                    msg.payload.payload.state=0
                }
            }

            if (config["title"]) {
                msg.payload.event = "setTitle"

                var t = null
                if (config["title-type"] == "msg") {
                    t = msg
                }
                else if (config["title-type"] == "flow") {
                    t = this.context().flow
                }
                else if (config["title-type"] == "global") {
                    t = this.context().global
                }

                if (t != null) {
                    v = t[config["title"]]
                }
                else {
                    v = config["title"]
                }
                
                if (typeof(v) === "string") {
                    msg.payload.payload.title=v
                    this.status({fill:"green",shape:"dot",text:"Set Title"});
                }
                else {
                    this.status({fill:"red",shape:"ring",text:"title must be a string"});
                    console.log("title must be a string")
                }
            }
            else if (config["image"]) {
                msg.payload.event = "setImage"

                var t = null
                if (config["image-type"] == "msg") {
                    t = msg
                }
                else if (config["image-type"] == "flow") {
                    t = this.context().flow
                }
                else if (config["image-type"] == "flow") {
                    t = this.context().global
                }

                if (t != null) {
                    v = t[config["image"]]
                }
                else {
                    v = config["image"]
                }
                if (typeof(v) === "string") {
                    msg.payload.payload.title=v
                    this.status({fill:"green",shape:"dot",text:"Set Image"});
                }
                else {
                    this.status({fill:"red",shape:"ring",text:"image must be a base64 string"});
                    console.log("image must be a base64 string")
                }                
            }
           node.send(msg);
        });
    }
    RED.nodes.registerType("sd-output",Output);
}
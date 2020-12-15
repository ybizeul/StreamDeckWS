module.exports = function(RED) {
    function Output(config) {
        RED.nodes.createNode(this,config);
        var node = this;
        node.on('input', function(msg) {
            contexts = this.context().flow.get("streamdeckContexts")
	        msg_payload=msg.payload
            // Payload
            if (typeof(msg_payload) != "object") {
                msg_payload={}
            }
            if (!msg_payload.hasOwnProperty("payload") || typeof(msg_payload.payload) != "object") {
                msg_payload.payload={}
            }
            
            // Set context in event
            if (!contexts) {
                this.status({fill:"red",shape:"ring",text:"Context cache is empty"});
                console.log("Context cache is empty")
                return
            }

            if (config["streamdeckID"]) {
                if (!contexts[config["streamdeckID"]]) {
                    err="Context for '" + config["streamdeckID"] + "' is unknown"
                    this.status({fill:"red",shape:"ring",text:err});
                    console.log(err)
                    return
                }
                msg_payload.context = contexts[config["streamdeckID"]]
            }
            else {
                if (!msg_payload.streamdeckID) {
                    err="Message has no streamdeckID"
                    this.status({fill:"red",shape:"ring",text:err});
                    console.log(err)
                }
                msg_payload.context = contexts[msg.streamdeckID]
            }

            // State
            if (!(config["title"] || config["image"])) {
                msg_payload.event = "setState"
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
                    msg_payload.payload.state = 1
                }
                else if (v === "off") {
                    msg_payload.payload.state = 0
                }
                else {
                    v=Number(v)
                    if (isNaN(v)){
                        err="Cannot convert state '"+ v +"' to number"
                        this.status({fill:"red",shape:"ring",text:err});
                        console.log(err)
                        return
                    }
                    else {
                        if (v === 0) {
                            msg_payload.payload.state = 0
                        }
                        else {
                            msg_payload.payload.state = 1
                        }
                    }
                }
                this.status({fill:"green",shape:"dot",text:"Set State " + msg_payload.payload.state});
            }
            else if (typeof(v) == "number") {
                if (v === 0) {
                    msg_payload.payload.state=0
                }
                else {
                    msg_payload.payload.state=1
                }
                this.status({fill:"green",shape:"dot",text:"Set State " + msg_payload.payload.state});
            }
            else if (typeof(v) == "boolean") {
                if (v === true) {
                    msg_payload.payload.state=1
                }
                else {
                    msg_payload.payload.state=0
                }
                this.status({fill:"green",shape:"dot",text:"Set State " + msg_payload.payload.state});
            }

            // Title
            if (config["title"]) {
                msg_payload.event = "setTitle"

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
                    msg_payload.payload.title=v
                    this.status({fill:"green",shape:"dot",text:"Set Title '" + v + "'"});
                }
                else {
                    err=`Title must be a string, not a ${typeof(v)}`
                    this.status({fill:"red",shape:"ring",text:err});
                    console.log(err)
		            node.warn(v)
                }
            }

            // Image
            else if (config["image"]) {
                msg_payload.event = "setImage"

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
                    msg_payload.payload.image=v
                    this.status({fill:"green",shape:"dot",text:"Set Image"});
                }
                else {
                    err="Image must be a base64 string"
                    this.status({fill:"red",shape:"ring",text:err});
                    console.log(err)
                }                
            }
           msg.payload=msg_payload
           node.send(msg);
        });
    }
    RED.nodes.registerType("sd-output",Output);
}
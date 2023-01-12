module.exports = function(RED) {
    function Input(config) {
        RED.nodes.createNode(this,config);
        var node = this;
        node.on('input', function(msg) {
            msg.payload=JSON.parse(msg.payload)
            contexts = this.context().global.get("streamdeckContexts")
            if (!contexts) {
                contexts = {}
            }
            sd_id=msg.payload.payload.settings.id
            if (! sd_id) {
                sd_id = "__STREAMDECK_KEY__" 
                    + msg.payload.payload.coordinates.column
                    + "_"
                    + msg.payload.payload.coordinates.row
            }
            contexts[sd_id]=msg.payload.context
            this.context().global.set("streamdeckContexts",contexts)
            msg.streamdeckID = sd_id
            msg.event = msg.payload.event
            node.send(msg);
        });
    }
    RED.nodes.registerType("sd-input",Input);
}
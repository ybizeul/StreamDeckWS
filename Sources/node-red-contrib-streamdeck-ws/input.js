module.exports = function(RED) {
    function Input(config) {
        RED.nodes.createNode(this,config);
        var node = this;
        node.on('input', function(msg) {
            msg.payload=JSON.parse(msg.payload)
            contexts = this.context().flow.get("streamdeckContexts")
            if (!contexts) {
                contexts = {}
            }
            contexts[msg.payload.payload.settings.id]=msg.payload.context
            this.context().flow.set("streamdeckContexts",contexts)
            msg.streamdeckID = msg.payload.payload.settings.id
            node.send(msg);
        });
    }
    RED.nodes.registerType("sd-input",Input);
}
module.exports = function(RED) {
    function Input(config) {
        RED.nodes.createNode(this,config);
        var node = this;
        node.on('input', function(msg) {
            msg.payload=JSON.parse(msg.payload)
            fcontext = this.context().flow
            if (! fcontext.hasOwnProperty("streamdeckContexts")) {
                fcontext.streamdeckContexts = {}
            }
            fcontext.streamdeckContexts[msg.payload.payload.settings.id]=msg.payload.context
            msg.streamdeckID = msg.payload.payload.settings.id
            node.send(msg);
        });
    }
    RED.nodes.registerType("sd-input",Input);
}
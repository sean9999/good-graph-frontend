import { websockUrl } from "./constants";

//  Soccer is a simple wrapper around WebSocket
class Soccer {
    url;
    ws;
    messageHandler;
    connectionAttempts;
    constructor(url){
        this.url = url;
        this.init();
        this.connectionAttempts = 0;
    }
    init(){
        this.connectionAttempts++;
        this.ws = new WebSocket( this.url );
        this.ws.addEventListener("message", ev => {
            const le_msg = JSON.parse(ev.data);
            if (this.messageHandler !== undefined) {
                this.messageHandler(le_msg);
            }
        });
        this.ws.addEventListener("close", console.info.bind(this.ws));
        this.ws.addEventListener("error", console.error.bind(this.ws));
        return this.ws.readyState;
    }
    send(subject="message") {
        if (this.ws.CLOSED === this.ws.readyState) {
            console.error("can't send on a closed connection");
            //this.retry(msgType, msg, n);
            this.reconnect();
        } else {
            const m = {
                "subject": subject,
                "peer": null,
                "relationship": null, 
                "mid": 0,
                "tid": 0
            };
            console.log(m);
            this.ws.send( JSON.stringify( m ) );
        }
    }
    retry(msgType="message", msg="", n=0) {
        this.reconnect();
        this.send(msgType, msg, n);
    }
    reconnect() {
        console.info("reconnecting");
        return this.init();
    }
    onMessage(fn) {
        this.messageHandler = fn;
    }
}

const soccer = new Soccer( websockUrl() );
export default soccer;


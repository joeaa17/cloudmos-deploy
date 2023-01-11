const axios = require("axios");

export class EventEmitter {

    constructor() {
        this.events = {};
    }

    on(event, listener) {
        if (typeof this.events[event] !== "object") {
            this.events[event] = [];
        }
        this.events[event].push(listener);
    }

    once(event, listener) {
        this.on(event, function g(...args) {
            this.removeListener(event, g);
            listener.apply(this, args);
        });
    }

    removeListener(event, listener) {
        if (typeof this.events[event] === "object") {
            const idx = this.events[event].indexOf(listener);
            if (idx > -1) {
                this.events[event].splice(idx, 1);
            }
        }
    }

    emit(event, ...args) {
        if (typeof this.events[event] === "object") {
            this.events[event].forEach((listener) => listener.apply(this, args));
        }
    }

    listenerCount(event) {
        return this.events[event] ? this.events[event].length : 0;
    }

}


export default class child_process {
  static spawn(command, args, options) {
    return new ChildProcess(command, args, options);
  }
}

export class ChildProcess {
    constructor(command, args, options) {
        this.command = command;
        this.args = args;
        this.options = options;
        this.stdout = new EventEmitter();
        this.stderr = new EventEmitter();
        this.e = new EventEmitter();
    }
    send(data) {
        console.log("ChildProcess.send", data);

        if (data.type === "websocket") {
            const url = data.url;
            const certPem = data.certPem;
            const keyPem = data.keyPem;

            const ws = new WebSocket(url, {
                cert: certPem,
                key: keyPem
            });

            ws.on("open", () => {
                console.log("WebSocket open");
            });

            ws.on("message", (data) => {
                this.e.emit("message", {
                    type: "websocket",
                    id: data.id,
                    message: data
                });
            });

            ws.on("close", () => {
                console.log("WebSocket close");
            });

            ws.on("error", (err) => {
                console.log("WebSocket error", err);
            });

        }

        if (data.type === "fetch" && data.method === "GET") {
            axios.get(data.url, {
                headers: data.headers
            }).then((res) => {
                this.e.emit("message", {
                    type: "fetch",
                    id: data.id,
                    response: {
                        body: res.data
                    }
                });
            }).catch((err) => {
                this.e.emit("message", {
                    type: "fetch",
                    id: data.id,
                    error: err
                });
            });
        }

        if (data.type === "fetch" && data.method === "POST") {
            axios.post(data.url, data.body, {
                headers: data.headers
            }).then((res) => {
                this.e.emit("message", {
                    type: "fetch",
                    id: data.id,
                    response: {
                        body: res.data
                    }
                });
            }).catch((err) => {
                this.e.emit("message", {
                    type: "fetch",
                    id: data.id,
                    error: err
                });
            });
        }
        if (data.type === "fetch" && data.method === "PUT") {
            axios.put(data.url, data.body, {
                headers: data.headers
            }).then((res) => {
                this.e.emit("message", {
                    type: "fetch",
                    id: data.id,
                    response: {
                        body: res.data
                    }
                });
            }).catch((err) => {
                this.e.emit("message", {
                    type: "fetch",
                    id: data.id,
                    error: err
                });
            });
        }

    }
    kill() {
        console.log("ChildProcess.kill");
    }

}

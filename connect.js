const ngrok = require("@ngrok/ngrok");
const { format_trackID } = require("./utils.js")
const { WebSocketServer } = require("ws");
const { store } = require("./main.js");
const { networkInterfaces } = require("os")

const {
    togglePlay,
    playNext,
    playPrevious
} = require("./mediaScripts.js");

var ngrok_listener = null;
var wss = null;
const ngrokSetup = async function (domain, authtoken) {
    try {
        // Start ngrok and expose a local port (e.g., 5050)
        ngrok_listener = await ngrok.forward({
            authtoken: authtoken,
            proto: 'http',       // Protocol to use (http or tcp)
            addr: 5050,          // Port on which your WebSocket server is running
            hostname: domain,
        });
        console.log("NGROK:", ngrok_listener.url());
        return ngrok_listener.url();
    } catch (err) {
        ngrok_listener = null;
        console.error('Error starting ngrok:', err);
    }
};

const ngrokShutdown = async function () {
    try {
        await ngrok_listener.close(); // stops all
        ngrok_listener = null;
    } catch (err) {
        console.error('Could not shutdown ngrok:', err);
    }
};

const webSocketSetup = (current_song, spot_instance) => {
    wss = new WebSocketServer({ port: 5050 });
    wss.on('connection', (ws) => {
        if (current_song.setUp)
            format_trackID(current_song.trackID, spot_instance, 1).then((data) => {
                ws.send(JSON.stringify({ type: "message", ...current_song, album: data }));
            });

        ws.on('error', (e) => { console.error("Error:", e) });
        ws.on('close', (e) => {
            console.error("Closed:", e);
            clearInterval(keepAlive);
        });

        ws.on('message', function message(data) {
            /*
            Actions supported: "next", "prev", "play"
            */
            const action = data.toString();
            if (action === 'next')
                playNext({ store, spot_instance });
            if (action === 'prev')
                playPrevious({ store, spot_instance })
            if (action === 'play')
                togglePlay({ store, spot_instance });
            console.log("Received: %s", data)
        });

        const keepAlive = setInterval(() => {
            ws.send(JSON.stringify({ type: "ping" }));
        }, 240000);// 4 minutes
    });
}

const webSocketShutdown = () => {
    try {
        wss.close();
        wss = null;
    } catch (err) {
        console.error('Could not shutdown websocket server:', err);
    }
}

const getClients = () => {
    return wss?.clients ?? new Set();
}

const notify = (message) => {
    if (wss === null) return;
    console.log(wss.clients.size)
    wss.clients.forEach((client) => {
        client.send(JSON.stringify({ type: "message", ...message }));
    })
}

const fetchIp = () => {
    console.log(ngrok_listener.url());
    if (ngrok_listener !== null)
        return ngrok_listener.url();

    // Fetch local wifi ip
    const nets = networkInterfaces();
    const results = Object.create(null); // Or just '{}', an empty object

    for (const name of Object.keys(nets)) {
        for (const net of nets[name]) {
            // Skip over non-IPv4 and internal (i.e. 127.0.0.1) addresses
            // 'IPv4' is in Node <= 17, from 18 it's a number 4 or 6
            const familyV4Value = typeof net.family === 'string' ? 'IPv4' : 4
            if (net.family === familyV4Value && !net.internal) {
                if (!results[name]) {
                    results[name] = [];
                }
                results[name].push(net.address);
            }
        }
    }
    console.log(results['en0']);
    return "ws://" + results['en0'] + ":5050";
}

module.exports.ngrokSetup = ngrokSetup;
module.exports.ngrokShutdown = ngrokShutdown;
module.exports.webSocketSetup = webSocketSetup;
module.exports.webSocketShutdown = webSocketShutdown;
module.exports.getClients = getClients;
module.exports.notify = notify;
module.exports.fetchIp = fetchIp;

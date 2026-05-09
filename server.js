const net = require('net');
const fs = require('fs');

// Our "Database" in memory
let pokedex = [
    { id: 1, name: "Bulbasaur", type: "Grass", level: 5 },
    { id: 2, name: "Charmander", type: "Fire", level: 5 },
    { id: 3, name: "Squirtle", type: "Water", level: 5 }
];

const server = net.createServer((socket) => {
    socket.on('data', (data) => {
        const requestText = data.toString();
        
        // Split headers from body (mandatory for POST requests)
        const [headerPart, bodyPart] = requestText.split('\r\n\r\n');
        const lines = headerPart.split('\r\n');
        const [method, path] = lines[0].split(' ');

        console.log(`📩 Incoming Request: ${method} ${path}`);

        // --- ROUTE 1: Static Content (Main Web) ---
        if (method === 'GET' && (path === '/' || path === '/index.html')) {
            fs.readFile('index.html', (err, content) => {
                if (err) {
                    socket.write("HTTP/1.1 404 Not Found\r\n\r\nFile not found");
                } else {
                    socket.write("HTTP/1.1 200 OK\r\n");
                    socket.write("Content-Type: text/html\r\n");
                    socket.write(`Content-Length: ${content.length}\r\n`);
                    socket.write("\r\n");
                    socket.write(content);
                }
                socket.end();
            });
        } 
        // --- ROUTE 2: API (List all Pokemon) ---
        else if (method === 'GET' && path === '/pokemon') {
            const body = JSON.stringify(pokedex);
            socket.write("HTTP/1.1 200 OK\r\n");
            socket.write("Content-Type: application/json\r\n");
            socket.write(`Content-Length: ${Buffer.byteLength(body)}\r\n`);
            socket.write("\r\n");
            socket.write(body);
            socket.end();
        }
        // --- ROUTE 3: API (Catch/Create new Pokemon) ---
        else if (method === 'POST' && path === '/pokemon') {
            try {
                const newPoke = JSON.parse(bodyPart);
                pokedex.push(newPoke);
                console.log(`✨ Successfully caught: ${newPoke.name}`);

                const responseMessage = "Pokemon added to Pokedex";
                socket.write("HTTP/1.1 201 Created\r\n");
                socket.write(`Content-Length: ${responseMessage.length}\r\n`);
                socket.write("\r\n");
                socket.write(responseMessage);
            } catch (error) {
                socket.write("HTTP/1.1 400 Bad Request\r\n\r\nInvalid JSON");
            }
            socket.end();
        }
        // --- ROUTE 4: Not Found ---
        else {
            const errorMsg = "Resource not found";
            socket.write("HTTP/1.1 404 Not Found\r\n");
            socket.write(`Content-Length: ${errorMsg.length}\r\n`);
            socket.write("\r\n");
            socket.write(errorMsg);
            socket.end();
        }
    });
});

// Start the server
const PORT = 3000;
const HOST = '127.0.0.1';
server.listen(PORT, HOST, () => {
    console.log(`🔴 Pokedex Server running at http://${HOST}:${PORT}`);
});
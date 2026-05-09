const net = require('net');
const fs = require('fs');

let pokedex = [
    { id: 1, name: "Bulbasaur", type: "Grass", level: 5 },
    { id: 2, name: "Charmander", type: "Fire", level: 5 },
    { id: 3, name: "Squirtle", type: "Water", level: 5 }
];

const server = net.createServer((socket) => {
    socket.on('data', (data) => {
        const requestText = data.toString();
        const lines = requestText.split('\r\n');
        const [method, path] = lines[0].split(' ');

        console.log(`🎮 Solicitud Pokédex: ${method} ${path}`);

        // Main Web
        if (method === 'GET' && (path === '/' || path === '/index.html')) {
            fs.readFile('index.html', (err, content) => {
                if (err) {
                    socket.write("HTTP/1.1 404 Not Found\r\n\r\n");
                } else {
                    socket.write("HTTP/1.1 200 OK\r\nContent-Type: text/html\r\n\r\n");
                    socket.write(content);
                }
                socket.end();
            });
        } 
        // Api for all the pokemon
        else if (method === 'GET' && path === '/pokemon') {
            const body = JSON.stringify(pokedex);
            socket.write("HTTP/1.1 200 OK\r\n");
            socket.write("Content-Type: application/json\r\n");
            socket.write(`Content-Length: ${Buffer.byteLength(body)}\r\n`);
            socket.write("\r\n");
            socket.write(body);
            socket.end();
        }
        else {
            socket.write("HTTP/1.1 404 Not Found\r\n\r\n");
            socket.end();
        }
    });
});

server.listen(3000, '127.0.0.1', () => {
    console.log('🔴 Servidor Pokédex listo en http://localhost:3000');
});
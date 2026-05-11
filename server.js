const net = require('net');
const fs = require('fs');

let pokedex = [
    { id: 1, name: "Bulbasaur", type: "Grass", level: 5 },
    { id: 2, name: "Charmander", type: "Fire", level: 5 },
    { id: 3, name: "Squirtle", type: "Water", level: 5 }
];

function writeLog(message) {
    const timestamp = new Date().toISOString();
    const logEntry = `[${timestamp}] ${message}\n`;
    fs.appendFile('access.log', logEntry, (err) => {
        if (err) console.error("Error writing to log file:", err);
    });
}

const server = net.createServer((socket) => {
    const clientIp = socket.remoteAddress;

    socket.on('data', (data) => {
        const requestText = data.toString();
        
        const [headerPart, bodyPart] = requestText.split('\r\n\r\n');
        const lines = headerPart.split('\r\n');
        
        if (!lines[0]) return;
        
        const [method, path] = lines[0].split(' ');

        if (path === '/favicon.ico') {
            socket.write("HTTP/1.1 404 Not Found\r\n\r\n");
            socket.end();
            return; 
        }
        
        console.log(`Incoming Request: ${method} ${path}`);
        writeLog(`${method} ${path} - Client: ${clientIp}`);

        if (path === '/' || path === '/index.html') {
            if (method === 'GET' || method === 'HEAD') {
                fs.readFile('index.html', (err, content) => {
                    if (err) {
                        writeLog(`ERROR: index.html not found`);
                        socket.write("HTTP/1.1 404 Not Found\r\n\r\nFile not found");
                    } else {
                        socket.write("HTTP/1.1 200 OK\r\n");
                        socket.write("Content-Type: text/html\r\n");
                        socket.write(`Content-Length: ${content.length}\r\n`);
                        socket.write("\r\n");
                        if (method === 'GET') socket.write(content);
                    }
                    socket.end();
                });
            } else {
                const msg = "Method Not Allowed";
                writeLog(`405 Method Not Allowed on ${path}`);
                socket.write("HTTP/1.1 405 Method Not Allowed\r\n");
                socket.write(`Allow: GET, HEAD\r\n`);
                socket.write(`Content-Length: ${msg.length}\r\n\r\n${msg}`);
                socket.end();
            }
        } 
        else if ((method === 'GET' || method === 'HEAD') && path === '/pokemon') {
            const body = JSON.stringify(pokedex);
            socket.write("HTTP/1.1 200 OK\r\n");
            socket.write("Content-Type: application/json\r\n");
            socket.write(`Content-Length: ${Buffer.byteLength(body)}\r\n`);
            socket.write("\r\n");
            if (method === 'GET') socket.write(body);
            socket.end();
        }
        else if ((method === 'GET' || method === 'HEAD') && path.startsWith('/pokemon/')) {
            const idToSearch = parseInt(path.split('/')[2]);
            const pokemon = pokedex.find(p => p.id === idToSearch);

            if (pokemon) {
                const body = JSON.stringify(pokemon);
                socket.write("HTTP/1.1 200 OK\r\n");
                socket.write("Content-Type: application/json\r\n");
                socket.write(`Content-Length: ${Buffer.byteLength(body)}\r\n\r\n`);
                if (method === 'GET') socket.write(body);
            } else {
                writeLog(`404 Not Found: Pokemon ID ${idToSearch}`);
                socket.write("HTTP/1.1 404 Not Found\r\n\r\nPokemon ID not found");
            }
            socket.end();
        }
        else if (method === 'POST' && path === '/pokemon') {
            try {
                const newPoke = JSON.parse(bodyPart);
                pokedex.push(newPoke);
                console.log(`Successfully caught: ${newPoke.name}`);
                writeLog(`CREATED: Pokemon ${newPoke.name}`);

                const responseMessage = "Pokemon added to Pokedex";
                socket.write("HTTP/1.1 201 Created\r\n");
                socket.write(`Content-Length: ${responseMessage.length}\r\n`);
                socket.write("\r\n");
                socket.write(responseMessage);
            } catch (error) {
                writeLog(`BAD REQUEST: Invalid JSON on POST`);
                socket.write("HTTP/1.1 400 Bad Request\r\n\r\nInvalid JSON");
            }
            socket.end();
        }
        else if (method === 'DELETE' && path.startsWith('/pokemon/')) {
            const idToDelete = parseInt(path.split('/')[2]);
            const initialLength = pokedex.length;
            
            pokedex = pokedex.filter(p => p.id !== idToDelete);

            if (pokedex.length < initialLength) {
                const msg = `Pokemon with ID ${idToDelete} released.`;
                writeLog(`DELETED: Pokemon ID ${idToDelete}`);
                socket.write("HTTP/1.1 200 OK\r\n");
                socket.write(`Content-Length: ${msg.length}\r\n\r\n${msg}`);
            } else {
                writeLog(`404 Not Found on DELETE: ID ${idToDelete}`);
                socket.write("HTTP/1.1 404 Not Found\r\n\r\nID not found");
            }
            socket.end();
        }
        else if (method === 'PUT' && path.startsWith('/pokemon/')) {
            const idToUpdate = parseInt(path.split('/')[2]);
            const index = pokedex.findIndex(p => p.id === idToUpdate);

            if (index !== -1) {
                try {
                    const updatedData = JSON.parse(bodyPart);
                    pokedex[index] = { ...pokedex[index], ...updatedData };
                    
                    const msg = `Pokemon ID ${idToUpdate} updated successfully.`;
                    writeLog(`UPDATED: Pokemon ID ${idToUpdate}`);
                    socket.write("HTTP/1.1 200 OK\r\n");
                    socket.write(`Content-Length: ${msg.length}\r\n\r\n${msg}`);
                } catch (e) {
                    writeLog(`BAD REQUEST: Invalid JSON on PUT ID ${idToUpdate}`);
                    socket.write("HTTP/1.1 400 Bad Request\r\n\r\nInvalid JSON");
                }
            } else {
                writeLog(`404 Not Found on PUT: ID ${idToUpdate}`);
                socket.write("HTTP/1.1 404 Not Found\r\n\r\nID not found");
            }
            socket.end();
        }
        else {
            const errorMsg = "Resource not found";
            writeLog(`404 Not Found: ${path}`);
            socket.write("HTTP/1.1 404 Not Found\r\n");
            socket.write(`Content-Length: ${errorMsg.length}\r\n`);
            socket.write("\r\n");
            socket.write(errorMsg);
            socket.end();
        }
    });
});

const PORT = 3000;
const HOST = '127.0.0.1';
server.listen(PORT, HOST, () => {
    console.log(`Pokedex Server running at http://${HOST}:${PORT}`);
    writeLog(`SERVER STARTED at http://${HOST}:${PORT}`);
});
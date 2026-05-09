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
        
        // Safety check to prevent errors with empty requests
        if (!lines[0]) return;
        
        const [method, path] = lines[0].split(' ');

        console.log(`Incoming Request: ${method} ${path}`);

        // Main web
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
        // List all pokemon (get)
        else if (method === 'GET' && path === '/pokemon') {
            const body = JSON.stringify(pokedex);
            socket.write("HTTP/1.1 200 OK\r\n");
            socket.write("Content-Type: application/json\r\n");
            socket.write(`Content-Length: ${Buffer.byteLength(body)}\r\n`);
            socket.write("\r\n");
            socket.write(body);
            socket.end();
        }
        // Get a specific pokemon (get by id)
        else if (method === 'GET' && path.startsWith('/pokemon/')) {
            const idToSearch = parseInt(path.split('/')[2]);
            const pokemon = pokedex.find(p => p.id === idToSearch);

            if (pokemon) {
                const body = JSON.stringify(pokemon);
                socket.write("HTTP/1.1 200 OK\r\n");
                socket.write("Content-Type: application/json\r\n");
                socket.write(`Content-Length: ${Buffer.byteLength(body)}\r\n\r\n`);
                socket.write(body);
            } else {
                socket.write("HTTP/1.1 404 Not Found\r\n\r\nPokemon ID not found");
            }
            socket.end();
        }
        // Catch a pokemon (create)
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
        // Release a pokemon (delete)
        else if (method === 'DELETE' && path.startsWith('/pokemon/')) {
            const idToDelete = parseInt(path.split('/')[2]);
            const initialLength = pokedex.length;
            
            // Filter the array to remove the pokemon with that ID
            pokedex = pokedex.filter(p => p.id !== idToDelete);

            if (pokedex.length < initialLength) {
                const msg = `Pokemon with ID ${idToDelete} released.`;
                socket.write("HTTP/1.1 200 OK\r\n");
                socket.write(`Content-Length: ${msg.length}\r\n\r\n${msg}`);
            } else {
                socket.write("HTTP/1.1 404 Not Found\r\n\r\nID not found");
            }
            socket.end();
        }
        // Level up a pokemon (PUT)
        else if (method === 'PUT' && path.startsWith('/pokemon/')) {
            const idToUpdate = parseInt(path.split('/')[2]);
            const index = pokedex.findIndex(p => p.id === idToUpdate);

            if (index !== -1) {
                try {
                    const updatedData = JSON.parse(bodyPart);
                    // Merging existing data with updated data
                    pokedex[index] = { ...pokedex[index], ...updatedData };
                    
                    const msg = `Pokemon ID ${idToUpdate} updated successfully.`;
                    socket.write("HTTP/1.1 200 OK\r\n");
                    socket.write(`Content-Length: ${msg.length}\r\n\r\n${msg}`);
                } catch (e) {
                    socket.write("HTTP/1.1 400 Bad Request\r\n\r\nInvalid JSON");
                }
            } else {
                socket.write("HTTP/1.1 404 Not Found\r\n\r\nID not found");
            }
            socket.end();
        }
        // Not found
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
    console.log(`Pokedex Server running at http://${HOST}:${PORT}`);
});
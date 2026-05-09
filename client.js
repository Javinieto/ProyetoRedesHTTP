const net = require('net');
const readline = require('readline');

const rl = readline.createInterface({
    input: process.stdin,
    output: process.stdout
});

/**
 * Sends a manual HTTP request over a TCP socket
 * @param {string} method - HTTP Verb (GET, POST, etc.)
 * @param {string} path - Resource path (/pokemon)
 * @param {object} body - Optional data to send as JSON
 */
function sendRequest(method, path, body = null) {
    const client = net.createConnection({ port: 3000, host: '127.0.0.1' }, () => {
        console.log(`\n🚀 Connecting to server... Sending ${method} request to ${path}`);

        // 1. Build the Start Line
        let request = `${method} ${path} HTTP/1.1\r\n` +
                      `Host: localhost:3000\r\n` +
                      `Connection: close\r\n`;

        // 2. Add Headers and Body if necessary
        if (body) {
            const bodyData = JSON.stringify(body);
            request += `Content-Type: application/json\r\n` +
                       `Content-Length: ${Buffer.byteLength(bodyData)}\r\n`;
            request += `\r\n${bodyData}`; // Blank line + Body
        } else {
            request += `\r\n`; // Blank line to end headers
        }

        client.write(request);
    });

    // 3. Handle Server Response
    client.on('data', (data) => {
        console.log('\n--- SERVER RESPONSE ---');
        console.log(data.toString());
        console.log('-----------------------\n');
        rl.close();
    });

    client.on('error', (err) => {
        console.error('❌ Connection Error:', err.message);
        rl.close();
    });
}

// --- POKÉDEX CLI MENU ---
console.log("============================");
console.log("    POKÉDEX TERMINAL CLI    ");
console.log("============================");
console.log("1. List all Pokémon (GET)");
console.log("2. Catch a new Pokémon (POST)");
console.log("3. Release a Pokémon (DELETE)");
console.log("4. Level up a Pokémon (PUT)");
console.log("5. Exit");

rl.question('\nSelect an option: ', (choice) => {
    switch (choice) {
        case '1':
            sendRequest('GET', '/pokemon');
            break;
        case '2':
            // Ask the user for Pokemon details
            rl.question('Enter Pokemon Name: ', (name) => {
                rl.question('Enter Type: ', (type) => {
                    rl.question('Enter Level: ', (level) => {
                        const newPokemon = { 
                            id: Date.now(), // Generate a unique ID based on time
                            name: name, 
                            type: type, 
                            level: parseInt(level) 
                        };
                        sendRequest('POST', '/pokemon', newPokemon);
                    });
                });
            });
            break;
        case '3':
            rl.question('Enter the ID of the Pokemon to release: ', (id) => {
                sendRequest('DELETE', `/pokemon/${id}`);
            });
            break;
        case '4':
            rl.question('Enter the ID of the Pokemon to edit: ', (id) => {
                rl.question('Enter New Name: ', (name) => {
                    rl.question('Enter New Level: ', (level) => {
                        const updatedPokemon = { 
                            name: name, 
                            level: parseInt(level) 
                        };
                        sendRequest('PUT', `/pokemon/${id}`, updatedPokemon);
                    });
                });
            });
            break;
        case '5':
            console.log("Goodbye!");
            rl.close();
            break;
        default:
            console.log("Invalid option.");
            rl.close();
            break;
    }
});
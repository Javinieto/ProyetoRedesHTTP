const net = require('net');
const readline = require('readline');

const rl = readline.createInterface({
    input: process.stdin,
    output: process.stdout
});

let serverConfig = {
    host: '127.0.0.1',
    port: 3000,
    customHeader: ""
};

function sendRequest(method, path, body = null) {
    const client = net.createConnection({ port: serverConfig.port, host: serverConfig.host }, () => {
        console.log(`\nConnecting to ${serverConfig.host}:${serverConfig.port}...`);
        console.log(`Sending ${method} request to ${path}`);

        let request = `${method} ${path} HTTP/1.1\r\n` +
                      `Host: ${serverConfig.host}:${serverConfig.port}\r\n` +
                      `Connection: close\r\n`;

        if (serverConfig.customHeader) {
            request += `${serverConfig.customHeader}\r\n`;
        }

        if (body && method !== 'HEAD') {
            const bodyData = JSON.stringify(body);
            request += `Content-Type: application/json\r\n` +
                       `Content-Length: ${Buffer.byteLength(bodyData)}\r\n\r\n` +
                       bodyData;
        } else {
            request += `\r\n`;
        }

        client.write(request);
    });

    client.on('data', (data) => {
        console.log('\n--- SERVER RESPONSE ---');
        console.log(data.toString());
        console.log('-----------------------\n');
        showMenu(); 
    });

    client.on('error', (err) => {
        console.error('\nConnection Error:', err.message);
        showMenu();
    });
}

function showMenu() {
    console.log("============================");
    console.log(`     POKÉDEX TERMINAL CLI    `);
    console.log(`     Connected to: ${serverConfig.host}:${serverConfig.port}`);
    console.log(`     Header: ${serverConfig.customHeader || "None"}`);
    console.log("============================");
    console.log("1. List all Pokémon (GET)");
    console.log("2. Get Headers Only (HEAD)");
    console.log("3. Catch a new Pokémon (POST)");
    console.log("4. Release a Pokémon (DELETE)");
    console.log("5. Level up a Pokémon (PUT)");
    console.log("6. Search Pokémon by ID (GET)");
    console.log("7. Change Server Settings (URL/Port)");
    console.log("8. Set Custom Header");
    console.log("0. Exit");

    rl.question('\nSelect an option: ', (choice) => {
        switch (choice) {
            case '1':
                sendRequest('GET', '/pokemon');
                break;
            case '2':
                sendRequest('HEAD', '/pokemon');
                break;
            case '3':
                rl.question('Enter Pokemon Name: ', (name) => {
                    rl.question('Enter Type: ', (type) => {
                        rl.question('Enter Level: ', (level) => {
                            const newPokemon = { 
                                id: Date.now(), 
                                name: name, 
                                type: type, 
                                level: parseInt(level) 
                            };
                            sendRequest('POST', '/pokemon', newPokemon);
                        });
                    });
                });
                break;
            case '4':
                rl.question('Enter the ID of the Pokemon to release: ', (id) => {
                    sendRequest('DELETE', `/pokemon/${id}`);
                });
                break;
            case '5':
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
            case '6':
                rl.question('Enter the ID of the Pokemon you want to find: ', (id) => {
                    sendRequest('GET', `/pokemon/${id}`);
                });
                break;
            case '7':
                console.log("\n--- SERVER SETTINGS ---");
                rl.question(`Enter new Host/IP (current: ${serverConfig.host}): `, (newHost) => {
                    rl.question(`Enter new Port (current: ${serverConfig.port}): `, (newPort) => {
                        if (newHost.trim() !== "") serverConfig.host = newHost;
                        if (newPort.trim() !== "") {
                            const parsedPort = parseInt(newPort);
                            if (!isNaN(parsedPort)) serverConfig.port = parsedPort;
                        }
                        console.log(`\nSettings updated!`);
                        showMenu();
                    });
                });
                break;
            case '8':
                rl.question('Enter custom header (Key: Value): ', (header) => {
                    serverConfig.customHeader = header;
                    console.log("Custom header updated.");
                    showMenu();
                });
                break;
            case '0':
                console.log("Goodbye!");
                rl.close();
                process.exit();
                break;
            default:
                console.log("Invalid option.");
                showMenu();
                break;
        }
    });
}

showMenu();
const net = require('net');// Import the sockets

// Options for connection
const options = { 
    port: 80, 
    host: 'example.com' 
};

// Socket building
const client = net.createConnection(options, () => {
    console.log('✅ Conectado al servidor físico');

    // The HTTP petition
    const request = 
        "GET / HTTP/1.1\r\n" + 
        "Host: example.com\r\n" + 
        "Connection: close\r\n" + 
        "\r\n";

    // We send the string through a socket
    client.write(request);
});

// Wait for the server answer
client.on('data', (data) => {
    console.log('📩 Respuesta recibida:');
    console.log('--------------------------------');
    console.log(data.toString()); // Show  status, heder and html
    console.log('--------------------------------');
});

// Error management
client.on('error', (err) => {
    console.error('❌ Error en la conexión:', err.message);
});

client.on('end', () => {
    console.log('🔌 Conexión cerrada.');
});
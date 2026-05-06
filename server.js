const net = require('net');

// Build the server
const server = net.createServer((socket) => {
    console.log('¡Cliente conectado!');

    // We receive the client data
    socket.on('data', (data) => {
        const requestText = data.toString();
        console.log('--- PETICIÓN RECIBIDA ---');
        console.log(requestText);

        // Basic HTTP answer
        const response = 
            "HTTP/1.1 200 OK\r\n" +
            "Content-Type: text/plain\r\n" +
            "Content-Length: 12\r\n" +
            "\r\n" +
            "Hola Mundo!!";

        socket.write(response);
        socket.end(); // Close connection after theanswer
    });
});

// We heard the answer at port 3000
server.listen(3000, '127.0.0.1', () => {
    console.log('Servidor escuchando en http://localhost:3000');
});
// const cdnModel = require('../models/cdnModel');



const init = async (connection , req) => {
    const { socket } = connection;
    socket.send('hi from server')
    socket.on('message', message => {
        let data;
        try {
            data = JSON.parse(message);
        } catch (e) {
            return
        }
        switch (data.type) {
            case 'ping': {
                socket.send(JSON.stringify({type: 'pong'}))
                break;
            } 
            case 'loadgame':{

            }
        }

    })

    socket.on('close', () => {
        console.log('disconnected')
    })

   
}

module.exports = {
    init
}
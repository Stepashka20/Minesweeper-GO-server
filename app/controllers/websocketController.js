// const cdnModel = require('../models/cdnModel');



const init = async (connection , req) => {
    const { socket } = connection;
    const uid = req.query.uid;
    const games = req.mongo.collection('games');
    var game = await games.findOne({uid:uid});
    var userField = game.userField;
    console.log(game)
    socket.on('message', message => {
        let data;
        try {
            data = JSON.parse(message);
        } catch (e) {
            return
        }
        console.log(data)
        switch (data.type) {
            case 'ping': {
                socket.send(JSON.stringify({type: 'pong'}))
                break;
            } 
            case 'loadgame':{

            }
            case "open":{
                const cellNum = data.data;
                var field = game.field;
                if (field[cellNum] == -1) {
                    socket.send(JSON.stringify({type: 'gameover'}))
                    return
                }
                let minesCount = 0;
                let cellsCount = 0;
                let size = game.size;
                let cells = size * size;
                const x = cellNum % size;
                const y = Math.floor(cellNum / size);
                if (x > 0) {
                    if (field[cellNum - 1] == -1) minesCount++;
                }
                if (x < size - 1) {
                    if (field[cellNum + 1] == -1) minesCount++;
                }
                if (y > 0) {
                    if (field[cellNum - size] == -1) minesCount++;
                }
                if (y < size - 1) {
                    if (field[cellNum + size] == -1) minesCount++;
                }
                if (x > 0 && y > 0) {
                    if (field[cellNum - size - 1] == -1) minesCount++;
                }
                if (x > 0 && y < size - 1) {
                    if (field[cellNum + size - 1] == -1) minesCount++;
                }
                if (x < size - 1 && y > 0) {
                    if (field[cellNum - size + 1] == -1) minesCount++;
                }
                if (x < size - 1 && y < size - 1) {
                    if (field[cellNum + size + 1] == -1) minesCount++;
                }
                userField[cellNum] = minesCount;
                socket.send(JSON.stringify({type: 'open', data: {cellNum: cellNum, minesCount: minesCount,userField:userField}}))
                break;
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
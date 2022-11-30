// const cdnModel = require('../models/cdnModel');



const init = async (connection , req) => {
    const { socket } = connection;
    const uid = req.query.uid;
    const games = req.mongo.collection('games');
    const users = req.mongo.collection('users');

    const username = req.jwt.decode(req.headers.authorization.split(' ')[1]).username;
    const user = await users.findOne({username:username,game:uid});
    if (!user) {
        socket.send(JSON.stringify({type: 'error', message: 'Вы не в этой игре'}));
        socket.close();
        return;
    }
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
                socket.send(JSON.stringify({type: 'loadgame',game:game}));
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
                game.players.find(player => player.username == username).points += minesCount;
                userField[cellNum] = minesCount;
                socket.send(JSON.stringify({type: 'open', data: {cellNum: cellNum, minesCount: minesCount,userField:userField,points:game.players.find(player => player.username == username).points}}))
                break;
            }
            case "flag":{
                const cellNum = data.data;
                
                if (userField[cellNum] == -3) {
                    userField[cellNum] = 0;
                } else {
                    userField[cellNum] = -3;
                }
                
                socket.send(JSON.stringify({type: 'open', data: {cellNum: cellNum,userField:userField,points:game.players.find(player => player.username == username).points}}))
            }
        }

    })

    socket.on('close', () => {
        console.log('closed')
        //save full game

        games.updateOne({uid:uid},{$set:{userField:userField,players:game.players}});

    })

   
}

module.exports = {
    init
}
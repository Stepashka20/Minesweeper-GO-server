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
    var gameEnd = false;
    console.log(game)
    socket.on('message', async (message) => {
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
            // case 'loadgame':{
            //     if (!gameEnd)
            //     socket.send(JSON.stringify({type: 'loadgame',game:game}));
            //     break;
            // }
            case "open":{
                if (gameEnd) return
                const cellNum = data.data;
                var field = game.field;
                if (field[cellNum] == -1) {
                    gameEnd = true;
                    for (let i = 0; i < field.length; i++) {
                        if (field[i] == -1) userField[i] = -1;
                    }
                    game.players.find(player => player.username == username).points = 0;
                    users.updateOne({username:username},{$set:{game:null}});
                    socket.send(JSON.stringify({type: 'gameover',data:{cellNum:cellNum,userField: userField}}))
                    
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
                if (minesCount==0){
                    const arr = openZerosAround(cellNum);
                    // console.log(arr)
                    for (let i = 0; i < arr.length; i++) {
                        userField[arr[i]] = field[arr[i]];
                    }

                }
                socket.send(JSON.stringify({type: 'open', data: {cellNum: cellNum, minesCount: minesCount,userField:userField,points:game.players.find(player => player.username == username).points}}))
                checkWin()
                break;
            }
            case "flag":{
                if (gameEnd) return
                const cellNum = data.data;
                
                if (userField[cellNum] == -3) {
                    userField[cellNum] = -2;
                } else {
                    userField[cellNum] = -3;
                }
                
                socket.send(JSON.stringify({type: 'open', data: {cellNum: cellNum,userField:userField,points:game.players.find(player => player.username == username).points}}))
                //check if all mines are flagged and all other cells are opened
                checkWin();

                break;
            }
            case "leave":{
                users.updateOne({username:username},{$set:{game:null}});
                // socket.close();
                socket.send(JSON.stringify({type: 'leave'}))
                setTimeout(() => {
                    socket.close();
                },5000)
                break;
            }
        }

    })

    socket.on('close', () => {
        console.log('closed')
        //save full game

        games.updateOne({uid:uid},{$set:{userField:userField,players:game.players}});

    })

    const checkWin = async () => {
        let field = game.field;
        let minesCount = field.filter(cell => cell == -1).length;
        let rightFlagsCount = 0;
        for (let i = 0; i < field.length; i++) {
            if (field[i] == -1 && userField[i] == -3 ) rightFlagsCount++;
        }
        let notOpened = userField.filter(cell => cell == -2).length;
        if (minesCount == rightFlagsCount && notOpened == 0) {
            gameEnd = true;
            console.log("win")
            users.updateOne({username:username},{$set:{game:null}});

            // if (game.players.find(player => player.username == username).points > game.players.find(player => player.username == game.winner).points) {
            //     game.winner = username;
            // }

            const gameTime = (Date.now() - game.timeStart)
            if (gameTime<= game.timeBet*1000) {
                
                await users.updateOne({username:username},{
                    $inc:{
                        balance:game.reward,
                        // [`statistics.wins.${game.difficulty}`]:1,   //only for multiplayer
                        // [`statistics.games.${game.difficulty}`]:1,
                        [`statistics.bestTime.${game.difficulty}`]: user.statistics.bestTime[game.difficulty] < gameTime ? user.statistics.bestTime[game.difficulty] : gameTime
                    }
                });
                socket.send(JSON.stringify({type: 'win',data:{reward: true, sum: game.reward}}))
            } else {
                
                await users.updateOne({username:username},{
                    $inc:{
                        // [`statistics.losses.${game.difficulty}`]:1,  //only for multiplayer
                        // [`statistics.games.${game.difficulty}`]:1,
                        [`statistics.bestTime.${game.difficulty}`]: user.statistics.bestTime[game.difficulty] < gameTime ? user.statistics.bestTime[game.difficulty] : gameTime
                    }
                });
                socket.send(JSON.stringify({type: 'win',data:{reward: false}}))
            }

        }
    }

    const openZerosAround = (cellNum) => {
        let field = game.field;
        let size = game.size;


        let cellsToOpen = [cellNum];
        let cellsOpened = [];
        while (cellsToOpen.length > 0) {
            let cell = cellsToOpen.pop();
            cellsOpened.push(cell);
            if (field[cell] == 0) {
                const [x,y] = [cell % size,Math.floor(cell / size)];
                if (x > 0) {
                    if ( !cellsOpened.includes(cell - 1)) cellsToOpen.push(cell - 1);
                }
                if (x < size - 1) {
                    if (!cellsOpened.includes(cell + 1)) cellsToOpen.push(cell + 1);
                }
                if (y > 0) {
                    if ( !cellsOpened.includes(cell - size)) cellsToOpen.push(cell - size);
                }
                if (y < size - 1) {
                    if (!cellsOpened.includes(cell + size)) cellsToOpen.push(cell + size);
                }
                if (x > 0 && y > 0) {
                    if ( !cellsOpened.includes(cell - size - 1)) cellsToOpen.push(cell - size - 1);
                }
                if (x > 0 && y < size - 1) {
                    if ( !cellsOpened.includes(cell + size - 1)) cellsToOpen.push(cell + size - 1);
                }
                if (x < size - 1 && y > 0) {
                    if ( !cellsOpened.includes(cell - size + 1)) cellsToOpen.push(cell - size + 1);
                }
                if (x < size - 1 && y < size - 1) {
                    if ( !cellsOpened.includes(cell + size + 1)) cellsToOpen.push(cell + size + 1);
                }
            }
        }
        return cellsOpened;

    }

   
}

module.exports = {
    init
}
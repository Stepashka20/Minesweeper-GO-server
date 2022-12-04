const {multiplayerSocketService} = require('../services/multiplayerSocketService');

class NewConnection {
    constructor(connection , req) {
        return (async (connection , req) => {
            this.socket = connection.socket
            this.uid = req.query.uid;
            this.games = req.mongo.collection('games');
            this.users = req.mongo.collection('users');
            this.username = req.jwt.decode(req.headers.authorization.split(' ')[1]).username;
            this.game = await this.games.findOne({uid:this.uid});
            this.user = await this.users.findOne({username:this.username,game: this.uid});
            this.userField = this.game.userFields.find(userField => userField.username == this.username).field;
            this.send = async (data) => this.socket.send(JSON.stringify(data))
            if (!this.user || !this.game)
                throw new Error("Игра не найдена")

            if (this.game.mode == "multiplayer") {
                const players = this.game.players.map(player => player.username);
                if (players.length == 2 && !players.includes(this.username))
                    throw new Error("Игра уже заполнена")
                multiplayerSocketService().addPlayer(this.uid,this.socket, this.username,this.onStartGame.bind(this));
            }
            this.gameField = this.game.field;
            this.gameEnd = false
            this.socket.on('message', this.onMessage.bind(this))
            this.socket.on('close', this.onClose.bind(this))
            this.socket.on('error', this.onError.bind(this))
            
            return this;
        })(connection , req);
    }
    onStartGame(lobby){
        this.lobby = lobby;
        console.log(this.username + " start game")
        this.send({type:'startgame',data:{field:this.gameField,players:lobby.players.map(player => player.username)}})
    }
    onMessage(message) {
        try {
            message = JSON.parse(message);
        } catch (error) {
            return;
        }
        console.log(message)
        if (this[message.type])
            this[message.type](message);
    }  
    ping(message){
        this.send({type:'pong'})
        this.saveGame()
    }
    open(message){
        if (this.gameEnd) return
        const cellNum = message.data;
        var field = this.game.field;
        if (field[cellNum] == -1) {
            this.gameEnd = true;
            for (let i = 0; i < field.length; i++) {
                if (field[i] == -1) this.userField[i] = -1;
            }
            this.game.players.find(player => player.username == this.username).points = 0;
            this.users.updateOne({username:this.username},{$set:{game:null}});
            this.send({type: 'gameover',data:{cellNum:cellNum,userField: this.userField}})
            return
        }
        let minesCount = 0;
        let size = this.game.size;
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
        this.game.players.find(player => player.username == this.username).points += minesCount;
        this.userField[cellNum] = minesCount;
        if (minesCount==0){
            const arr = this.openZerosAround(cellNum);
            for (let i = 0; i < arr.length; i++) {
                this.userField[arr[i]] = field[arr[i]];
                this.game.players.find(player => player.username == this.username).points += field[arr[i]];
            }

        }
        this.send({type: 'open', data: {cellNum: cellNum, minesCount: minesCount,userField:this.userField,points:this.game.players.find(player => player.username == this.username).points}})
        this.checkWin()
    }
    flag(message){
        if (this.gameEnd) return
        const cellNum = message.data;
        
        if (this.userField[cellNum] == -3) {
            this.userField[cellNum] = -2;
        } else {
            this.userField[cellNum] = -3;
        }
        
        this.send({type: 'open', data: {cellNum: cellNum,userField:this.userField,points:this.game.players.find(player => player.username == this.username).points}})
        this.checkWin();
    }
    async leave(message){
        this.users.updateOne({username:this.username},{$set:{game:null}});
        this.send({type: 'leave'})
        this.socket.close();
    }
    saveGame(){
        this.games.updateOne({uid:this.uid},{$set:{userField:this.userField,players:this.game.players}});
    }
    onClose() {
        console.log('Connection closed')
        this.saveGame();
    }

    onError(err) {
        console.log(err)
    }
    openZerosAround = (cellNum) => {
        let field = this.game.field;
        let size = this.game.size;
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
    checkWin = async () => {
        let field = this.game.field;
        let minesCount = field.filter(cell => cell == -1).length;
        let rightFlagsCount = 0;
        for (let i = 0; i < field.length; i++) {
            if (field[i] == -1 && this.userField[i] == -3 ) rightFlagsCount++;
        }
        let notOpened = this.userField.filter(cell => cell == -2).length;
        if (minesCount == rightFlagsCount && notOpened == 0) {
            this.gameEnd = true;
            this.users.updateOne({username:this.username},{$set:{game:null}});

            // if (game.players.find(player => player.username == username).points > game.players.find(player => player.username == game.winner).points) {
            //     game.winner = username;
            // }

            const gameTime = (Date.now() - this.game.timeStart)
            this.game.reward.stars = this.calcRating(this.game.difficulty,this.game.size,gameTime);
            if (gameTime<= this.game.timeBet*1000) {
                
                await this.users.updateOne({username:this.username},{
                    $inc:{
                        balance:this.game.reward.bombs,
                        rating:this.game.reward.stars,
                        // [`statistics.wins.${game.difficulty}`]:1,   //only for multiplayer
                        // [`statistics.games.${game.difficulty}`]:1,
                    },
                    $set:{
                        [`statistics.bestTime.${this.game.difficulty}`]: this.user.statistics.bestTime[this.game.difficulty] > gameTime && this.user.statistics.bestTime[this.game.difficulty] > 0 ? gameTime : this.user.statistics.bestTime[this.game.difficulty] 
                    }
                });
                this.send({type: 'win',data:{reward: true, bombs: this.game.reward.bombs, stars: this.game.reward.stars}})
            } else { 
                await users.updateOne({username:this.username},{
                    $set:{
                        [`statistics.bestTime.${this.game.difficulty}`]: this.user.statistics.bestTime[this.game.difficulty] > gameTime && this.user.statistics.bestTime[this.game.difficulty] > 0 ? gameTime : this.user.statistics.bestTime[this.game.difficulty] 
                    }
                });
                socket.send({type: 'win',data:{reward: false}})
            }
        }
    }
    calcRating = (difficulty,size,time) => {
        let rating = 0;
        switch (difficulty) {
            case "easy":
                rating = 1;
                break;
            case "medium":
                rating = 1.4;
                break;
            case "hard":
                rating = 1.9;
                break;
        }
        rating += size/10;
        rating += 1/time*100;
        return Math.ceil(rating);
    }

}

const init = async (connection , req) => {
    let { socket } = connection;
    console.log("New connection")
    try {
        var newConnection = await new NewConnection(connection,req);
    } catch (error) {
        console.log(error)
        await socket.send(JSON.stringify({type: 'error',data:error.message}))
        await socket.close();
        return
    }
}





module.exports = {
    init
}
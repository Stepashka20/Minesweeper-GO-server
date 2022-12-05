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
    async onStartGame(lobby){
        this.lobby = lobby;
        this.game = await this.games.findOne({uid:this.uid});
        //copt object
        let userResp = JSON.parse(JSON.stringify(this.game));
        delete userResp.field;
        delete userResp._id;
        userResp.userFields = userResp.userFields.filter(userField => userField.username == this.username);
        this.send({type:'startgame',data:{gameParams:userResp,players:lobby.players.map(player => player.username)}})
        
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
    open = async (message) => {
        if (this.gameEnd) return
        const cellNum = message.data;
        var field = this.game.field;
        if (field[cellNum] == -1) {
            this.gameEnd = true;
            this.users.updateOne({username:this.username},{$set:{game:null}});
            if (this.game.mode == "multiplayer") {
                await defeat();
            } else {
                for (let i = 0; i < field.length; i++) {
                    if (field[i] == -1) this.userField[i] = -1;
                }
                this.game.players.find(player => player.username == this.username).points = 0;
                this.send({type: 'gameover',data:{cellNum:cellNum,userField: this.userField}})
                
            }
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
        //TODO recalculating points !!! When 2 players and same maps points can be different
        this.game.players.find(player => player.username == this.username).points += minesCount;
        this.userField[cellNum] = minesCount;
        if (minesCount==0){
            const arr = this.openZerosAround(cellNum);
            for (let i = 0; i < arr.length; i++) {
                this.userField[arr[i]] = field[arr[i]];
                this.game.players.find(player => player.username == this.username).points += field[arr[i]];
            }

        }
        const finalPoints = this.game.players.find(player => player.username == this.username).points
        this.send({type: 'open', data: {cellNum: cellNum, minesCount: minesCount,userField:this.userField,points:finalPoints}})
        this.lobby.players.find(x=>x.username != this.username).socket.send(JSON.stringify({type:'opponent_points',data:{points:finalPoints}}))
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
    defeat = async () => {
        const newgame = await this.games.findOne({uid:this.uid});
        const opponent = newgame.players.find(player => player.username != this.username);
        const opponentProfile = await this.users.findOne({username: opponent.username});
        const myPoints = this.game.players.find(player => player.username == this.username).points
        const gameTime = (Date.now() - this.game.timeStart)

        if (opponent.status == "finished"){
            let winner = {
                username: opponent.username,
                gameTime: opponent.gameTime,
                statistics: opponentProfile.statistics,
            }
            let loser = {
                username: this.username,
                gameTime: gameTime,
                statistics: this.user.statistics,
            }
            await this.addGameResult(winner,loser)
        } else if (opponent.status == "defeat"){
            if (myPoints > opponent.points){
                let winner = {
                    username: this.username,
                    gameTime: gameTime,
                    statistics: this.user.statistics,
                }
                let loser = {
                    username: opponent.username,
                    gameTime: opponent.gameTime,
                    statistics: opponentProfile.statistics,
                }
                await this.addGameResult(winner,loser)
            } else if (myPoints < opponent.points){
                let winner = {
                    username: opponent.username,
                    gameTime: opponent.gameTime,
                    statistics: opponentProfile.statistics,
                }
                let loser = {
                    username: this.username,
                    gameTime: gameTime,
                    statistics: this.user.statistics,
                }
                await this.addGameResult(winner,loser)
            } else {
                if (opponent.time < gameTime){
                    let winner = {
                        username: opponent.username,
                        gameTime: opponent.gameTime,
                        statistics: opponentProfile.statistics,
                    }
                    let loser = {
                        username: this.username,
                        gameTime: gameTime,
                        statistics: this.user.statistics,
                    }
                    await this.addGameResult(winner,loser)
                } else {
                    let winner = {
                        username: this.username,
                        gameTime: gameTime,
                        statistics: this.user.statistics,
                    }
                    let loser = {
                        username: opponent.username,
                        gameTime: opponent.gameTime,
                        statistics: opponentProfile.statistics,
                    }
                    await this.addGameResult(winner,loser)
                }
            }
        } else {
            this.games.updateOne({uid:this.uid},{$set:{players:newgame.players.map(player => player.username == this.username ? {...player,status:"defeat",points: myPoints,time:gameTime} : player)}});
            this.lobby.players.find(x=>x.username != this.username).socket.send(JSON.stringify({type:'opponent_status',data:{status:"defeat"}}))
        }
    }
    addGameResult = async (winner, loser) => {
        await this.users.updateOne({username: winner.username},{
            $inc:{
                balance:this.game.reward.bombs*2,
                rating:this.game.reward.stars*2,
                [`statistics.wins.${this.game.difficulty}`]:1,
                [`statistics.games.${this.game.difficulty}`]:1,
            },
            $set:{
                [`statistics.bestTime.${this.game.difficulty}`]: winner.statistics.bestTime[this.game.difficulty] > winner.gameTime && winner.statistics.bestTime[this.game.difficulty] > 0 ? winner.gameTime : winner.statistics.bestTime[this.game.difficulty]
            }
        });
        await this.users.updateOne({username:loser.username},{
            $inc:{
                [`statistics.losses.${this.game.difficulty}`]:1,
                [`statistics.games.${this.game.difficulty}`]:1,
            },
            $set:{
                [`statistics.bestTime.${this.game.difficulty}`]: loser.statistics.bestTime[this.game.difficulty] > loser.gameTime && loser.statistics.bestTime[this.game.difficulty] > 0 ? loser.gameTime : loser.statistics.bestTime[this.game.difficulty] 
            }
        });
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
            if (this.game.mode == "multiplayer") {
                const newgame = await this.games.findOne({uid:this.uid});
                const opponent = newgame.players.find(player => player.username != this.username);
                const opponentProfile = await this.users.findOne({username: opponent.username});
                const myPoints = this.game.players.find(player => player.username == this.username).points
                const gameTime = (Date.now() - this.game.timeStart)
                if (opponent.status == "finished"){
                    if (gameTime < opponent.time){
                        this.users.updateOne({username:this.username},{
                            $inc:{
                                balance:this.game.reward.bombs,
                                rating:this.game.reward.stars,
                                [`statistics.wins.${this.game.difficulty}`]:1,
                                [`statistics.games.${this.game.difficulty}`]:1,
                            },
                            $set:{
                                [`statistics.bestTime.${this.game.difficulty}`]: this.user.statistics.bestTime[this.game.difficulty] > gameTime && this.user.statistics.bestTime[this.game.difficulty] > 0 ? gameTime : this.user.statistics.bestTime[this.game.difficulty] 
                            }
                        });
                        this.users.updateOne({username: opponent.username},{
                            $inc:{
                                [`statistics.losses.${this.game.difficulty}`]:1,
                                [`statistics.games.${this.game.difficulty}`]:1,
                            },
                            $set:{
                                [`statistics.bestTime.${this.game.difficulty}`]: opponentProfile.statistics.bestTime[this.game.difficulty] > gameTime && opponentProfile.statistics.bestTime[this.game.difficulty] > 0 ? gameTime : opponentProfile.statistics.bestTime[this.game.difficulty]
                            }
                        });
                    } else {
                        await this.users.updateOne({username: opponent.username},{
                            $inc:{
                                balance:this.game.reward.bombs,
                                rating:this.game.reward.stars,
                                [`statistics.wins.${this.game.difficulty}`]:1,
                                [`statistics.games.${this.game.difficulty}`]:1,
                            },
                            $set:{
                                [`statistics.bestTime.${this.game.difficulty}`]: opponentProfile.statistics.bestTime[this.game.difficulty] > gameTime && opponentProfile.statistics.bestTime[this.game.difficulty] > 0 ? gameTime : opponentProfile.statistics.bestTime[this.game.difficulty]
                            }
                        });
                        this.users.updateOne({username:this.username},{
                            $inc:{
                                [`statistics.losses.${this.game.difficulty}`]:1,
                                [`statistics.games.${this.game.difficulty}`]:1,
                            },
                            $set:{
                                [`statistics.bestTime.${this.game.difficulty}`]: this.user.statistics.bestTime[this.game.difficulty] > gameTime && this.user.statistics.bestTime[this.game.difficulty] > 0 ? gameTime : this.user.statistics.bestTime[this.game.difficulty] 
                            }
                        });
                    }
                } else if (opponent.status == "defeat") {
                    this.users.updateOne({username:this.username},{
                        $inc:{
                            balance:this.game.reward.bombs,
                            rating:this.game.reward.stars,
                            [`statistics.wins.${this.game.difficulty}`]:1,
                            [`statistics.games.${this.game.difficulty}`]:1,
                        },
                        $set:{
                            [`statistics.bestTime.${this.game.difficulty}`]: this.user.statistics.bestTime[this.game.difficulty] > gameTime && this.user.statistics.bestTime[this.game.difficulty] > 0 ? gameTime : this.user.statistics.bestTime[this.game.difficulty] 
                        }
                    });
                    this.users.updateOne({username: opponent.username},{
                        $inc:{
                            [`statistics.losses.${this.game.difficulty}`]:1,
                            [`statistics.games.${this.game.difficulty}`]:1,
                        },
                        $set:{
                            [`statistics.bestTime.${this.game.difficulty}`]: opponentProfile.statistics.bestTime[this.game.difficulty] > gameTime && opponentProfile.statistics.bestTime[this.game.difficulty] > 0 ? gameTime : opponentProfile.statistics.bestTime[this.game.difficulty]
                        }
                    });
                } else {
                    this.games.updateOne({uid:this.uid},{$set:{players:newgame.players.map(player => player.username == this.username ? {...player,status:"finished",points: myPoints,time:gameTime} : player)}});
                    this.lobby.players.find(x=>x.username != this.username).socket.send(JSON.stringify({type:'opponent_status',data:{status:"finished"}}))
                }
            } else {
                const gameTime = (Date.now() - this.game.timeStart)
                this.game.reward.stars = this.calcRating(this.game.difficulty,this.game.size,gameTime);
                if (gameTime<= this.game.timeBet*1000) {
                    
                    await this.users.updateOne({username:this.username},{
                        $inc:{
                            balance:this.game.reward.bombs,
                            rating:this.game.reward.stars,
                        },
                        $set:{
                            [`statistics.bestTime.${this.game.difficulty}`]: this.user.statistics.bestTime[this.game.difficulty] > gameTime && this.user.statistics.bestTime[this.game.difficulty] > 0 ? gameTime : this.user.statistics.bestTime[this.game.difficulty] 
                        }
                    });
                    
                } else { 
                    await this.users.updateOne({username:this.username},{
                        $set:{
                            [`statistics.bestTime.${this.game.difficulty}`]: this.user.statistics.bestTime[this.game.difficulty] > gameTime && this.user.statistics.bestTime[this.game.difficulty] > 0 ? gameTime : this.user.statistics.bestTime[this.game.difficulty] 
                        }
                    });
                    this.send({type: 'win',data:{reward: false}})
                }
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
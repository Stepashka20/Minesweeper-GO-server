class MultiplayerSocketService {
    constructor() {
        console.log("MultiplayerSocketService constructor");
        this.lobbies = {};
    }
    
    addPlayer(uid, socket,username ,callback) {
        console.log(`addPlayer ${uid} ${username}`)
        if (!this.lobbies[uid]) {
            this.lobbies[uid] = {
                players: [],
                start: true
            }
        }
        this.lobbies[uid].players.push({
            username: username,
            socket: socket,
            callback: callback
        });
        
        if (!this.lobbies[uid].start) {
            callback(this.lobbies[uid])
        } else if (this.lobbies[uid].players.length == 2 && this.lobbies[uid].start) {
            console.log("brodcast")
            this.lobbies[uid].start = false;
            this.lobbies[uid].players.forEach(player => {
                player.callback(this.lobbies[uid]);
            })
        }
    }
    async deleteGame(uid) {
        if (!this.lobbies[uid]) return
        await this.lobbies[uid].players[0].socket.emit("message",JSON.stringify({type: "gameDeleted"}));
        delete this.lobbies[uid];
    }
    removeUser(username,uid) {
        if (!this.lobbies[uid]) return
        this.lobbies[uid].players = this.lobbies[uid].players.filter(player => player.username != username);
    }

    sendToOpponent(uid,myName,message) {
        if (!this.lobbies[uid]) return
        this.lobbies[uid].players.forEach(player => {
            if (player.username != myName) {
                player.socket.send(JSON.stringify(message));
            }
        })
    }

    getUser(username) {
        return this.users[username];
    }

    onUserJoin(user,callback) {
        this.callbacks[user] = callback;
    }
}


var multiplayerSocketService;

module.exports = {
    init: async () => {
        console.log("Initializing multiplayer socket service");
        multiplayerSocketService = new MultiplayerSocketService();
        console.log(multiplayerSocketService)
    },

    multiplayerSocketService: () => multiplayerSocketService,
};
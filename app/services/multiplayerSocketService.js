class MultiplayerSocketService {
    constructor() {
        console.log("MultiplayerSocketService constructor");
        this.lobbies = {};
    }
    
    addPlayer(uid, socket,username ,callback) {
        // this.users[username] = socket;
        if (!this.lobbies[uid]) {
            this.lobbies[uid] = {
                players: [] 
            }
        }
        this.lobbies[uid].players.push({
            username: username,
            socket: socket,
            callback: callback
        });
        console.log(this.lobbies[uid].players)
        if (this.lobbies[uid].players.length == 2) {
            this.lobbies[uid].players.forEach(player => {
                player.callback(this.lobbies[uid]);
            })
        }
    }

    removeUser(username) {
        delete this.users[username];
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
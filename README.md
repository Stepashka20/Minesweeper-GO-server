# Server for [repo](https://github.com/Stepashka20/Minesweeper-GO)

# 👶 Getting Started

Firstly, you will need to clone the repo locally. Once you have it ready navigate into the directory and run the following commands:

1. `npm install`
2. `cp .env.sample .env`
3. `fill .env file`
3. `node server.js`

# 🐳 Run in docker
1. `docker build . -t <username>/minesweeper_go`
2. `docker run -p 8080:8080 -p 27018:27017 -d <username>/minesweeper_go`

class ConnectionHandler {
    static exit () {
        process.exit();
    }

    constructor() {
        this.openRequests = 0;
    }

    close () {
        if (--this.openRequests < 1) {
            ConnectionHandler.exit();
        }
    }

    open () {
        this.openRequests++;
    }
}

const connection = new ConnectionHandler();

process.on('SIGINT', () => {
    console.log('Got SIGINT.');
    connection.close();
});

process.on('SIGTERM', () => {
    console.log('Got SIGTERM.');
    connection.close();
});

module.exports = connection;
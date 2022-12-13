 

const createLobbySchema = {
    body: {
        type: 'object',
        required: ['bet', 'betType', 'difficulty',"size"],
        properties: {
            bet: { type: 'number' },
            betType: {
                type: 'string',
                enum: ['balance', 'rating']
            },
            difficulty: { 
                type: 'string',
                enum: ['easy', 'medium', 'hard']
            },
            size: {
                type: 'number',
                enum: [10, 15, 20]
            }
        }
    }
}

const startSchema = {
    body: {
        type: 'object',
        required: ['difficulty', 'mode', 'size',"timeBet"],
        properties: {
            mode: {
                type: 'string',
                enum: ['single']
            },
            difficulty: { 
                type: 'string',
                enum: ['easy', 'medium', 'hard']
            },
            size: {
                type: 'number',
                enum: [10, 15, 20]
            },
            timeBet: {
                type: 'string',
                enum: ['time_0', 'time_1', 'time_2']
            }
        }
    }
}


module.exports = {
    createLobbySchema,
    startSchema
}


const createUserSchema = {
    body: {
        type: 'object',
        required: ['username', 'password', 'email'],
        properties: {
            username: { type: 'string' },
            password: { type: 'string' },
            email: { type: 'string' }
        }
    }
}

module.exports = {
    createUserSchema
}
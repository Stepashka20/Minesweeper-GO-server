

const registerSchema = {
    body: {
        type: 'object',
        required: ['username', 'password', 'email'],
        properties: {
            username: {
                type: 'string',
                minLength: 3,
             },
            password: { 
                type: 'string',
                minLength: 8,
             },
            email: { 
                type: 'string',
                minLength: 4,
             }
        }
    }
}
const loginSchema = {
    body: {
        type: 'object',
        required: ['password', 'email'],
        properties: {
            password: {
                type: 'string',
                minLength: 8,
            },
            email: {
                type: 'string',
                minLength: 4,
            }
        }
    }
}
module.exports = {
    registerSchema,
    loginSchema
}
const request = require('supertest')
const app = require('../src/app')
const User = require('../src/models/user')
const jwt = require('jsonwebtoken')
const mongoose = require('mongoose')

const userOneId = new mongoose.Types.ObjectId()
const userOne = {
    _id: userOneId,
    name: 'Mike',
    email: 'mike@example.com',
    password: '57ekd03',
    tokens: [{
        token: jwt.sign({_id: userOneId}, process.env.JWT_SECRET)
    }]
}

beforeEach(async () => {    
    await User.deleteMany()
    await new User(userOne).save()
})

test('Should sign-up new user', async () => {
    const response = await request(app).post('/users').send({
        name: 'Ivanko',
        email: 'test@test.com',
        password: 'asdf123#'
    }).expect(201)

    const user = await User.findById(response.body.user._id)
    expect(user).not.toBeNull() //provjerava da nije null, jer ovo gore ako ne pronađe usera po id-u onda će user binding biti null, što znači ako nije null znači da ga je naša i proša je test

    expect(response.body.user.name).toBe('Ivanko') //ovo je provjera samo jednom propertija
    //a možemo provjerit i cijeli objekt, cijeli response.body
    expect(response.body).toMatchObject({
        user: {
            name: 'Ivanko',
            email: 'test@test.com'
        },
        token: user.tokens[0].token
    })

    //mozemo provjerit jeli da lozinka nije slucajno sacuvana kao običan string
    expect(user.password).not.toBe('asdf123#')
})

test('Should login existing user', async () => {
    const response = await request(app).post('/users/login').send({
        email: userOne.email,
        password: userOne.password
    }).expect(200)

    const user = await User.findById(userOneId)
    expect(response.body.token).toBe(user.tokens[1].token)    
})

test('Should not login non existing user', async() => {
    await request(app).post('/users/login').send({
        email: 'falseemail@fail.com',
        password: 'password123'
    }).expect(400)
})

test('Should get profile for user', async () => {
    await request(app).get('/users/me').set('Authorization', `Bearer ${userOne.tokens[0].token}`).send().expect(200)
})

test('Should not get profile for nonauthenticated user', async () => {
    await request(app).get('/users/me').send().expect(401)
})

test('Should delete account for user', async () => {
    await request(app).delete('/users/me').set('Authorization', `Bearer ${userOne.tokens[0].token}`).send().expect(200)
    const user = await User.findById(userOneId)
    expect(user).toBeNull()
})

test('Should not delete account for unauthorized user', async () => {
    await request(app).delete('/users/me').send().expect(401)
})

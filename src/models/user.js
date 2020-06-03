const mongoose = require('mongoose')
const validator = require('validator')
const bcrypt = require('bcryptjs')
const jwt = require('jsonwebtoken')
const Task = require('./task')

const userSchema = new mongoose.Schema({
    name: {
        type: String,
        required: true
    },
    email: {
        type: String,
        unique: true,
        lowercase: true,
        required: true,
        validate(value) {
            if (!validator.isEmail(value)) {
                throw new Error('Email is invalid')
            }
        }
    },
    password: {
        type: String,
        required: true,
        trim: true,
        minlength: 7,
        validate(value) {
            if (value.toLowerCase().includes('password')) {
                throw new Error('Password must not contain word password inside')
            }
        }
    },
    age: {
        type: Number,
        default: 0,
        validate(value) {
            if (value < 0) {
                throw new Error('Age must be a positive number')
            }
        }
    },
    tokens: [{
        token: {
            type: String,
            required: true
        }
    }],
    avatar: {
        type: 'Buffer'
    }
}, {
    timestamps: true
})

userSchema.methods.generateAuthToken = async function () {
    const user = this
    const token = jwt.sign({_id: user._id.toString()}, process.env.JWT_SECRET)
    
    user.tokens = user.tokens.concat({token})

    await user.save()
    
    return token
}

userSchema.methods.toJSON = function () {
    const user = this
    const userObject = user.toObject() //ovo će vratit čisti user objekt bez mongoose posebnih propertija koje on dodaje
    //obrisat će te propertije sa objekta i vratit objekt
    delete userObject.password 
    delete userObject.tokens
    delete userObject.avatar
    return userObject
}

userSchema.statics.findByCredentials = async (email, password) => {
    const user = await User.findOne({email})

    if (!user) {
        throw new Error ('Unable to login')
    }

    const isMatch = await bcrypt.compare(password, user.password)

    if (!isMatch) {
        throw new Error ('Unable to login')
    }

    return user
}

userSchema.pre('save', async function (next) { 
    const user = this 
    console.log('Just before saving')
    if (user.isModified('password')) {
        user.password = await bcrypt.hash(user.password, 8)
    } //ovo će okinit samo ako je korisnik napravio update lozinke ili prilikom kreiranja zadao novu, u ta 2 slučaja. Tako da ne haširamo već haširanu lozinku
    next()
}) 

userSchema.pre('remove', async function (next) {
    const user = this
    await Task.deleteMany({owner: user._id})
    next()
})

userSchema.virtual('tasks', {
    ref: 'Task',
    localField: '_id', //properti trenutnog modela
    foreignField: 'owner' //properti drugog modela sa kojim se povezuju (i taj properti sadrži id)
})

const User = mongoose.model('User', userSchema)

module.exports = User
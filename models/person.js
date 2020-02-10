const mongoose = require('mongoose');
const bcrypt = require('bcrypt');
const saltRounds = 10;
const uniqueValidator = require('mongoose-unique-validator');

const personSchema = new mongoose.Schema({
    firstName: { type: String, required: true },
    lastName: { type: String, required: true },
    id: { type: String, required: true , unique: true},
    email: { type: String, required: true , unique: true }, 
    password: { type: String, required: true },
    birthDay: { type: String, required: true },
    gender: { type: String, required: true },
});
personSchema.plugin(uniqueValidator);

personSchema.pre('save', function(next) {
    var person = this;

    if (!person.isModified('password')) return next();

    bcrypt.hash(person.password, saltRounds, function (err, hash) {
        if (err) { return next(err); }
        person.password = hash;
        next();
    });
});

personSchema.methods.checkPassword = function(candidatePassword) {
    return new Promise((resolve, reject) => {
        bcrypt.compare(candidatePassword, this.password, function (err, isMatch) {
            if (err) return reject(err);
            resolve(isMatch);
        });
    })
};
module.exports = new mongoose.model('Person', personSchema);

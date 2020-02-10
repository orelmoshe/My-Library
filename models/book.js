const mongoose = require('mongoose');
const bookSchema = new mongoose.Schema({
	isbn: { type: Number, required: true, unique: true },
	nameBook: { type: String, required: true },
	nameAuthor: { type: String, required: true },
	category: { type: String, required: true },
	yearOfPublication: { type: Number, required: true },
	numberOfCopies: { type: Number, required: true },
	pathPicture: { type: String, required: true },
	isLoan: { type: String, required: true }
});
module.exports = new mongoose.model('Book', bookSchema);

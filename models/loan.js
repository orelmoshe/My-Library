const mongoose = require('mongoose');
const loanSchema = new mongoose.Schema({
    booksLoan: { type: mongoose.Schema.Types.ObjectId, ref: 'Book', required: true },
    studentLoan: { type: mongoose.Schema.Types.ObjectId, ref: 'Person', required: true },
    dateBorrow: { type: String, required: true },
});
module.exports = new mongoose.model('Loan', loanSchema);

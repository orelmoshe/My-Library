const express = require('express'),
	app = express(),
	bodyParser = require('body-parser'),
	cookieSession = require('cookie-session');
(Person = require('./models/person')),
	(Book = require('./models/book')),
	(Loan = require('./models/loan'));
const port = 3000;

//connect mongoDB
const mongoose = require('mongoose');
mongoose.connect('mongodb://localhost/myLibrary', { useNewUrlParser: true, useCreateIndex: true });

app.use(bodyParser.urlencoded({ extended: true }));
app.use('/scripts', express.static(__dirname + '/scripts'));
app.use('/stylesheets', express.static(__dirname + '/stylesheets'));
app.use('/images', express.static(__dirname + '/images'));
app.use(cookieSession({ secret: '1234' }));

app.set('view engine', 'ejs');
app.set('views', __dirname + '/views');

//---------------Home---------------
app.get('/', function(req, res, next) {
	res.render('index');
});

//---------------Registration---------------
app.get('/registration', function(req, res, next) {
	res.render('registration');
});

app.post('/registration', async function(req, res, next) {
	const person = new Person(req.body);
	try {
		await person.save();
		console.log('Success registration');
	} catch (err) {
		console.log(person.errors);
		res.render('Error', {
			error: {
				messege: 'Failed to registration',
				page: '/registration'
			}
		});
	}
	res.render('login');
});

//---------------Login---------------
app.get('/login', function(req, res, next) {
	res.render('login');
});

app.post('/login', async function(req, res, next) {
	let person = new Person();
	try {
		person = await Person.findOne({ email: req.body.email });
		const res = await person.checkPassword(req.body.password);
		if (!res) {
			throw new Error('Invalid password');
		}
		console.log('Success login');
		req.session.userId = person.id;
		req.session.userName = person.firstName + ' ' + person.lastName;
	} catch (err) {
		console.log(person.errors);
		res.render('Error', {
			error: {
				messege: 'Failed to login , Invalid email or password , ' + err,
				page: '/login'
			}
		});
	}
	res.render('LateLogin/webLibraryLateLogin', { person: person });
});

//---------------Home Late Login---------------
app.get('/LateLogin/webLibraryLateLogin', async function(req, res, next) {
	let person = null;
	if (req.session.userId) {
		person = await Person.findOne({ id: req.session.userId });
	}
	res.render('LateLogin/webLibraryLateLogin', { person: person });
});

//---------------Add---------------
app.get('/addBook', function(req, res, next) {
	res.render('addBook');
});

app.post('/addBook', async function(req, res, next) {
	const book = new Book(req.body);
	try {
		book.isLoan = 'false';
		await book.save();
		for (let i = 1; i < req.body.numberOfCopies; i++) {
			let bookAdd = new Book(req.body);
			bookAdd.isLoan = 'false';
			bookAdd.isbn = ++req.body.isbn;
			await bookAdd.save();
		}
		console.log('Success add Book');
	} catch (err) {
		console.log(book.errors);
		res.render('Error', {
			error: {
				messege: 'Failed to add book , ' + err,
				page: '/addBook'
			}
		});
	}
	res.render('addBook');
});

//---------------Delete---------------
app.get('/deleteBook', function(req, res, next) {
	res.render('deleteBook');
});

app.post('/deleteBook', async function(req, res, next) {
	const book = await Book.findOne({ isbn: req.body.isbn });
	try {
		const nameBook = book.nameBook;
		const countNew = (Number(book.numberOfCopies) - 1).toString();
		await book.deleteOne();
		console.log('Success delete Book');
		await Book.updateMany(
			{ nameBook: nameBook },
			{
				$set: { numberOfCopies: countNew }
			}
		);
	} catch (err) {
		console.log(book.errors);
		res.render('Error', {
			error: {
				messege: 'Failed to delete book , ' + err,
				page: '/deleteBook'
			}
		});
	}
	res.render('deleteBook');
});

//---------------Show---------------
app.get('/ShowBook', async function(req, res, next) {
	const book = await Book.find({});
	const count = (await Book.countDocuments()) || 0;
	res.render('ShowBook', {
		Books: book,
		count: count
	});
});

//---------------Show Late Login---------------
app.get('/LateLogin/ShowBookForUser', async function(req, res, next) {
	if (req.session.userId) {
		const book = await Book.find({});
		const count = (await Book.countDocuments()) || 0;
		res.render('LateLogin/ShowBookForUser', {
			Books: book,
			count: count
		});
	} else {
		res.render('Error', {
			error: {
				messege: 'Failed to login , ',
				page: '/login'
			}
		});
	}
});

//---------------Borrow---------------
app.get('/LateLogin/borrowBook', function(req, res, next) {
	if (req.session.userId) {
		res.render('LateLogin/borrowBook');
	} else {
		res.render('Error', {
			error: {
				messege: 'Failed to login , ',
				page: '/login'
			}
		});
	}
});

app.post('/LateLogin/borrowBook', async function(req, res, next) {
	try {
		await Book.updateOne(
			{ isbn: req.body.isbn },
			{
				$set: { isLoan: 'true' }
			}
		);
		const b = await Book.findOne({ isbn: req.body.isbn });
		const p = await Person.findOne({ id: req.session.userId });
		const dateBorrow = new Date();
		const borrow = new Loan({ booksLoan: b, studentLoan: p, dateBorrow: dateBorrow });
		await borrow.save();

		console.log('Success borrow Book');
	} catch (err) {
		console.log(Book.errors);
		res.render('Error', {
			error: {
				messege: 'Failed to Borrow book , ' + err,
				page: '/LateLogin/borrowBook'
			}
		});
	}
	res.render('LateLogin/borrowBook');
});

//---------------Borrow from page search---------------
app.get('/LateLogin/borrowBook/:isbn', async function(req, res, next) {
	if (req.session.userId) {
		let arrBook = [];
		let count = 0;
		try {
			await Book.updateOne(
				{ isbn: req.params.isbn },
				{
					$set: { isLoan: 'true' }
				}
			);
			const b = await Book.findOne({ isbn: req.params.isbn });
			const p = await Person.findOne({ id: req.session.userId });
			const dateBorrow = new Date();
			const borrow = new Loan({ booksLoan: b, studentLoan: p, dateBorrow: dateBorrow });
			await borrow.save();
			console.log('Success borrow Book');
			const descriptionBook = req.session.descriptionBook.toString();
			const book = await Book.find({});

			for (let b of book) {
				let s = b.nameBook + ' ' + b.nameAuthor;
				if (s.includes(descriptionBook)) {
					arrBook.push(b);
				}
			}
			count = arrBook.length;
		} catch (err) {
			console.log(Book.errors);
			res.render('Error', {
				error: {
					messege: 'Failed to Borrow book , ' + err,
					page: '/LateLogin/borrowBook'
				}
			});
		}
		res.render('LateLogin/showSearchBook', { arrBook: arrBook, count: count });
	} else {
		res.render('Error', {
			error: {
				messege: 'Failed to login , ',
				page: '/login'
			}
		});
	}
});

//---------------Search---------------
app.get('/LateLogin/searchBook', function(req, res, next) {
	if (req.session.userId) {
		res.render('LateLogin/searchBook');
	} else {
		res.render('Error', {
			error: {
				messege: 'Failed to login , ',
				page: '/login'
			}
		});
	}
});

app.post('/LateLogin/searchBook', async function(req, res, next) {
	let arrBook = [];
	let count = 0;
	try {
		const descriptionBook = req.body.descriptionBook.toString();
		const book = await Book.find({});

		for (let b of book) {
			let s = b.nameBook + ' ' + b.nameAuthor;
			if (s.includes(descriptionBook)) {
				arrBook.push(b);
			}
		}
		count = arrBook.length;

		console.log('Success search Book');
		req.session.descriptionBook = req.body.descriptionBook;
	} catch (err) {
		console.log(Book.errors);
		res.render('Error', {
			error: {
				messege: 'Failed to search book , ' + err,
				page: '/LateLogin/searchBook , ' + err
			}
		});
	}
	res.render('LateLogin/showSearchBook', { arrBook: arrBook, count: count });
});

//---------------Return---------------
app.get('/LateLogin/returnBook', async function(req, res, next) {
	if (req.session.userId) {
		let arrBook = [];
		let count = 0;
		try {
			const loan = await Loan.find({}).populate('studentLoan');

			for (let l of loan) {
				if (l.studentLoan.id === req.session.userId) {
					let book = await Book.findById(l.booksLoan);

					arrBook.push(book);
				}
			}
			count = arrBook.length;
		} catch (err) {
			res.render('Error', {
				error: {
					messege: 'Failed to return Book , ' + err,
					page: '/LateLogin/returnBook , ' + err
				}
			});
		}
		res.render('LateLogin/returnBook', { arrBook: arrBook, count: count });
	} else {
		res.render('Error', {
			error: {
				messege: 'Failed to login , ',
				page: '/login'
			}
		});
	}
});

app.post('/LateLogin/returnBook', async function(req, res, next) {
	let arrBook = [];
	let count = 0;
	try {
		const loanForUser = await Loan.find({})
			.populate('studentLoan')
			.populate('booksLoan');

		for (let r of req.body.isbn) {
			for (let l of loanForUser) {
				await Book.updateOne(
					{ isbn: r },
					{
						$set: { isLoan: 'false' }
					}
				);
				let b = await Book.findOne({ isbn: r });

				if (l.studentLoan.id === req.session.userId && l.booksLoan.id === b.id) {
					await Loan.findOneAndDelete({ _id: l._id });
					console.log(`succses return book isbn : ${r} `);
				}
			}
		}

		const loan = await Loan.find({}).populate('studentLoan');

		for (let l of loan) {
			if (l.studentLoan.id === req.session.userId) {
				let book = await Book.findById(l.booksLoan);

				arrBook.push(book);
			}
		}
		count = arrBook.length;
	} catch (err) {
		res.render('Error', {
			error: {
				messege: 'Failed to return Book , ' + err,
				page: '/LateLogin/returnBook , ' + err
			}
		});
	}
	res.render('LateLogin/returnBook', { arrBook: arrBook, count: count });
});

//---------------Logout---------------
app.get('/LateLogin/Logout', function(req, res) {
	req.session = null;
	console.log('Success Logout');
	res.redirect('/');
});

app.listen(port, () => console.log(`app listening on port ${port}!`));

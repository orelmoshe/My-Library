require('dotenv').config()
var express     = require("express"),
    app         = express(),
    bodyParser  = require("body-parser"),
    mongoose    = require("mongoose"),
    flash       = require("connect-flash"),
    moment = require('moment'),
    passport    = require("passport"),
    LocalStrategy = require("passport-local"),
    methodOverride = require("method-override"),
    Dog          = require("./models/dog"),
    Comment     = require("./models/comment"),
    User        = require("./models/user");
    
    
//requiring routes
var commentRoutes    = require("./routes/comments"),
    dogRoutes = require("./routes/dogs"),
    indexRoutes      = require("./routes/index");
    
  
    
    
mongoose.connect("mongodb://localhost/pet_me_v1");
app.use(bodyParser.urlencoded({extended: true}));
app.set("view engine", "ejs");
app.use(express.static(__dirname + "/public"));
app.use(methodOverride("_method"));
app.use(flash());
// seedDB(); //seed the database

// PASSPORT CONFIGURATION
app.use(require("express-session")({
    secret: "Jaklin is the best dog ever!",
    resave: false,
    saveUninitialized: false
}));

app.use(passport.initialize());
app.use(passport.session());
passport.use(new LocalStrategy(User.authenticate()));
passport.serializeUser(User.serializeUser());
passport.deserializeUser(User.deserializeUser());
app.locals.moment = require('moment');


app.use(function(req, res, next){
   res.locals.currentUser = req.user;
   res.locals.error = req.flash("error");
   res.locals.success = req.flash("success");
   next();
});

app.use("/", indexRoutes);
app.use("/dogs", dogRoutes);
app.use("/dogs/:id/comments", commentRoutes);





app.listen(process.env.PORT || 3000, process.env.IP, function(){
   console.log("The PetMe Server Has Started!");
});
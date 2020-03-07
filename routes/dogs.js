var express = require("express");
var router  = express.Router();
var Dog = require("../models/dog");
var middleware = require("../middleware");

var NodeGeocoder = require('node-geocoder');
 
var options = {
  provider: 'google',
  httpAdapter: 'https',
  apiKey: process.env.GEOCODER_API_KEY,
  formatter: null
};
 
var geocoder = NodeGeocoder(options);


//INDEX - show all dogs
router.get("/", function(req, res){
    // Get all dogs from DB
    Dog.find({}, function(err, allDogs){
       if(err){
           console.log(err);
       } else {
          res.render("dogs/index",{dogs:allDogs});
       }
    });
});





//CREATE - add new dog to DB
router.post("/", middleware.isLoggedIn, function(req, res){
  // get data from form and add to dog array
  var name = req.body.name;
  var price = req.body.price;
  var date1 = req.body.date1;
  var date2 = req.body.date2;
  var image = req.body.image;
  var desc = req.body.description;
  var author = {
      id: req.user._id,
      username: req.user.username
  }
  geocoder.geocode(req.body.location, function (err, data) {
    if (err || !data.length) {
      req.flash('error', 'Invalid address');
      return res.redirect('back');
    }
    var lat = data[0].latitude;
    var lng = data[0].longitude;
    var location = data[0].formattedAddress;
    var newDog = {name: name,price: price,date1:date1,date2:date2, image: image, description: desc, author:author, location: location, lat: lat, lng: lng};
    // Create a new dog and save to DB
    Dog.create(newDog, function(err, newlyCreated){
        if(err){
            console.log(err);
        } else {
            //redirect back to dog page
            console.log(newlyCreated);
            res.redirect("/dogs");
        }
    });
  });
});





//NEW - show form to create new dog
router.get("/new", middleware.isLoggedIn, function(req, res){
   res.render("dogs/new"); 
});

// SHOW - shows more info about one dog
router.get("/:id", function(req, res){
    //find the dog with provided ID
    Dog.findById(req.params.id).populate("comments").exec(function(err, foundDog){
        if(err){
            console.log(err);
        } else {
            console.log(foundDog)
            //render show template with that dog
            res.render("dogs/show", {dog: foundDog});
        }
    });
});

// EDIT dog ROUTE
router.get("/:id/edit", middleware.checkDogOwnership, function(req, res){
    Dog.findById(req.params.id, function(err, foundDog){
        res.render("dogs/edit", {dog: foundDog});
    });
});



// UPDATE DOG ROUTE
router.put("/:id", middleware.checkDogOwnership, function(req, res){
  geocoder.geocode(req.body.location, function (err, data) {
    if (err || !data.length) {
      req.flash('error', 'Invalid address');
      return res.redirect('back');
    }
    req.body.dog.lat = data[0].latitude;
    req.body.dog.lng = data[0].longitude;
    req.body.dog.location = data[0].formattedAddress;

    Dog.findByIdAndUpdate(req.params.id, req.body.dog, function(err, dog){
        if(err){
            req.flash("error", err.message);
            res.redirect("back");
        } else {
            req.flash("success","Successfully Updated!");
            res.redirect("/dogs/" + dog._id);
        }
    });
  });
});





// DESTROY DOG ROUTE
router.delete("/:id",middleware.checkDogOwnership, function(req, res){
   Dog.findByIdAndRemove(req.params.id, function(err){
      if(err){
          res.redirect("/dogs");
      } else {
          res.redirect("/dogs");
      }
   });
});


module.exports = router;


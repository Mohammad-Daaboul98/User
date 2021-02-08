require('dotenv').config();
const express = require("express");
const bodyParser = require("body-parser");
const ejs = require("ejs");
const mongoose = require("mongoose");
const session = require("express-session");
const pasport = require("passport");
const pasportLocalMongoose = require("passport-local-mongoose");
const passportLocalMongoose = require('passport-local-mongoose');
const GoogleStrategy = require('passport-google-oauth20').Strategy;
const findOrCreate = require("mongoose-findorcreate");
// const encrypt = require('mongoose-encryption'); 
// const md5 = require("md5");
// const bcrypt = require("bcrypt");
// const saltRound = 10;



const app = express();

app.use(express.static("Public"));
app.set("view engine", "ejs");
app.use(bodyParser.urlencoded({ extended: true }));
app.use(session({
    secret: "koko lo7sh is monster",
    resave: false,
    saveUninitialized: false
}));

app.use(pasport.initialize());
app.use(pasport.session());

mongoose.connect("mongodb://localhost:27017/userDB", { useNewUrlParser: true });
mongoose.set("useCreateIndex", true);
const userSchema = new mongoose.Schema({
    email: String,
    password: String,
    googleId:String
});

userSchema.plugin(passportLocalMongoose);
userSchema.plugin(findOrCreate);

// const secret = process.env.SECRET;
// userSchema.plugin(encrypt,{secret:secret,encryptedFields:["password"]});

const User = mongoose.model("User", userSchema);

pasport.use(User.createStrategy());

pasport.serializeUser(function(user, done) {
    done(null, user.id);
  });
  
  pasport.deserializeUser(function(id, done) {
    User.findById(id, function(err, user) {
      done(err, user);
    });
  });

pasport.use(new GoogleStrategy({
    clientID: process.env.CLIENT_ID,
    clientSecret: process.env.CLIENT_SECRET,
    callbackURL: "http://localhost:3000/auth/google/secrets"
    // userProfileURL: "https://www.googleleapis.com/oauth2/v3/userinfo"
},
    function (accessToken, refreshToken, profile, cb) {
        User.findOrCreate({ googleId: profile.id }, function (err, user) {
            return cb(err, user);
        });
    }
));


app.get("/", function (req, res) {
    res.render("home");
});

app.get("/auth/google",
    pasport.authenticate("google", { scope: ["profile"] })
);

app.get("/auth/google/secrets",
    pasport.authenticate('google', { failureRedirect: '/login' }),
    function (req, res) {
        // Successful authentication, redirect secrets.
        res.redirect('/secrets');
    });

app.get("/login", function (req, res) {
    res.render("login");
});


app.get("/register", function (req, res) {
    res.render("register");
});
app.get("/secrets", function (req, res) {
    if (req.isAuthenticated()) {
        res.render("secrets");
    } else {
        res.redirect("/login");
    }

});

app.get("/logout", function (req, res) {
    req.logout();
    res.redirect("/")
});

app.post("/register", function (req, res) {


    User.register({ username: req.body.username }, req.body.password, function (err, user) {
        if (err) {
            console.log(err);
            res.redirect("/register")
        } else {
            pasport.authenticate("local")(req, res, function () {
                res.redirect("/secrets")
            });
        }
    });


    // bcrypt.hash(req.body.password, saltRound, function (err, hash) {
    //     const newUser = new User({
    //         email: req.body.username,
    //         password: hash
    //     });

    //     newUser.save(function (err) {
    //         if (err) {
    //             console.log(err);
    //         } else {
    //             res.render("secrets");
    //         }
    //     });
    // });

});


app.post("/login", function (req, res) {

    const user = new User({
        username: req.body.username,
        password: req.body.password
    });

    req.login(user, function (err) {
        if (err) {
            console.log(err);
        } else {
            pasport.authenticate("local")(req, res, function () {
                res.redirect("/secrets");
            });
        }
    });














    // const userName = req.body.username;
    // const password = req.body.password
    // User.findOne({ email: userName }, function (err, foundUser) {
    //     if (!err) {
    //         if (foundUser) {
    //             bcrypt.compare(password, foundUser.password, function (err, result) {
    //                 if (result === true) {
    //                     res.render("secrets")
    //                 }
    //             });


    //         }
    //     }
    // });
});






app.listen("3000", function (req, res) {
    console.log("server is running on port 3000");
});
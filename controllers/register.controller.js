var registerModel = require('../models/register.model');
var bcrypt = require('bcryptjs');
var shortId = require('shortid');
var redis = require('redis'),
    client = redis.createClient();

client.on('error', function (err) {
    console.log("Redis error ", err);
});

var hashedPassword = function (password) {
    var salt = bcrypt.genSaltSync(10);
    return bcrypt.hashSync(password, salt);
};

module.exports.create = function (req, res) {

    var name = req.body.name,
        username = req.body.username,
        email = req.body.email,
        password = req.body.password,
        passwordAgain = req.body.passwordAgain;

    req.checkBody('name', 'Name must not be empty').notEmpty();
    req.checkBody('username', 'Username cannot be empty').notEmpty();
    req.checkBody('email', 'Email is not correct').isEmail();
    req.checkBody('email', 'Email cannot be empty').notEmpty();
    req.checkBody('password', 'Password Field cannot be empty').notEmpty();
    req.checkBody('passwordAgain', 'Again password field cannot be empty').notEmpty();
    req.checkBody('passwordAgain', 'Passwords do not match').equals(password);

    var checkUsername = registerModel.find({username: username}, function (err, result) {
        if (result.length !== 0) {
            res.render('register', {title: 'Register', errorMessage: 'Please use different username!'});
        } else {
            req.getValidationResult()
                .then(function (result) {
                    if (result.isEmpty()) {

                        var hashedPass = hashedPassword(password);

                        entry = new registerModel({
                            name: name,
                            username: username,
                            email: email,
                            password: hashedPass
                        });

                        entry.save(function (error) {
                            if (error) {
                                console.log('Something went wrong!' + error);
                            }
                        }).then(function (product) {
                            var query = registerModel.find({username: username});
                            query.exec(function (err, result) {
                                if (err) {
                                    console.log(err);
                                } else {
                                    console.log(result);
                                    console.log(result[0]._id);
                                    var d = new Date();
                                    d.setDate(d.getDate() + 1);
                                    var token;
                                    client.hmset(result[0]._id.toString(), 'token', shortId.generate(), 'expiry_date', d);
                                    client.hgetall(result[0]._id.toString(), function (err, obj) {
                                        console.log(obj.token);

                                        var url = 'http://localhost:3000/email-verification/' + obj.token + '/' + result[0]._id + '/' + result[0].email;
                                        var api_key = 'key-1d196eea58dc4008e50edf624afb24a9';
                                        var domain = 'sandbox664c048b4d2b4fc9834fb86dadd427fa.mailgun.org';
                                        var mailgun = require('mailgun-js')({apiKey: api_key, domain: domain});

                                        var data = {
                                            from: 'AmazeSpace <admin@theamaze.space>',
                                            to: result[0].email,
                                            subject: 'Registration Confirmation Link',
                                            text: 'This is your email confirmation link ' + url
                                        };

                                        mailgun.messages().send(data, function (error, body) {
                                            console.log(body);
                                        });
                                    });
                                }
                            });
                            res.render('register', {
                                title: 'Register',
                                message: "You've been Registered. Please check your email for email-confirmation"
                            })
                        });


                    } else {
                        res.render('register', {result: result.array(), title: 'Register'});
                    }
                });
        }
    });

};
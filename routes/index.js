var util = require('util');
var express = require('express');
var router = express.Router();

var registerController = require('../controllers/register.controller');

/* GET home page. */
router.get('/', function (req, res, next) {
    res.render('index', {title: 'Dashboard'});
});

// GET register page
router.get('/register', function (req, res, next) {
    res.render('register', {title: 'Register'});
});

// POST /register
router.post('/register', function (req, res, next) {
    return registerController.create(req, res);
});

// GET login page
router.get('/login', function (req, res, next) {
    res.render('login', {title: 'Login'});
});

// email confirmation router
router.get('/email-verification/:token/:id/:email', function (req, res, next) {
    var token = req.params.token,
        id = req.params.id,
        email = req.params.email;
    res.render('emailVerification', {
        token: token,
        id: id,
        email: email
    })
});

module.exports = router;
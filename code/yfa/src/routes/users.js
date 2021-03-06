"use strict";

var HttpStatus = require('http-status');
var User = require('../models/user');

/**
 * Create a user
 *
 * @errors (405) You're not allowed to create users on this system
 *
 * @param req An express request object
 * @param res An express res object, expected to contain res.problem middleware
 * @return {problem}
 */
exports.create = function (req, res) {
    return res.problem(HttpStatus.METHOD_NOT_ALLOWED,
        "You're not allowed to create users on this system",
        "Users are created via 3rd party (Facebook) authentication");
};

/**
 * Gets a list of all users
 *
 * @errors (500) Unexpected problem
 *
 * @param req An express request object
 * @param res An express res object, expected to contain res.problem middleware
 * @return {problem|null|object}
 */
exports.list = function (req, res) {
    User.publicList(req.query.skip, req.query.take, function(err, results){
        if(err){
            return res.problem(HttpStatus.INTERNAL_SERVER_ERROR,
                "Unexpected problem",
                "Could not list users due to internal error");
        }

        if(results === null || results.length === 0){
            return res.json(HttpStatus.NO_CONTENT);
        } else {
            User.count({}, function(err, count){
                return res.json(HttpStatus.OK, {
                    meta: { total: count || 0 },
                    results: results
                });
            });
        }
    });
};

/**
 * Gets a user by ID
 *
 * @param req
 * @param res
 */
exports.getById = function (req, res) {
    // Example mongodb id: 52aff48d78b818c844000001
    User.getById(req.params.mid, function(err, results){
        if(err){
            return res.problem(HttpStatus.INTERNAL_SERVER_ERROR,
                "Unexpected problem",
                "Could not retrieve user due to internal error");
        }

        if(results === null || results.length === 0){
            return res.json(HttpStatus.NO_CONTENT);
        } else {
            return res.json(HttpStatus.OK, results);
        }
    });
};

/**
 * Gets the list of cohorts for a user, given the user's id.
 *
 * @param req
 * @param res
 */
exports.getCohortsById = function (req, res) {
	User.getCohortsById(req.params.mid, function(err, results) {
		if(err){
			return res.problem(HttpStatus.INTERNAL_SERVER_ERROR,
				"Unexpected problem",
				"Could not retrieve cohorts due to internal error");
		}

		if(results === null || results.length === 0) {
			return res.json(HttpStatus.NO_CONTENT);
		} else {
			return res.json(HttpStatus.OK, results);
		}
	});
};

/**
 * Add a single cohort to a user object.
 *
 * @param req
 * @param res
 */
exports.addCohortForUser = function (req, res) {
    User.addCohort(req.params.mid, req.params.id, function(err, results){
        if(err){
            return res.problem(HttpStatus.INTERNAL_SERVER_ERROR,
                "Unexpected problem",
                "Could not save cohort due to internal error");
        }

        if(results === null || results.length === 0) {
            return res.json(HttpStatus.NO_CONTENT);
        } else {
            return res.json(HttpStatus.OK, results);
        }
    });
};

/**
 * Remove a single cohort from a user object.
 *
 * @param req
 * @param res
 */
exports.removeCohortFromUser = function (req, res) {
    User.removeCohort(req.params.mid, req.params.id, function(err, results){
        if(err){
            return res.problem(HttpStatus.INTERNAL_SERVER_ERROR,
                "Unexpected problem",
                "Could not remove cohort due to internal error");
        }

        if(results === null || results.length === 0) {
            return res.json(HttpStatus.NO_CONTENT);
        } else {
            return res.json(HttpStatus.OK, results);
        }
    });
};

/**
 * Updates a user document
 *
 * Expects res.problem middleware and an authenticated passport.js session.
 * Requires this to be constrained to the user making the request.
 *
 * @param req
 * @param res
 */
exports.update = function (req, res) {
    var upd = req.body;
    User.fb(req.user.facebookId, function(err, user){
        if(err || user === null) {
            return res.problem(
                HttpStatus.BAD_REQUEST,
                "Could not save user information",
                "There was an error processing the request to save your information"
            );
        }

        // only new users can change their usernames
        if (!user.registrationDone) {
            // must start with a letter and be between 5 and 16 alphanumeric characters
            if(/^[a-zA-Z]{1}[a-zA-Z0-9_]{4,15}$/.test(upd.username) === false) {
                return res.problem(
                    HttpStatus.BAD_REQUEST,
                    "Invalid Username",
                    "User names must be 5-16 characters"
                );
            }

            user.username = upd.username;
        }

        user.registrationDone = true;
        user.firstName = upd.firstName || user.firstName;
        user.lastName = upd.lastName || user.lastName;
        user.email = upd.email || user.email;
        user.state = User.States.ONLINE;
        user.avatar = upd.avatar;

        return user.save(function(err, user) {
            res.json(HttpStatus.OK, user);
        });
    });
};

/**
 * Deletes a user document
 *
 * Expects res.problem middleware and an authenticated passport.js session.
 * Requires this to be constrained to the user making the request.
 *
 * @param req
 * @param res
 */
exports.delete = function (req, res) {
    User.fb(req.user.facebookId, function(err, user) {
        if (err || user === null) {
            return res.problem(
                HttpStatus.BAD_REQUEST,
                "Could not delete user",
                "There was an error processing the request to save your information"
            );
        }

        return user.remove(function(err, result){
            res.json(HttpStatus.OK, result);
        });
    });
};

/**
 * Gets a list of user's undelivered messages
 *
 * Expects res.problem middleware and an authenticated passport.js session.
 * Requires this to be constrained to the user making the request.
 *
 * @param req
 * @param res
 */
exports.getMessages = function (req, res){
    User.getMessages(req.params.mid, function(err,doc){
        if (err || doc === null || doc.messages === null) {
            return res.problem(
              HttpStatus.NO_CONTENT
            );
        }

        return res.json(HttpStatus.OK, doc);
    });
};

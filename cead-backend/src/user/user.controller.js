const bcrypt = require('bcryptjs'),
    userService = require('./user.service');


function signup(req, res, next) {
  const user = {
    first_name: req.body.first_name,
    last_name: req.body.last_name,
    email: req.body.email,
    organization: req.body.organization,
    work_field: req.body.work_field,
    design_exp: req.body.design_exp
  };
  userService.signup(user,req.body.password).then(() => {
    return res.status(201).send({message: 'User created successfully.'});
  }).catch(next);
  
}


function login(req, res, next) {
  const authData = {
    email: req.body.email,
    password: req.body.password,
  };
  userService.login(authData).then((loggedInUser) => {
    res.status(200).send({
                           data: loggedInUser,
                           message: 'User logged in successfully',
                         });
  }).catch(next);
}


function getUser(req, res, next) {
  let tokenUserId = req.userId;
  let requestedUserId = req.params.userId;
  let role = req.userRole;
  userService.getUser(tokenUserId, role, requestedUserId).then((user) => {
    res.status(200).send({data: user});
  }).catch(next);
}

function editUser(req, res, next) {
  const userId = req.params.userId,
      tokenId = req.userId,
      userRole = req.userRole;
  userService.editUser(userId, tokenId,userRole,req.body).then((user) => {
    return res.status(200).send({message: 'User successfully updated'});
  }).catch(next);
}

function passChange(req, res, next) {
  const userId = req.params.userId,
      tokenId = req.userId;
  userService.passChange(userId, tokenId,req.body).then((user) => {
    return res.status(200).send({message: 'Password changed successfully'});
  }).catch(next);
}

module.exports = {
  login, signup,getUser,editUser,passChange
};

const db = require('../_database'),
    User = db.User;
const bcrypt = require('bcryptjs');
const jwt = require('jsonwebtoken');
const config = require('../app.config.json');
const {ROLES} = require('../_database');
const jwtSecret = process.env.JWT_KEY;


async function signup(bodyUser,pass) {
  try{
    bodyUser.password_hash = await bcrypt.hashSync(pass, 8);
    const user = new User(bodyUser);
    return user.save();
  }catch (err) {
    return err;
  }
}


async function login(authData) {
  return new Promise((resolve, reject) => {
    User.findOne({
                   email: authData.email,
                 }).exec(async (err, user) => {
      if (err) {
        return reject(err);
      }
      
      if (!user) {
        return reject({
                        name: 'customError',
                        message: 'Email or password is incorrect.',
                        code: 400,
                      });
      }
  
      let passwordIsValid='sss';
      try {
        passwordIsValid = await bcrypt.compare(
            authData.password,
            user['password_hash'],
        );
      } catch(err) {
        return reject(err); 
      }
      if (!passwordIsValid) {
        return reject({
                        name: 'customError',
                        message: 'Email or password is incorrect.',
                        code: 400,
                      });
      }
      
      let token = jwt.sign(
          {id: user._id, role: user.role, status: user.status},
          jwtSecret, {
            expiresIn: config.token.expiration || 3600,
          },
      );
      
      resolve({
                _id: user._id,
                first_name: user.first_name,
                last_name: user.last_name,
                email: user.email,
                organization: user.organization,
                work_field: user.work_field,
                design_exp: user.design_exp,
                cur_api_call: user.cur_api_call,
                max_api_call: user.max_api_call,
                notallowed_api: user.cur_api_call >= user.max_api_call,
                accessToken: token,
              });
    });
  });
  
}


async function getUser(tokenUserId, userRole, requesteduserId) {
  return new Promise((resolve, reject) => {
    let findUser = res => {
      User.findOne({
                     _id: requesteduserId,
                   }).exec((err, user) => {
        if (err) {
          return reject(err);
        }
        
        res({
              _id: user._id,
              first_name: user.first_name,
              last_name: user.last_name,
              email: user.email,
              organization: user.organization,
              work_field: user.work_field,
              design_exp: user.design_exp,
              cur_api_call: user.cur_api_call,
              max_api_call: user.max_api_call,
              notallowed_api: user.cur_api_call >= user.max_api_call,
            });
      });
    };
    
    if (userRole === ROLES.ADMIN) {
      findUser(resolve);
    } else {
      if (requesteduserId === tokenUserId)
        findUser(resolve);
      else
        reject({message: 'You don\'t have access to this user.'});
    }
  });
}


async function apiUsageIncrement(userId) {
  return new Promise((resolve, reject) => {
    
    User.findOne({
                   _id: userId,
                 }).exec((err, user) => {
      if (err) {
        return reject(err);
      }
      
      user.cur_api_call = user.cur_api_call + 1;
      return resolve(user.save());
    });
  });
}


async function editUser(userId, tokenId, userRole, bodyUser) {
  return new Promise((resolve, reject) => {
    // Check user edit his own information if he is not admin
    if (userRole !== ROLES.ADMIN && userId !== tokenId)
      reject({
               name: 'customError',
               code: 403,
               message: 'You are not allowed to edit',
             });
    
    User.findOne({_id: userId}).then((user) => {
      if (!user)
        return reject({
                        name: 'customError',
                        code: 404,
                        message: `user with id ${userId} not found`,
                      });
      user.first_name=bodyUser.first_name;
      user.last_name=bodyUser.last_name;
      user.organization=bodyUser.organization;
      user.work_field=bodyUser.work_field;
      user.design_exp=bodyUser.design_exp;
      
      return resolve(user.save());
    }).catch(() => reject);
  });
  
}

async function passChange(userId, tokenId, passObj) {
  return new Promise((resolve, reject) => {
    // Check user edit his own information if he is not admin
    if (userId !== tokenId)
      reject({
               name: 'customError',
               code: 403,
               message: 'You are not allowed to do this',
             });
    
    User.findOne({_id: userId}).then(async (user) => {
      
      if (!user)
        return reject({
                        name: 'customError',
                        code: 404,
                        message: `user with id ${userId} not found`,
                      });
  
      let passwordIsValid;
      try {
        passwordIsValid = await bcrypt.compare(
            passObj['old_pass'],
            user.password_hash,
        );
      } catch(err) {
        return reject(err); 
      }
      
      if (!passwordIsValid)
        reject({
                        name: 'customError',
                        message: 'Old password is incorrect.',
                        code: 400,
                      });
  
      let hashedPass;
      try{
        hashedPass = await bcrypt.hash(passObj['new_pass'], 8);
      }catch (err) {
        return reject(err);
      }
      user['password_hash']= hashedPass;
      return resolve(user.save());
    }).catch(() => reject);
  });
  
}



module.exports = {
  signup,
  login,
  getUser,
  editUser,
  passChange,
  apiUsageIncrement,
};

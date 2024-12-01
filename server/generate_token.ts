import jwt from 'jsonwebtoken';

const generateTestToken = (username, firstName, lastName, isAdmin, secret) => {
    const payload = {
      username,
      firstName,
      lastName,
      isAdmin,
    };
  
    const token = jwt.sign(payload, secret, { expiresIn: '1h' });
    console.log('Generated Token:', token);
    return token;
  };
  
  // Replace these values with the desired user data
  const username = 'johndoe';
  const firstName = 'John';
  const lastName = 'Doe';
  const isAdmin = true;


const secret = process.env.JWT_SECRET; // Replace this with your JWT_SECRET
// const options = { expiresIn: "1h" };

generateTestToken(username, firstName, lastName, isAdmin, secret);
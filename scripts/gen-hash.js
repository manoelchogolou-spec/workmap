const bcrypt = require('bcryptjs');

const password = 'Password123!';
const hash = bcrypt.hashSync(password, 12);

console.log(hash);
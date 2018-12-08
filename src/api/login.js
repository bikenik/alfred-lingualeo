const alfy = require('alfy')

if (process.argv[3] === 'login') {
	alfy.config.set('login', process.argv[2])
}
if (process.argv[3] === 'password') {
	alfy.config.set('password', process.argv[2])
}

const alfy = require('alfy')

module.exports = (username, password) => {
	if (!username) {
		alfy.output([{
			title: 'Login is missing',
			subtitle: 'Pleas, fill the username from your LinguaLeo account',
			icon: {path: './icons/Login.png'},
			arg: alfy.config.set('login', alfy.input)
		}])
	} else if (!password) {
		alfy.output([{
			title: 'Password is missing',
			subtitle: 'Pleas, fill the password from your LinguaLeo account',
			icon: {path: './icons/Password.png'},
			arg: alfy.config.set('password', alfy.input)
		}])
	}
}

const alfy = require('alfy')
const got = require('got')

const WorkflowError = require('../../utils/error')

module.exports = () => {
	let username
	let password
	const doLogin = async (user, pw) => {
		username = user
		password = pw
		let response
		try {
			response = await got(`https://lingualeo.com/api/login?email=${username}&password=${password}`)
			alfy.config.set('Cookie', response.headers['set-cookie'])
			const res = JSON.parse(response.body).user
			const premiumUntil = new Date(res.premium_until)
			const currentDate = new Date()
			const oneDay = 24 * 60 * 60 * 1000
			const leftDays = Math.round(Math.abs((premiumUntil.getTime() - currentDate.getTime()) / (oneDay)))
			alfy.config.set('userInfo', `🦁 ${res.hungry_pct}%  📈 level: ${res.xp_level}  🥩 ${res.meatballs}  👑 left: ${leftDays} days`)
		} catch (error) {
			if (response) {
				console.log(JSON.parse(response.body).error_msg)
			} else {
				throw new WorkflowError(error.stack)
			}
		}
	}
	const userAPI = {
		login: doLogin
	}
	return userAPI
}

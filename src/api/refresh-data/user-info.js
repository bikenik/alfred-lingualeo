const alfy = require('alfy')
const got = require('got')

const WorkflowError = require('../../utils/error')

module.exports = () => {
	const doLogin = async (user, pw) => {
		let response1
		try {
			response1 = await got.get(`https://lingualeo.com/api/login?email=${user}&password=${pw}`)
			const userInfo = JSON.parse(response1.body)
			if (userInfo.user) {
				const premiumUntil = new Date(userInfo.user.premium_until)
				const currentDate = new Date()
				const oneDay = 24 * 60 * 60 * 1000
				const leftDays = Math.round(Math.abs((premiumUntil.getTime() - currentDate.getTime()) / (oneDay)))
				alfy.config.set('Cookie', response1.headers['set-cookie'])
				alfy.config.set('userInfo', `🦁 ${userInfo.user.hungry_pct}%  📈 level: ${userInfo.user.xp_level}  🥩 ${userInfo.user.meatballs}  👑 left: ${leftDays} days  💡🅰 ${userInfo.user.words_cnt - userInfo.user.words_known}`)
			} else {
				throw new Error(userInfo.error_msg)
			}
		} catch (error) {
			if (response1 === false) {
				throw new WorkflowError(error.stack)
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

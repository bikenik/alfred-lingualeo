/* eslint-env es6 */
const fs = require('fs')
const alfy = require('alfy')
const got = require('got')

const request = require('request-promise')
const streamToPromise = require('stream-to-promise')
const WorkflowError = require('./error')

module.exports.saveAudioFile = async (url, fileName) => {
	const writeStreamExp = fs.createWriteStream(
		`${process.env.PWD}/tmp/${fileName}.mp3`
	)
	request
		.get(url)
		.pipe(writeStreamExp)
	await streamToPromise(writeStreamExp)
	writeStreamExp.end()
}

const wordTop = (currentCase, top) => {
	switch (top) {
		case 1:
			return `icons/${currentCase}_1000.png`
		case 2:
			return `icons/${currentCase}_2000.png`
		case 3:
			return `icons/${currentCase}_3000.png`
		default:
			return `icons/${currentCase}.png`
	}
}
module.exports.wordProgress = (value, top) => {
	switch (value) {
		case 25:
			return wordTop('quarter', top)
		case 50:
			return wordTop('half', top)
		case 75:
			return wordTop('three_quarters', top)
		case 100:
			return wordTop('done', top)
		default:
			return wordTop('initial', top)
	}
}
module.exports.nameOfSetByNumber = arr => {
	return arr.map(x => {
		if (typeof x === 'number' && alfy.config.get('nameOfSets').length > 0) {
			if (alfy.config.get('nameOfSets')
				.filter(y => x === y.setNumber).length > 0) {
				return alfy.config.get('nameOfSets')
					.filter(y => x === y.setNumber)[0].setName
			}
		}
		return x
	})
}

module.exports.User = () => {
	let username
	let password
	const doLogin = async (user, pw) => {
		if (user === '' && pw === '') {
			alfy.output([{
				title: 'Login and Password are missing',
				subtitle: 'Pleas, fill the password and username from your LinguaLeo account'
			}])
		} else {
			username = user
			password = pw
			try {
				const response = await got(`https://lingualeo.com/api/login?email=${username}&password=${password}`)
				alfy.config.set('Cookie', response.headers['set-cookie'])
				const res = JSON.parse(response.body).user
				const premiumUntil = new Date(res.premium_until)
				const currentDate = new Date()
				const oneDay = 24 * 60 * 60 * 1000
				const leftDays = Math.round(Math.abs((premiumUntil.getTime() - currentDate.getTime()) / (oneDay)))
				alfy.config.set('userInfo', `🦁 ${res.hungry_pct}%  📈 level: ${res.xp_level}  🥩 ${res.meatballs}  👑 left: ${leftDays} days`)
			} catch (error) {
				throw new WorkflowError(error.stack)
			}
		}
	}
	const userAPI = {
		login: doLogin
	}
	return userAPI
}

'use strict'
const alfy = require('alfy')
const rp = require('request-promise')
const got = require('got')

const WorkflowError = require('./src/utils/error')

const {username} = process.env
const {password} = process.env

const run = async () => {
	let userInfo
	try {
		const response = await got(`https://lingualeo.com/api/login?email=${username}&password=${password}`)
		alfy.config.set('Cookie', response.headers['set-cookie'])
		const res = JSON.parse(response.body).user
		const premiumUntil = new Date(res.premium_until)
		const currentDate = new Date()
		const oneDay = 24 * 60 * 60 * 1000
		const leftDays = Math.round(Math.abs((premiumUntil.getTime() - currentDate.getTime()) / (oneDay)))
		userInfo = `🦁 ${res.hungry_pct}%  📈 level: ${res.xp_level}  🥩 ${res.meatballs}  👑 left: ${leftDays} days`
	} catch (error) {
		throw new WorkflowError(error.stack)
	}

	const options = {
		uri: 'https://lingualeo.com/ru/userdict3/getWordSets',
		headers: {
			Cookie: alfy.config.get('Cookie')
		},
		json: true
	}
	alfy.input = alfy.input.replace(/.*?\u2023[\s]/gm, '')
	await rp(options)
		.then(data => {
			const items = alfy
				.matches(alfy.input, data.result, 'name')
				.map(x => ({
					title: x.name,
					subtitle: `🅰 words: ${x.countWords}${x.id === 'dictionary' ? `  ${userInfo}` : ''}`,
					arg: x.id,
					variables: {
						currentSet: x.name
					}
				}))
			alfy.output(items.length > 0 ? items : [{
				title: `Set ${alfy.input} not found`
			}])
			const setsName = items.map(x => ({
				setNumber: x.arg,
				setName: x.title
			}))
			alfy.config.set('nameOfSets', setsName)
		})
		.catch(error => {
			throw new WorkflowError(error.stack)
		})
}
if (username === '' && password === '') {
	alfy.output([{
		title: 'Login and Password are missing',
		subtitle: 'Pleas, fill the password and username from your LinguaLeo account'
	}])
} else {
	run()
}

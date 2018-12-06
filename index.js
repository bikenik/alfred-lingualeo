/* eslint new-cap: ["error", { "capIsNew": false }] */
'use strict'
const alfy = require('alfy')
const Render = require('./src/utils/engine')
const User = require('./src/api/refresh-data/user-info')
const login = require('./src/api/login')
const runRefresh = require('./src/utils/run-refresh')

const username = alfy.config.get('login')
const password = alfy.config.get('password')

const run = async () => {
	const data = require('./data/sets-of-dictionary.json')
	const currentUser = User()
	await currentUser.login(username, password)
	const userInfo = alfy.config.get('userInfo')

	alfy.input = alfy.input.replace(/.*?\u2023[\s]/gm, '')

	const setsName = data.result.map(x => ({
		setNumber: x.id,
		setName: x.name
	}))
	const items = []
	for (const set of data.result) {
		const item = new Render('List of dictionaries',
			'title', 'subtitle', 'arg', 'variables', 'mods')
		item.title = set.name
		item.subtitle = `🅰 words: ${set.countWords}${set.id === 'dictionary' ? `  ${userInfo}` : ''}`
		item.arg = set.id
		item.variables = {
			currentSet: set.name
		}
		item.mods = /\d/u.test(set.id) ? {
			fn: {
				subtitle: '‼️ Delete this Set ‼️',
				variables: {
					groupName: set.name,
					groupId: set.id
				},
				icon: alfy.icon.delete
			}
		} : {}
		items.push(item.getProperties())
	}
	const itemsResultArr = alfy
		.matches(alfy.input, items, 'title')
		.map(x => ({
			title: x.title,
			subtitle: x.subtitle,
			arg: x.arg,
			text: x.text,
			autocomplete: x.autocomplete,
			variables: x.variables,
			mods: x.mods
		}))
	if (items.length > 0) {
		alfy.output(itemsResultArr.length > 0 ? itemsResultArr : [{
			title: `add to: "${alfy.input}" set`,
			variables: {
				currentSet: alfy.input
			},
			arg: alfy.input
		}])
	}
	alfy.config.set('nameOfSets', setsName)
}

if (process.argv[3] === 'reset') {
	alfy.config.clear()
	alfy.config.delete('password')
	alfy.config.delete('login')
} else if (username && password) {
	run()
	runRefresh()
} else {
	login(username, password)
}

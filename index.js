/* eslint new-cap: ["error", { "capIsNew": false }] */
'use strict'
const alfy = require('alfy')
const Render = require('./src/utils/engine')
const runRefresh = require('./src/utils/run-refresh')

const run = () => {
	const data = require('./data/sets-of-dictionary.json')
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
	alfy.config.delete('login')
	alfy.config.delete('password')
} else if (alfy.config.get('nameOfSets') && alfy.config.get('nameOfSets').length > 0) {
	run()
	runRefresh()
} else {
	alfy.output([{
		title: 'The config of your account is not dowload yet',
		subtitle: 'type \'lleo-dic\' to login and try later',
		icon: {path: alfy.icon.info}
	}])
}

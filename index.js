/* eslint new-cap: ["error", { "capIsNew": false }] */
/* eslint import/no-unresolved: [2, { commonjs: false, amd: false }] */
'use strict'
const fs = require('fs')
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

const waitMessage = [{
	title: 'The config of your account is not dowload yet',
	subtitle: 'type \'lleo-dic\' to login and try later',
	icon: {path: alfy.icon.info}
}]
if (/!.*/.test(alfy.input)) {
	alfy.output([{
		title: 'reset login and password',
		subtitle: 'hit ↵ to reset your login & password',
		variables: {loginMode: 'reset'},
		icon: {path: alfy.icon.delete}
	}])
} else if (alfy.config.get('nameOfSets') === undefined || alfy.config.get('nameOfSets').length === 0) {
	alfy.output([waitMessage])
} else {
	fs.access('data/sets-of-dictionary.json',
		fs.constants.F_OK, error => {
			if (error) {
				alfy.output(waitMessage)
			} else {
				run()
				runRefresh()
			}
		})
}

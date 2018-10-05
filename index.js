/* eslint new-cap: ["error", { "capIsNew": false }] */
'use strict'
const alfy = require('alfy')
const rp = require('request-promise')
const Render = require('./src/utils/engine')
const {User} = require('./src/utils/api')

const WorkflowError = require('./src/utils/error')

const {username} = process.env
const {password} = process.env

const addToItems = new Render()

const run = async () => {
	const currentUser = User()
	await currentUser.login(username, password)
	const userInfo = alfy.config.get('userInfo')

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
			const setsName = data.result.map(x => ({
				setNumber: x.id,
				setName: x.name
			}))
			for (const set of data.result) {
				addToItems.add(
					new Render('sets',
						{title: set.name},
						{subtitle: `🅰 words: ${set.countWords}${set.id === 'dictionary' ? `  ${userInfo}` : ''}`},
						{arg: set.id},
						{
							variables: {
								currentSet: set.name
							}
						},
						{
							mods: /\d/u.test(set.id) ? {
								fn: {
									subtitle: '‼️ Delete this Set ‼️',
									variables: {
										groupName: set.name,
										groupId: set.id
									},
									icon: {
										path: alfy.icon.delete
									}
								}
							} : {}
						}
					))
			}
			const items = alfy
				.matches(alfy.input, addToItems.items, 'title')
				.map(x => ({
					title: x.title,
					subtitle: x.subtitle,
					arg: x.arg,
					text: x.text,
					autocomplete: x.autocomplete,
					variables: x.variables,
					mods: x.mods
				}))
			if (addToItems.items.length > 0) {
				alfy.output(items.length > 0 ? items : [{
					title: `add to: "${alfy.input}" set`,
					variables: {
						currentSet: alfy.input
					},
					arg: alfy.input
				}])
			}
			alfy.config.set('nameOfSets', setsName)
		})
		.catch(error => {
			throw new WorkflowError(error.stack)
		})
}
run()

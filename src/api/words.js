/* eslint camelcase: ["error", {properties: "never"}] */
'use strict'
const alfy = require('alfy')
const rp = require('request-promise')

const WorkflowError = require('../utils/error')
const {nameOfSetByNumber, wordProgress} = require('../utils/api')
const Render = require('../utils/engine')

const yourLanguage = process.env.your_language

module.exports.allWords = (data, currentData) => {
	const items = []
	for (const word of currentData.words) {
		const item = new Render('words',
			'title', 'subtitle', 'arg', 'text', 'icon', 'quicklookurl', 'variables', 'mods', 'metaInfo')
		item.title = `${word.word_value}`
		item.subtitle = `${word.user_translates.map(x => x.translate_value).join(', ')}${data.group.id === 'dictionary' && word.groups ? `\t\t[${nameOfSetByNumber(word.groups).join(', ')}]` : ''}`
		item.arg = currentData.data
		item.text = {
			copy: `${word.word_value}\n\n${word.user_translates[0].translate_value}`,
			largetype: `${word.word_value}\n\n${word.user_translates[0].translate_value}`
		}
		item.icon = wordProgress(word.progress_percent, word.word_top)
		item.quicklookurl = word.user_translates[0].picture_url === '' ? '' : `https:${word.user_translates[0].picture_url}`
		item.variables = {missing: false}
		item.mods = {
			alt: {
				subtitle: '⏯ PLAY',
				variables: {
					audioFileName: word.word_id,
					audioUrl: word.sound_url,
					missing: false
				}
			},
			fn: {
				subtitle: '‼️ Delete this word ‼️',
				arg: JSON.stringify({
					word_id: word.word_id,
					groupId: word.groupId ? word.groupId : 'dictionary',
					word_value: word.word_value
				}),
				icon: {
					path: alfy.icon.delete
				}
			}
		}
		item.metaInfo = {
			id: typeof (word.user_translates) === 'object' ? word.user_translates.map(x => x.translate_id) : word.user_translates.translate_id
		}
		items.push(item.getProperties())
	}
	return items
}
const switchTargetLanguage = async input => {
	const items = []
	await alfy.fetch(`https://lingualeo.com/translate.php?q=${encodeURIComponent(input.normalize())}&from=&source=${yourLanguage}&target=en`)
		.then(data => {
			const item = new Render('rus translation',
				'title', 'valid')
			item.title = data.translation
			item.valid = false
			items.push(item.getProperties())
		})
	return items
}

const addToItemsAdditional = []
const fetchingMissingWords = data => {
	if (data.error_msg === '' && data.translate.length > 0) {
		for (const translate of data.translate) {
			const item = new Render('missing words',
				'title', 'subtitle', 'metaInfo')
			item.title = translate.value
			item.subtitle = translate.votes
			item.metaInfo = {
				id: translate.id,
				word_id: data.word_id,
				user_word_value: alfy.input
			}
			addToItemsAdditional.push(item.getProperties())
		}
		const item = new Render('your version',
			'title', 'metaInfo')
		item.title = 'add your version'
		item.metaInfo = {
			id: null,
			word_id: data.word_id,
			user_word_value: alfy.input
		}
		addToItemsAdditional.push(item.getProperties())
	} else {
		const item = new Render('error',
			'title')
		item.title = `Word "${alfy.input}" not found`
		addToItemsAdditional.push(item.getProperties())
	}
}

module.exports.missingWords = async input => {
	if (!/[a-zA-Z]/.test(input)) {
		return switchTargetLanguage(input)
	}
	const options = {
		uri: `https://lingualeo.com/api/gettranslates?word=${input}`,
		headers: {
			Cookie: alfy.config.get('Cookie')
		},
		json: true // Automatically parses the JSON string in the response
	}
	await rp(options)
		.then(data => {
			fetchingMissingWords(data)
		})
		.catch(error => {
			throw new WorkflowError(error.stack)
		})
	return addToItemsAdditional
}

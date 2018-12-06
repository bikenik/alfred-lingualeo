/* eslint camelcase: ["error", {properties: "never"}] */
'use strict'
const alfy = require('alfy')
const rp = require('request-promise')

const {nameOfSetByNumber, wordProgress} = require('../utils/api')
const Render = require('../utils/engine')

module.exports.datesForFilter = currentData => {
	const item = new Render('sort by date to Alfred',
		'title', 'subtitle', 'arg', 'variables')
	item.title = currentData.name
	item.subtitle = `words: ${currentData.count === '' ? '0' : currentData.count}`
	item.arg = currentData.name
	item.variables = {
		mode: currentData.name
	}
	return [item.getProperties()]
}

module.exports.wordTypesForFilter = async groupId => {
	const items = []
	const typeOfItems = [
		{name: 'Words', index: '1'},
		{name: 'Phrases', index: '2'},
		{name: 'Sentences', index: '3'}
	]
	for (const type of typeOfItems) {
		let countOfWords
		const options = {
			uri: `http://lingualeo.com/ru/userdict/json?sortBy=date&wordType=${type.index}&filter=all&page=1&groupId=${groupId}`,
			headers: {
				Cookie: alfy.config.get('Cookie')
			},
			json: true // Automatically parses the JSON string in the response
		}
		/* eslint-disable no-await-in-loop */
		await rp(options)
			.then(data => {
				countOfWords = data.count_words ? data.count_words.toString() : ''
			})
			.catch(error => {
				console.log('MYERROR: ', error)
			})
		/* eslint-enable no-await-in-loop */
		const item = new Render('sort by type to Alfred',
			'title', 'subtitle', 'variables')
		item.title = type.name
		item.subtitle = `words: ${countOfWords === '' ? '0' : countOfWords}`
		item.variables = {
			type: type.index,
			typeName: type.name,
			missing: false
		}
		items.push(item.getProperties())
	}
	return items
}

module.exports.filterWordsByDate = (data, currentData) => {
	const items = []
	for (const word of currentData.words) {
		const item = new Render('sorted with Alfred words',
			'title', 'subtitle', 'arg', 'text', 'icon', 'quicklookurl', 'variables', 'mods')
		item.title = `${word.word_value}`
		item.subtitle = `${word.user_translates[0].translate_value}${data.group.id === 'dictionary' && word.groups ? `\t\t[${nameOfSetByNumber(word.groups).join(', ')}]` : ''}`
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
		items.push(item.getProperties())
	}
	return items.length > 0 ? items : [{title: 'Words not found'}]
}

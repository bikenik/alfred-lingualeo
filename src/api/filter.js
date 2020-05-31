/* eslint camelcase: ["error", {properties: "never"}] */
'use strict'
const alfy = require('alfy')
const rp = require('request-promise')

const api = require('../utils/api')
const {nameOfSetByNumber, wordProgress} = require('../utils')
const Render = require('../utils/engine')

module.exports.datesForFilter = currentData => {
	const item = new Render('sort by date to Alfred',
		'title', 'subtitle', 'arg', 'variables')
	item.title = currentData.groupName
	item.subtitle = `words: ${currentData.groupCount === '' ? '0' : currentData.groupCount}`
	item.arg = currentData.groupName
	item.variables = {
		mode: currentData.groupName
	}
	return [item.getProperties()]
}

module.exports.wordTypesForFilter = async groupId => {
	const items = []
	const typeOfItems = [
		{name: 'word', index: '1'},
		{name: 'phrase', index: '2'},
		{name: 'sentence', index: '3'}
	]
	for (const type of typeOfItems) {
		let countOfWords
		const options = api.optionsDataGetWords(groupId, type.name)
		/* eslint-disable no-await-in-loop */
		await rp(options)
			.then(data => {
				countOfWords = data.data.length > 0
			})
			.catch(error => {
				console.log('MYERROR:', error)
			})
		/* eslint-enable no-await-in-loop */
		const item = new Render('sort by type to Alfred',
			'title', 'variables')
		if (countOfWords) {
			item.title = type.name
			item.variables = {
				type: type.index,
				typeName: type.name,
				missing: false
			}
			items.push(item.getProperties())
		}
	}

	return items
}

module.exports.filterWordsByDate = (data, currentData) => {
	const items = []
	for (const word of data.words) {
		const item = new Render('sorted with Alfred words',
			'title', 'subtitle', 'arg', 'text', 'icon', 'quicklookurl', 'variables', 'mods')
		item.title = `${word.wordValue}`
		item.subtitle = `${word.combinedTranslation}${data.groupName === 'dictionary' && word.groupName ? `\t\t[${nameOfSetByNumber(word.groupName).join(', ')}]` : ''}`
		item.arg = currentData.data
		item.text = {
			copy: `${word.wordValue}\n\n${word.combinedTranslation}`,
			largetype: `${word.wordValue}\n\n${word.combinedTranslation}`
		}
		item.icon = wordProgress(word.progress, word.word_top)
		item.quicklookurl = word.picture === '' ? '' : word.picture
		item.variables = {missing: false}
		item.mods = {
			alt: {
				subtitle: '⏯ PLAY',
				variables: {
					audioFileName: word.id,
					audioUrl: word.pronunciation,
					missing: false
				}
			},
			fn: {
				subtitle: '‼️ Delete this word ‼️',
				arg: JSON.stringify({
					word_id: word.id,
					groupId: word.wordSets.length > 0 ? word.wordSets[0].id : 'dictionary',
					word_value: word.wordValue
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

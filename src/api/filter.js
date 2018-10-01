/* eslint camelcase: ["error", {properties: "never"}] */
'use strict'
const alfy = require('alfy')
const rp = require('request-promise')

const {nameOfSetByNumber, wordProgress} = require('../utils')
const Render = require('../utils/engine')

const addToItems = new Render()

module.exports.datesForFilter = currentData => {
	addToItems.add(
		new Render('sort by date to Alfred',
			{title: currentData.name},
			{subtitle: `words: ${currentData.count === '' ? '0' : currentData.count}`},
			{arg: currentData.name},
			{
				variables: {
					mode: currentData.name
				}
			}
		))
	return addToItems.items
}

module.exports.wordTypesForFilter = async groupId => {
	const typeOfitems = [
		{name: 'Words', index: '1'},
		{name: 'Phrases', index: '2'},
		{name: 'Sentences', index: '3'}
	]
	for (const type of typeOfitems) {
		let countOfWords
		const options = {
			uri: `http://lingualeo.com/ru/userdict/json?sortBy=date&wordType=${type.index}&filter=all&page=1&groupId=${groupId}`,
			headers: {
				// 'Cookie': myCookie.Cookie
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
		addToItems.add(
			new Render('sort by type to Alfred',
				{title: type.name},
				{subtitle: `words: ${countOfWords === '' ? '0' : countOfWords}`},
				{
					variables: {
						type: type.index,
						typeName: type.name,
						missing: false
					}
				}
			))
	}
	return addToItems.items
}

module.exports.filterWordsByDate = (data, currentData) => {
	for (const word of currentData.words) {
		addToItems.add(
			new Render('sorted with Alfred words',
				{title: `${word.word_value}`},
				{subtitle: `${word.user_translates[0].translate_value}${data.group.id === 'dictionary' && word.groups ? `\t\t[${nameOfSetByNumber(word.groups).join(', ')}]` : ''}`},
				{arg: currentData.data},
				{
					text: {
						copy: `${word.word_value}\n\n${word.user_translates[0].translate_value}`,
						largetype: `${word.word_value}\n\n${word.user_translates[0].translate_value}`
					}
				},
				{icon: wordProgress(word.progress_percent, word.word_top)},
				{quicklookurl: word.user_translates[0].picture_url === '' ? '' : `https:${word.user_translates[0].picture_url}`},
				{
					variables: {
						missing: false
					}
				},
				{
					mods: {
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
				}
			))
	}
	return addToItems.items.length > 0 ? addToItems.items : [{title: 'Words not found'}]
}

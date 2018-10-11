/* eslint camelcase: ["error", {properties: "never"}] */
'use strict'
const alfy = require('alfy')
const rp = require('request-promise')

const WorkflowError = require('../utils/error')
const {nameOfSetByNumber, wordProgress} = require('../utils/api')
const Render = require('../utils/engine')

const addToItems = new Render()
module.exports.allWords = (data, currentData) => {
	for (const word of currentData.words) {
		addToItems.add(
			new Render('words',
				{title: `${word.word_value}`},
				{subtitle: `${word.user_translates.map(x => x.translate_value).join(', ')}${data.group.id === 'dictionary' && word.groups ? `\t\t[${nameOfSetByNumber(word.groups).join(', ')}]` : ''}`},
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
				},
				{
					metaInfo: {
						id: typeof (word.user_translates) === 'object' ? word.user_translates.map(x => x.translate_id) : word.user_translates.translate_id
					}
				}
			))
	}
	return addToItems.items
}

module.exports.missingWords = async input => {
	const addToItemsAdditional = new Render()
	if (!/[a-zA-Z]/.test(input)) {
		await alfy.fetch(`https://lingualeo.com/translate.php?q=${encodeURIComponent(input.normalize())}&from=&source=${process.env.your_language}&target=en`)
			.then(data => {
				addToItemsAdditional.add(
					new Render('rus translation',
						{title: data.translation},
						{valid: false}
					))
			})
		return addToItemsAdditional.items
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
			if (data.error_msg === '' && data.translate.length > 0) {
				for (const translate of data.translate) {
					addToItemsAdditional.add(
						new Render('missing words',
							{title: translate.value},
							{subtitle: translate.votes},
							{
								metaInfo: {
									id: translate.id,
									word_id: data.word_id,
									user_word_value: alfy.input
								}
							}
						))
				}
				addToItemsAdditional.add(
					new Render('your version',
						{title: 'add your version'},
						{
							metaInfo: {
								id: null,
								word_id: data.word_id,
								user_word_value: alfy.input
							}
						}
					))
			} else {
				addToItemsAdditional.add(
					new Render('error',
						{title: `Word "${alfy.input}" not found`}
					))
			}
		}).catch(error => {
			throw new WorkflowError(error.stack)
		})
	return addToItemsAdditional.items
}

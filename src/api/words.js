/* eslint camelcase: ["error", {properties: "never"}] */
'use strict'
const alfy = require('alfy')
const rp = require('request-promise')

const WorkflowError = require('../utils/error')
const api = require('../utils/api')
const {wordProgress} = require('../utils')
const Render = require('../utils/engine')

const starVotes = (versions, i) => {
	let current = versions - i
	let stars = ''
	do {
		current--
		stars += '⭑'
	} while (current > 0)

	return stars
}

module.exports.allWords = data => {
	const items = []
	for (const word of data.words) {
		const item = new Render('words',
			'title', 'subtitle', 'arg', 'text', 'icon', 'quicklookurl', 'variables', 'mods', 'metaInfo')
		item.title = `${word.wordValue}`
		item.subtitle = word.combinedTranslation
		item.arg = word.created
		item.text = {
			copy: `${word.wordValue}\n\n${word.combinedTranslation ? word.combinedTranslation : ''}`,
			largetype: `${word.wordValue}\n\n${word.combinedTranslation ? word.combinedTranslation : ''}`
		}
		item.icon = wordProgress(word.progress, 0)
		item.quicklookurl = word.picture ? word.picture : ''
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
		item.metaInfo = {
			id: typeof (word.combinedTranslation) === 'object' ? word.user_translates.map(x => x.translate_id) : word.id
		}

		items.push(item.getProperties())
	}

	return items
}

const addToItemsAdditional = []

const yandexSpeller = async input => {
	/* ****************************************
	Search by suggestions (Yandex Speller)
	******************************************* */
	try {
		const data = await alfy.fetch(`https://speller.yandex.net/services/spellservice.json/checkText?text=${input}&lang=en`)
		if (data.length > 0) {
			return data[0].s.map(x => {
				const item = new Render('Yandex Speller',
					'title', 'subtitle', 'autocomlete', 'valid', 'icon')
				item.title = x
				item.subtitle = `Perhaps you mean: ${x}`
				item.autocomplete = x
				item.valid = false
				item.icon = './icons/speller.png'
				return item.getProperties()
			})
		}
	} catch (error) {
		throw new WorkflowError(error.stack)
	}
}

const fetchingMissingWords = async (data, source) => {
	if (source === 'en') {
		const spellerChecked = await yandexSpeller(alfy.input)
		if (spellerChecked) {
			addToItemsAdditional.push(...spellerChecked)
		}

		if (data.error_msg === '' && data.translate.length > 0) {
			data.translate.sort((a, b) => {
				return b.votes - a.votes
			}).forEach((translate, i) => {
				const item = new Render('missing words',
					'title', 'subtitle', 'metaInfo', 'icon')
				item.title = translate.translate_value
				item.subtitle = starVotes(data.translate.length, i)
				item.metaInfo = {
					id: translate.id,
					word_id: data.word_id,
					user_word_value: alfy.input,
					is_user: translate.is_user
				}
				item.icon = 'icons/jungle.png'
				addToItemsAdditional.push(item.getProperties())
			})

			const item = new Render('your version',
				'title', 'icon', 'metaInfo')
			item.title = 'add your version'
			item.icon = 'icons/Option.png'
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
	} else if (data.word_forms) {
		data.word_forms.sort((a, b) => {
			return b.votes - a.votes
		}).forEach((translate, i) => {
			const item = new Render('missing words',
				'title', 'subtitle', 'metaInfo', 'icon')
			item.title = translate.word
			item.subtitle = starVotes(data.word_forms.length, i)
			item.autocomplete = translate.word
			item.metaInfo = {
				id: null,
				word_id: translate.word_id,
				user_word_value: alfy.input
			}
			item.icon = 'icons/jungle.png'
			addToItemsAdditional.push(item.getProperties())
		})
	}

	return addToItemsAdditional
}

module.exports.missingWords = async input => {
	try {
		const data = await rp(api.optionsDataGetTransales(input))
		if (!/[a-zA-Z]/.test(input)) {
			return await fetchingMissingWords(data, 'ru')
		}

		return await fetchingMissingWords(data, 'en')
	} catch (error) {
		throw new WorkflowError(error.stack)
	}
}

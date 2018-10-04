/* eslint camelcase: ["error", {properties: "never"}] */
'use strict'
const alfy = require('alfy')
const got = require('got')
const rp = require('request-promise')

const {username} = process.env
const {password} = process.env

const WorkflowError = require('../utils/error')
const Render = require('../utils/engine')
const {saveAudioFile} = require('../utils')
const {allWords, missingWords} = require('./words')
const {wordTypesForFilter, filterWordsByDate, datesForFilter} = require('./filter')

const addToItems = new Render()

const groupId = process.env.groupId ? process.env.groupId : 'dictionary'
const type = process.env.type ? process.env.type : '0'
const {audioUrl} = process.env
const {audioFileName} = process.env
const mode = process.argv[3]

const getCookie = async () => {
	try {
		const response = await got(`https://lingualeo.com/api/login?email=${username}&password=${password}`)
		alfy.config.set('Cookie', response.headers['set-cookie'])
	} catch (error) {
		console.log(error)
		//	=> 'Internal server error ...'
	}
}
const checkForAlreadyAdded = (items, x) => {
	return items.length > 0 && items
		.filter(z => z.metaInfo.id
			.filter(y => y === x.metaInfo.id).length > 0).length > 0
}
const itemsReduce = (items, missingWordsResult) => {
	return [...items, ...alfy.matches('', missingWordsResult, 'title').map(x => ({
		title: x.title,
		subtitle: x.subtitle,
		arg: x.arg,
		variables: {
			missing: !checkForAlreadyAdded(items, x),
			search: JSON.stringify({
				translate_id: x.metaInfo.id,
				word_id: x.metaInfo.word_id,
				translate_value: x.title,
				user_word_value: x.metaInfo.user_word_value
			}, '', 2),
			currentSearch: x.metaInfo.user_word_value
		},
		icon: checkForAlreadyAdded(items, x) ? {
			path: 'icons/word-exist.png'
		} : {path: 'icons/jungle.png'}
	}))]
}

alfy.input = alfy.input.replace(/.*?\u2023[\s]/gm, '')
const bool = missingWordsResult => {
	return {
		missing: missingWordsResult && missingWordsResult[0].name === 'rus translation',
		addNewWord: mode === 'allWords' && type === '0' && groupId === 'dictionary' && alfy.input !== ''
	}
}
const updateListOfSetName = async () => {
	const options = {
		uri: 'https://lingualeo.com/ru/userdict3/getWordSets',
		headers: {
			Cookie: alfy.config.get('Cookie')
		},
		json: true
	}
	await rp(options)
		.then(data => {
			const setsName = data.result.map(x => ({
				setNumber: x.id,
				setName: x.name
			}))
			alfy.config.set('nameOfSets', setsName)
		})
		.catch(error => {
			throw new WorkflowError(error.stack)
		})
}
const runDictionary = async () => {
	await getCookie()
	const options = {
		uri: `http://lingualeo.com/ru/userdict/json?sortBy=date&wordType=${type}&filter=all&page=1&groupId=${groupId}`,
		headers: {
			Cookie: alfy.config.get('Cookie')
		},
		json: true // Automatically parses the JSON string in the response
	}
	await rp(options)
		.then(async data => {
			switch (mode) {
				case 'play':
					saveAudioFile(audioUrl, audioFileName)
					break
				case 'filter':
					addToItems.items = await wordTypesForFilter(groupId)
					break
				default:
					break
			}

			for (const currentDate of data.userdict3) {
				switch (mode) {
					case 'allWords':
						addToItems.items = allWords(data, currentDate)
						break
					case 'filter':
						addToItems.items = datesForFilter(currentDate)
						break
					case currentDate.name:
						addToItems.items = filterWordsByDate(data, currentDate)
						break
					default:
						break
				}
			}

			let items = alfy.inputMatches(addToItems.items, 'title')
				.map(x => ({
					title: x.title,
					subtitle: x.subtitle,
					arg: x.arg,
					text: x.text,
					autocomplete: x.autocomplete,
					variables: x.variables,
					icon: x.icon,
					quicklookurl: x.quicklookurl,
					mods: x.mods,
					metaInfo: x.metaInfo
				}))
			let missingWordsResult
			if (bool().addNewWord) {
				missingWordsResult = await missingWords(alfy.input)
				if (missingWordsResult[0] && missingWordsResult[0].name !== 'error') {
					items = bool(missingWordsResult).missing ?
						[{
							title: missingWordsResult[0].title,
							subtitle: 'Press Tab ↹ or ↵ to add translations',
							autocomplete: missingWordsResult[0].autocomplete,
							valid: false
						}] : itemsReduce(items, missingWordsResult)
				} else {
					items = missingWordsResult[0]
				}
			}
			alfy.output(items.length > 0 ? items : [{title: 'Words not found'}])
		})
		.catch(error => {
			throw new WorkflowError(error.stack)
		})
}

if (username === '' && password === '' && alfy.config.has('nameOfSets')) {
	alfy.output([{
		title: 'Login and Password are missing',
		subtitle: 'Pleas, fill the password and username from your LinguaLeo account'
	}])
} else {
	updateListOfSetName()
	runDictionary()
}

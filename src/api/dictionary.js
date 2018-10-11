/* eslint camelcase: ["error", {properties: "never"}] */
/* eslint new-cap: ["error", { "capIsNew": false }] */
'use strict'
const alfy = require('alfy')
const rp = require('request-promise')

const {User} = require('../utils/api')
const WorkflowError = require('../utils/error')
const Render = require('../utils/engine')
const {saveAudioFile} = require('../utils/api')
const {allWords, missingWords} = require('./words')
const {wordTypesForFilter, filterWordsByDate, datesForFilter} = require('./filter')

const addToItems = new Render()

const {username} = process.env
const {password} = process.env
const groupId = process.env.groupId ? process.env.groupId : 'dictionary'
const type = process.env.type ? process.env.type : '0'
const {audioUrl} = process.env
const {audioFileName} = process.env
const mode = process.argv[3]

const currentUser = User()

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
		text: {
			copy: x.title,
			largetype: x.title
		},
		variables: {
			missing: !checkForAlreadyAdded(items, x),
			search: JSON.stringify({
				translate_id: x.metaInfo.id,
				word_id: x.metaInfo.word_id,
				translate_value: x.title,
				user_word_value: x.metaInfo.user_word_value
			}, '', 2),
			currentSearch: x.metaInfo.user_word_value,
			custom: x.name === 'your version'
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
const concatArrayInDublicateObj = (myArr, prop) => {
	return myArr.filter((obj, pos, arr) => {
		if (arr.map(mapObj => mapObj[prop]).indexOf(obj[prop]) !== pos) {
			arr[pos - 1].words = [...arr[pos - 1].words, ...obj.words]
		}
		return arr.map(mapObj => mapObj[prop]).indexOf(obj[prop]) === pos
	})
}
const runDictionary = async () => {
	let parseData
	let wordExist = true
	/* eslint-disable no-await-in-loop */
	for (let countPage = 1; ; countPage++) {
		const options = {
			uri: `http://lingualeo.com/ru/userdict/json?sortBy=date&wordType=${type}&filter=all&page=${countPage}&groupId=${groupId}`,
			headers: {
				Cookie: alfy.config.get('Cookie')
			},
			json: true // Automatically parses the JSON string in the response
		}
		await rp(options)
			.then(data => {
				if (data.userdict3.length > 0 && countPage === 1) {
					parseData = data
				} else if (data.userdict3.length > 0 && countPage > 1) {
					parseData.userdict3 = concatArrayInDublicateObj([...parseData.userdict3, ...data.userdict3], 'name')
				} else {
					wordExist = false
				}
			})
			.catch(error => {
				throw new WorkflowError(error.stack)
			})
		if (!wordExist) {
			break
		}
	}
	/* eslint-enable no-await-in-loop */
	try {
		const runParseData = async parseData => {
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

			for (const currentDate of parseData.userdict3) {
				switch (mode) {
					case 'allWords':
						addToItems.items = allWords(parseData, currentDate)
						break
					case 'filter':
						addToItems.items = datesForFilter(currentDate)
						break
					case currentDate.name:
						addToItems.items = filterWordsByDate(parseData, currentDate)
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
		}
		runParseData(parseData)
	} catch (error) {
		throw new WorkflowError(error.stack)
	}
}
(async () => {
	await currentUser.login(username, password)
	if (username !== '' && password !== '') {
		updateListOfSetName()
		runDictionary()
	}
})()

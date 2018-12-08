/* eslint camelcase: ["error", {properties: "never"}] */
/* eslint new-cap: ["error", { "capIsNew": false }] */
'use strict'
const alfy = require('alfy')
const WorkflowError = require('../utils/error')
const {saveAudioFile} = require('../utils/api')
const runRefresh = require('../utils/run-refresh')
const {allWords, missingWords} = require('./words')
const {wordTypesForFilter, filterWordsByDate, datesForFilter} = require('./filter')

const {audioUrl, audioFileName} = process.env
const currentSet = process.env.currentSet ? process.env.currentSet.replace(/\s/g, '-') : 'My-dictionary'
const groupId = process.env.groupId ? process.env.groupId : 'dictionary'
const type = process.env.type ? process.env.type : '0'
const mode = process.argv[3]

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
		} : x.icon
	}))]
}

alfy.input = alfy.input.replace(/\n/gm, ' ')
alfy.input = alfy.input.replace(/.*?\u2023[\s]/gm, '')
const bool = missingWordsResult => {
	return {
		missing: missingWordsResult && missingWordsResult[0].name === 'rus translation',
		addNewWord: mode === 'allWords' && type === '0' && groupId === 'dictionary' && alfy.input !== ''
	}
}

const runDictionary = () => {
	const typeOf = ['allTypes', 'Words', 'Phrases', 'Sentences']
	const parseData = require(`../../data/${currentSet}-${typeOf[type]}.json`)
	try {
		const itemsResult = []
		const runParseData = async parseData => {
			switch (mode) {
				case 'play':
					saveAudioFile(audioUrl, audioFileName)
					break
				case 'filter':
					itemsResult.push(...await wordTypesForFilter(groupId))
					break
				default:
					break
			}

			for (const currentDate of parseData.userdict3) {
				switch (mode) {
					case 'allWords':
						itemsResult.push(...allWords(parseData, currentDate))
						break
					case 'filter':
						itemsResult.push(...datesForFilter(currentDate))
						break
					case currentDate.name:
						itemsResult.push(...filterWordsByDate(parseData, currentDate))
						break
					default:
						break
				}
			}

			let items = alfy.inputMatches(itemsResult, 'title')
				.map(x => ({
					name: x.name,
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

if (alfy.config.get('login') === undefined) {
	alfy.output([{
		title: `Your login is: ${alfy.input}`,
		subtitle: 'Please, fill in and check your input above and hit ↵',
		icon: {path: './icons/Login.png'},
		arg: alfy.input,
		variables: {
			inputMode: 'login'
		}
	}])
} else if (alfy.config.get('password') === undefined) {
	alfy.output([{
		title: `Your password is: ${alfy.input}`,
		subtitle: 'Please, fill in and check your input above and hit ↵',
		icon: {path: './icons/Password.png'},
		arg: alfy.input,
		variables: {
			inputMode: 'password'
		}
	}])
} else {
	runDictionary()
	runRefresh()
}

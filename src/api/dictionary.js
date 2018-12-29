/* eslint camelcase: ["error", {properties: "never"}] */
/* eslint new-cap: ["error", { "capIsNew": false }] */
'use strict'
const fs = require('fs')
const alfy = require('alfy')
const WorkflowError = require('../utils/error')
const {saveAudioFile} = require('../utils/api')
const runRefresh = require('../utils/run-refresh')
const {allWords, missingWords} = require('./words')
const {wordTypesForFilter, filterWordsByDate, datesForFilter} = require('./filter')

const {audioUrl, audioFileName} = process.env
const currentSet = process.env.currentSetId ? process.env.currentSetId : alfy.config.get('nameOfSets') && alfy.config.get('nameOfSets')[0] ? alfy.config.get('nameOfSets')[0].setNumber : ''
const groupId = process.env.groupId ? process.env.groupId : 'dictionary'
const type = process.env.type ? process.env.type : '0'
const mode = process.argv[3]
const typeOf = ['allTypes', 'Words', 'Phrases', 'Sentences']

const checkForAlreadyAdded = (items, x) => {
	return items.length > 0 && items
		.filter(z => z.metaInfo.id
			.filter(y => y === x.metaInfo.id).length > 0).length > 0
}
const itemsReduce = (items, missingWordsResult) => {
	return [...items, ...alfy.matches('', missingWordsResult, 'title').map(x => ({
		title: x.title,
		subtitle: x.subtitle,
		arg: x.arg ? x.arg : null,
		autocomplete: x.autocomplete ? x.autocomplete : null,
		valid: x.valid ? x.valid : false,
		text: {
			copy: x.title,
			largetype: x.title
		},
		variables: {
			missing: !checkForAlreadyAdded(items, x),
			search: JSON.stringify({
				translate_id: x.metaInfo ? x.metaInfo.id : '',
				word_id: x.metaInfo ? x.metaInfo.word_id : '',
				translate_value: x.title,
				user_word_value: x.metaInfo ? x.metaInfo.user_word_value : ''
			}, '', 2),
			currentSearch: x.metaInfo ? x.metaInfo.user_word_value : '',
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
				if (missingWordsResult[0] && missingWordsResult[0].name !== 'error' && missingWordsResult[0].title) {
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
			alfy.output(items.length > 0 ? items : [{title: 'Word not found'}])
		}
		runParseData(parseData)
	} catch (error) {
		throw new WorkflowError(error.stack)
	}
}

if (/^!.*/.test(alfy.input)) {
	alfy.output([
		{
			title: 'reset login and password',
			subtitle: 'hit ↵ to reset your login & password',
			variables: {settingMode: 'reset'},
			icon: {path: alfy.icon.delete}
		},
		{
			title: 'toogle color of icons for dark/light theme',
			subtitle: 'hit ↵ to toogle day or night theme',
			variables: {settingMode: 'theme'},
			icon: {path: 'icons/night_and_day.png'}
		}
	])
} else if (alfy.config.get('login') === undefined) {
	alfy.output([{
		title: `Your login is: ${alfy.input}`,
		subtitle: 'Please, fill in and check your input above and hit ↵',
		icon: {path: './icons/Login.png'},
		arg: alfy.input,
		variables: {
			settingMode: 'login'
		}
	}])
} else if (alfy.config.get('password') === undefined) {
	alfy.output([{
		title: `Your password is: ${alfy.input}`,
		subtitle: 'Please, fill in and check your input above and hit ↵',
		icon: {path: './icons/Password.png'},
		arg: alfy.input,
		variables: {
			settingMode: 'password'
		}
	}])
} else {
	fs.access(`data/${currentSet}-${typeOf[type]}.json`, fs.constants.F_OK, error => {
		if (error) {
			runRefresh()
			alfy.output([{
				title: 'Wait for downloading data from server'
			}])
		} else {
			runDictionary()
		}
	})
	if (!process.env.settingMode) {
		runRefresh()
	}
}

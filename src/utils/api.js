/* eslint-env es6 */
/* eslint camelcase: ["error", {properties: "never"}] */

const fs = require('fs')
const alfy = require('alfy')
const request = require('request-promise')
const streamToPromise = require('stream-to-promise')

module.exports.saveAudioFile = async (url, fileName) => {
	const writeStreamExp = fs.createWriteStream(
		`${process.env.PWD}/tmp/${fileName}.mp3`
	)
	request
		.get(url)
		.pipe(writeStreamExp)
	await streamToPromise(writeStreamExp)
	writeStreamExp.end()
}

module.exports.optionsSetWords = async (groupId, mode) => {
	const search = JSON.parse(process.env.search)
	const data = () => {
		const wordIds = () => {
			if (search.translate_id) {
				return [search.word_id]
			}

			return null
		}

		const valueList = () => {
			if (search.translate_id) {
				return {
					wordSetId: groupId,
					translation: {
						id: search.translate_id,
						main: 1,
						selected: 1
					}
				}
			}

			return {
				wordValue: search.user_word_value,
				wordSetId: groupId,
				translation: {
					tr: search.translate_value
				}
			}
		}

		if (mode === 'delete') {
			return [
				{
					action: 'delete',
					mode: 'delete',
					wordSetId: 1, // Use [groupId] for remove the word out of the specifying set
					wordIds: [
						search.word_id
					],
					dateGroups: null,
					filter: null,
					chunk: null,
					valueList: {
						globalSetId: 1
					}
				}
			]
		}

		return [
			{
				action: 'add',
				mode: '0',
				wordIds: wordIds(),
				valueList: valueList()
			}
		]
	}

	const op = () => {
		if (mode === 'delete') {
			return 'groupActionWithWords {action: delete}'
		}

		return 'actionWithWords {action: add}'
	}

	return {
		method: 'POST',
		uri: 'https://api.lingualeo.com/SetWords',
		headers:
		{
			'Content-Type': 'application/json',
			Cookie: alfy.config.get('Cookie'),
			Host: 'api.lingualeo.com'
		},
		body:
			{
				apiVersion: '1.0.1',
				op: op(),
				data: data(),
				userData: {
					nativeLanguage: 'lang_id_src'
				},
				ctx: {
					config: {
						isCheckData: true,
						isLogging: true
					}
				}
			},
		json: true
	}
}

module.exports.optionsDataGetWords = (wordSetId, category = '') => {
	return {
		method: 'POST',
		uri: 'https://api.lingualeo.com/GetWords',
		headers: {
			'Content-Type': 'application/json',
			Cookie: alfy.config.get('Cookie'),
			Host: 'api.lingualeo.com',
			Referer: 'https://lingualeo.com/ru/dictionary/vocabulary/jungle',
			Connection: 'keep-alive'
		},
		body: {
			apiVersion: '1.0.1',
			api_call: 'GetWords',
			attrList: {
				id: 'id',
				wordValue: 'wd',
				origin: 'wo',
				wordType: 'wt',
				translations: 'trs',
				wordSets: 'ws',
				created: 'cd',
				learningStatus: 'ls',
				progress: 'pi',
				transcription: 'scr',
				pronunciation: 'pron',
				relatedWords: 'rw',
				association: 'as',
				trainings: 'trainings',
				listWordSets: 'listWordSets',
				combinedTranslation: 'trc',
				picture: 'pic',
				speechPartId: 'pid',
				wordLemmaId: 'lid',
				wordLemmaValue: 'lwd'
			},
			category,
			dateGroup: 'start',
			mode: 'basic',
			perPage: 6000,
			status: '',
			wordSetId,
			offset: null,
			search: '',
			training: null,
			ctx: {
				config: {
					isCheckData: true,
					isLogging: true
				}
			},
			token: alfy.config.get('Cookie')[1].replace(/remember=(.*?);.*/g, '$1')
		},
		json: true
	}
}

module.exports.optionsDataGetWordSet = () => {
	return {
		method: 'POST',
		uri: 'https://api.lingualeo.com/GetWordSets',
		headers: {
			'Content-Type': 'application/json',
			Cookie: alfy.config.get('Cookie'),
			Host: 'api.lingualeo.com',
			Referer: 'https://lingualeo.com/ru/dictionary/sets/my',
			Connection: 'keep-alive'
		},
		body: {
			apiVersion: '1.0.0',
			op: 'loadSets: \n[\n  {\n    "req": "myAll",\n    "opts": {\n      "category": "all",\n      "page": 1,\n      "perPage": 20\n    },\n    "attrs": [\n      "type",\n      "id",\n      "name",\n      "countWords",\n      "countWordsLearned",\n      "picture",\n      "category",\n      "status",\n      "source",\n      "level"\n    ]\n  }\n]',
			request: [
				{
					subOp: 'myAll',
					type: 'user',
					perPage: 999,
					sortBy: 'created',
					attrList: {
						type: 'type',
						id: 'id',
						name: 'name',
						countWords: 'cw',
						countWordsLearned: 'cl',
						wordSetId: 'wordSetId',
						picture: 'pic',
						category: 'cat',
						status: 'st',
						source: 'src'
					}
				}
			],
			ctx: {
				config: {
					isCheckData: true,
					isLogging: true
				}
			}
		},
		json: true
	}
}

module.exports.optionsDataGetTransales = input => {
	return {
		method: 'POST',
		uri: 'https://api.lingualeo.com/getTranslates',
		headers: {
			Cookie: alfy.config.get('Cookie'),
			Connection: 'keep-alive'
		},
		body: {
			apiVersion: '1.0.1',
			text: `${input.normalize()}`,
			ctx: {
				config: {
					isCheckData: true,
					isLogging: true
				}
			}
		},
		json: true // Automatically parses the JSON string in the response
	}
}

module.exports.optionsSetWordSets = (groupId, mode, input) => {
	const data = mode => {
		if (mode === 'delete only set') {
			return [
				{
					action: 'delete',
					wordSetId: groupId
				}
			]
		}

		if (mode === 'add set') {
			return [
				{
					action: 'add',
					valueList: {
						name: input,
						picture: null
					}
				}
			]
		}

		return [
			{
				action: 'delete_all',
				wordSetId: groupId
			}
		]
	}

	const op = mode => {
		if (mode === 'delete only set') {
			return 'removeWordSet'
		}

		if (mode === 'add set') {
			return 'createWordSet'
		}

		return 'removeWordSetFromAllDicts'
	}

	return {
		method: 'POST',
		uri: 'https://api.lingualeo.com/SetWordSets',
		headers: {
			'Content-Type': 'application/json',
			Cookie: alfy.config.get('Cookie'),
			Host: 'api.lingualeo.com',
			Connection: 'keep-alive'
		},
		body: {
			apiVersion: '1.0.0',
			op: op(mode),
			data: data(mode),
			ctx: {
				config: {
					isCheckData: true,
					isLogging: true
				}
			}
		},
		json: true
	}
}

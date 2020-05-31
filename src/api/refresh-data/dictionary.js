/* eslint-env es6 */
const alfy = require('alfy')
const jsonfile = require('jsonfile')
const rp = require('request-promise')

const WorkflowError = require('../../utils/error')
const api = require('../../utils/api')
const user = require('./user-info')

const username = alfy.config.get('login')
const password = alfy.config.get('password')

const options1 = (wordSetId, category) => {
	return api.optionsDataGetWords(wordSetId, category)
}

const options2 = () => {
	return api.optionsDataGetWordSet()
}

const updateListOfSetName = async () => {
	const setsOfDictionary = './data/sets-of-dictionary.json'
	await rp(options2())
		.then(data => {
			jsonfile.writeFile(setsOfDictionary, data, {
				spaces: 2
			}, err => {
				if (err !== null) {
					console.error(err)
				}
			})
			const setsName = data.data[0].items.map(x => ({
				setNumber: x.id,
				setName: x.name
			}))
			alfy.config.set('nameOfSets', setsName)
		})
		.catch(error => {
			throw new WorkflowError(error.stack)
		})
}

const concatArrayInDublicateObject = (myArray, prop) => {
	return myArray.filter((object, pos, array) => {
		if (array.map(mapObject => mapObject[prop]).indexOf(object[prop]) !== pos) {
			array[pos - 1].words = [...array[pos - 1].words, ...object.words]
		}

		return array.map(mapObject => mapObject[prop]).indexOf(object[prop]) === pos
	})
}

let parseData
let wordExist = true
const getData = (data, countPage, setNumber, type) => {
	if (countPage === 1) {
		parseData = data
		jsonfile.writeFile(`./data/${setNumber}-${type.name}.json`, parseData, {
			spaces: 2
		}, err => {
			if (err !== null) {
				console.error(err)
			}
		})
	} else if (data.userdict3 && parseData.userdict3 && data.userdict3.length > 0 && countPage > 1) {
		parseData.userdict3 = concatArrayInDublicateObject([...parseData.userdict3, ...data.userdict3], 'name')
		jsonfile.writeFile(`./data/${setNumber}-${type.name}.json`, parseData, {
			spaces: 2
		}, err => {
			if (err !== null) {
				console.error(err)
			}
		})
	} else {
		wordExist = false
	}
}

const runApi = async () => {
	const currentUser = user()
	await currentUser.login(username, password)
	if (username !== '' && password !== '') {
		await updateListOfSetName()
	}

	for (const dic of alfy.config.get('nameOfSets')) {
		const setNumber = dic.setNumber.toString()
		const typeOfItems = [
			{name: 'allTypes', index: ''},
			{name: 'Words', index: 'word'},
			{name: 'Phrases', index: 'phrase'},
			{name: 'Sentences', index: 'sentence'}
		]
		for (const type of typeOfItems) {
			for (let countPage = 1; ; countPage++) {
				/* eslint-disable no-await-in-loop */
				await rp(options1(setNumber, type.index))
					.then(data => {
						getData(data, countPage, setNumber, type)
					})
					.catch(error => {
						if (error.message !== 'Error: socket hang up') {
							throw new WorkflowError(error.stack)
						}
					})
				/* eslint-enable no-await-in-loop */
				if (!wordExist) {
					break
				}
			}
		}
	}
}

runApi()

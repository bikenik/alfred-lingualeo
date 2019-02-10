/* eslint-env es6 */
const alfy = require('alfy')
const jsonfile = require('jsonfile')
const rp = require('request-promise')

const WorkflowError = require('../../utils/error')
const user = require('./user-info')

const username = alfy.config.get('login')
const password = alfy.config.get('password')

const updateListOfSetName = async () => {
	const setsOfDictionary = './data/sets-of-dictionary.json'
	const options = {
		uri: 'https://lingualeo.com/ru/userdict3/getWordSets',
		headers: {
			Cookie: alfy.config.get('Cookie')
		},
		json: true
	}
	await rp(options)
		.then(data => {
			jsonfile.writeFile(setsOfDictionary, data, {
				spaces: 2
			}, err => {
				if (err !== null) {
					console.error(err)
				}
			})
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
	} else if (data.userdict3 && data.userdict3.length > 0 && countPage > 1) {
		parseData.userdict3 = concatArrayInDublicateObj([...parseData.userdict3, ...data.userdict3], 'name')
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
			{name: 'allTypes', index: '0'},
			{name: 'Words', index: '1'},
			{name: 'Phrases', index: '2'},
			{name: 'Sentences', index: '3'}
		]
		for (const type of typeOfItems) {
			for (let countPage = 1; ; countPage++) {
				const options = {
					uri: `http://lingualeo.com/ru/userdict/json?sortBy=date&wordType=${type.index}&filter=all&page=${countPage}&groupId=${dic.setNumber}`,
					headers: {
						Cookie: alfy.config.get('Cookie')
					},
					json: true // Automatically parses the JSON string in the response
				}
				/* eslint-disable no-await-in-loop */
				await rp(options)
					.then(data => {
						getData(data, countPage, setNumber, type)
					})
					.catch(error => {
						throw new WorkflowError(error.stack)
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

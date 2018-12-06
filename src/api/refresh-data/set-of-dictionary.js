
const alfy = require('alfy')
const jsonfile = require('jsonfile')
const rp = require('request-promise')

const setsOfDictionary = './data/sets-of-dictionary.json'

const options = {
	uri: 'https://lingualeo.com/ru/userdict3/getWordSets',
	headers: {
		Cookie: alfy.config.get('Cookie')
	},
	json: true
};
(async () => {
	await rp(options)
		.then(data => {
			jsonfile.writeFile(setsOfDictionary, data, {
				spaces: 2
			}, err => {
				if (err !== null) {
					console.error(err)
				}
			})
		})
})()

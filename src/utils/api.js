/* eslint-env es6 */
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

const wordTop = (currentCase, top) => {
	switch (top) {
		case 1:
			return `icons/${currentCase}_1000.png`
		case 2:
			return `icons/${currentCase}_2000.png`
		case 3:
			return `icons/${currentCase}_3000.png`
		default:
			return `icons/${currentCase}.png`
	}
}
module.exports.wordProgress = (value, top) => {
	switch (value) {
		case 25:
			return wordTop('quarter', top)
		case 50:
			return wordTop('half', top)
		case 75:
			return wordTop('three_quarters', top)
		case 100:
			return wordTop('done', top)
		case 'keyword':
			return wordTop('keyword', top)
		default:
			return wordTop('initial', top)
	}
}
module.exports.nameOfSetByNumber = arr => {
	return arr.map(x => {
		if (typeof x === 'number' && alfy.config.get('nameOfSets') && alfy.config.get('nameOfSets').length > 0) {
			if (alfy.config.get('nameOfSets')
				.filter(y => x === y.setNumber).length > 0) {
				return alfy.config.get('nameOfSets')
					.filter(y => x === y.setNumber)[0].setName
			}
		}
		return x
	})
}

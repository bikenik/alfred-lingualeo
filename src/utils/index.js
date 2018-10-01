const fs = require('fs')
const alfy = require('alfy')
const request = require('request-promise')
const streamToPromise = require('stream-to-promise')

/* eslint-disable no-extend-native */
/* eslint-disable-next-line no-use-extend-native/no-use-extend-native */
String.prototype.replaceAll = function (search, replacement) {
	const target = this
	return target.replace(new RegExp(search, 'gi'), replacement)
}
/* eslint-disable-next-line no-use-extend-native/no-use-extend-native */
Array.prototype.last = function () {
	return this[this.length - 1]
}
/* eslint-enable no-extend-native */

module.exports = {
	wordOfURL: alfy.config.get('wordOfURL')
}

module.exports.capitalize = x =>
	x.charAt(0).toUpperCase() + x.slice(1)

module.exports.hasOwnProperty = (obj, prop) =>
	Object.prototype.hasOwnProperty.call(obj, prop)

module.exports.saveAudioFile = async (url, fileName) => {
	const writeStreamExp = fs.createWriteStream(
		`/usr/local/lib/node_modules/${alfy.meta.name}/tmp/${fileName}.mp3`
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
		default:
			return wordTop('initial', top)
	}
}
module.exports.nameOfSetByNumber = arr => {
	return arr.map(x => {
		if (typeof x === 'number' && alfy.config.get('nameOfSets')) {
			return alfy.config.get('nameOfSets').filter(y => x === y.setNumber)[0].setName
		}
		return x
	})
}

const alfy = require('alfy')

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

module.exports.hasOwnProperty = (object, prop) =>
	Object.prototype.hasOwnProperty.call(object, prop)

module.exports.wordProgress = (value, top) => {
	const wordTop = (currentCase, top) => {
		switch (top) {
			case 3:
				return `icons/${currentCase}_1000.png`
			case 2:
				return `icons/${currentCase}_2000.png`
			case 1:
				return `icons/${currentCase}_3000.png`
			default:
				return `icons/${currentCase}.png`
		}
	}

	switch (value) {
		case 1:
			return wordTop('quarter', top)
		case 2:
			return wordTop('half', top)
		case 3:
			return wordTop('three_quarters', top)
		case 4:
			return wordTop('done', top)
		case 'keyword':
			return wordTop('keyword', top)
		default:
			return wordTop('initial', top)
	}
}

module.exports.nameOfSetByNumber = array => {
	return array.map(x => {
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

/* eslint quotes: ["error", "single", { "allowTemplateLiterals": true }] */
/* eslint no-trailing-spaces: ["error", { "skipBlankLines": true }] */
'use strict'

let largetype
const clearSentences = argSentence => argSentence.replace(/\s(\.|\?|!)/g, `$1`)
const largetypeFunc = (sentence, arg, title, subtitle) => {
	if (sentence && arg) {
		sentence = Array.isArray(sentence) ? sentence.map(x => clearSentences(x.text)) : clearSentences(sentence)
		largetype = `${title}${arg.sense && arg.sense.register_label ? ` ⇒ [${arg.sense.register_label}]` : ''}\n\n🔑 :${subtitle}${Array.isArray(sentence) ? `\n\n🎯 ${sentence.map(x => x).join('\n🎯 ')}` : /🎲/.test(sentence) ? sentence : `\n\n🎯 ${sentence}`}`
	}
}

const clearSentencesInArg = arg => {
	if (arg && arg.examples) {
		for (const example of arg.examples) {
			if (example.text) {
				example.text = clearSentences(example.text)
			}
		}
	}
}

const keyOperations = (item, key) => {
	const largetype = largetypeFunc(item.sentence, item.arg, item.title, item.subtitle)
	switch (key) {
		case 'title':
			item.autocomplete = item.title
			break
		case 'icon':
			item.icon = {path: item.icon}
			break
		case 'arg':
			clearSentencesInArg(item.arg)
			break

		default:
			break
	}

	return largetype
}

module.exports = class Render {
	constructor(name, ...itemKeys) {
		const item = {}
		const defaultItems = {
			name,
			autocomplete: '',
			valid: true,
			text: {
				copy: largetype,
				largetype
			}
		}

		for (const key in defaultItems) {
			if (Object.prototype.hasOwnProperty.call(defaultItems, key)) {
				item[key] = defaultItems[key]
			}
		}

		for (const key of itemKeys) {
			this.itemKey = null
			Object.defineProperty(this, key, {
				get: () => key,
				set: value => {
					item[key] = value
					keyOperations(item, key)
					/* -----------------------------
					following rules must be runing after all iterations
					------------------------------- */
					if (Object.keys(item).length - Object.keys(defaultItems).length === itemKeys.length) {
						if (!item.text) {
							const largetype = largetypeFunc(item.sentence, item.arg, item.title, item.subtitle)
							item.text = {
								copy: largetype,
								largetype
							}
						}
					}
				}
			})
		}

		this.getProperties = () => item
	}
}

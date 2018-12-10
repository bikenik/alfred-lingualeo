/* eslint camelcase: ["error", {properties: "never"}] */
'use strict'
const alfy = require('alfy')

const search = JSON.parse(process.env.search)
search.translate_value = alfy.input
const subtitle = 'your version: If you want to add a sentence, put a punctuation mark at the end (. ? !)'
alfy.output([{
	title: process.env.currentSearch,
	subtitle,
	variables: {
		search: JSON.stringify(search)
	},
	text: {largetype: `${process.env.currentSearch}\n\n💡${subtitle}`}
}])

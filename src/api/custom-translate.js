/* eslint camelcase: ["error", {properties: "never"}] */
'use strict'
const alfy = require('alfy')

const search = JSON.parse(process.env.search)
search.translate_value = alfy.input
alfy.output([{
	title: process.env.currentSearch,
	subtitle: 'type or paste your own version of translate',
	variables: {
		search: JSON.stringify(search)
	}
}])

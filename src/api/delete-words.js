/* eslint camelcase: ["error", {properties: "never"}] */
'use strict'
const rp = require('request-promise')

const api = require('../utils/api')

const search = JSON.parse(process.env.search)
const deleteWords = async () => {
	await rp(await api.optionsSetWords(search.groupId, 'delete'))
		.then(data => {
			const result = data
			if (result.status === 'ok') {
				process.stdout.write(
					JSON.stringify({
						alfredworkflow: {
							variables: {
								text_notify_title: search.word_value.toUpperCase(),
								text_notify_subtitle: 'was deleted frome your dictionary!',
								error: false
							}
						}
					})
				)
			} else {
				process.stdout.write(
					JSON.stringify({
						alfredworkflow: {
							variables: {
								error: true,
								error_msg: result.error_msg
							}
						}
					})
				)
			}
		})
		.catch(error => {
			process.stderr.write(error)
		})
}

deleteWords()

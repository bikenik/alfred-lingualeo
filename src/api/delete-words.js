/* eslint camelcase: ["error", {properties: "never"}] */
'use strict'
const alfy = require('alfy')
const rp = require('request-promise')

const target = JSON.parse(alfy.input)
const addWords = async () => {
	const options = {
		method: 'POST',
		uri: 'https://lingualeo.com/userdict3/deleteWords?all=0&groupId=dictionary&filter=all&search=&wordType=0&delete_source=dictionary_toolbar&wordIds_length=1',
		headers:
		{
			Cookie: alfy.config.get('Cookie'),
			// Cookie: Cookie,
			'Cache-Control': 'no-cache',
			'X-Requested-With': 'XMLHttpRequest',
			'Content-Type': 'application/x-www-form-urlencoded'
		},
		form: {
			all: 0,
			groupId: target.groupId,
			filter: 'all',
			wordIds: target.word_id,
			delete_source: 'dictionary_toolbar'
		}
	}
	await rp(options)
		.then(data => {
			const result = JSON.parse(data)
			if (result.error_msg === '') {
				process.stdout.write(
					JSON.stringify({
						alfredworkflow: {
							variables: {
								text_notify_title: `${target.word_value.toUpperCase()}`,
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

addWords()

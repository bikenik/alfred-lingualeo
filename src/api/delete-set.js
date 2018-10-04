/* eslint camelcase: ["error", {properties: "never"}] */
'use strict'
const alfy = require('alfy')
const rp = require('request-promise')

const target = JSON.parse(alfy.input)
const deleteWordSet = async () => {
	const options = {
		method: 'POST',
		uri: 'https://lingualeo.com/userdict3/deleteWordSet',
		headers:
		{
			Cookie: alfy.config.get('Cookie'),
			'Cache-Control': 'no-cache',
			'X-Requested-With': 'XMLHttpRequest',
			'Content-Type': 'application/x-www-form-urlencoded'
		},
		form: {
			word_set_id: target.groupId,
			is_complete_delete: 1
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
								text_notify_title: `"${target.name}" Set was deleted`,
								text_notify_subtitle: `${result.count_deleted_words} words were deleted\n${result.count_deleted_learned_words} lerned words were deleted`,
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

deleteWordSet()

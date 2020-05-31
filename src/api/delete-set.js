/* eslint camelcase: ["error", {properties: "never"}] */
'use strict'
const rp = require('request-promise')
const api = require('../utils/api')

const {groupName, groupId} = process.env
const deleteWordSet = async () => {
	await rp(api.optionsSetWordSets(groupId, process.argv[2]))
		.then(data => {
			const result = data
			if (result.status === 'ok') {
				process.stdout.write(
					JSON.stringify({
						alfredworkflow: {
							variables: {
								text_notify_title: `"${groupName}" Set was deleted`,
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

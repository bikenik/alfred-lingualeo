/* eslint camelcase: ["error", {properties: "never"}] */
'use strict'
const alfy = require('alfy')
const rp = require('request-promise')

const WorkflowError = require('../utils/error')
const api = require('../utils/api')

const search = JSON.parse(process.env.search)

const runCreateSet = async input => {
	const options = api.optionsSetWordSets(null, 'add set', input)
	const result = await rp(options)
		.then(data => {
			return data.data[0].id
		}).catch(error => {
			throw new WorkflowError(error.stack)
		})
	return result
}

const groupID = async () => {
	if (/[a-zA-Zа-яА-Я]/.test(alfy.input) && alfy.input !== 'dictionary') {
		const id = await runCreateSet(alfy.input)
		return id
	}

	return process.env.currentSetId
}

const addWords = async () => {
	const groupIDresult = await groupID()
	const options = await api.optionsSetWords(groupIDresult, 'add')
	await rp(options)
		.then(data => {
			const result = data
			if (result.status === 'ok') {
				process.stdout.write(
					JSON.stringify({
						alfredworkflow: {
							variables: {
								text_notify_title: result.xp_points_added ?
									`${search.user_word_value}` :
									`Added: "${JSON.parse(process.env.search).user_word_value}" (to ${process.env.currentSetName})`,
								text_notify_subtitle: `${search.translate_value}`,
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
								error_msg: result.status
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

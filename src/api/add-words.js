/* eslint camelcase: ["error", {properties: "never"}] */
'use strict'
const alfy = require('alfy')
const rp = require('request-promise')

const WorkflowError = require('../utils/error')

const search = JSON.parse(process.env.search)

const runCreateSet = async input => {
	const options = {
		uri: `http://lingualeo.com/ru/userdict3/createWordSet?wordSet[name]=${input}`,
		headers: {
			Cookie: alfy.config.get('Cookie')
		},
		json: true // Automatically parses the JSON string in the response
	}
	const result = await rp(options)
		.then(data => {
			return data.result.id
		}).catch(error => {
			throw new WorkflowError(error.stack)
		})
	return result
}

const groupID = async () => {
	if (/[a-zA-Z]/.test(alfy.input)) {
		const id = await runCreateSet(alfy.input)
		return id
	}
	return alfy.input
}

const addWords = async () => {
	const options = {
		method: 'POST',
		uri: 'https://lingualeo.com/userdict3/addWord',
		headers:
		{
			Cookie: alfy.config.get('Cookie'),
			'Cache-Control': 'no-cache',
			'X-Requested-With': 'XMLHttpRequest',
			'Content-Type': 'application/x-www-form-urlencoded'
		},
		form: {
			word_id: search.word_id,
			speech_part_id: 0,
			groupId: await groupID(),
			translate_id: search.translate_id,
			translate_value: search.translate_value,
			user_word_value: search.user_word_value
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
								text_notify_title: result.xp_points_added ? `+${result.xp_points_added} 🍖  | 🦁 ${result.hungry}%  |  XP: ${result.xp_points_daily} / ${result.xp_points_daily_norm}` : `Added: "${JSON.parse(process.env.search).user_word_value}" (to ${process.env.currentSet})`,
								text_notify_subtitle: result.xp_points_added ? `Added: "${JSON.parse(process.env.search).user_word_value}" (to ${process.env.currentSet})\nLevel: ${result.xp_level}  |  Remaining XP: ${result.xp_points_remaining}` : `${result.userdict3.related_words[0].translate_value}`,
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

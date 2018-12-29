'use strict'
const fs = require('fs-extra')
const alfy = require('alfy');

(async () => {
	try {
		switch (alfy.config.get('theme')) {
			case 'dark':
				alfy.config.set('theme', 'light')
				await fs.copy(`${process.env.PWD}/icons/for_light_theme/`, `${process.env.PWD}/icons/`)
				break

			default:
				alfy.config.set('theme', 'dark')
				await fs.copy(`${process.env.PWD}/icons/for_dark_theme/`, `${process.env.PWD}/icons/`)
				break
		}
	} catch (error) {
		process.stderr.write(error)
	}
})()

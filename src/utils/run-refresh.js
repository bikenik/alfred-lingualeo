const alfy = require('alfy')
const runApplescript = require('run-applescript')

module.exports = async () => {
	if (!alfy.cache.get('start-PID')) {
		alfy.cache.set('start-PID', process.pid, {maxAge: 30000})
	}

	if (alfy.cache.get('start-PID') === process.pid) { // Prevent for 30 seconds
		await runApplescript(`
		tell application id "com.runningwithcrayons.Alfred"
			run trigger ¬
				"lingua-leo-refresh" in workflow ¬
				"org.bikenik.alfred-lingualeo"
		end tell
		`)
	}
}

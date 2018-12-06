/* eslint one-var: [2, { var: "always", let: "always" }] */
/* eslint quotes: ["error", "single", { "allowTemplateLiterals": true }] */

module.exports = class WorkflowError extends Error {
	constructor(message, data) {
		// `data` is an object with the following optional props:
		//   .tip - message to show so the user can fix the error
		//   .autocomplete - self-explanatory

		super(message)
		this.name = 'Workflow'

		Object.assign(this, data)
	}
}

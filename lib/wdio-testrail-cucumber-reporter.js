/**
 * @exports WdioTestRailCucumberReporter
 * @requires events
 * @requires ./test-rail
 * @requires mocha-testrail-reporter/dist/lib/shared
 * @requires mocha-testrail-reporter/dist/lib/testrail.interface
 */

const events = require('events');
const TestRail = require('./test-rail');
const titleToCaseIds = require('mocha-testrail-reporter/dist/lib/shared').titleToCaseIds;
const Status = require('mocha-testrail-reporter/dist/lib/testrail.interface').Status;

/**
 * Class representing Cucumber reporter data and methods
 * @extends events.EventEmitter
 */
class WdioTestRailCucumberReporter extends events.EventEmitter {

	/**
	 *  @constructor
	 * @param {{}} baseReporter - Configured in wdio.conf file
	 * @param {Object} config - wdio config proprties
	 * @param {Object} config.testRailsOptions - wdio TestRail specifc configurations 
	 * @param {string} config.testRailsOptions.domain - Domain for TestRail
	 * @param {number} config.testRailsOptions.projectId - Project identifier
	 * @param {Array.<number>} config.testRailsOptions.suiteId - List of suites identifiers
	 * @param {number} [config.testRailsOptions.assignedToId] - User identifier
	 * @param {string} config.testRailsOptions.username - User email
	 * @param {string} config.testRailsOptions.password - User API key
	 * @param {Boolean} config.testRailsOptions.includeAll - Flag to inlcude all tests from a suite in a run
	 * @param {number} [config.testRailsOptions.updateRun] - Test run identifier for test run to update
	 * @param {number} [config.testRailsOptions.updatePlan] - Test plan identifier for a test plan to update
	 */
	constructor(baseReporter, config) {
		super();
		this.reporterName = 'WebDriver.io Cucumber TestRail Reporter';

		const options = config.testRailsOptions;
		this._results = [];
		this._passes = 0;
		this._fails = 0;
		this._pending = 0;
		this._out = [];
		this.testRail = new TestRail(options);

		this.on('test:pending', (test) => {
			this._pending++;
			this._out.push(test.title + ': pending');
		});

		this.on('test:pass', (test) => {
			this._passes++;
			this._out.push(test.title + ': pass');
			let caseIds = titleToCaseIds(test.parent); //look in the parent for the testrail id (represents a scenario or scenario outline)
			if (caseIds.length > 0) {
				let results = caseIds.map(caseId => {
					return {
						case_id: caseId,
						status_id: Status.Passed,
						comment: `${test.title}`
					};
				});
				this._results.push(...results);
			}
		});

		this.on('test:fail', (test) => {
			this._fails++;
			this._out.push(test.title + ': fail');
			let caseIds = titleToCaseIds(test.parent);
			if (caseIds.length > 0) {
				let results = caseIds.map(caseId => {
					return {
						case_id: caseId,
						status_id: Status.Failed,
						comment: `${test.title}
											${test.err.message}
											${test.err.stack}
										`
					};
				});
				this._results.push(...results);
			}
		});

		this.on('end', () => {
			if (this._results.length == 0) {
				console.warn("No testcases were matched. Ensure that your tests are declared correctly and matches TCxxx\n" +
					"You may use script generate-cases to do it automatically.");
				return;
			}

			const executionDateTime = new Date();
			const total = this._passes + this._fails + this._pending;
			const runName = options.runName || WdioTestRailReporter.reporterName;
			const name = `${runName}: automated test run ${executionDateTime}`;
			const description = `${name}
													Execution summary:
													Passes: ${this._passes}
													Fails: ${this._fails}
													Pending: ${this._pending}
													Total: ${total}
												`;
			this.testRail.publish(name, description, this._results);
		});
	}
}

module.exports = WdioTestRailCucumberReporter;
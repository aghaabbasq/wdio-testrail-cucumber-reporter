/**
 * @exports WdioTestRailCucumberReporter
 * @requires events
 * @requires ./test-rail
 * @requires mocha-testrail-reporter/dist/lib/shared
 * @requires mocha-testrail-reporter/dist/lib/testrail.interface
 * @returns chalk
 */

const events = require('events')
const dedent = require('dedent-js')
const TestRail = require('./test-rail')
const Utils = require('./utils')

const Status = {
    Passed: 1,
    Blocked: 2,
    Untested: 3,
    Retest: 4,
    Failed: 5,
}

let CaseContents = []
let CaseId
let ExampleCount = 0
let PrevScenerioTitle = ''

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
        super()

        const options = config.testRailsOptions
        this._results = {}
        this._passes = 0
        this._fails = 0
        this._pending = 0
        this._out = []
        this.testRail = new TestRail(options)

        this.on('runner:start', (runner) => {
            this._results[runner.capabilities.browserName] = {}
        })

        this.on('suite:start', (suite) => {
            CaseContents = []

            const caseIds = Utils.getCaseIds(suite)
            if (caseIds.length > 0) {
                if (PrevScenerioTitle === suite.title) {
                    ExampleCount += 1
                } else ExampleCount = 0
                PrevScenerioTitle = suite.title
                CaseId = caseIds[ExampleCount]
            } else CaseId = undefined
        })

        this.on('test:start', (test) => {
            CaseContents.push(test.title)
        })

        this.on('test:pending', (test) => {
            this._pending += 1
            this._out.push(`${test.title}: pending`)
            const runnerKey = Object.keys(test.runner)[0]
            const browserName = test.runner[runnerKey].browserName
            if (typeof CaseId !== 'undefined') {
                if (this._results[browserName][CaseId]) {
                    this._results[browserName][CaseId].comment = dedent`${this._results[browserName][CaseId].comment}
                                                                        ${test.title}: pending`
                } else {
                    this._results[browserName][CaseId] = {
                        case_id: CaseId,
                        status_id: this._results[browserName][CaseId].status_id,
                        comment: `${test.title}: pending`,
                        runner: test.runner[runnerKey],
                    }
                }
            }
        })

        this.on('test:pass', (test) => {
            this._passes += 1
            this._out.push(`${test.title}: pass`)
            const runnerKey = Object.keys(test.runner)[0]
            const browserName = test.runner[runnerKey].browserName
            if (typeof CaseId !== 'undefined') {
                if (this._results[browserName][CaseId] && this._results[browserName][CaseId].status_id === Status.Passed) {
                    this._results[browserName][CaseId].comment = dedent`${this._results[browserName][CaseId].comment}
                                                                        ${test.title}: pass`
                } else {
                    this._results[browserName][CaseId] = {
                        case_id: CaseId,
                        status_id: Status.Passed,
                        comment: `${test.title}: pass`,
                        runner: test.runner[runnerKey],
                    }
                }
            }
        })

        this.on('test:fail', (test) => {
            this._fails += 1
            this._out.push(`${test.title}: fail`)
            const runnerKey = Object.keys(test.runner)[0]
            const browserName = test.runner[runnerKey].browserName
            if (typeof CaseId !== 'undefined') {
                if (this._results[browserName][CaseId]) {
                    this._results[browserName][CaseId].status_id = Status.Failed
                    this._results[browserName][CaseId].comment = dedent`${this._results[browserName][CaseId].comment}                                 
                                                                        ${test.title}: fail
                                                                            ${test.err.message}
                                                                            ${test.err.stack}`
                } else {
                    this._results[browserName][CaseId] = {
                        case_id: CaseId,
                        status_id: Status.Failed,
                        comment: dedent`${test.title}: fail
                                            ${test.err.message}
                                            ${test.err.stack}`,
                        runner: test.runner[runnerKey],
                    }
                }
            }
        })

        this.on('end', (data) => {
            if (Object.keys(this._results).length === 0) {
                console.warn("No testcases were matched. Ensure that your tests are declared correctly and matches TCxxx\n")
                return
            }

            const results = []
            for (const [browserName, run] of Object.entries(this._results)) {
                for (const [caseId, value] of Object.entries(run)) {
                    results.push(value)
                }
            }
            const total = this._passes + this._fails + this._pending
            const description = `Execution summary:
                                    Passed steps: ${this._passes}
                                    Failed steps: ${this._fails}
                                    Skipped steps: ${this._pending}
                                    Total steps: ${total}`
            this.testRail.publish(description, results, data.capabilities)
        })
    }
}

WdioTestRailCucumberReporter.reporterName = 'WebDriver.io Cucumber TestRail Reporter'

module.exports = WdioTestRailCucumberReporter

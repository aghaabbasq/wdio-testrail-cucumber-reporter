/**
 * @exports WdioTestRailCucumberReporter
 * @requires events
 * @requires ./test-rail
 * @requires mocha-testrail-reporter/dist/lib/shared
 * @requires mocha-testrail-reporter/dist/lib/testrail.interface
 * @returns chalk
 */

const events = require('events');
const TestRail = require('./test-rail');
const tagToCaseId = require('./utils').tagToCaseId;
const chalk = require('chalk');
const dedent = require('dedent-js');

const Status = {
    Passed: 1,
    Blocked: 2,
    Untested: 3,
    Retest: 4,
    Failed: 5
}

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

        const options = config.testRailsOptions;
        this._results = {};
        this._passes = 0;
        this._fails = 0;
        this._pending = 0;
        this._out = [];
        this.scenarioCount = 1;
        this.featureCount = 1;
        this.testRail = new TestRail(options);

        this.on('runner:start', (runner) => {
            this._results[runner.capabilities.browserName] = {}
        });
        
        this.on('suite:start', (suite) => {

            if (config.maxInstances == 1) {
                if (suite.parent && suite.parent != null) {
                    console.log(`${chalk.cyan.underline('   ' + this.featureCount++ + '. Scenario: ')} ${suite.title}`);
                } else {
                    console.log(`\n\n${chalk.yellow.underline(this.scenarioCount++ + '. Feature: ')} ${suite.title}`);
                }
            }
        });

        this.on('test:pending', (test) => {
            this._pending++;
            this._out.push(test.title + ': pending');
            let caseId = tagToCaseId(Array.from(test.tags).map(x => x.name).join(', '));
            const runnerKey = Object.keys(test.runner)[0];
            let browserName = test.runner[runnerKey].browserName
            if (typeof caseId !== 'undefined') {
                if (this._results[browserName][caseId]) {
                    this._results[browserName][caseId].comment = dedent`${this._results[browserName][caseId].comment}
                                                                        ${test.title}: pending`
                } else {
                    this._results[browserName][caseId] = {
                        case_id: caseId,
                        status_id: this._results[browserName][caseId].status_id,
                        comment: `${test.title}: pending`,
                        runner: test.runner[runnerKey]
                    };    
                }
            }
        });

        this.on('test:pass', (test) => {
            this._passes++;
            this._out.push(test.title + ': pass');
            let caseId = tagToCaseId(Array.from(test.tags).map(x => x.name).join(', '));
            const runnerKey = Object.keys(test.runner)[0];
            let browserName = test.runner[runnerKey].browserName
            if (typeof caseId !== 'undefined') {
                if (this._results[browserName][caseId] && this._results[browserName][caseId].status_id === Status.Passed) {
                    this._results[browserName][caseId].comment = dedent`${this._results[browserName][caseId].comment}
                                                                        ${test.title}: pass`
                } else {
                    this._results[browserName][caseId] = {
                        case_id: caseId,
                        status_id: Status.Passed,
                        comment: `${test.title}: pass`,
                        runner: test.runner[runnerKey]
                    }
                }
            }
        });

        this.on('test:fail', (test) => {
            this._fails++;
            this._out.push(test.title + ': fail');
            let caseId = tagToCaseId(Array.from(test.tags).map(x => x.name).join(', '));
            const runnerKey = Object.keys(test.runner)[0];
            let browserName = test.runner[runnerKey].browserName
            if (typeof caseId !== 'undefined') {
                if (this._results[browserName][caseId]) {
                    this._results[browserName][caseId].status_id = Status.Failed
                    this._results[browserName][caseId].comment = dedent`${this._results[browserName][caseId].comment}                                 
                                                                        ${test.title}: fail
                                                                            ${test.err.message}
                                                                            ${test.err.stack}`
                } else {
                    this._results[browserName][caseId] = {
                        case_id: caseId,
                        status_id: Status.Failed,
                        comment: dedent`${test.title}: fail
                                            ${test.err.message}
                                            ${test.err.stack}`,
                        runner: test.runner[runnerKey],
                    };    
                }
            }
        });

        this.on('end', (data) => {

            if (Object.keys(this._results).length == 0) {
                console.warn("No testcases were matched. Ensure that your tests are declared correctly and matches TCxxx\n");
                return;
            }

            let results = [];
            for (let [browserName, run] of Object.entries(this._results)) {
                for (let [caseId, value] of Object.entries(run)) {
                    results.push(value);
                }
            }
            const total = this._passes + this._fails + this._pending;
            const description = `Execution summary:
								    Passed steps: ${this._passes}
                                    Failed steps: ${this._fails}
                                    Skipped steps: ${this._pending}
                                    Total steps: ${total}`;
            this.testRail.publish(description, results, data.capabilities);
        });
    }
}

WdioTestRailCucumberReporter.reporterName = 'WebDriver.io Cucumber TestRail Reporter';

module.exports = WdioTestRailCucumberReporter;
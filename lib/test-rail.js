/**
 * @exports TestRail
 * @requires sync-request
 */

const request = require('sync-request')


const AutomationType = {
    implemented: 3,
}


/**
 * TestRail basic API wrapper
 */
class TestRail {
    /**
     * @param {Object} options - wdio TestRail specifc configurations
     * @param {string} options.domain - Domain for TestRail
     * @param {number} options.projectId - Project identifier
     * @param {Array.<number>} options.suiteId - List of suites identifiers
     * @param {number} [options.assignedToId] - User identifier
     * @param {string} options.username - User email
     * @param {string} options.password - User API key
     * @param {Boolean} options.includeAll - Flag to inlcude all tests from a suite in a run
     * @param {number} [options.updateRun] - Test run identifier for test run to update
     * @param {number} [options.updatePlan] - Test plan identifier for a test plan to update
     */
    constructor(options) {
        this._validate(options, 'domain')
        this._validate(options, 'username')
        this._validate(options, 'password')
        this._validate(options, 'projectId')
        this._validate(options, 'suiteId')
        this._validate(options, 'includeAll')
        this._validate(options, 'updatePlan')

        // compute base url
        this.options = options
        this.base = `https://${options.domain}/index.php`
    }

    /**
     * Verifies if required options exist in webdriverio config file
     *
     * @param {Object} options - wdio TestRail specifc configurations
     * @param {string} options.domain - Domain for TestRail
     * @param {number} options.projectId - Project identifier
     * @param {Array.<number>} options.suiteId - List of suites identifiers
     * @param {number} [options.assignedToId] - User identifier
     * @param {string} options.username - User email
     * @param {string} options.password - User API key
     * @param {Boolean} options.includeAll - Flag to inlcude all tests from a suite in a run
     * @param {number} [options.updateRun] - Test run identifier for test run to update
     * @param {number} [options.updatePlan] - Test plan identifier for a test plan to update
     * @param {string} name - Name of the property
     * @private
     */
    _validate(options, name) {
        if (options == null) {
            throw new Error("Missing testRailsOptions in wdio.conf")
        }
        if (options[name] == null) {
            throw new Error(`Missing ${name} value. Please update testRailsOptions in wdio.conf`)
        }
    }

    /**
     * Construct and returns an API path
     *
     * @param {string} path - The path for the API
     * @return {string} Constructed URL path to TestRail API
     * @private
     */
    _url(path) {
        return `${this.base}?${path}`
    }

    /**
     * Makes a POST request on a TestRail API
     *
     * @param {string} api - API path
     * @param {*} body - Body of request
     * @param {callback} error - Callback to handle errors
     * @return {*} Response object
     * @private
     */
    _post(api, body, error = undefined) {
        return this._request("POST", api, body, error)
    }

    /**
     * Makes a GET request on a TestRail API
     *
     * @param {string} api - API path
     * @param {callback} error - Callback to handle errors
     * @return {*} Response object
     * @private
     */
    _get(api, error = undefined) {
        return this._request("GET", api, null, error)
    }

    /**
     * Makes a request to the TestRail API
     *
     * @param {string} method - Type of request to make
     * @param {string} api - API path
     * @param {*} body  Body of request
     * @param {callback} error
     * @return {*} API response
     * @private
     */
    _request(method, api, body, error = undefined) {
        const options = {
            headers: {
                Authorization: `Basic ${Buffer.from(`${this.options.username}:${this.options.password}`).toString("base64")}`,
                "Content-Type": "application/json",
            },
        }
        if (body) {
            options.json = body
        }

        let result = request(method, this._url(`/api/v2/${api}`), options)
        result = JSON.parse(result.getBody('utf8'))
        if (result.error) {
            console.error("Error: %s", JSON.stringify(result.body))
            if (error) {
                error(result.error)
            } else {
                throw new Error(result.error)
            }
        }
        return result
    }

    /**
     * Creates a new array of unique data from the data
     * within 2 existing arrays
     *
     * @param {Array.<*>} currArr
     * @param {Array.<*>} newArr
     * @returns {array}
     * @private
     */
    _createUniqueArray(currArr, newArr) {
        return [...new Set([...newArr, ...currArr])]
    }

    /**
     * Creates a new test plan
     *
     * @param {string} name - Plan name
     * @param {string} desc - Plane description
     * @param {Array.<Object>} testRuns - Test runs
     * @returns {*} API response
     */
    addPlan(name, description, testRuns) {
        return this._post(`add_plan/${this.options.projectId}`, {
            name,
            description,
            entries: testRuns,
        })
    }

    /**
     * Retrieves a test plan
     *
     * @param {number} planId - Plan identifier
     * @returns {*} API response
     */
    getPlan(planId) {
        return this._get(`get_plan/${planId}`)
    }

    /**
     * Adds a test plan entry to the current project
     *
     * @param {number} planId - Plan identifier
     * @param {number} suiteId  - Suite identifier
     * @param {string} name - Plan name
     * @param {string} desc - Plan name
     * @param {Array.<Object>} runs - Test runs
     * @param {Array.<number>} caseIds - Test case identifiers
     * @return {*} API response
     */
    addTestPlanEntry(planId, suiteId, name, desc, runs, caseIds, configIds) {
        return this._post(
            `add_plan_entry/${planId}`, {
                include_all: this.options.includeAll,
                suite_id: suiteId,
                name,
                description: desc,
                runs,
                case_ids: caseIds,
                config_ids: configIds,
            },
        )
    }

    /**
     * Adds missing case ids to a test plan entry
     *
     * @param {number} planId - Plan identifier
     * @param {number} entryId  - Entry identifier
     * @param {Array.<number>} caseIds - Test case identifiers
     * @return {*} API response
     */
    updateTestPlanEntry(planId, entryId, caseIds) {
        return this._post(`update_plan_entry/${planId}/${entryId}`, {
            case_ids: caseIds,
        })
    }

    /**
     * Gets a suite
     *
     * @param {number} suiteId - Suite identifier
     * @return {*} API response
     */
    getSuite(suiteId) {
        return this._get(`get_suite/${suiteId}`)
    }

    /**
     * Gets a case by id
     *
     * @param {number} caseId - Case identifier
     * @return {*} API response
     */
    getCase(caseId) {
        return this._get(`get_case/${caseId}`)
    }

    /**
     * Gets a run by id
     *
     * @param {number} runId - Run identifier
     * @return {*} API response
     */
    getRun(runId) {
        return this._get(`get_run/${runId}`)
    }

    /**
     * Add a test case
     *
     * @param {string} title - case name
     * @param {string} content - steps
     * @param {number} sectionId - new case will be added to this section
     * @return {*} API response
     */
    addCase(title, content, sectionId) {
        return this._post(`add_case/${sectionId}`, {
            title,
            custom_status: 1,
            custom_steps: content,
            custom_automation_type: AutomationType.implemented,
        })
    }

    /**
     * Update a test case
     *
     * @param {number} caseId - Case identifier
     * @param {string} title - case name
     * @param {string} content - steps
     * @return {*} API response
     */
    updateCase(caseId, title, content) {
        return this._post(`update_case/${caseId}`, {
            title,
            custom_steps: content,
        })
    }

    /**
     * Gets sections in a suite
     *
     * @param {number} suiteId - Suite identifier
     * @return {*} API response
     */
    getSections(suiteId) {
        return this._get(`get_sections/${this.options.projectId}&suite_id=${suiteId}`)
    }

    /**
     * Gets all the tests in a run
     *
     * @param {number} runId - Run identifier
     * @return {*} API response
     */
    getTestsForRun(runId) {
        return this._get(`get_tests/${runId}`)
    }

    /**
     * Adds a test run
     *
     * @param {string} name - Test run name
     * @param {string} description - Test run description
     * @param {number} suiteId - Suite id for test cases in this run
     * @return {*} API response
     */
    addRun(name, description, suiteId, caseIds) {
        return this._post(`add_run/${this.options.projectId}`, {
            suite_id: suiteId,
            name,
            description,
            assignedto_id: this.options.assignedToId,
            include_all: this.options.includeAll,
            case_ids: caseIds,
        })
    }

    /**
     * Adds test cases to a test run
     *
     * @param {number} runId - Run identifier
     * @param {Array.<Object>} cases - Test case data
     * @return {*} API response
     */
    addCasesToRun(runId, cases) {
        const currentCases = this.getTestsForRun(runId).map(c => c.case_id)
        const caseIds = this._createUniqueArray(currentCases, cases)
        console.log(`all case list:`)
        console.log(caseIds)
        this._post(`update_run/${runId}`, {
            case_ids: caseIds,
        })
    }

    /**
     * Get test cases that belong to a suite
     *
     * @param {*} projectId - Project identifier
     * @param {*} suiteId - Suite identifier
     * @return {*} API response
     */
    getCasesForSuite(projectId, suiteId) {
        return this._get(`get_cases/${projectId}&suite_id=${suiteId}`)
    }

    /**
     * Adds test results for a test cases
     *
     * @param {number} runId - Run identifier
     * @param {Array.<Object>} results - Test case results
     *
     * @return {*} API response
     */
    addResultsForCases(runId, results) {
        if (results.length > 0) {
            return this._post(`add_results_for_cases/${runId}`, {
                results,
            })
        }
    }

    /**
     * Publishes results of execution of an automated test run
     *
     * @param {string} description - description text in test run
     * @param {Array.<Object>} results
     * @param runners - selenium capability
     */
    publish(description, results, runners) {
        let entryId
        let caseIds
        let resultByRunner
        let name

        // 1. find our existing plan
        const plan = this.getPlan(this.options.updatePlan)
        const suiteInfo = this.getSuite(this.options.suiteId)

        // 2. collected current test case in suite
        let cases = this.getCasesForSuite(this.options.projectId, this.options.suiteId)
        cases = cases.map(c => c.id)

        // 3. add new entry (run) in that plan for each browser
        runners.forEach((runner, runnerIdx) => {
            name = `${suiteInfo.name} - ${runner.browserName} - ${this.options.platform} - ${this.options.time}`

            // 4. filter result to unique
            resultByRunner = results.filter(r => JSON.stringify(r.runner) === JSON.stringify(runner))
            caseIds = resultByRunner.map(r => r.case_id)

            entryId = this.addTestPlanEntry(
                plan.id,
                this.options.suiteId,
                name, description, [],
                caseIds,
            ).runs[0].id

            this.addResultsForCases(
                entryId,
                resultByRunner.filter(r => cases.includes(r.case_id)),
            )
        })
        console.log(`Results published to ${this.base}?/runs/view/${entryId}`)
    }
}

module.exports = TestRail

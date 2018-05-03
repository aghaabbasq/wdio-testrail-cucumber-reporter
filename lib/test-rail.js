/**
 * @exports TestRail
 * @requires sync-request
 */

const request = require('sync-request');

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
		this._validate(options, 'domain');
		this._validate(options, 'username');
		this._validate(options, 'password');
		this._validate(options, 'projectId');
		this._validate(options, 'suiteId');
		this._validate(options, 'includeAll');

		// compute base url
		this.options = options;
		this.base = `https://${options.domain}/index.php`;
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
			throw new Error("Missing testRailsOptions in wdio.conf");
		}
		if (options[name] == null) {
			throw new Error(`Missing ${name} value. Please update testRailsOptions in wdio.conf`);
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
		return `${this.base}?${path}`;
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
		return this._request("POST", api, body, error);
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
		return this._request("GET", api, null, error);
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
		let options = {
			headers: {
				"Authorization": "Basic " + new Buffer(this.options.username + ":" + this.options.password).toString("base64"),
				"Content-Type": "application/json"
			},
		};
		if (body) {
			options['json'] = body;
		}

		let result = request(method, this._url(`/api/v2/${api}`), options);
		result = JSON.parse(result.getBody('utf8'));
		if (result.error) {
			console.log("Error: %s", JSON.stringify(result.body));
			if (error) {
				error(result.error);
			} else {
				throw new Error(result.error);
			}
		}
		return result;
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
			"name": name,
			"description": description,
			"entries": testRuns
		});
	}

	/**
	 * Retrieves a test plan
	 * 
	 * @param {number} planId - Plan identifier
	 * @returns {*} API response
	 */
	getPlan(planId) {
		return this._get(`get_plan/${this.options.updatePlan}`);
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
	addTestPlanEntry(planId, suiteId, name, desc, runs, caseIds) {
		return this._post(
			`add_plan_entry/${planId}`, {
				'include_all': this.options.includeAll,
				'suite_id': suiteId,
				'name': name,
				'description': desc,
				'runs': runs,
				'case_ids': caseIds
			});
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
			case_ids: caseIds
		});
	}

	/**
	 * Gets a suite
	 * 
	 * @param {number} suiteId - Suite identifier
	 * @return {*} API response
	 */
	getSuite(suiteId) {
		return this._get(`get_suite/${suiteId}`);
	}

	/**
	 * Gets all the tests in a run
	 * 
	 * @param {number} runId - Run identifier 
	 * @return {*} API response
	 */
	getTestsForRun(runId) {
		this._get(`get_tests/${runId}`)
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
			"suite_id": suiteId,
			"name": name,
			"description": description,
			"assignedto_id": this.options.assignedToId,
			"include_all": this.options.includeAll,
			"case_ids": caseIds
		});
	}

	/**
	 * Adds test cases to a test run
	 * 
	 * @param {number} runId - Run identifier
	 * @param {Array.<Object>} cases - Test case data 
	 * @return {*} API response
	 */
	addCasesToRun(runId, cases) {
		const currentCases = this._get(`get_tests/${runId}`).map(c => c.case_id);
		//console.log([...currentCases, ...cases])
		this._post(`update_run/${runId}`, {
			'case_ids': [...new Set([...currentCases, ...cases])]
		});
	}

	/**
	 * Get test cases that belong to a suite
	 * 
	 * @param {*} projectId - Project identifier
	 * @param {*} suiteId - Suite identifier
	 * @return {*} API response
	 */
	getCasesForSuite(projectId, suiteId) {
		return this._get(`get_cases/${projectId}&suite_id=${suiteId}`);
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
				results: results
			});
		}
	}

	/**
	 * Publishes results of execution of an automated test run
	 * 
	 * @param {string} name - Test run/plan name
	 * @param {string} description 
	 * @param {Array.<Object>} results
	 * @param {callback} callback
	 */
	publish(name, description, results, callback = undefined) {
		let runs = [];
		let body = null;
		let plan = null

		if (typeof this.options.suiteId !== 'number') {
			if (this.options.updatePlan) {
				//1. find our existing plan
				plan = this.getPlan(this.options.updatePlan);

				//console.log(plan);
				plan.entries.forEach(entry => {
					//console.log(entry.runs)
					const suiteInfo = this.getSuite(entry.runs[0].suite_id);
					const currentCases = this.getCasesForRun(entry.runs[0].id).map(c => c.case_id);
					suiteInfo.cases = this.getCasesForSuite(this.options.projectId, suiteInfo.id).map(c => c.id);
					suiteInfo.newCases = results.filter(r => suiteInfo.cases.includes(r.case_id));

					//reset case id listing
					this.updateTestPlanEntry(
						plan.id,
						entry.id,
						this._createUniqueArray(
							currentCases,
							...suiteInfo.newCases.map(r => r.case_id)
						)
					)
					body = [];
					//add new results
					body.push(this.addResultsForCases(entry.runs[0].id, suiteInfo.newCases));
				})
			} else {
				//1. create the test plan
				plan = this.addPlan(name, description, []);
				//2. for each suite, find the associated results for that suite & add those to the correct runs in the test plan
				this.options.suiteId.forEach((suiteId, idx) => {
					const suiteInfo = this.getSuite(suiteId);
					suiteInfo.cases = this.getCasesForSuite(this.options.projectId, suiteId).map(c => c.id);

					// update plan with test runs
					runs.push(this.addTestPlanEntry(plan.id, suiteId, suiteInfo.name, description, [{
							'name': suiteInfo.name,
							'description': description,
							'suite_id': suiteId,
						}],
						results.map(r => r.case_id)).runs[0]);

					//console.log(results.filter(r => suiteInfo.cases.includes(r.case_id)));
					body = [];
					body.push(this.addResultsForCases(runs[idx].id, results.filter(r => suiteInfo.cases.includes(r.case_id))));
					//console.log(`Add updateRun:[${runs[idx].id}] to your config to update this run [${suiteInfo.name}].`);
				});
			}

			console.log(`Results published to ${this.base}?/plans/view/${plan.id}`);
			console.log(`Add updatePlan: ${plan.id} to your config to update this plan.`);
		} else {
			if (this.options.updateRun) {
				//update run here
				runs[0] = {
					id: this.options.updateRun
				};

				//add any missing test case ids to a run
				this.addCasesToRun(runs[0].id, results.map(r => r.case_id));
			} else {
				runs.push(this.addRun(name, description, this.options.suiteId, results.map(r => r.case_id)));
			}

			body = this.addResultsForCases(runs[0].id, results);
			console.log(`Results published to ${this.base}?/runs/view/${runs[0].id}`);
			console.log(`Add updateRun: ${runs[0].id} to your config to update this run.`);
		}

		// execute callback if specified
		if (callback) {
			callback(body);
		}
	}
}

module.exports = TestRail;
/**
 * @module lib/TestRail
 * @requires sync-request
 */

const request = require('sync-request');

/**
 * TestRail basic API wrapper
 */
class TestRail {

	/**
	 * @param {{domain, projectId, suiteId, assignedToId, username, password, includeAll, updateRun, updatePlan}} options
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
	 * @param {{}} options
	 * @param {string} name
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
	 * @param {string} path
	 * @return {string}
	 * @private
	 */
	_url(path) {
		return `${this.base}?${path}`;
	}

	/**
	 * @param {string} api
	 * @param {*} body
	 * @param {callback} callback
	 * @param {callback} error
	 * @return {*}
	 * @private
	 */
	_post(api, body, error = undefined) {
		return this._request("POST", api, body, error);
	}

	/**
	 * @param {string} api
	 * @param {callback} error
	 * @return {*}
	 * @private
	 */
	_get(api, error = undefined) {
		return this._request("GET", api, null, error);
	}

	addTestPlanEntry(planId, suiteId, name, description, runs, caseIds) {
		return this._request(
			'POST',
			`add_plan_entry/${planId}`, {
				'include_all': this.options.includeAll,
				'suite_id': suiteId,
				'name': name,
				'description': description,
				'runs': runs,
				'case_ids': caseIds
			});
	}

	/**
	 * @param {string} method
	 * @param {string} api
	 * @param {*} body
	 * @param {callback} callback
	 * @param {callback} error
	 * @return {*}
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
	 * @param {string} name
	 * @param {string} description
	 * @param {number} suiteId
	 * @return {*}
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
	 * 
	 * @param {String} name 
	 * @param {String} description 
	 * @param {Array} testRuns 
	 */
	addPlan(name, description, testRuns) {
		return this._post(`add_plan/${this.options.projectId}`, {
			"name": name,
			"description": description,
			"entries": testRuns
		});
	}

	/**
	 * 
	 * @param {number} runId 
	 * @param {Array} cases 
	 */
	addCasesToRun(runId, cases) {
		const currentCases = this._get(`get_tests/${runId}`).map(c => c.case_id);
		//console.log([...currentCases, ...cases])
		this._post(`update_run/${runId}`, {
			'case_ids': [...new Set([...currentCases, ...cases])]
		});
	}

	getCasesForSuite(projectId, suiteId) {
		return this._get(`get_cases/${projectId}&suite_id=${suiteId}`);
	}

	/**
	 * Publishes results of execution of an automated test run
	 * @param {string} name
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
				plan = this._get(`get_plan/${this.options.updatePlan}`);

				//console.log(plan);
				plan.entries.forEach(entry => {
					//console.log(entry.runs)
					const suiteInfo = this._get(`get_suite/${entry.runs[0].suite_id}`, callback);
					suiteInfo.cases = this.getCasesForSuite(this.options.projectId, suiteInfo.id).map(c => c.id);
					//console.log(suiteInfo);
					//console.log(results.filter(r => suiteInfo.cases.includes(r.case_id)).map(r => r.case_id))

					const currentCases = this._get(`get_tests/${entry.runs[0].id}`).map(c => c.case_id);

					//add any missing test case ids to each run
					this._post(`update_plan_entry/${plan.id}/${entry.id}`, {
						case_ids: [...new Set([...currentCases, ...results.filter(r => suiteInfo.cases.includes(r.case_id)).map(r => r.case_id)])]
					});
					body = [];
					body.push(this.addResultsForCases(entry.runs[0].id, results.filter(r => suiteInfo.cases.includes(r.case_id))));
				})
			} else {
				//1. create the test plan
				plan = this.addPlan(name, description, []);
				//2. for each suite, find the associated results for that suite & add those to the correct runs in the test plan
				this.options.suiteId.forEach((suiteId, idx) => {
					const suiteInfo = this._get(`get_suite/${suiteId}`, callback);
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

	/**
	 * @param {number} runId
	 * @param {Array.<Object>} results
	 * 
	 * @return {Object}
	 */
	addResultsForCases(runId, results) {
		if (results.length > 0) {
			return this._post(`add_results_for_cases/${runId}`, {
				results: results
			});
		}
	}
}

module.exports = TestRail;
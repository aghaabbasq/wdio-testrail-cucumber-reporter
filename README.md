# TestRail Reporter for Webdriver.io using Cucumber

Pushes test results into TestRail system.
Fork from [wdio testrail reporter](https://www.npmjs.com/package/wdio-testrail-reporter)

## Installation

```shell
 npm i wdio-testrail-cucumber-reporter -D
```

## Usage
Ensure that your TestRail installation API is enabled and generate your API keys. See http://docs.gurock.com/

Add reporter to wdio.conf.js:

```Javascript
const WdioCucumberTestRailReporter = require('wdio-testrail-cucumber-reporter');

...

    reporters: ['spec', WdioCucumberTestRailReporter],
    testRailsOptions: {
      domain: "yourdomain.testrail.net",
      username: "username",
      password: "password",
      projectId: 1,
      suiteId: 1,
      runName: "My test run",
      includeAll: true
    }
```

Mark your cucumber scenarios with ID of TestRail test cases. Ensure that your case ids are well distinct from test descriptions.

```Javascript
Scenario: C123 C324 I should be able to navigate to the home page
Scenario Outline: C123 C324 I should be able to navigate to the home page
```

Only passed or failed tests will be published. Skipped or pending tests will not be published resulting in a "Pending" status in TestRail test run.

[JSDocs can be found here](https://gavin771.github.io/wdio-testrail-cucumber-reporter/)

## Options

**domain**: *string* domain name of your TestRail instance (e.g. for a hosted instance instance.testrail.net)

**username**: *string* user email under which the test run will be created

**password**: *string* password or API token for user

**projectId**: *number* project number with which the tests are associated

**suiteId**: *array* suite numbers with which the tests are associated

**assignedToId**: *number* (optional) user id which will be assigned failed tests

<hr/>

## Advanced Options

### Scenario A

**You want to update a previous automation run (independent/in a test plan) without creating a new run.**

Add to your config object:
```
updateRun: runId
```
Cannot be used with Scenario C or D

<hr/>

### Scenario B

**You want to execute an automation run that does not include all tests in the suite, just the ones in your automation.**

Add to your config object:
```
includeAll: false
```
Can be used with any configuration

<hr/>

### Scenario C

**You want to create a test plan; test runs that pull cases from multiple suites.**

Add to your config object:
```
suiteId: [id1,id2,id3...]
```
Can be used with scenario D

<hr/>

### Scenario D

**You want to update the test results in your test plan without creating a new test plan.**

Add to your config object:

```Javascript
suiteId: [id1,id2,id3...],
updatePlan: planId
```

## Feel free to submit any bugs/issues/suggestions

[https://github.com/gavin771/wdio-testrail-cucumber-reporter/issues](https://github.com/gavin771/wdio-testrail-cucumber-reporter/issues)

## References

- https://www.npmjs.com/package/mocha-testrail-reporter
- http://webdriver.io/guide/reporters/customreporter.html
- http://docs.gurock.com/testrail-api2/start
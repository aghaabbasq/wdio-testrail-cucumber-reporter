# Cucumber TestRail Reporter for Webdriver.io 

Pushes test results into TestRail system.
Fork from [wdio-testrail-cucumber-reporter](https://github.com/Artemon-line/wdio-testrail-cucumber-reporter)


## Changed

- Only 1 result is published for per scenerio, not per step
- Update existing test plan instead
- Use independent case ID for `Scenario Outline`s

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
      password: "apiPassword",
      projectId: 1,
      suiteId: 1,
      sectionId: 1,
      updatePlan: 1,
      includeAll: false,

      // options used in TestRail run name
      runName: "My test run",
      time: "run time"         // I use `moment().format(" YYYY-MM-DD HH:mm")`
      platform: "Windows 10"
    }
```

Mark your cucumber scenarios with ID of TestRail test cases. Ensure that your case ids are well distinct from test descriptions.

```
Scenario: I should be able to navigate to the home page
"""
@C122
"""

...

Scenario Outline: I should be able to navigate to the home page
"""
@C123 @C124 @C125
"""
```

Only passed or failed tests will be published.

## Options

**domain**: *string* domain name of your TestRail instance (e.g. for a hosted instance instance.testrail.net)

**username**: *string* user email under which the test run will be created

**password**: *string* password or API token for user

**projectId**: *number* project number with which the tests are associated

**sectionId** *number* section number with which the tests are associated

**suiteId**: *number* suite number with which the tests are associated

**updatePlan**: *number* Plan ID to update

**includeAll**: *boolean* should all of the tests from the test suite be added to the run ?

**runName**: *string* Name that will be given to the run on TestRail

**time**: *string* Specify the run datetime to TestRail run name

**platform**: *string* Specify the platform to TestRail run name

## See also

- https://github.com/gavin771/wdio-testrail-cucumber-reporter/issues
- https://www.npmjs.com/package/mocha-testrail-reporter
- http://v4.webdriver.io/guide/reporters/customreporter.html
- http://docs.gurock.com/testrail-api2/start

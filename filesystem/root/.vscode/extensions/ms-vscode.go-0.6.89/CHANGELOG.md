## 0.6.89 - 30th August, 2018

* Show package variables and not just local variables in the debug viewlet when debugging. [Feature Request 1854](https://github.com/Microsoft/vscode-go/issues/1854) implemented with [PR 1865](https://github.com/Microsoft/vscode-go/pull/1865)
* Fix issue with anti virus scans blocking download of the Go plugin due to a dependency. [Bug 1871](https://github.com/Microsoft/vscode-go/pull/1871)
* Fix broken code coverage feature in Windows in Go 1.11 as the cover profile no longer uses backward slashes. [Bug 1847](https://github.com/Microsoft/vscode-go/issues/1847)
* Update existing Go tools when Go version or goroot changes, instead of the checkbox UI where user has to select the tools to update.

## 0.6.87 and 0.6.88 - 16th August, 2018

### Bug Fixes

* Extension host crashing with SIGPIPE error on machines that do not have the Go tools that the extension depends on instead of graceful error handling. [Bug 1845](https://github.com/Microsoft/vscode-go/issues/1845)
* Build fails on unix machines if user doesnt have entry in the /etc/passwd file. [Bug 1850](https://github.com/Microsoft/vscode-go/issues/1850)
* Avoid repeating gopath when the inferred gopath is the same as env gopath

## 0.6.86 - 13th August, 2018

### Debugging improvements

* [Zyck (@qzyse2017)](https://github.com/qzyse2017)
   * Introducing a new mode for debugging called `auto`. In this mode, the debugging sessions will run in `test` mode automatically if the current active file is a test file. Otherwise this defaults to the usual `debug` mode. [Feature Request 1780](https://github.com/Microsoft/vscode-go/issues/1780)

* [Luis GG (@lggomez)](https://github.com/lggomez)
   * Errors from delve api calls are now shown in the debug console when `"showLog": true` is added to the debug configuration. [PR 1815](https://github.com/Microsoft/vscode-go/pull/1815).

* [Ramya Rao (@ramya-rao-a)](https://github.com/ramya-rao-a)
   * Fix bug when debugging a program that runs in a loop forever is not stopped when the stop button is clicked. [Bug 1814](https://github.com/Microsoft/vscode-go/issues/1814)
   * Fix bug when a previous failed debugging session due to compile errors results in failure of future sessions after fixing the compile error. [Bug 1840](https://github.com/Microsoft/vscode-go/issues/1840)
   * The environment variables in `go.toolsEnvVars` setting which gets used by all Go tools in this extension will now be passed to `dlv` as well during debugging sessions. With this change you dont need to repeat the variables in the debug configuration if you have already added it in the settings. [Feature Request 1839](https://github.com/Microsoft/vscode-go/issues/1839)

### Others

* [Ramya Rao (@ramya-rao-a)](https://github.com/ramya-rao-a)
   * The `go.gopath` command when run programatically by other extensions now returns the GOPATH as determined by this extension. Useful for other extensions that want to provide additional features but do not want to repeat the work done by this extension to determine the GOPATH.

* [Darrian @(rikkuness)](https://github.com/rikkuness)
   * Fix bug with permission issues when there are mutliple user accounts on the same machine by using separate tmp files. [Bug 1829](https://github.com/Microsoft/vscode-go/issues/1829) fixed with [PR 1835](https://github.com/Microsoft/vscode-go/pull/1835)

* [Filip Stanis @(fstanis)](https://github.com/fstanis)
   * Fix error handling when the error returned by the process that runs formatting is not a string. [PR 1828](https://github.com/Microsoft/vscode-go/pull/1828)

## 0.6.85 - 26th July, 2018

* [Shannon Wynter @freman](https://github.com/freman)
    * New command `Go: Add Package to Workspace` that will add selected imported package to the current workspace. [Feature Request 1733](https://github.com/Microsoft/vscode-go/issues/1733) implemented with [PR 1745](https://github.com/Microsoft/vscode-go/pull/1745)

* [Jackson Kearl (@JacksonKearl)](https://github.com/JacksonKearl)
    * Fix perf issues when using linters. [Bug 1775](https://github.com/Microsoft/vscode-go/issues/1775) fixed with [PR 1791](https://github.com/Microsoft/vscode-go/pull/1791)
    * Improve performance of the Outline view. [PR 1766](https://github.com/Microsoft/vscode-go/pull/1766)

* [Marwan Sulaiman (@marwan-at-work)](https://github.com/marwan-at-work)
    * When suggesting unimported custom packages, show the ones form current workspace before the others. [PR 1782](https://github.com/Microsoft/vscode-go/pull/1782)

* [Halil Kaskavalci (@kaskavalci)](https://github.com/kaskavalci)
    * Fix bug with function snippets such that they are not inserted when functions are being filling in as parameters of another function call. [Bug 1779](https://github.com/Microsoft/vscode-go/issues/1779) fixed with [PR 1788](https://github.com/Microsoft/vscode-go/pull/1788)

* [Matt Strong (@xmattstrongx)](https://github.com/xmattstrongx)
    * Fix bug in debug variable and hover when using multi byte characters. [Bug 1777](https://github.com/Microsoft/vscode-go/issues/1777) fixed with [PR 1790](https://github.com/Microsoft/vscode-go/pull/1790)

* [Ramya Rao (@ramya-rao-a)](https://github.com/ramya-rao-a)
    * Fix error with `Go: Generate Interface Stubs` command when using on an interface that is defined inside an "internal" folder.[Bug 1769](https://github.com/Microsoft/vscode-go/issues/1769)
    * Fix bug where auto-completions dont show built-in types. [Bug 1739](https://github.com/Microsoft/vscode-go/issues/1739)
    * Look at GOROOT before PATH when looking for the Go binary. Fixes [Bug 1760](https://github.com/Microsoft/vscode-go/issues/1760) which was a regression.
    * Clean up the debug binary that gets generated by delve at the end of the debugging session. [Bug 1345](https://github.com/Microsoft/vscode-go/issues/1345)

## 0.6.84 - 29th June, 2018

* [Michal Hruby (@mhr3)](https://github.com/mhr3)
    * Support to run tests that use the test suites from [stretchr/testify](https://github.com/stretchr/testify) suite using codelens. [PR 1707](https://github.com/Microsoft/vscode-go/pull/1707)

* [Luis GG (@lggomez)](https://github.com/lggomez)
    * New setting `go.delveConfig` to configure the use of v2 apis from delve to be used when debugging tests as well normal code. [Feature Request 1735](https://github.com/Microsoft/vscode-go/issues/1735) implemented with [PR 1749](https://github.com/Microsoft/vscode-go/pull/1749)

* [Ramya Rao (@ramya-rao-a)](https://github.com/ramya-rao-a)
    * Option to install/update selected tools required by the Go extension. [Feature Request 1731](https://github.com/Microsoft/vscode-go/issues/1731)


## 0.6.83 - 15th Jun, 2018

* [Luis GG (@lggomez)](https://github.com/lggomez)
    * Support for Conditional Breakpoints when debugging. [Feature Request 1720](https://github.com/Microsoft/vscode-go/issues/1720) implemented with [PR 1721](https://github.com/Microsoft/vscode-go/pull/1721)
    * Fix the watch feature in the debug panel that got introduced in the previous update. Fixes [Bug 1714](https://github.com/Microsoft/vscode-go/issues/1714) with [PR 1718](https://github.com/Microsoft/vscode-go/pull/1718)

* [@ikedam](https://github.com/ikedam)
    * New setting `go.alternateTools` to provide alternate tools or alternate paths for the same tools used by the Go extension. Provide either absolute path or the name of the binary in GOPATH/bin, GOROOT/bin or PATH. 
    Useful when you want to use wrapper script for the Go tools or versioned tools from https://gopkg.in. [PR 1297](https://github.com/Microsoft/vscode-go/pull/1297). Some scenarios:
        * Map `go` to `goapp` when using App Engine Go
        * Map `gometalinter` to `gometalinter.v2` if you want to use the stable version of the tool

* [Ramya Rao (@ramya-rao-a)](https://github.com/ramya-rao-a)
    * Support the new outline feature which is in preview. [Bug 1725](https://github.com/Microsoft/vscode-go/issues/1725)
    * Close `gocode` before updating and show appropriate message when failed to do so.  

## 0.6.82 - 6th June, 2018

* [Tyler Bunnell (@tylerb)](https://github.com/tylerb)
    * Status bar item to cancel running tests. [Feature Request 1047](https://github.com/Microsoft/vscode-go/issues/1047) implemented with [PR 1218](https://github.com/Microsoft/vscode-go/pull/1218)

* [Frederik Ring (@m90)](https://github.com/m90)
    * Use `mdempsky/gocode` instead of `nsf/gocode` for auto-completion feature as the latter fails in Go 1.10 onwards.  Fixes [Bug 1645](https://github.com/Microsoft/vscode-go/issues/1645) with [PR 1710](https://github.com/Microsoft/vscode-go/pull/1710)

* [Ramya Rao (@ramya-rao-a)](https://github.com/ramya-rao-a)
    * Fix the regression in the code coverage where the coverage doesnt get applied/removed as expected. Fixes [Bug 1716](https://github.com/Microsoft/vscode-go/issues/1716) and [Bug 1717](https://github.com/Microsoft/vscode-go/issues/1717) with [commit abe97240](https://github.com/Microsoft/vscode-go/commit/abe97240e573e9d2c11cea00bfd8c1e77c41398e)

## 0.6.81 - 4th June, 2018

### Features

* [Luis GG (@lggomez)](https://github.com/lggomez)
    * Use debug configuration to choose to use version 2 of delve apis when debugging. [Feature Request 1555](https://github.com/Microsoft/vscode-go/issues/1555) implemented with [PR 1647](https://github.com/Microsoft/vscode-go/pull/1647). This enables you to set configuration to increase the size of arrays and strings that are watchable during debugging which fixes [Bug 868](https://github.com/Microsoft/vscode-go/issues/868)

* [@golangci](https://github.com/golangci)
    * Support the use of `golangci-lint` as a linter. [Feature Request 1693](https://github.com/Microsoft/vscode-go/issues/1693) implemented with [PR 1693](https://github.com/Microsoft/vscode-go/pull/1693)

* [Minko Gechev (@mgechev)](https://github.com/mgechev) and [Mark Wolfe (@wolfeidau)](https://github.com/wolfeidau)
    * Support the use of `revive` as a linter. [Feature Request 1697](https://github.com/Microsoft/vscode-go/issues/1697) implemented with [PR 1699](https://github.com/Microsoft/vscode-go/pull/1699), [PR 1703](https://github.com/Microsoft/vscode-go/pull/1703) and commit [d31636](https://github.com/Microsoft/vscode-go/commit/d31636a89931add2b799610d91dce1f67b27d5d8)

* [Kent Quirk (@kentquirk)](https://github.com/kentquirk)
    * Customize the colors used in highlighting covered/uncovered code or the gutter styles used to indicated covered/uncovered code using the setting `go.coverageDecorator`. [Feature Request 1302](https://github.com/Microsoft/vscode-go/issues/1302) implemented with [PR 1695](https://github.com/Microsoft/vscode-go/pull/1695).

* [Shreyas Karnik (@shreyu86)](https://github.com/shreyu86)
    * Include exported member name in completions when starting a comment above it. Use Ctrl+Space to trigger completions inside comments. [Feature Request 1005](https://github.com/Microsoft/vscode-go/issues/1005) implemented with [PR 1675](https://github.com/Microsoft/vscode-go/pull/1675) and [PR 1706](https://github.com/Microsoft/vscode-go/pull/1706)

* [Frederik Ring (@m90)](https://github.com/m90), [Ramya Rao (@ramya-rao-a)](https://github.com/ramya-rao-a)
    * Get code completion and formatting features when using language server. Use the new setting `go.languageServerExperimentalFeatures` to opt-in to try such new features from the language server that might not be feature complete yet. [Feature Request 1593](https://github.com/Microsoft/vscode-go/issues/1593) implemented with [PR 1607](https://github.com/Microsoft/vscode-go/pull/1607)

* [Ramya Rao (@ramya-rao-a)](https://github.com/ramya-rao-a)
    * Resolve `~`, `${workspaceRoot}`, `${workspaceFolder}` in the `go.testFlags` setting. [Feature Request 928](https://github.com/Microsoft/vscode-go/issues/928)
    * Ensure `Go: Add Import` shows up the list of imports ASAP. Fixes [Feature Request 1450](https://github.com/Microsoft/vscode-go/issues/1450)
    * Prompt user to install missing tool when they change either of `go.formatTool`, `go.lintTool` or `go.docsTool` setting to a tool that they dont have installed yet.
    * Pass the environment variables in the `go.toolsEnvVars` setting to the process that runs the language server.
    * Include the GOPATH from environment variable in the inferred GOPATH when `go.inferGopath` setting is enabled. [Feature Request 1525](https://github.com/Microsoft/vscode-go/issues/1525)

### Bug Fixes

* [Kent Quirk (@kentquirk)](https://github.com/kentquirk)
    * Fix code coverage when code is covered by multiple tests. [Bug 1683](https://github.com/Microsoft/vscode-go/issues/1683).

* [Nuruddin Ashr (@uudashr)](https://github.com/uudashr)
    * Imrpove performance when using `gopkgs`. Fixes [Bug 1490](https://github.com/Microsoft/vscode-go/issues/1490) with [PR 1658](https://github.com/Microsoft/vscode-go/pull/1658)
    * Internal packages at the root of GOROOT should not be importable. [PR 1681](https://github.com/Microsoft/vscode-go/pull/1681).

* [Gordon Tyler (@doxxx)](https://github.com/doxxx)
    * Fix the improper usage of Cancellation Tokens that resulted in lint/vet processes getting cancelled. [PR 1704](https://github.com/Microsoft/vscode-go/pull/1704)

* [Luis GG (@lggomez)](https://github.com/lggomez)
    * Exlcude parameters in the function snippet in auto-completions if there is a `()` after cursor. Fixes [Bug 1655](https://github.com/Microsoft/vscode-go/issues/1655) with [PR 1696](https://github.com/Microsoft/vscode-go/pull/1696)

* [Ramya Rao (@ramya-rao-a)](https://github.com/ramya-rao-a)
    * Support `Go to Definition` feature when the entire symbol is selected with cursor at the end. Fixes [Bug 891](https://github.com/Microsoft/vscode-go/issues/891).

## 0.6.80 - 14th May, 2018

* [Ramya Rao (@ramya-rao-a)](https://github.com/ramya-rao-a)
    * New setting `go.installDependenciesWhenBuilding` to control whether the `-i` flag is passed to `go build`/`go test` when compiling. [Feature Request 1464](https://github.com/Microsoft/vscode-go/issues/1464)
    * Use GOROOT from `go env` if not set as environment variable explicitly.
    * Fix bug where the output pane keeps showing up when using language server. [Bug 1662](https://github.com/Microsoft/vscode-go/issues/1662)
    * Show rename errors in the output channel. Fixes [Bug 1663](https://github.com/Microsoft/vscode-go/issues/1663)

* [@tanguylebarzic](https://github.com/tanguylebarzic)
    * Fixed regression bug where environment variables set in `go.toolsEnvVars` arent being used. [PR 1665](https://github.com/Microsoft/vscode-go/pull/1665)

* [Gordon Tyler (@doxxx)](https://github.com/doxxx)
    * Fix broken links in test output when `Go: Test All Packages In Workspace` command is run. [Bug 1626](https://github.com/Microsoft/vscode-go/issues/1626) and [PR 1651](https://github.com/Microsoft/vscode-go/pull/1651)
    * Expand function snippet for inline functions in auto-completions. [Feature Request 1287](https://github.com/Microsoft/vscode-go/issues/1287) and [PR 1673](https://github.com/Microsoft/vscode-go/pull/1673)
    * Avoid completions in line comments. [Bug 1659](https://github.com/Microsoft/vscode-go/issues/1659) and [PR 1671](https://github.com/Microsoft/vscode-go/pull/1671)

* [Jon Calhoun (@joncalhoun)](https://github.com/joncalhoun)
    * Expand function snippet for function types in auto-completions. [Feature Request 1553](https://github.com/Microsoft/vscode-go/issues/1553) and [PR 1560](https://github.com/Microsoft/vscode-go/pull/1560)

## 0.6.79 - 4th May, 2018

* [Frederik Ring (@m90)](https://github.com/m90)
    * New setting `go.gotoSymbol.includeGoroot`. If enabled, the symbols from the standard library are included when doing a workspace symbol search using the `Go to Symbol in Workspace` command. [Feature Request 1567](https://github.com/Microsoft/vscode-go/issues/1567) and [PR 1604](https://github.com/Microsoft/vscode-go/pull/1604)

* [Antoine @primalmotion](https://github.com/primalmotion)
    * New setting `go.coverOnSingleTest`. If enabled, code coverage will be shown in the editor when running individual tests. [Feature Request 1637](https://github.com/Microsoft/vscode-go/issues/1637) and [PR 1638](https://github.com/Microsoft/vscode-go/pull/1638)

* [lixiaohui (@leaxoy)](https://github.com/leaxoy)
    * Use the right icons for completion items of type `const`, `package`, `type` and `var`. [PR 1624](https://github.com/Microsoft/vscode-go/pull/1624)

* [Michael Novak (@novak)](https://github.com/novak)
    * Use the `go.buildTags` setting when running `go vet`. [Bug 1591](https://github.com/Microsoft/vscode-go/issues/1591) and [PR 1625](https://github.com/Microsoft/vscode-go/pull/1625)

* [Nuruddin Ashr (@uudashr)](https://github.com/uudashr)
    * Package name suggestion should be `main` in a test file if the folder contains a `main.go`. [PR 1630](https://github.com/Microsoft/vscode-go/pull/1630)

* [Ramya Rao (@ramya-rao-a)](https://github.com/ramya-rao-a)
    * Non string values for environment variables are now allowed in settings like `go.testEnvVars` and `go.toolsEnvVars`. [Bug 1608](https://github.com/Microsoft/vscode-go/issues/1608)
    * Support the `Go to Implementation` and `Peek Implmentation` commands when using the Go Language Server. [Feature Request 1611](https://github.com/Microsoft/vscode-go/issues/1611)
    * Fix automatic imports of packages when there is a comment in the end of the import block. [Bug 1606](https://github.com/Microsoft/vscode-go/issues/1606)
    * Fix automatic imports of packages when package alias starts with any keyword in the import block. [Bug 1618](https://github.com/Microsoft/vscode-go/issues/1618)
    
## 0.6.78 - 3rd April, 2018

### New Features and Enhancements

* [Teruo Kunihiro @1984weed](https://github.com/1984weed)
    * Configure the `output` option of delve in debug configuration.The location provided here is where delve will output the binary it then uses for debugging. [PR 1564](https://github.com/Microsoft/vscode-go/pull/1564)

* [Harry Kalogirou @harkal](https://github.com/harkal)
    * Codelens to debug benchmarks. [PR 1566](https://github.com/Microsoft/vscode-go/pull/1566)

* [David Howden @dhowden](https://github.com/dhowden)
    * Show build errors at the right column in a line instead of showing them at the start of the line by using columns numbers returned from `go build`. [PR 1573](https://github.com/Microsoft/vscode-go/pull/1573)

* [Ramya Rao (@ramya-rao-a)](https://github.com/ramya-rao-a)
    * Make links in test output clickable when it fails due to build errors. [Feature Request 1562](https://github.com/Microsoft/vscode-go/issues/1562)
    * Enable `Go to Implementation` to work both ways. [Feature Request 1536](https://github.com/Microsoft/vscode-go/issues/1536)

* [Dan Mick @dmick](https://github.com/dmick)
    * Include comments from struct definitions when showing the definitions on hover. [PR 1559](https://github.com/Microsoft/vscode-go/pull/1559)

* [KataKonst @KataKonst](https://github.com/KataKonst)
    * Use `go vet` instead of `go tool vet` from Go 1.10 onwards as the latter now supports all vet flags. [PR 1576](https://github.com/Microsoft/vscode-go/pull/1576)

* [Luis GG @lggomez](https://github.com/lggomez)
    * Add option to never show the warning on editing generated files. [PR 1537](https://github.com/Microsoft/vscode-go/pull/1537)

* [Jan Koehnlein @JanKoehnlein](https://github.com/JanKoehnlein)
    * Show warning when go binary is not found during build. [PR 1543](https://github.com/Microsoft/vscode-go/pull/1543)

### Bug Fixes

* [Kegsay @Kegsay](https://github.com/Kegsay)
    * Fix bug where debug codelens would debug all tests that match the current test name. [PR 1561](https://github.com/Microsoft/vscode-go/pull/1561)

* [Nuruddin Ashr (@uudashr)](https://github.com/uudashr)
    * Fix bug where internal packages are allowed to be imported when their path is substring of current package. [PR 1535](https://github.com/Microsoft/vscode-go/pull/1535)

* [Ramya Rao (@ramya-rao-a)](https://github.com/ramya-rao-a)
    * Fix `Go to Implementation` feature when GOPATH is directly opened in VS Code. [Bug 1545](https://github.com/Microsoft/vscode-go/issues/1545) and [Bug 1554](https://github.com/Microsoft/vscode-go/issues/1554)
    * Fix issue with debugging into std lib when remote debugging and remote path is a complete substring of the local path.


## 0.6.77 - 20th February, 2018

* [Robin Bartholdson @buyology](https://github.com/buyology)
    * New command `Go: Fill Struct` integrates the `fillstruct` tool that lets you fill struct fields with default values. [PR 1506](https://github.com/Microsoft/vscode-go/pull/1506)

* [Ramya Rao (@ramya-rao-a)](https://github.com/ramya-rao-a)
    * Show key value pairs of map variables correctly in the variable pane when debugging. Fixes [Bug 1384](https://github.com/Microsoft/vscode-go/issues/1384)

* [Nuruddin Ashr (@uudashr)](https://github.com/uudashr)
    * Fix the issue of various features not working with Go 1.10 due to regex failure on fetching the version. [PR 1523](https://github.com/Microsoft/vscode-go/pull/1523)

* [Kevin Wiesmüller @kwiesmueller](https://github.com/kwiesmueller)
    * Generating Unit Tests will not open a new editor for generated/updated test file if the file is already open and visible in another editor group. [PR 1517](https://github.com/Microsoft/vscode-go/pull/1517)

* [Murad Korejo (@mkorejo)](https://github.com/mkorejo)
    * Notify user when `gopkgs` fails to get packages that are needed to provide the completions for unimported packages. [PR 1528](https://github.com/Microsoft/vscode-go/pull/1528)

* [Anatoly Milkov (@anatolym)](https://github.com/anatolym) and [Christian Winther (@jippi)](https://github.com/jippi)
    * Documentation Updates

## 0.6.76 - 10th February, 2018

* [Bug 1449](https://github.com/Microsoft/vscode-go/issues/1449): Rename fails due to cgo not being able to find the go executable.  
* [Bug 1508](https://github.com/Microsoft/vscode-go/issues/1508): Broken Path in Windows when running Go tools
   
## 0.6.74 - 8th February, 2018

* [Nikhil Raman (@cheesedosa)](https://github.com/cheesedosa)
    * [Feature Request 1456](https://github.com/Microsoft/vscode-go/issues/1456): Show build/vet/lint status in status bar instead of opening output pane when run manually

* [Ramya Rao (@ramya-rao-a)](https://github.com/ramya-rao-a)
    * [Bug 1470](https://github.com/Microsoft/vscode-go/issues/1470): `Go: Build Workspace` command or the setting `"go.buildOnSave": "workspace"` results in persistent error from trying to build the root directory with no Go files.
    * [Bug 1469](https://github.com/Microsoft/vscode-go/issues/1469): Formatting adds �� in Chinese files some times.
    * [Bug 1481](https://github.com/Microsoft/vscode-go/issues/1481): Untitled files in empty workspace results in build errors
    * [Bug 1483](https://github.com/Microsoft/vscode-go/issues/1483): Generating unit tests for a function generates tests for other functions with similar names

## 0.6.72 - 9th January, 2018

* [Ramya Rao (@ramya-rao-a)](https://github.com/ramya-rao-a)
    * Fix the issue that got introduced in the previous release, where formatter reverts changes unless `goreturns` is updated. Fixes [Bug 1447](https://github.com/Microsoft/vscode-go/issues/1447)
    * `~`, `$workspaceRoot` and `$workspaceFolder` are now supported in the `go.goroot` setting
* [Ben Wood @(benclarkwood)](https://github.com/Microsoft/vscode-go/blob/master/benclarkwood)
    * Collapse single line imports into an import block when auto-completing symbols from unimported packages or when using the `Go: Add Import` command. Fixes [Bug 374](https://github.com/Microsoft/vscode-go/issues/374) with [PR 500](https://github.com/Microsoft/vscode-go/pull/500)

## 0.6.71 - 5th January, 2018

* [Ramya Rao (@ramya-rao-a)](https://github.com/ramya-rao-a)
    * Setting `go.inferGopath` will now infer the correct GOPATH even in the below 2 cases which wasnt supported before
         - When a Go file is opened in VS Code directly without opening any workspace.
         - When GOPATH itself is directly opened in VS Code. Fixes [Bug 1213](https://github.com/Microsoft/vscode-go/issues/1213)
    * Use byte offset when calling `gocode` to fix issue with code completion when there are unicode characters in the file. Fixes [Bug 1431](https://github.com/Microsoft/vscode-go/issues/1431)
    * Add descriptions to the contributed snippets. These descriptions will appear in auto-completion and when using the `Insert Snippet` command
    * Fix "maxBufferExceeded" error by using `spawn` instead of `exec` when running formatters.
    * Use the new `onDebugResolve` activation event instead of `onDebug` to avoid activating the Go extension when other type of debug sessions are started

* [halfcrazy](https://github.com/halfcrazy)
    * Fixed the upstream issue with `goreturns`: [PR sqs/goreturns#42](https://github.com/sqs/goreturns/pull/42). This in turn fixes [Bug 613](https://github.com/Microsoft/vscode-go/issues/613) and [Bug 630](https://github.com/Microsoft/vscode-go/issues/630)

* [Nikhil Raman (@cheesedosa)](https://github.com/cheesedosa)
    * Show a warning when user edits a generated file. [Feature Request 1295](https://github.com/Microsoft/vscode-go/issues/1295) via [PR 1425](https://github.com/Microsoft/vscode-go/pull/1425)

## 0.6.70 - 19th December, 2017

* [Avihay Kain (@grooveygr)](https://github.com/grooveygr)
    * Snippets for methods on types during auto-completion. [Feature Request 168](https://github.com/Microsoft/vscode-go/issues/168). [PR 1368](https://github.com/Microsoft/vscode-go/pull/1368)
* [Matt Brandt (@Matt007)](https://github.com/matt007)
    * Debug configuration snippet for remote debugging. [PR 1365](https://github.com/Microsoft/vscode-go/pull/1365)
* [Ramya Rao (@ramya-rao-a)](https://github.com/ramya-rao-a)
    * Prompt to recompile dependent Go tools when GOROOT changes. [Feature Request 1286](https://github.com/Microsoft/vscode-go/issues/1286)
    * Support for `${workspaceFolder}` in the below settings
        - `go.gopath`
        - `go.toolsGopath`
        - `go.testEnvVars`
        - `go.testEnvFile`
    * The `Analysis Tools Missing` message has bee updated to only appear for the tools backing basic features of the extension
    * Skip showing linting/vetting errors on a line that has build errors. [Feature Request 600](https://github.com/Microsoft/vscode-go/issues/600)
    * Fix the issue of slow linters resulting in stale problem markers in updated file. [Bug 1404](https://github.com/Microsoft/vscode-go/issues/1404)
    * Deprecate `go.formatOnSave` setting in favor of `editor.formatOnSave`. To disable formatting on save, add the below setting:
        ```
        "[go]": {
            "editor.formatOnSave": false
        }
        ```
        This fixes the below issues
       - Cursor jumps unexpectedly when formatting on save. [Bug 1346](https://github.com/Microsoft/vscode-go/issues/1346)
       - Adopting the format on save feature of VS Code. [Debt 540](https://github.com/Microsoft/vscode-go/issues/540)
       - Format-on-save messes up undo/redo stack [Bug 678](https://github.com/Microsoft/vscode-go/issues/678)
       - FormatOnSave re-saves file [Bug 1037](https://github.com/Microsoft/vscode-go/issues/1037)
       - Save All doesnt format all files [Bug 279](https://github.com/Microsoft/vscode-go/issues/279)
       - Slow format on save affects tests [Bug 786](https://github.com/Microsoft/vscode-go/issues/786)


## 0.6.69 - 27th November, 2017

* New commands
    * [Frederik Ring (@m90)](https://github.com/m90)
        * `Go: Run on Go Playground` to run the current file (only if all its dependencies are from the std library) in the [Go Playground](https://play.golang.org/) using [goplay](https://github.com/haya14busa/goplay). [PR 1270](https://github.com/Microsoft/vscode-go/pull/1270). [Feature Request #1211](https://github.com/Microsoft/vscode-go/issues/1211)
            * Use the setting `go.playground` to control whether to run and/or share a link to the playground and/or open the playground in the browser.
    * [Robin Bartholdson @buyology](https://github.com/buyology)
        * `Go: Benchmark Function At Cursor` and Codelens for running benchmarks in test files. [PR 1303](https://github.com/Microsoft/vscode-go/pull/1303). [Feature Request #972](https://github.com/Microsoft/vscode-go/issues/972)
    * [Andrew Nee (@ndrewnee)](https://github.com/ndrewnee)
        * `Go: Lint Current Package` and `Go: Lint Workpsace` to lint using the tool specified in the `go.lintTool` setting and the flags specified in the `go.lintFlags` setting. [PR 1258](https://github.com/Microsoft/vscode-go/pull/1258). [Feature Request #1041](https://github.com/Microsoft/vscode-go/issues/1041)
    * [Ramya Rao (@ramya-rao-a)](https://github.com/ramya-rao-a)
        * `Go: Vet Current Package` and `Go: Vet Workpsace` to vet using the flags specified in the `go.vetFlags` setting. [Feature Request #1041](https://github.com/Microsoft/vscode-go/issues/1041)
        * `Go: Build Current Package` and `Go: Build Workpsace` to build using the flags specified in the `go.buildFlags` setting and build tags specified in the setting `go.buildTags`. [Feature Request #287](https://github.com/Microsoft/vscode-go/issues/287)
        * `Go: Install Current Package` to install the current package using the flags specified in the `go.buildFlags` setting and build tags specified in the setting `go.buildTags`. [Feature Request #287](https://github.com/Microsoft/vscode-go/issues/287)

* Completion Improvements
    * [wangkechun (@wangkechun)](https://github.com/wangkechun)
        * Completions for standard packages are now shown before custom packages when providing completions for unimported packages. [PR 1309](https://github.com/Microsoft/vscode-go/pull/1309) 
    * [Ramya Rao (@ramya-rao-a)](https://github.com/ramya-rao-a)
        * `gocode` can now use [gb](https://github.com/constabulary/gb) specific rules when providing completions. Set the new setting `go.gocodePackageLookupMode` to `gb` to use this feature. [Feature Request #547](https://github.com/Microsoft/vscode-go/issues/547)

* Performance improvements
    * [Ramya Rao (@ramya-rao-a)](https://github.com/ramya-rao-a)
        * The `autobuild` feature of `gocode` which is known to slow completions is now disabled by default. Fixes [Bug 1323](https://github.com/Microsoft/vscode-go/issues/1323)
            * Since we use the `-i` flag when building, we do not rely on `autobuild` feature of `gocode` to ensure fresh results from dependencies.
            * If you have disabled the `buildOnSave` setting, then use the new `Go: Build Current Package` command once in a while to ensure the dependencies are up to date or enable the `go.gocodeAutoBuild` setting.
        * In Go 1.9 and higher, running the vet feature in the absence of vet flags will be faster due to the use of `go vet ./...` instead of `go tool vet -flags`. Fixes [Bug 1215](https://github.com/Microsoft/vscode-go/issues/1215)
        * Performance issues caused by a large number of lingering processes for vet/lint/hover features are now solved. 
            * Measures are now in place to kill older processes before starting new ones for vet/lint feature. Fixes [Bug 1265](https://github.com/Microsoft/vscode-go/issues/1265)
            * For other features like hover/outline/definition etc. the cancellation token provided by the core is used to kill processes if the corresponding request from the core is cancelled. Fixes [Bug 667](https://github.com/Microsoft/vscode-go/issues/667)

* Others
    * [Phil Kates (@philk)](https://github.com/philk)
        * Fix the formatting issue due to stricter rules in the VS Code apis around configuration objects. [PR 1334](https://github.com/Microsoft/vscode-go/pull/1334). Fixes [Bug 1333](https://github.com/Microsoft/vscode-go/issues/1333).
    * [David Marby (@DMarby)](https://github.com/DMarby)
        * Fix delve connection issues when verbose build flag is set. [PR 1354](https://github.com/Microsoft/vscode-go/pull/1354)
    * [Jan Koehnlein @JanKoehnlein](https://github.com/JanKoehnlein)
        * Fix `Open Workspace Settings` action in the prompt to set GOPATH. [PR 1375](https://github.com/Microsoft/vscode-go/pull/1375). Fixes [Bug 1374](https://github.com/Microsoft/vscode-go/issues/1374)
    * [Ramya Rao (@ramya-rao-a)](https://github.com/ramya-rao-a)
        * Apply/Clear coverage in active editors of all editor groups rather than just the first one. Fixes [Bug 1343](https://github.com/Microsoft/vscode-go/issues/1343)
        * Fix the issue of codelens for references showing "0 references" when `guru` fails to provide references. Fixes [Bug 1336](https://github.com/Microsoft/vscode-go/issues/1336)
        * Support multiple buildtags in the `go.buildTags` setting. Fixes [Bug 1355]https://github.com/Microsoft/vscode-go/issues/1355).

## 0.6.67 - 4th November, 2017

* [Nuruddin Ashr (@uudashr)](https://github.com/uudashr)
    * Do not show suggestions from internal packages of other projects. Fixes [Bug 1256](https://github.com/Microsoft/vscode-go/issues/1256).

* [Alexander Kohler (@alexkohler)](https://github.com/alexkohler)
    * Fix issue with `go.useCodeSnippetsOnFunctionSuggestWithoutType` setting dropping parameters of same type. Fixes [Bug 1279](https://github.com/Microsoft/vscode-go/issues/1279) via [PR 1284](https://github.com/Microsoft/vscode-go/pull/1284)
    * Remove duplciate compilation errors that can show up when entire workspace is built. Fixes [Bug 1228](https://github.com/Microsoft/vscode-go/issues/1228) via [PR 1269](https://github.com/Microsoft/vscode-go/pull/1269)

* [Paweł Słomka @slomek](https://github.com/slomek)
    * Snippet for Example functions. [PR 1281](https://github.com/Microsoft/vscode-go/pull/1281)

* [Ramya Rao (@ramya-rao-a)](https://github.com/ramya-rao-a)
    * Fix suggestions to import vendored packages in Windows. Fixes [Bug 1147](https://github.com/Microsoft/vscode-go/issues/1147).
    * Fix extension activation issue in Windows when a Go file is opened without any folder open. Fixes [Bug 1306](https://github.com/Microsoft/vscode-go/issues/1306)
    * Use the newer debug APIs as the older ones will be deprecated in VS Code 1.18

## 0.6.66 - 2nd October, 2017

### [Multi Root support](https://code.visualstudio.com/updates/v1_15#_preview-multi-root-workspaces) when using [VS Code Insiders](https://code.visualstudio.com/insiders)
   
We now have [Multi Root support](https://code.visualstudio.com/updates/v1_15#_preview-multi-root-workspaces) for Go. [PR 1221](https://github.com/Microsoft/vscode-go/pull/1221) Please note:
* The settings at Folder level takes precedence over the ones at the Workspace level which in turn take precedence over the ones at the User level
* You can have the different roots in the multi-root mode use different GOPATHs. The experimental language server feature is not supported in such cases though.
* All current Go related features that refer to "workspace" will refer to the individual roots in the multi root mode. For example: Build/lint/vet/test workspace or `Go to Symbol in workspace`.
* Give it a try and log any issues that you find in the [vscode-go repo](https://github.com/Microsoft/vscode-go/issues)

### Auto-completion improvements

* [Nuruddin Ashr (@uudashr)](https://github.com/uudashr)
    * Auto-completion for unimported packages that are newly installed/built will now show up without the need for reloading VS Code.
    * Completions from sub vendor packages that were showing up are ignored now. Fixes [Bug 1251](https://github.com/Microsoft/vscode-go/issues/1251)
    * The `package` snippet completion is now smarter when suggesting package names. [PR 1220](https://github.com/Microsoft/vscode-go/pull/1220). It suggests
        * `main` when current file is `main.go` or there exists a `main.go` file in current folder
        * The folder name when the current file is `internal_test.go`
        * The folder name with `_test` when current file is a test file 
        * If the folder name in above cases has `-` or `.`, then what appears after the `-` or `.` is suggested.
* [Alexander Kohler (@alexkohler)](https://github.com/alexkohler)
    * A new setting `go.useCodeSnippetsOnFunctionSuggestWithoutType` is introduced. This allows completions of functions with their parameter signature but without the parameter types. [Feature Request 1241](https://github.com/Microsoft/vscode-go/issues/1241)
* [Miklós @kmikiy](https://github.com/kmikiy)
    * 3 New snippets for the `Log` methods from the `testing` package

### Improvements around running and debugging tests

* [zhouhaibing089 (@zhouhaibing089)](https://github.com/zhouhaibing089)
    * Running and debugging tests for packages in symlinked folders is now possible. [PR 1164](https://github.com/Microsoft/vscode-go/pull/1164)
* [Katsuma Ito (@ka2n)](https://github.com/ka2n)
    * The Debug Test codelens now uses the buildTags and buildFlags correctly. [PR 1248](https://github.com/Microsoft/vscode-go/pull/1248)
* [Chase Adams (@chaseadamsio)](https://github.com/chaseadamsio)
    * You can now run tests from unsaved files. Fixes [Bug 1225](https://github.com/Microsoft/vscode-go/issues/1225)
* [Ramya Rao (@ramya-rao-a)](https://github.com/ramya-rao-a)
    * Changes done to coverage options and decorators in settings now apply immediately without the need for moving to another file and back. Fixes [Bug 1171](https://github.com/Microsoft/vscode-go/issues/1171)
    * The Run Test and Debug Test codelens react to change in the codelens setting immediately without the need for moving to another file and back. Fixes [Bug 1172](https://github.com/Microsoft/vscode-go/issues/1172)
    * `$workspaceRoot` will now be resolved when part of `go.testEnvVars` and `go.toolsEnvVars` setting.


### Improvements around Packages
* [Nuruddin Ashr (@uudashr)](https://github.com/uudashr)
    * `Go: Browse Packages` command will now include newly installed/built packages without the need for reloading VS Code.
* [Hugo (@juicemia)](https://github.com/juicemia)
    * A new command `Go: Get Package` is introduced to run `go get` on the package in the import statement under the cursor. [PR 1222](https://github.com/Microsoft/vscode-go/pull/1222)

## 0.6.65 - 6th September, 2017

[Seonggi Yang (@sgyang)](https://github.com/sgyang)
* [Bug #1152](https://github.com/Microsoft/vscode-go/issues/1152): Auto completions for unimported packages do not work anymore on certain machines. [PR 1197](https://github.com/Microsoft/vscode-go/pull/1197)

[Ramya Rao (@ramya-rao-a)](https://github.com/ramya-rao-a)
* [Bug #1194](https://github.com/Microsoft/vscode-go/issues/1194) and [Bug #1196](https://github.com/Microsoft/vscode-go/issues/1196): Debugger doesnt use GOPATH from env in debug configuration
* Go to implementation cmd doesnt show up when using the language server.

## 0.6.64 - 5th September, 2017

* [Dan Mace (@ironcladlou)](https://github.com/ironcladlou), [Vincent Chinedu Okonkwo (@codmajik)](https://github.com/codmajik) & [Dima (@hummerd)](https://github.com/hummerd)
    * Support for the `Go To Implementation` command on interfaces. [Feature Request #771](https://github.com/Microsoft/vscode-go/issues/771).
* [Craig-Stone (@Craig-Stone)](https://github.com/Craig-Stone)
    * Normalize program path in Windows which otherwise prevented breakpoints from being set correctly when remote debugging. [PR 1131](https://github.com/Microsoft/vscode-go/pull/1131)
* [Marwan Sulaiman (@marwan-at-work)](https://github.com/marwan-at-work)
    * Refactor the code behind `Go: Browse Packages` to make browsing selected package faster. [PR 1136](https://github.com/Microsoft/vscode-go/pull/1136)
* [Thomas Darimont (@thomasdarimont)](https://github.com/thomasdarimont)
    * A new snippet called `helloweb` that generates a web app with an http endpoint returning a greeting and current time. [PR 1113](https://github.com/Microsoft/vscode-go/pull/1113)
* [Nuruddin Ashr (@uudashr)](https://github.com/uudashr)
    * Refactor the way test output is shown to show output of `log.Println`. Fixes [Issue #1120](https://github.com/Microsoft/vscode-go/issues/1120) with [PR 1124](https://github.com/Microsoft/vscode-go/pull/1124)
* [Ramya Rao (@ramya-rao-a)](https://github.com/ramya-rao-a)
    * Test Improvements
        * Show test coverage after the command `Go: Test Package` is run. You can disable this by setting `go.coverOnTestPackage` to `false`.
        * Show test coverage even if files are outside of GOPATH. Fixes [Issue #1122](https://github.com/Microsoft/vscode-go/issues/1122)
        * Decouple running test coverage on save from running build/lint/test on save. Fixes the issue where the problems view was not getting updated until `go.coverOnSave` was disabled.
    * Debugging Improvements
        * No need to set GOPATH in debug configuration in the `launch.json` file anymore. When no GOPATH is provided this way, the debug adapter will now infer the GOPATH based on the path of the file/package being debugged. This fixes [Issue #840](https://github.com/Microsoft/vscode-go/issues/840).
        * The debug code lens will now honor the `go.buildFlags`, `go.buildTags` and `go.testFlags` settings. Fixes [Issue #1117](https://github.com/Microsoft/vscode-go/issues/1117)
        * Fix issue with stepping over standard library code when remote debugging in Windows. Fixes [Issue #1178](https://github.com/Microsoft/vscode-go/issues/1178)
    * Other Bug Fixes
        * Fix the extra text being selected at the end of formatting run on save. Fixes [Issue #899](https://github.com/Microsoft/vscode-go/issues/899) and [Issue #1096](https://github.com/Microsoft/vscode-go/issues/1096).
        * `gometalinter` and `dlv` will honor the `go.toolsGopath` setting. Fixes [Issue #1110](https://github.com/Microsoft/vscode-go/issues/1110)
        * Skip vendor folders from lint and vet results. Fixes [Issue #1119](https://github.com/Microsoft/vscode-go/issues/1119) and [Issue #1121](https://github.com/Microsoft/vscode-go/issues/1121)
    

## 0.6.63 - 26th July, 2017

### Features
    
* [Ian Chiles (@fortytw2)](https://github.com/fortytw2)
    * Option to use [megacheck](https://github.com/dominikh/go-tools/tree/master/cmd/megacheck) as a linting tool which 
can have significantly better performance than `gometalinter`, while only supporting a subset of the tools. Use the setting `go.lintTool` to try this.
* [alexandrevez (@alexandrevez)](https://github.com/alexandrevez)
    * Option to highlight gutters rather than full text for code coverage. Use the new setting `go.coverageDecorator` to try this.
* [Ramya Rao (@ramya-rao-a)](https://github.com/ramya-rao-a) & [Marwan Sulaiman (@marwan-at-work)](https://github.com/marwan-at-work)
    * Browse packages and go files with new command `Go: Browse Packages`. [Feature Request 330](https://github.com/Microsoft/vscode-go/issues/330)
         - If cursor is on an import statement, then files from the imported package will be shown in the quick pick control
         - Else, all packages are shown in the quick pick control. Select any and corresponding Go files will be shown next.
         - Selecting any of the Go files, will open the file in a new editor.
* [Saud Khan (@bidrohi)](https://github.com/bidrohi)
    * Print import paths of Go tools as they get installed. [PR 1032](https://github.com/Microsoft/vscode-go/pull/1032)
* [Ramya Rao (@ramya-rao-a)](https://github.com/ramya-rao-a) 
    * Prompt to update dependent Go tools when there is a change in the Go version. [Feature Request 797](https://github.com/Microsoft/vscode-go/issues/797)
    * Better user experience when dependent Go tools are missing. [Feature Request 998](https://github.com/Microsoft/vscode-go/issues/998)
         - Prompts will only show up for tools that are used for features that are explicitly executed by the user. Eg: Rename, Generate Unit Tests, Modify tags. And not for features that get triggered behind the scenes like linting, hover or format on save.
         - When the prompts do show up, closing them will ensure that they wont show up for the duration of the current session of VS Code.

### Bug Fixes

* [llife0915 (@llife0915)](https://github.com/llife0915)
    * Fix for issue when unverified breakpoints appeear when creating/deleting breakpoints once debugging starts in Windows.
* [Roman Peshkov (@rpeshkov)](https://github.com/rpeshkov)
    * Expand file names to file paths in test output for subtests. [Bug 1049](https://github.com/Microsoft/vscode-go/issues/1049)
* [Guilherme Oenning (@goenning)](https://github.com/goenning)
    * Pass GOPATH to debug adapter when debugging tests via codelens. [Bug 1057](https://github.com/Microsoft/vscode-go/issues/1057)
* [Nuruddin Ashr (@uudashr)](https://github.com/uudashr)
    * Skip testing vendor folders when using the command `Go: Test all Packages in Workspace`
* [Ramya Rao (@ramya-rao-a)](https://github.com/ramya-rao-a)
    * Start without debugging should fallback to debug mode when configured program is not a file. [Bug 1084](https://github.com/Microsoft/vscode-go/issues/1084)
    * Fix for incorrect package name during autocomplete of unimported packages when package name is not the same as the last part of the import path. [Bug 647](https://github.com/Microsoft/vscode-go/issues/647)
    * Skip building vendor folders when `go.buildOnSave` is set to `workspace`. [Bug 1060](https://github.com/Microsoft/vscode-go/issues/1060)
    * Honor `go.buildTags` when using `gogetdoc`. [Bug 1024](https://github.com/Microsoft/vscode-go/issues/1024)
    * Fix build failure when `-i` is passed as a build flag. [Bug 1064](https://github.com/Microsoft/vscode-go/issues/1064)
    * Fix vet failure when any flag is passed. [Bug 1073](https://github.com/Microsoft/vscode-go/issues/1073)
    * Better formatting in import blocks when imports get added during auto-completion or when `Go: Add Import` command is used. [Bug 1056](https://github.com/Microsoft/vscode-go/issues/1056)
    * `Go: Generate Interface Stubs` should work when interface is prefixed with package path


## 0.6.62 - 9th June, 2017

### Features
* [Jamie Stackhouse (@itsjamie)](https://github.com/itsjamie)
   * New command `Go: Generate interface stub` to generate stubs that implement given interface using [impl](https://github.com/josharian/impl). [PR 939](https://github.com/Microsoft/vscode-go/pull/939)
        - When the command is run, you are prompted to provide interface name. Eg: `f *File io.Closer`
        - The stubs are then generated where the cursor is in the editor.
* [Guilherme Oenning (@goenning)](https://github.com/goenning)
    * New setting `go.testEnvFile` to configure the location of a file that would have environment variables to use while running tests. [PR 971](https://github.com/Microsoft/vscode-go/pull/971)
        - File contents should be of the form `key=value`.
        - Values from the existing setting `go.test.EnvVars` will override the above
        - These environment variables will also be used by the "Debug Test" codelens
        - When debugging using the debug viewlet or pressing `F5`, the above will not be used. Continue to use the `env` and/or `envFile` property in the debug configurations in the `launch.json` file.
* [Ole (@vapourismo)](https://github.com/vapourismo)
    * You can now run build/lint/vet on the whole workspace instead of just the current package on file save. [PR 1023](https://github.com/Microsoft/vscode-go/pull/1023)
        - To enable this, the settings `go.buildOnSave`, `go.lintOnSave` and `go.vetOnSave` now take values `package`, `workspace` or `off` instead of the previous `true`/`false`. 
        - These features are backward compatible and so if you are still using `true`/`false` for these settings, they will work as they did before, but you will get a warning in your settings file.
* [Ramya Rao (@ramya-rao-a)](https://github.com/ramya-rao-a)
    * Better build performance when working on main packages and test files by using the `-i` flag.
    * Better linting experience while running `gometalinter` by using the `--aggregate` flag which aggregates similar errors from multiple linters.

### Bug Fixes
* [Ramya Rao (@ramya-rao-a)](https://github.com/ramya-rao-a)
    * Fix for [Bug 968](https://github.com/Microsoft/vscode-go/issues/968) where rename fails if `---` is anywhere in the file
    * Fix for [Bug 981](https://github.com/Microsoft/vscode-go/issues/981) where `Go: Test Function At Cursor` fails.
    * Fix for [Bug 983](https://github.com/Microsoft/vscode-go/issues/983) where the Go binary is not found in MSYS2 as it is not located in GOROOT.
    * Fix for [Bug 1022](https://github.com/Microsoft/vscode-go/issues/1002) where snippets from function auto complete do not insert the placeholders
    * Fix for [Bug 962](https://github.com/Microsoft/vscode-go/issues/962) where references codelens wouldnt work for methods.
* [F0zi (@f0zi)](https://github.com/f0zi)
    * Fix for [Bug 1009](https://github.com/Microsoft/vscode-go/issues/1009) where remote debugging fails to verify breakpoint if GOPATH partially matches remote GOPATH
* [Anton Kryukov (@Emreu)](https://github.com/Emreu)
    * Use the `go.testEnvVars` while debugging tests using codelens

## 0.6.61 - 4th May, 2017
* [Ramya Rao (@ramya-rao-a)](https://github.com/ramya-rao-a)
    * Fix for [Bug 963](https://github.com/Microsoft/vscode-go/issues/963) Fix for perf issues when references codelens is enabled. [Commit 352435a](https://github.com/Microsoft/vscode-go/commit/352435ab0e6846b7483958a90f61fb94329dd0ae)
    * Fix for [Bug 964](https://github.com/Microsoft/vscode-go/issues/964) The setting `go.referencesCodeLens.enabled` is deprecated in favor of `go.enableCodeLens` to control multiple types of codelens.
        ```json
        "go.enableCodeLens": {
            "references": false,
            "runtest": true
        }
        ```

## 0.6.60 - 3rd May, 2017

### Codelens for references, to run and debug tests
* [theSoenke (@theSoenke)](https://github.com/theSoenke)
    * [Feature Request 726](https://github.com/Microsoft/vscode-go/issues/726): Display Reference count above functions using codelens. On clicking, the references are shown just like the `Find All References` command. [PR 933](https://github.com/Microsoft/vscode-go/pull/933) and [PR 938](https://github.com/Microsoft/vscode-go/pull/938). You can disable this by updating the setting `go.referencesCodeLens.enabled`.
* [Guilherme Oenning (@goenning)](https://github.com/goenning)
    * Use Codelens to run each test function, tests in the file and tests in the package. [PR 937](https://github.com/Microsoft/vscode-go/pull/937)
* [Ramya Rao (@ramya-rao-a)](https://github.com/ramya-rao-a)
    * [Feature Request 879](https://github.com/Microsoft/vscode-go/issues/879): Use Codelens to debug a test function. [Commit 5b1ced7](https://github.com/Microsoft/vscode-go/commit/5b1ced78cc06016d24539099aa164fe170fa7267)

### Test Coverage
* [Thomas Bradford (@kode4food)](https://github.com/kode4food)
    * New setting `go.coverageOptions` to control whether you want to highlight only covered code or only uncovered code or both when code coverage is run. [PR 945](https://github.com/Microsoft/vscode-go/pull/945)
* [Ramya Rao (@ramya-rao-a)](https://github.com/ramya-rao-a)
    * The command `Go: Test Coverage In Current Package` is renamed to `Go: Toggle Test Coverage In Current Package` and it does exactly what the name suggests. Toggles test coverage. [Commit cc661daf](https://github.com/Microsoft/vscode-go/commit/cc661dafd06770137459b72441e5f7cc877483f0)
        
### Bug Fixes 
* [Ramya Rao (@ramya-rao-a)](https://github.com/ramya-rao-a)
    * Fix for [Bug 529](https://github.com/Microsoft/vscode-go/issues/529) Code completion for unimported packages now works on unsaved file after deleting imports.
    * Fix for [Bug 922](https://github.com/Microsoft/vscode-go/issues/922) Go to Symbol in File feature now includes symbols from unsaved file contents. [PR 929](https://github.com/Microsoft/vscode-go/pull/929)
    * Fix for [Bug 878](https://github.com/Microsoft/vscode-go/issues/878) Debugging now works on current file even when there is no folder/workspace open. [Commit 42646afc](https://github.com/Microsoft/vscode-go/commit/42646afc2d2442b5e962d3125a7cbf61b98b2a0a)
    * Fix for [Bug 947](https://github.com/Microsoft/vscode-go/issues/947) Mac users using the latest delve from master may see that all env variables are empty while debugging their code. This is due to delve using the `--backend=lldb` option in Mac by default. You can now change this default value by setting the `backend` property to `native` in the `launch.json` file. [Commit 4beecf1](https://github.com/Microsoft/vscode-go/commit/4beecf1db2aaa18b336be2ee64476b56202fc959). Root cause is expected to be fixed in delve itself and is being tracked in [derekparker/delve/818](https://github.com/derekparker/delve/issues/818)
* [Tyler Bunnell (@tylerb)](https://github.com/tylerb)
    * Fix for [Bug 943](https://github.com/Microsoft/vscode-go/issues/943) Live error reporting now works across multiple files in the current package, mapping errors to the correct files. [PR 923](https://github.com/Microsoft/vscode-go/pull/923)
* [Guilherme Oenning (@goenning)](https://github.com/goenning)
    * Fix for [Bug 934](https://github.com/Microsoft/vscode-go/issues/934) Environment variables from `envFile` attribute in the launch.json file is used while debugging and is overridden only by the ones in the `env` attribute. [PR 935](https://github.com/Microsoft/vscode-go/pull/935)

### Others
* [Luka Zakrajšek (@bancek)](https://github.com/bancek) and [Ramya Rao (@ramya-rao-a)](https://github.com/ramya-rao-a)
    * New setting `go.toolsEnvVars` where you can specify env vars to be used by the Go tools that are used in the Go extension. [PR 932](https://github.com/Microsoft/vscode-go/pull/932) and [commit bca4dd5f](https://github.com/Microsoft/vscode-go/commit/bca4dd5f31f32ac49da79580c07b4000f06287a3). This fixes [Bug 632](https://github.com/Microsoft/vscode-go/issues/632) as well.
* [Paweł Słomka (@slomek)](https://github.com/slomek)
    * New snippet for writing table driven tests. [PR 952](https://github.com/Microsoft/vscode-go/pull/952)


## 0.6.59 - 4th April, 2017

* [Tyler Bunnell (@tylerb)](https://github.com/tylerb)
    * Add live error feedback using `gotype-live` which is `gotype` with support for unsaved file contents. [PR 903](https://github.com/Microsoft/vscode-go/pull/903)
        * New setting `go.liveErrors` controls this feature. 
        * Set `"go.liveErrors": { "enabled": true }` to enable this feature
        * Edit the delay property in `"go.liveErrors": { "enabled": true, "delay": 500 }` to update the delay (in milliseconds) after which `gotype-live` would be run post a keystroke

* [Eon S. Jeon (@esjeon)](https://github.com/esjeon)
    * GOPATH from settings is now honored when users debug current file without having a `launch.json` file. [PR 904](https://github.com/Microsoft/vscode-go/pull/904)
        * Note: Once you have a `launch.json` file, GOPATH from settings wont be read. You will need to set it in the `env` property as before

* [Ramya Rao (@ramya-rao-a)](https://github.com/ramya-rao-a)
    * `--config` flag for `gometalinter` now supports the use of `${workspaceRoot}` and `~` that allows users to provide config file path relative to workspace or home directory respectively. [PR 909](https://github.com/Microsoft/vscode-go/pull/903)
    * New command `Go: Test All Packages in Workspace` to run tests from all packages in the workspace.

## 0.6.57 - 30th March, 2017
Fix for [Bug 892](https://github.com/Microsoft/vscode-go/issues/892) which breaks build when the user has multiple GOPATHs and the Go project being worked on is not the first one among the multiple GOPATHs. [Commit d417fd6](https://github.com/Microsoft/vscode-go/commit/d417fd6725077d1233fb1bcd3aa5d097d02715a9)

## 0.6.56 - 29th March, 2017

### Editing improvements
* [Ramya Rao (@ramya-rao-a)](https://github.com/ramya-rao-a)
    * Use [gomodifytags](https://github.com/fatih/gomodifytags) to add/remove tags on selected struct fields. [PR 880](https://github.com/Microsoft/vscode-go/pull/880)
         * If there is no selection, then the whole struct under the cursor will be selected for the tag modification.
         * `Go: Add Tags` command adds tags configured in `go.addTags` setting to selected struct fields. By default, `json` tags are added. Examples:
             * To add `xml` tags, set `go.addTags` to `{"tags": "xml"}` 
             * To add `xml` with `cdata` option, set `go.addTags` to `{"tags": "xml", "options": "xml=cdata"}`  
             * To add both `json` and `xml` tags, set `go.addTags` to `{"tags": "json,xml"}` 
         * `Go: Remove Tags` command removes tags configured in `go.removeTags` setting from selected struct fields. 
             * By default, all tags are removed. 
             * To remove only say `xml` tags, set `go.removeTags` to `{"tags": "xml"}` 
         * To be prompted for tags instead of using the configured ones, set `go.addTags` and/or `go.removeTags` to `{"promptForTags": true}`
    * Fix rename issue when `diff` tool from Git or Cygwin are in the `PATH` in Windows. [PR 866](https://github.com/Microsoft/vscode-go/pull/866)
    * Keywords are now supported in completion suggestions. [PR 865](https://github.com/Microsoft/vscode-go/pull/865)
    * Suggestion items to import packages disabled in single line import statements and the line with package definition where they do not make sense. [PR 860](https://github.com/Microsoft/vscode-go/pull/860)

### Debugging improvements
* [Ramya Rao (@ramya-rao-a)](https://github.com/ramya-rao-a)
    * Support to build and run your Go file.  [PR 881](https://github.com/Microsoft/vscode-go/pull/881)
        * Press `Ctrl+F5` or run the command `Debug: Start Without Debugging` to run using the currently selected launch configuration.
        * If you don't have a `launch.json` file, then the current file will be run.
        * Supported only for launch configs with `type` as `debug` and `program` that points to a Go file and not package
    * New `envFile` attribute in `launch.json` where you can provide a file with env variables to use while debugging. [PR 849](https://github.com/Microsoft/vscode-go/pull/849)
    * Use current file's directory instead of folder opened in VS Code to debug in the default configurations. [Commit 0915e50a](https://github.com/Microsoft/vscode-go/commit/0915e50a1ada5c74742d9c4ce7f265b5e273ca31)

### Tooling improvements
* [Ramya Rao (@ramya-rao-a)](https://github.com/ramya-rao-a)
    * New Setting `go.languageServerFlags` that will be passed while running the Go language server. [PR 882](https://github.com/Microsoft/vscode-go/pull/882)
        * Set this to `["trace"]` to see the traces from the language server in the output pane under the channel "go-langserver"
        * Set this to `["trace", "logfile", "path to a text file to log the trace]` to log the traces and errors from the language server to a file.
    * `Go: Install Tools` command now installs delve as well in Linux and Windows, but not in Mac OSX. [Commit 30ea096](https://github.com/Microsoft/vscode-go/commit/30ea0960d6f773cc2e8e18ba5113960d1f5faf08) Fixes [Bug 874](https://github.com/Microsoft/vscode-go/issues/874)
* [netroby @netroby](https://github.com/netroby)
    * `Go: Install Tools` command now installs `godoc`. [PR 854](https://github.com/Microsoft/vscode-go/pull/854)

### Others
* [Ramya Rao (@ramya-rao-a)](https://github.com/ramya-rao-a)
    * Use `GOPATH` as defined by the `go env` output as default. Use `go` binary from default platform specific locations when GOROOT is not set as env variable. Fixes [Bug 873](https://github.com/Microsoft/vscode-go/issues/873)
    * Fix compiling errors for vendor packages in case of symlinks. [PR 864](https://github.com/Microsoft/vscode-go/pull/864)
    * Support links in the test output, which then navigates the user to the right line of the test file where tests are failing. [PR 885](https://github.com/Microsoft/vscode-go/pull/885)
    * Experimental new setting `go.editorContextMenuCommands` to control which commands show up in the editor context menu.
* [Albert Callarisa (@acroca)](https://github.com/acroca) and [Ramya Rao (@ramya-rao-a)](https://github.com/ramya-rao-a)
    * New setting `go.gotoSymbol.ignoreFolders` that allows to ignore folders while using the "Go to Symbol in Workspace" feature. This takes in an array of folder names (not paths). Best used to ignore vendor folders while doing a workspace symbol search. [PR 795](https://github.com/Microsoft/vscode-go/pull/795)
    
## 0.6.55 - 3rd March, 2017
* Re-publishing the extension from a non Windows machine as the fix for [Bug 438](https://github.com/Microsoft/vscode-go/issues/438) worked only on Windows machines.
For details read the discussion in [PR 838](https://github.com/Microsoft/vscode-go/pull/838).

## 0.6.54 - 28th February, 2017

### Tooling improvements
* [Ramya Rao (@ramya-rao-a)](https://github.com/ramya-rao-a) and [Sourcegraph](https://github.com/sourcegraph/go-langserver)
    * A new setting `go.useLanguageServer` to use the Go language server from [Sourcegraph](https://github.com/sourcegraph/go-langserver) for features like Hover, Definition, Find All References, Signature Help, Go to Symbol in File and Workspace. [PR 750](https://github.com/Microsoft/vscode-go/pull/750)
        * This is an experimental feature and is not available in Windows yet.
        * If set to true, you will be prompted to install the Go language server. Once installed, you will have to reload VS Code window.
        The language server will then be run by the Go extension in the background to provide services needed for the above mentioned features.

### GOPATH improvements
* [Ramya Rao (@ramya-rao-a)](https://github.com/ramya-rao-a)
    * Fix for [Bug 623](https://github.com/Microsoft/vscode-go/issues/623). `${workspaceRoot}` and `~` are now supported in `go.gopath` and `go.toolsGopath` settings. [PR 768](https://github.com/Microsoft/vscode-go/pull/768)
    * The default GOPATH used by Go 1.8 when none is set as environment variable is now supported by the extension as well. [PR 820](https://github.com/Microsoft/vscode-go/pull/820)
* [Vincent Chinedu Okonkwo (@codmajik)](https://github.com/codmajik)
    * Added new setting `go.inferGopath`. When `true` GOPATH will be inferred from the path of the folder opened in VS Code.
    This will override the value from `go.gopath` setting as well as the GOPATH environment variable. [PR 762](https://github.com/Microsoft/vscode-go/pull/762)

### Debugging improvements
* [Ramya Rao (@ramya-rao-a)](https://github.com/ramya-rao-a)
    * Debug current file without a launch configuration file. Simply press `F5` to start the debug session. 
    A `launch.json` is still required to debug tests or for advanced debug configurations. [PR 769](https://github.com/Microsoft/vscode-go/pull/769)
    * Launch configuration snippets are now available for common scenarios like debugging file/package or debugging a test package/function.
    These snippets can be used through IntelliSense when editing the `launch.json` file. [PR 794](https://github.com/Microsoft/vscode-go/pull/794)
    * Fix for [Bug 492](https://github.com/Microsoft/vscode-go/issues/492). Now when there are build errors, starting a debug session will display the error instead of hanging. [PR 774](https://github.com/Microsoft/vscode-go/pull/774)
* [Rob Lourens (@roblourens)](https://github.com/roblourens)
    * Fix for [Bug 438](https://github.com/Microsoft/vscode-go/issues/438). Now when you stop a debug session, all processes started by the session will be closed as well. [PR 765](https://github.com/Microsoft/vscode-go/pull/765)
* [Suraj Barkale (@surajbarkale-dolby)](https://github.com/surajbarkale-dolby)
    * Fix for [Bug 782](https://github.com/Microsoft/vscode-go/issues/782). Helpful error messages when the `program` attribute in `launch.json` file is invalid or not a full path. [PR 790](https://github.com/Microsoft/vscode-go/pull/790)
* [F0zi (@f0zi)](https://github.com/f0zi)
    * Fix for [Bug 689](https://github.com/Microsoft/vscode-go/issues/689). When debugging against a remote machine, paths anywhere under the GOPATH will be correctly mapped so you can set breakpoints in them. 
    Previously only paths next to the program could be debugged. [PR 742](https://github.com/Microsoft/vscode-go/pull/742)

### Testing improvements
* [Oleg Bulatov (@dmage)](https://github.com/dmage)
    * Added new setting `go.testOnSave`. When `true`, all tests in the current package will be run on saving a Go file. 
    The status of the tests will be shown in the status bar at the bottom of the VS Code window. It is not advised to have this on when you have Auto Save enabled. [PR 810](https://github.com/Microsoft/vscode-go/pull/810)
* [Jeff Willette (@deltaskelta)](https://github.com/deltaskelta)
    * Test output is no longer verbose by default. Add `-v` to the `go.testFlags` to get verbose output. [PR 817](https://github.com/Microsoft/vscode-go/pull/817)
    
### Other Bug Fixes
* [Richard Musiol (@neelance)](https://github.com/neelance)
    * Fix offset for files with multibyte characters so that features like Hover and Go To Definition work as expected. [PR 780](https://github.com/Microsoft/vscode-go/pull/780)
* [Ramya Rao (@ramya-rao-a)](https://github.com/ramya-rao-a)
    * Fix for [Bug 777](https://github.com/Microsoft/vscode-go/issues/777) Less disruptive experience during test failures when `go.coveronSave` is `true`.
    * Fix for [Bug 680](https://github.com/Microsoft/vscode-go/issues/680) Reduce noise in Go to Symbol in File feature by removing the entries corresponding to import statements. [PR 775](https://github.com/Microsoft/vscode-go/pull/775)


## 0.6.53 - 30th January, 2017

### Installation improvements
* [Sam Herrmann (@samherrmann)](https://github.com/samherrmann), [Ramya Rao (@ramya-rao-a)](https://github.com/ramya-rao-a)
    *  A new setting `go.toolsGopath` for providing an alternate location to install all the Go tools that the extension depends on, if you don't want them cluttering your GOPATH. [PR 351](https://github.com/Microsoft/vscode-go/pull/351) and [PR 737](https://github.com/Microsoft/vscode-go/pull/737).
        * This is useful when you work on different GOPATHs.
        * Remember to run `Go: Install Tools` command to install the tools to the new location.
* [Ramya Rao (@ramya-rao-a)](https://github.com/ramya-rao-a)
    * All the "Install tool" options (the pop ups you see) and the `Go: Install Tools` command now support `gometalinter` if it is your chosen linting tool. [PR 735](https://github.com/Microsoft/vscode-go/pull/735).
        * Since `gometalinter` internally installs linters and expects them to be in the user's GOPATH, `gometalinter` will get installed to your GOPATH and not the alternate location specified in `go.toolsGopath`

### Build improvements
* [Matt Aimonetti (@mattetti)](https://github.com/mattetti)
    * While building, we now use the `-i` flag (for non main packages) which installs dependent packages, which in turn get used in subsequent builds resulting in faster builds in bigger workspaces. [PR 718](https://github.com/Microsoft/vscode-go/pull/718)
* [Ramya Rao (@ramya-rao-a)](https://github.com/ramya-rao-a)
    * Build errors with no line numbers (for eg. Import cycle) are now displayed in the output window and will be mapped to the first line of the file. [PR 740](https://github.com/Microsoft/vscode-go/pull/740)

### Test improvements
* [Ramya Rao (@ramya-rao-a)](https://github.com/ramya-rao-a)
    * A new setting `go.testFlags` that can be used to run tests. If null, `go.buildFlags` will be used. [PR 482](https://github.com/Microsoft/vscode-go/pull/482)
    * Customize flags for each of the test command by using different keybindings. [PR 482](https://github.com/Microsoft/vscode-go/pull/482). In the below example, `ctrl+shift+t` is bound to run the tests in current file with `-short` flag. The commands here can be `go.test.package`, `go.test.file` or `go.test.cursor`.
	
        ```json
        {
            "key": "ctrl+shift+t",
            "command": "go.test.file",
            "args": {
                "flags": ["-short"]
            },
            "when": "editorTextFocus"
        }
        ```
    * New toggle command `Go: Toggle Test File` that lets you toggle between your Go file and the corresponding test file. Previous commands `Go: Open Test File` and `Go: Open Implementation For Test File` have been deprecated in favor of this new command. [PR 739](https://github.com/Microsoft/vscode-go/pull/739). You can add a keyboard binding to this as below:
	
        ```json
        {
            "key": "ctrl+shift+t",
            "command": "go.toggle.test.file",
            "when": "editorTextFocus && editorLangId == 'go'"
        }
        ```
    * If current file is not a test file, show error message while running test commands, instead of displaying success message. Fixes [#303](https://github.com/Microsoft/vscode-go/issues/303)
* [Marcel Voigt (@nochso)](https://github.com/nochso)
   * Show error message in output window when running test coverage fails. [PR 721](https://github.com/Microsoft/vscode-go/pull/721)

### Debugging improvements
* [Andreas Kuhn (@ankon)](https://github.com/ankon)
   * Honor the `cwd` launch configuration argument. [PR 714](https://github.com/Microsoft/vscode-go/pull/714)
* [Ramya Rao (@ramya-rao-a)](https://github.com/ramya-rao-a)
   * GOPATH set in the `env` property in `launch.json` will also be used to find `dlv` tool. [PR 725](https://github.com/Microsoft/vscode-go/pull/725).
* [Rob Lourens (@roblourens)](https://github.com/roblourens)
   * New property `trace` in `launch.json` to provide option to have verbose logging while debugging using vscode-debug-logger. [PR 753](https://github.com/Microsoft/vscode-go/pull/753). This will help in diagnosing issues with debugging in the Go extension.


## 0.6.52 - 5th January, 2017
* [Yuwei Ba (@ibigbug)](https://github.com/ibigbug)
    * Use `http.proxy` setting while installing Go tools. [PR 639](https://github.com/Microsoft/vscode-go/pull/639)
* [chronos (@bylevel)](https://github.com/bylevel)
    * Bug [#465](https://github.com/Microsoft/vscode-go/issues/465) Fix file outline when non English comments in file. [PR 699](https://github.com/Microsoft/vscode-go/pull/699)
* [Ramya Rao (@ramya-rao-a)](https://github.com/ramya-rao-a)
    * Implement Step Out in debgging [Commit 6d0f440](https://github.com/Microsoft/vscode-go/commit/6d0f4405330efb789c16a01434cf096f0f9fb29c)
    * Improve performance by reducing number of calls to `godoc`, `godef`, `gogetdoc`. [PR 711](https://github.com/Microsoft/vscode-go/pull/711)
    * Default value for `go.autocompleteUnimportedPackages` is now false to reduce noise in the suggestion list. Members of unimported packages will still show up in suggestion list after typing dot after package name.

## 0.6.51 - 29th November, 2016
* [Jimmy Kuu (@jimmykuu)](https://github.com/jimmykuu)
    *  Remove blank space in the end of code snippet on function suggest. [PR 628](https://github.com/Microsoft/vscode-go/pull/628)
* [Ahmed W. (@OneofOne)](https://github.com/OneOfOne)
    *  Remove the multiple -d flags in formatting. [PR 644](https://github.com/Microsoft/vscode-go/pull/644)
* [Paweł Kowalak (@viru)](https://github.com/viru)
    *  Snippet for Benchmark Test function. [PR 648](https://github.com/Microsoft/vscode-go/pull/648)
* [Alberto García Hierro (@fiam)](https://github.com/fiam)
    *  Fix Go To Definition, Hover and Signature Help when using Go from tip. [PR 655](https://github.com/Microsoft/vscode-go/pull/655)
* [Cedric Lamoriniere (@cedriclam)](https://github.com/cedriclam)
    *  Fix Generate Test for Current function when the function is a method on a type. [PR 657](https://github.com/Microsoft/vscode-go/pull/657)
* [Potter Dai (@PotterDai)](https://github.com/PotterDai)
    *  Fix Find all References when using multiple GOPATH where one is the substring of the other. [PR 658](https://github.com/Microsoft/vscode-go/pull/658)
* [Ramya Rao (@ramya-rao-a)](https://github.com/ramya-rao-a)
    *  Fix autocomplete of unimported versioned packages from gopkg.in [PR 659](https://github.com/Microsoft/vscode-go/pull/659)
    *  Use relative path for vendor packages when the vendor folder is right under $GOPATH/src as well. [PR 660](https://github.com/Microsoft/vscode-go/pull/660)
    *  Fix autocomplete when working with large data. [Bug 640](https://github.com/issues/640). [PR 661](https://github.com/Microsoft/vscode-go/pull/661)

## 0.6.50 - 21st November, 2016
* [lixiaohui (@leaxoy)](https://github.com/leaxoy), [Arnaud Barisain-Monrose (@abarisain)](https://github.com/abarisain), [Zac Bergquist (@zmb3)](https://github.com/zmb3) and [Ramya Rao (@ramya-rao-a)](https://github.com/ramya-rao-a)
    * Added option to use `gogetdoc` for Goto Definition , Hover and Signature Help features. [PR 622](https://github.com/Microsoft/vscode-go/pull/622) To use this, add a setting `"go.docstool": "gogetdoc"` to your settings and reload/restart VS Code. This fixes the below bugs
         * [#440](https://github.com/Microsoft/vscode-go/issues/440) Hover info does not show doc string for structs
         * [#442](https://github.com/Microsoft/vscode-go/issues/442) Goto Definition, Hover, Signature Help do not work for `net` package
         * [#496](https://github.com/Microsoft/vscode-go/issues/496) Goto Definition, Hover, Signature Help do not work for Dot imported functions
         * [#515](https://github.com/Microsoft/vscode-go/issues/515) Go to definition and type info doesn't work with mux.Vars or anything else from gorilla/mux
         * [#567](https://github.com/Microsoft/vscode-go/issues/567) Signature Help and Quick Info do not show function comments for unexported functions
* [Ramya Rao (@ramya-rao-a)](https://github.com/ramya-rao-a)
    * Revert changes done in the formatting area in 0.6.48 update. Fixes below bugs
         * [#613](https://github.com/Microsoft/vscode-go/issues/613) Format removes imports of vendored packages in use
         * [#630](https://github.com/Microsoft/vscode-go/issues/630) goreturns fails to consider global variables in package

## 0.6.49 - 10th November, 2016
* [Ramya Rao (@ramya-rao-a)](https://github.com/ramya-rao-a)
    * Revert the deprecation of `go.formatOnSave` due to popular demand.

## 0.6.48 - 9th November, 2016
* [Mark LaPerriere (@marklap)](https://github.com/marklap)
    * Snippets for method declaration, main and init functions [PR 602](https://github.com/Microsoft/vscode-go/pull/602)
* [Rob Lourens @roblourens](https://github.com/roblourens)
    * launch.json intellisense to include all "mode" values. Fixes [#574](https://github.com/Microsoft/vscode-go/issues/574)
* [Ramya Rao (@ramya-rao-a)](https://github.com/ramya-rao-a)
    * Support for `editor.formatOnSave` and deprecating `go.formatOnSave` [PR 578](https://github.com/Microsoft/vscode-go/pull/578)
    * Remove deprecated language configuration settings [PR 587](https://github.com/Microsoft/vscode-go/pull/587)
    * Feature Request [432](https://github.com/Microsoft/vscode-go/issues/432): Commands to switch to test file and back.  [PR 590](https://github.com/Microsoft/vscode-go/pull/590). You can add your own shortcuts for these commands.
         * `Go: Open Test File`
         * `Go: Open Implementation for Test File`
    * Navigate to test file after generating unit tests using the `Go: Generate unit tests ...` commands. [PR 610](https://github.com/Microsoft/vscode-go/pull/610)
    * Prompt to set GOPATH if not set already [PR 591](https://github.com/Microsoft/vscode-go/pull/591)
    * Improvements to auto complete
         * [#389](https://github.com/Microsoft/vscode-go/issues/389) Fix issue with autocomplete popping up at the end of a string [PR 586](https://github.com/Microsoft/vscode-go/pull/586)
         * [#598](https://github.com/Microsoft/vscode-go/issues/598) Importable packages in auto complete should appear after rest of the suggestions. [PR 603](https://github.com/Microsoft/vscode-go/pull/603)
         * [#598](https://github.com/Microsoft/vscode-go/issues/598) Importing vendored packages from other Go projects should not be allowed. [PR 605](https://github.com/Microsoft/vscode-go/pull/605)
         * [#598](https://github.com/Microsoft/vscode-go/issues/598) When there is an identifier with same name as an available package, do not show the package in the compeltion list [PR 608](https://github.com/Microsoft/vscode-go/pull/608)
    * Other Bug Fixes
         * [#592](https://github.com/Microsoft/vscode-go/issues/592) Use Go from GOROOT while installing tools [PR 594](https://github.com/Microsoft/vscode-go/pull/594)
         * [#585](https://github.com/Microsoft/vscode-go/issues/585) Use fs.stat instead of fs.exists to avoid mistaking "go" folder as "go" file [PR 595](https://github.com/Microsoft/vscode-go/pull/595)
         * [#563](https://github.com/Microsoft/vscode-go/issues/563) Dont run `gotests` on non Go files [PR 584](https://github.com/Microsoft/vscode-go/pull/584)

## 0.6.47 - 26th October 2016
* [Rob Lourens @roblourens](https://github.com/roblourens)
    * Fix the regression in debugging [PR #576](https://github.com/Microsoft/vscode-go/pull/576)
* [Ramya Rao(@ramya-rao-a)](https://github.com/ramya-rao-a)
    * Preserve focus in editor when running tests [PR #577](https://github.com/Microsoft/vscode-go/pull/577)

## 0.6.46 - 26th October 2016
* [Ramya Rao(@ramya-rao-a)](https://github.com/ramya-rao-a)
    * Fix issues due to missing version when Go is used from source without release tags [PR #549](https://github.com/Microsoft/vscode-go/pull/549)
    * Use -imports-only option in go-outline tool [PR #550](https://github.com/Microsoft/vscode-go/pull/550)
* [Rob Lourens @roblourens](https://github.com/roblourens)
    * Use random port number while debugging [PR #553](https://github.com/Microsoft/vscode-go/pull/553)

## 0.6.45 - 17th October 2016
* [Ramya Rao(@ramya-rao-a)](https://github.com/ramya-rao-a)
    * Better error message when Go is not found [PR #536](https://github.com/Microsoft/vscode-go/pull/536)
	* Add setting to control use of -d flag by the formatting tool [PR #537](https://github.com/Microsoft/vscode-go/pull/537)
	* Replace full path for vendor packages with relative path [PR #491](https://github.com/Microsoft/vscode-go/pull/491)

## 0.6.44 - 12th October 2016
* [Ludwig Valda Vasquez (@bredov)](https://github.com/bredov)
    * New configuration `go.formatFlags` to pass flags to the formatting tool [PR #461](https://github.com/Microsoft/vscode-go/pull/461)
* [Dan Mace (@ironcladlou](https://github.com/ironcladlou)
    * New command to execute the last run test. The command is `Go: Test Previous` [PR #478](https://github.com/Microsoft/vscode-go/pull/478)
    * Send test output to a distinct output channel [PR #499](https://github.com/Microsoft/vscode-go/pull/499)
* [Cedric Lamoriniere (@cedriclam)](https://github.com/cedriclam)
    * New commands to generate unit test skeletons using `gotests` tool. Needs Go 1.6 or higher. [PR #489](https://github.com/Microsoft/vscode-go/pull/489)
       * `Go: Generate unit tests for current file`
       * `Go: Generate unit tests for current function`
       * `Go: Generate unit tests for current package`
* [Ramya Rao (@ramya-rao-a)](https://github.com/ramya-rao-a)
    * New configuration `go.testEnVars` to pass environment variables to Go tests [PR #498](https://github.com/Microsoft/vscode-go/pull/498)
    * Changes made to GOROOT and GOPATH via settings now take effect immediately without requiring to reload/restart VS Code [PR #458](https://github.com/Microsoft/vscode-go/pull/458)
    * Go extension ready to use after installing tools without requiring to reload/restart VS Code [PR #457](https://github.com/Microsoft/vscode-go/pull/457)
    * Enable Undo after Rename. [PR #477](https://github.com/Microsoft/vscode-go/pull/477). Needs `diff` tool which is not available on Windows by default. You can install it from [DiffUtils for Windows](http://gnuwin32.sourceforge.net/packages/diffutils.htm)
    * Autocomplete for functions from unimported packages and for unimported packages themselves. To enable this set  `go.autocompleteUnimportedPackages` to true. [PR #497](https://github.com/Microsoft/vscode-go/pull/497)
    * Do not allow to import already imported packages via the `Go: Add Import` command. [PR #508](https://github.com/Microsoft/vscode-go/pull/508)
    * Suggest `gometalinter` to Go 1.5 users since `golint` dropped support for Go 1.5 [PR #509](https://github.com/Microsoft/vscode-go/pull/509)
    * Fix broken installation for `goimports`. [PR #470](https://github.com/Microsoft/vscode-go/pull/470) and [PR #509](https://github.com/Microsoft/vscode-go/pull/509)
* [Arnaud Barisain-Monrose (@abarisain)](https://github.com/abarisain)
    * Fix broken installation for `goreturns` in Windows. [PR #463](https://github.com/Microsoft/vscode-go/pull/463)

## 0.6.43 - August 2016
* [Matt Aimonetti (@mattetti)](https://github.com/mattetti)
    * New command to install/update all Go tools that the Go extension needs. The command is `Go: Install Tools` [PR #428](https://github.com/Microsoft/vscode-go/pull/428)
* [Ryan Veazey (@ryanz)](https://github.com/ryanvz)
    * Auto-generated launch.json to have `showLog:true`. [PR #412](https://github.com/Microsoft/vscode-go/pull/412)
* [Arnaud Barisain-Monrose (@abarisain)](https://github.com/abarisain)
    * Updates to Extra Info feature: Documentation from `godoc` now appears on hover [PR #424](https://github.com/Microsoft/vscode-go/pull/424)

## 0.6.40-42 - July 2016
* [Sajjad Hashemian (@sijad)](https://github.com/sijad)
    * Option to choose `gometalinter` as tool for linting [PR #294](https://github.com/Microsoft/vscode-go/pull/294)
* [Bartosz Wróblewski (@bawr)](https://github.com/bawr)
    * New configuration `showLog` to toggle the debugging output from `delve` [PR #352](https://github.com/Microsoft/vscode-go/pull/352)
* [benclarkwood (@benclarkwood)](https://github.com/benclarkwood)
    * Better logging while installing tools [PR #375](https://github.com/Microsoft/vscode-go/pull/375)

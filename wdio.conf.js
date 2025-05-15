exports.config = {
    runner: 'local',
    specs: [
        ['./test/**/*.js']
    ],
    exclude: [
    ],
    maxInstances: 10,
    capabilities: [
        {
            'browserName': 'electron',
            'wdio:electronServiceOptions': {
                appBinaryPath: './out/Playful-darwin-x64/Playful.app/Contents/MacOS/Playful',
                env: {
                    TEST_MODE: 'true' // Enable test mode
                }
            },
        },
    ],
    logLevel: 'info',
    bail: 0,
    waitforTimeout: 10000,
    connectionRetryTimeout: 120000,
    connectionRetryCount: 3,
    services: [
        [
            'electron',
        ],
    ],
    framework: 'mocha',
    reporters: ['spec'],

    // Options to be passed to Mocha.
    // See the full list at http://mochajs.org/
    mochaOpts: {
        ui: 'bdd',
        timeout: 60000
    },
}

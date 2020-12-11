module.exports = {
    // clearMocks: true,
    // roots: ['<rootDir>'],
    // verbose: true,
    // // An array of file extensions your modules use
    // // moduleFileExtensions: ['js', 'json', 'jsx'],
    // coveragePathIgnorePatterns: [
    //     '<rootDir>/dist/',
    //     '<rootDir>/node_modules/',
    //     '<rootDir>/docs/',
    //     '<rootDir>/build/'
    // ],
    // testPathIgnorePatterns: [
    //     '<rootDir>/dist/',
    //     '<rootDir>/node_modules/',
    //     '<rootDir>/docs/',
    //     '<rootDir>/build/'
    // ],
    testMatch: [
        '<rootDir>/**/__tests__/**/?(*.)(spec|test)js',
        '<rootDir>/**/?(*.)(spec|test).js'
    ],
    testEnvironment: 'node',
};
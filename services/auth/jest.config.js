const { defaults } = require('jest-config');

/** @type {import('ts-jest/dist/types').InitialOptionsTsJest} */
module.exports = {
    preset: 'ts-jest',
    testEnvironment: 'node',
    verbose: true,
    bail: true,
    // moduleFileExtensions: [...defaults.moduleFileExtensions, 'ts', 'tsx'],
    extensionsToTreatAsEsm: ['.ts'],
    globals: {
        'ts-jest': {
            useESM: true,
        },
    },
    moduleNameMapper: {
        '^(\\.{1,2}/.*)\\.js$': '$1',
    },
    testMatch: [
        '<rootDir>/src/**/__tests__/**/?(*.)(spec|test).ts',
        '<rootDir>/src/**/?(*.)(spec|test).ts',
    ],

};

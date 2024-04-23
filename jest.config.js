module.exports = {
    preset: "ts-jest",
    testEnvironment: "jest-environment-jsdom",
    collectCoverage: false,
    roots: ["<rootDir>/test"],
    clearMocks: true,
    resetMocks: true,
    restoreMocks: true,
};

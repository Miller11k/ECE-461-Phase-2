import { logger } from "./Metrics.js";

/**
 * Asserts that the actual value is equal to the expected value within a threshold.
 * 
 * @param actual - The actual value to compare.
 * @param expected - The expected value to compare against.
 * @param testName - The name of the test (optional).
 * @returns Returns 1 if the assertion passes, otherwise returns 0.
 */
export function ASSERT_EQ(actual: number, expected: number, testName: string = ''): number {
    let threshold = 0.01;

    if (Math.abs(expected - actual) < threshold) {
        logger.debug(`${testName} : Passed :: Expected: ${expected}, Actual: ${actual}`);
        return 1;
    }
    else {
        logger.error(`${testName} : Failed :: Expected: ${expected}, Actual: ${actual}`);
        return 0;
    }
}

/**
 * Asserts that the actual value is near the expected value within a specified threshold.
 * 
 * @param actual - The actual value to compare.
 * @param expected - The expected value.
 * @param threshold - The threshold within which the actual value is considered near the expected value.e * @param testName - The name of the test (optional).
 * @param testName - The name of the test
 * @returns 1 if the assertion passes, 0 otherwise.
 */
export function ASSERT_NEAR(actual: number, expected: number, threshold: number, testName: string = ''): number {
    if (Math.abs(expected - actual) < threshold) {
        logger.debug(`${testName} : Passed :: Expected: ${expected}, Actual: ${actual}`);
        return 1;
    }
    else {
        logger.error(`${testName}: Failed :: Expected: ${expected}, Actual: ${actual}`);
        return 0;
    }
}

/**
 * Asserts that the actual value is less than the expected value with a threshold of 0.005.
 * 
 * @param actual - The actual value to be compared.
 * @param expected - The expected value.
 * @param testName - The name of the test (optional).
 * @returns 1 if the assertion passes, 0 otherwise.
 */
export function ASSERT_LT(actual: number, expected: number, testName: string = ''): number {
    let threshold = 0.005;

    if (actual < (expected + threshold)) {
        logger.debug(`${testName} : Passed :: Expected: ${expected}, Actual: ${actual}`);
        return 1;
    }
    else {
        logger.error(`${testName} : Failed :: Expected: ${expected}, Actual: ${actual}`);
        return 0;
    }
}

/**
 * Asserts that the actual value is greater than the expected value with a given threshold.
 * 
 * @param actual - The actual value to be compared.
 * @param expected - The expected value to be compared against.
 * @param testName - The name of the test (optional).
 * @returns 1 if the assertion passes, 0 otherwise.
 */
export function ASSERT_GT(actual: number, expected: number, testName: string = ''): number {
    let threshold = 0.01;

    if (actual > (expected - threshold)) {
        logger.debug(`${testName} : Passed :: Expected: ${expected}, Actual: ${actual}`);
        return 1;
    }
    else {
        logger.error(`${testName} : Failed :: Expected: ${expected}, Actual: ${actual}`);
        return 0;
    }
}
/*
    Copyright (c) 2024 Winterbloom LLC, Alethea Katherine Flowers
    Published under the standard MIT License.
    Full text available at: https://opensource.org/licenses/MIT
*/

import { defaultReporter, summaryReporter } from "@web/test-runner";
//import { chromeLauncher } from "@web/test-runner-chrome";
import { esbuildPlugin } from "@web/dev-server-esbuild";

// https://modern-web.dev/docs/test-runner/cli-and-configuration/

export default {
    files: "tests/**/*.test.ts",
    nodeResolve: true,
    debugger: true,
    // browsers: [
    //     chromeLauncher({
    //         concurrency: 1,
    //         launchOptions: {
    //             devtools: true,
    //         },
    //     }),
    // ],
    plugins: [
        esbuildPlugin({
            ts: true,
            loaders: {
                ".js": "ts",
                ".css": "text",
            },
        }),
    ],
    reporters: [
        defaultReporter({ reportTestResults: true, reportTestProgress: true }),
        summaryReporter(),
    ],
    testFramework: {
        config: {
            ui: "tdd",
        },
    },
};

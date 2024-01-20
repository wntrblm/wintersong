/*
    Copyright (c) 2023 Opulo, Inc
    Published under the Mozilla Public License
    Full text available at: https://www.mozilla.org/en-US/MPL/
*/

import { bundle } from "./bundle.js";

let { options, context } = await bundle({
    outfile: "www/dist/winter.js",
    sourcemap: true,
});

await context.watch();

let { host, port } = await context.serve({
    servedir: "./www",
});

console.log(`Watching and building to ${options.outfile}`);
console.log(`Serving at http://${host}:${port}`);

/**
 * Agent driver: emit one JSON line per pending mcp-single file.
 * Agent calls graphql_mutation with {query, variables} from each line.
 */
const fs = require("fs");
const path = require("path");
const { execFileSync } = require("child_process");

const lines = execFileSync("node", [path.join(__dirname, "_run-mcp-singles-from-disk.js")], {
  encoding: "utf8",
  maxBuffer: 50 * 1024 * 1024,
})
  .trim()
  .split(/\r?\n/)
  .filter(Boolean)
  .map((l) => JSON.parse(l));

for (const item of lines) {
  process.stdout.write(JSON.stringify(item) + "\n");
}

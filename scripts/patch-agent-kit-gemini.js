const fs = require("node:fs");
const path = require("node:path");

const root = path.resolve(__dirname, "..");
const targets = [
	path.join(
		root,
		"node_modules",
		"@inngest",
		"agent-kit",
		"dist",
		"chunk-BSWKEFTT.js",
	),
	path.join(
		root,
		"node_modules",
		"@inngest",
		"agent-kit",
		"dist",
		"index.cjs",
	),
];

// The fix: Gemini 3.1 requires thoughtSignature in parts containing functionCall
// This must be added at the part level (sibling to functionCall) when reconstructing
// the conversation history with tool calls
const replacements = [
	{
		// User role tool_call: add thoughtSignature at part level
		pattern:
			/case "tool_call":\s+if \(m\.tools\.length === 0\) \{\s+throw new Error\("Tool call message must have at least one tool"\);\s+\}\s+return \{\s+role: "model",\s+parts: \[\s+\{\s+functionCall: \{\s+name: m\.tools\[0\]\.name,\s+args: m\.tools\[0\]\.input\s+\}\s+\}\s+\]\s+\};/g,
		replacement: `case "tool_call":
          if (m.tools.length === 0) {
            throw new Error("Tool call message must have at least one tool");
          }
          return {
            role: "model",
            parts: [
              {
                functionCall: {
                  name: m.tools[0].name,
                  args: m.tools[0].input
                },
                thoughtSignature: m.tools[0].thoughtSignature
              }
            ]
          };`,
	},
];

function patchFile(filePath) {
	if (!fs.existsSync(filePath)) {
		return false;
	}

	const original = fs.readFileSync(filePath, "utf8");
	let updated = original;

	for (const { pattern, replacement } of replacements) {
		const matches = updated.match(pattern);
		if (matches) {
			updated = updated.replace(pattern, replacement);
		}
	}

	if (updated !== original) {
		fs.writeFileSync(filePath, updated);
		console.log(`patched ${path.relative(root, filePath)}`);
		return true;
	}

	console.log(`no changes needed for ${path.relative(root, filePath)}`);
	return false;
}

let patchedAny = false;
for (const target of targets) {
	patchedAny = patchFile(target) || patchedAny;
}

process.exitCode = 0;

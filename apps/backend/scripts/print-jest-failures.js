const fs = require('fs');
const path = require('path');

const resultsPath = path.resolve(__dirname, '..', 'jest-results.json');
if (!fs.existsSync(resultsPath)) {
  console.error('jest-results.json not found at', resultsPath);
  process.exit(1);
}

const data = JSON.parse(fs.readFileSync(resultsPath, 'utf8'));
const failing = [];

for (const suite of data.testResults || []) {
  for (const assertion of suite.assertionResults || []) {
    if (assertion.status === 'failed') {
      const msg = (assertion.failureMessages || []).join(' | ');
      failing.push({
        suite: suite.name,
        test: assertion.fullName,
        msg,
      });
    }
  }
}

console.log('Failing tests:');
for (let i = 0; i < Math.min(200, failing.length); i++) {
  const f = failing[i];
  const cleanMsg = f.msg
    .replace(/\x1B\[[0-9;]*m/g, '')
    .replace(/\s+/g, ' ')
    .trim();
  console.log(`${i + 1}. [${f.suite}] ${f.test}`);
  console.log(`   -> ${cleanMsg}`);
}
console.log(`\nTotal failing: ${failing.length}`);

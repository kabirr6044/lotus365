import test from 'node:test';
import assert from 'node:assert/strict';
import { destinationUrl } from '../lib/destination.mjs';
test('unset and unsafe destinations remain inactive', () => {
 for (const value of [undefined, '', ' ', '/relative', 'javascript:alert(1)', 'data:text/html,test', 'https://user:secret@example.com']) assert.equal(destinationUrl(value), null);
});
test('the configured destination preserves its path and query without any form data', () => {
 assert.equal(destinationUrl(' https://example.com/continue?source=assignment '), 'https://example.com/continue?source=assignment');
 assert.equal(destinationUrl('http://localhost:3000/redirect-test/'), 'http://localhost:3000/redirect-test/');
});

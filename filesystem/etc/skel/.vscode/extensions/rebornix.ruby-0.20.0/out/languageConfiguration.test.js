"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
const assert = require("assert");
const languageConfiguration_1 = require("./languageConfiguration");
describe('wordPattern', function () {
    const wordPattern = languageConfiguration_1.default.wordPattern;
    it('should not match leading colon in symbols (#257)', function () {
        const text = ':fnord';
        const matches = text.match(wordPattern);
        assert.equal(matches[0], 'fnord');
    });
    it('should not match leading colons in constants (#257)', function () {
        const text = '::Bar';
        const matches = text.match(wordPattern);
        assert.equal(matches[0], 'Bar');
    });
});
//# sourceMappingURL=languageConfiguration.test.js.map
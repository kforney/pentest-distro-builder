'use strict';
Object.defineProperty(exports, "__esModule", { value: true });
const vscode = require("vscode");
const settings_1 = require("./settings");
const logger_1 = require("../logger");
const escapeChars = /[\\\^\$\*\+\?\{\}\(\)\.\!\=\|\[\]\ \/]/;
function escape(chars) {
    let result = "";
    for (let char of chars) {
        if (char.match(escapeChars)) {
            result += `\\${char}`;
        }
        else {
            result += char;
        }
    }
    return result;
}
function getMLBeginPattern(insert) {
    if (insert && insert.startsWith("/*")) {
        let match = escape(insert.substr(2));
        return `^\\s*\\/\\*${match}(?!\\/)([^\\*]|\\*(?!\\/))*$`;
    }
    return undefined;
}
function getMLSplitAfterPattern() {
    return "^\\s*\\*\\/$";
}
function getMLContinuePattern(insert) {
    if (insert) {
        let match = escape(insert.trimRight());
        if (match) {
            let right = escape(insert.substr(insert.trimRight().length));
            return `^\\s*${match}(${right}([^\\*]|\\*(?!\\/))*)?$`;
        }
    }
    return undefined;
}
function getMLEndPattern(insert) {
    if (insert) {
        let match = escape(insert.trimRight().trimLeft());
        if (match) {
            return `^\\s*${match}[^/]*\\*\\/\\s*$`;
        }
    }
    return undefined;
}
function getMLEmptyEndPattern(insert) {
    if (insert) {
        insert = insert.trimRight();
        if (insert) {
            if (insert.endsWith('*')) {
                insert = insert.substr(0, insert.length - 1);
            }
            let match = escape(insert.trimRight());
            return `^\\s*${match}\\*\\/\\s*$`;
        }
    }
    return undefined;
}
function getSLBeginPattern(insert) {
    if (insert) {
        let match = escape(insert.trimRight());
        return `^\\s*${match}.*$`;
    }
    return undefined;
}
function getSLContinuePattern(insert) {
    if (insert) {
        let match = escape(insert.trimRight());
        return `^\\s*${match}.+$`;
    }
    return undefined;
}
function getSLEndPattern(insert) {
    if (insert) {
        let match = escape(insert);
        let trimmed = escape(insert.trimRight());
        if (match !== trimmed) {
            match = `(${match}|${trimmed})`;
        }
        return `^\\s*${match}$`;
    }
    return undefined;
}
function getMLSplitRule(comment) {
    if (comment) {
        let beforePattern = getMLBeginPattern(comment.begin);
        if (beforePattern) {
            return {
                beforeText: new RegExp(beforePattern),
                afterText: new RegExp(getMLSplitAfterPattern()),
                action: {
                    indentAction: vscode.IndentAction.IndentOutdent,
                    appendText: comment.continue ? comment.continue : ''
                }
            };
        }
    }
    return undefined;
}
function getMLFirstLineRule(comment) {
    if (comment) {
        let beforePattern = getMLBeginPattern(comment.begin);
        if (beforePattern) {
            return {
                beforeText: new RegExp(beforePattern),
                action: {
                    indentAction: vscode.IndentAction.None,
                    appendText: comment.continue ? comment.continue : ''
                }
            };
        }
    }
    return undefined;
}
function getMLContinuationRule(comment) {
    if (comment) {
        let continuePattern = getMLContinuePattern(comment.continue);
        if (continuePattern) {
            return {
                beforeText: new RegExp(continuePattern),
                action: {
                    indentAction: vscode.IndentAction.None,
                    appendText: comment.continue.trimLeft()
                }
            };
        }
    }
    return undefined;
}
function getMLEndRule(comment) {
    if (comment) {
        let endPattern = getMLEndPattern(comment.continue);
        if (endPattern) {
            return {
                beforeText: new RegExp(endPattern),
                action: {
                    indentAction: vscode.IndentAction.None,
                    removeText: comment.continue.length - comment.continue.trimLeft().length
                }
            };
        }
    }
    return undefined;
}
function getMLEmptyEndRule(comment) {
    if (comment) {
        let endPattern = getMLEmptyEndPattern(comment.continue);
        if (endPattern) {
            return {
                beforeText: new RegExp(endPattern),
                action: {
                    indentAction: vscode.IndentAction.None,
                    removeText: comment.continue.length - comment.continue.trimLeft().length
                }
            };
        }
    }
    return undefined;
}
function getSLFirstLineRule(comment) {
    if (comment) {
        let continuePattern = getSLBeginPattern(comment.begin);
        if (continuePattern) {
            return {
                beforeText: new RegExp(continuePattern),
                action: {
                    indentAction: vscode.IndentAction.None,
                    appendText: comment.continue.trimLeft()
                }
            };
        }
    }
    return undefined;
}
function getSLContinuationRule(comment) {
    if (comment) {
        let continuePattern = getSLContinuePattern(comment.continue);
        if (continuePattern) {
            return {
                beforeText: new RegExp(continuePattern),
                action: {
                    indentAction: vscode.IndentAction.None,
                    appendText: comment.continue.trimLeft()
                }
            };
        }
    }
    return undefined;
}
function getSLEndRule(comment) {
    if (comment) {
        let endPattern = getSLEndPattern(comment.continue);
        if (endPattern) {
            return {
                beforeText: new RegExp(endPattern),
                action: {
                    indentAction: vscode.IndentAction.None,
                    removeText: comment.continue.length - comment.continue.trimLeft().length
                }
            };
        }
    }
    return undefined;
}
function getLanguageConfig(languageId, resource) {
    let settings = new settings_1.CppSettings(resource);
    let patterns = settings.commentContinuationPatterns;
    return getLanguageConfigFromPatterns(languageId, patterns);
}
exports.getLanguageConfig = getLanguageConfig;
function getLanguageConfigFromPatterns(languageId, patterns) {
    let beginPatterns = [];
    let continuePatterns = [];
    let duplicates = false;
    let beginRules = [];
    let continueRules = [];
    let endRules = [];
    patterns.forEach(pattern => {
        let c = (typeof pattern === "string") ? { begin: pattern, continue: pattern.startsWith('/*') ? " * " : pattern } : pattern;
        let r = constructCommentRules(c, languageId);
        if (beginPatterns.indexOf(c.begin) < 0) {
            if (r.begin && r.begin.length > 0) {
                beginRules = beginRules.concat(r.begin);
            }
            beginPatterns.push(c.begin);
        }
        else {
            duplicates = true;
        }
        if (continuePatterns.indexOf(c.continue) < 0) {
            if (r.continue && r.continue.length > 0) {
                continueRules = continueRules.concat(r.continue);
            }
            if (r.end && r.end.length > 0) {
                endRules = endRules.concat(r.end);
            }
            continuePatterns.push(c.continue);
        }
    });
    if (duplicates) {
        logger_1.getOutputChannel().appendLine("Duplicate multiline comment patterns detected.");
    }
    return { onEnterRules: beginRules.concat(continueRules).concat(endRules).filter(e => (e)) };
}
exports.getLanguageConfigFromPatterns = getLanguageConfigFromPatterns;
function constructCommentRules(comment, languageId) {
    if (comment && comment.begin && comment.begin.startsWith('/*') && (languageId === 'c' || languageId === 'cpp')) {
        return {
            begin: [
                getMLSplitRule(comment),
                getMLFirstLineRule(comment)
            ],
            continue: [getMLContinuationRule(comment)],
            end: [
                getMLEmptyEndRule(comment),
                getMLEndRule(comment)
            ]
        };
    }
    else if (comment && comment.begin && comment.begin.startsWith('//') && languageId === 'cpp') {
        return {
            begin: (comment.begin === comment.continue) ? [] : [getSLFirstLineRule(comment)],
            continue: [getSLContinuationRule(comment)],
            end: [getSLEndRule(comment)]
        };
    }
    return {
        begin: [],
        continue: [],
        end: []
    };
}
//# sourceMappingURL=languageConfig.js.map
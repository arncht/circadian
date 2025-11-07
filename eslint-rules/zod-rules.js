/**
 * Custom ESLint rules for Zod validation
 */

const zodRequireStrict = {
    meta: {
        type: 'problem',
        docs: {
            description: 'Require .strict() on all z.object() schemas',
            category: 'Best Practices',
            recommended: true,
        },
        messages: {
            missingStrict: 'z.object() must be followed by .strict() to prevent unexpected properties',
        },
        fixable: 'code',
        schema: [],
    },
    create(context) {
        return {
            CallExpression(node) {
                // Check if this is z.object()
                if (
                    node.callee.type === 'MemberExpression' &&
                    node.callee.object.name === 'z' &&
                    node.callee.property.name === 'object'
                ) {
                    // Check if parent is a member expression with .strict()
                    const parent = node.parent;

                    // Allow if it's part of a chain that includes .strict()
                    let current = parent;
                    let hasStrict = false;

                    // Walk up the chain to find .strict()
                    while (current && current.type === 'MemberExpression') {
                        if (current.property.name === 'strict') {
                            hasStrict = true;
                            break;
                        }
                        current = current.parent;
                    }

                    // Also check if the next call in the chain is .strict()
                    if (parent.type === 'MemberExpression' && parent.property.name === 'strict') {
                        hasStrict = true;
                    }

                    // Check if it's called immediately: z.object().strict()
                    if (parent.type === 'CallExpression' &&
                        parent.callee.type === 'MemberExpression' &&
                        parent.callee.property.name === 'strict') {
                        hasStrict = true;
                    }

                    if (!hasStrict) {
                        context.report({
                            node,
                            messageId: 'missingStrict',
                            fix(fixer) {
                                // Find the end of the z.object() call
                                const sourceCode = context.getSourceCode();
                                const objectCall = sourceCode.getText(node);

                                // Add .strict() after the closing parenthesis
                                return fixer.insertTextAfter(node, '.strict()');
                            },
                        });
                    }
                }
            },
        };
    },
};

const zodRequireExplicitType = {
    meta: {
        type: 'problem',
        docs: {
            description: 'Require explicit type annotation before .parse() calls',
            category: 'Best Practices',
            recommended: true,
        },
        messages: {
            missingExplicitType: 'Assign the object to a typed variable before calling .parse() for compile-time type checking',
        },
        schema: [],
    },
    create(context) {
        return {
            CallExpression(node) {
                // Check if this is a .parse() or .safeParse() call
                if (
                    node.callee.type === 'MemberExpression' &&
                    (node.callee.property.name === 'parse' || node.callee.property.name === 'safeParse')
                ) {
                    // Check if the argument is an object literal
                    if (node.arguments.length > 0 && node.arguments[0].type === 'ObjectExpression') {
                        const objectArg = node.arguments[0];

                        // Check if this parse call is NOT part of a variable declaration with type annotation
                        const parent = node.parent;

                        // Allow if it's assigned to a variable with explicit type
                        if (parent.type === 'VariableDeclarator') {
                            // Check if the variable has a type annotation
                            if (parent.id.typeAnnotation) {
                                return; // This is OK
                            }
                        }

                        // Allow if it's a return statement where function has explicit return type
                        let currentParent = parent;
                        while (currentParent) {
                            if (currentParent.type === 'ReturnStatement') {
                                // Check if the containing function has explicit return type
                                let funcNode = currentParent.parent;
                                while (funcNode && funcNode.type !== 'FunctionDeclaration' &&
                                    funcNode.type !== 'FunctionExpression' &&
                                    funcNode.type !== 'ArrowFunctionExpression') {
                                    funcNode = funcNode.parent;
                                }
                                if (funcNode && funcNode.returnType) {
                                    return; // This is OK
                                }
                            }
                            currentParent = currentParent.parent;
                        }

                        context.report({
                            node: objectArg,
                            messageId: 'missingExplicitType',
                        });
                    }
                }
            },
        };
    },
};

export default {
    rules: {
        'zod-require-strict': zodRequireStrict,
        'zod-require-explicit-type': zodRequireExplicitType,
    },
};

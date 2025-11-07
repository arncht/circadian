export default {
    rules: {
        'sort-declarations': {
            meta: {
                type: 'layout',
                docs: {
                    description:
                        'Enforce declaration order: imports, types, consts, functions, exports',
                    category: 'Stylistic Issues',
                },
                schema: [],
            },
            create(context) {
                const sourceCode = context.getSourceCode();

                const getDeclarationType = (node) => {
                    if (node.type === 'ImportDeclaration') return 0;
                    if (
                        node.type === 'TSTypeAliasDeclaration' ||
                        node.type === 'TSInterfaceDeclaration'
                    )
                        return 1;
                    if (
                        node.type === 'ExportNamedDeclaration' ||
                        node.type === 'ExportDefaultDeclaration'
                    )
                        return 3;
                    // Everything else (const, let, var, function, expression, etc.)
                    return 2;
                };

                return {
                    Program(node) {
                        const body = node.body;
                        let previousType = -1;
                        let previousNode = null;

                        for (let i = 0; i < body.length; i++) {
                            const currentNode = body[i];
                            const currentType = getDeclarationType(currentNode);

                            // Skip expression statements (function calls, etc.)
                            if (currentType === -1) {
                                continue;
                            }

                            // Check if this is a type that depends on a const (circular dependency)
                            if (currentNode.type === 'TSTypeAliasDeclaration' && i > 0) {
                                const typeText = sourceCode.getText(currentNode);
                                // Skip if type references a const that comes before it (typeof pattern)
                                if (typeText.includes('typeof ')) {
                                    previousNode = currentNode;
                                    continue;
                                }
                            }

                            // Check for missing blank line between different declaration types
                            if (
                                previousNode &&
                                currentType !== previousType &&
                                previousType !== -1
                            ) {
                                const prevLine = previousNode.loc.end.line;
                                const currLine = currentNode.loc.start.line;

                                // If previous was type/interface and current is not type/interface
                                if (
                                    (previousNode.type === 'TSTypeAliasDeclaration' ||
                                        previousNode.type === 'TSInterfaceDeclaration') &&
                                    currentNode.type !== 'TSTypeAliasDeclaration' &&
                                    currentNode.type !== 'TSInterfaceDeclaration' &&
                                    currLine - prevLine < 2
                                ) {
                                    context.report({
                                        node: currentNode,
                                        message: `Expected blank line after type/interface declaration.`,
                                    });
                                }
                            }

                            // Check for missing blank line between same type declarations (types)
                            if (
                                previousNode &&
                                previousNode.type === 'TSTypeAliasDeclaration' &&
                                currentNode.type === 'TSTypeAliasDeclaration'
                            ) {
                                const prevLine = previousNode.loc.end.line;
                                const currLine = currentNode.loc.start.line;

                                if (currLine - prevLine < 2) {
                                    context.report({
                                        node: currentNode,
                                        message: `Expected blank line between type declarations.`,
                                    });
                                }
                            }

                            // Skip if current type is lower than previous (out of order)
                            if (
                                currentType < previousType &&
                                currentType !== 0 &&
                                currentType !== 3
                            ) {
                                context.report({
                                    node: currentNode,
                                    message: `Declaration out of order. Expected order: imports, types, other, exports.`,
                                });
                            }

                            previousType = Math.max(previousType, currentType);
                            previousNode = currentNode;
                        }
                    },
                };
            },
        },
    },
};

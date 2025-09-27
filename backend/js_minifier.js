const babel = require('@babel/parser');
const traverse = require('@babel/traverse').default;
const generate = require('@babel/generator').default;

// Read input from stdin
let input = '';
process.stdin.setEncoding('utf8');
process.stdin.on('readable', () => {
    const chunk = process.stdin.read();
    if (chunk !== null) {
        input += chunk;
    }
});

process.stdin.on('end', () => {
    try {
        // Parse JavaScript code
        const ast = babel.parse(input, {
            sourceType: 'module',
            allowImportExportEverywhere: true,
            plugins: ['jsx', 'typescript']
        });
        
        // Variable renaming logic (matching Python implementation)
        const nameMapping = new Map();
        let counter = 0;
        const reservedWords = new Set([
            'var', 'let', 'const', 'function', 'return', 'if', 'else', 'for', 
            'while', 'do', 'break', 'continue', 'switch', 'case', 'default',
            'try', 'catch', 'finally', 'throw', 'new', 'this', 'typeof',
            'instanceof', 'in', 'delete', 'void', 'null', 'undefined', 'true', 'false',
            'console', 'log', 'length', 'push', 'pop', 'slice', 'splice',
            'Object', 'Array', 'String', 'Number', 'Boolean', 'Math', 'Date',
            'JSON', 'parseInt', 'parseFloat', 'isNaN', 'isFinite',
            'setTimeout', 'setInterval', 'clearTimeout', 'clearInterval'
        ]);
        
        function counterToName(counter) {
            let result = "";
            while (true) {
                result = String.fromCharCode(97 + (counter % 26)) + result;
                counter = Math.floor(counter / 26);
                if (counter === 0) break;
                counter -= 1;
            }
            return result;
        }
        
        function getNewName(originalName) {
            if (nameMapping.has(originalName)) {
                return nameMapping.get(originalName);
            }
            
            if (reservedWords.has(originalName)) {
                return originalName;
            }
            
            const newName = counterToName(counter);
            nameMapping.set(originalName, newName);
            counter++;
            return newName;
        }
        
        // Traverse and rename variables
        traverse(ast, {
            Identifier(path) {
                // Only rename if it's a binding (variable declaration/function parameter)
                if (path.isReferencedIdentifier() || path.isBindingIdentifier()) {
                    if (!reservedWords.has(path.node.name)) {
                        path.node.name = getNewName(path.node.name);
                    }
                }
            },
            FunctionDeclaration(path) {
                if (!reservedWords.has(path.node.id.name)) {
                    path.node.id.name = getNewName(path.node.id.name);
                }
            }
        });
        
        // Generate code back from AST
        const result = generate(ast, {
            minified: true,
            compact: true
        });
        
        console.log(result.code);
        
    } catch (error) {
        console.error('Error:', error.message);
        process.exit(1);
    }
});
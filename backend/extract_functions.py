import esprima
import json
from typing import List, Dict, Any

class JavaScriptFunctionVisitor:
    """
    A visitor class to traverse an Esprima AST and extract function info.
    
    This pattern is inspired by Python's `ast.NodeVisitor` and is more
    robust than a simple recursive walk function.
    """
    def __init__(self, code_string: str):
        self.code_string: str = code_string
        self.functions: List[Dict[str, Any]] = []
        self._context_stack: List[esprima.nodes.Node] = []

    def visit(self, node: esprima.nodes.Node):
        """Public entry point to begin traversal."""
        if not node or not isinstance(node, esprima.nodes.Node):
            return
        
        # Push current node to context stack
        self._context_stack.append(node)
        
        # Dispatch to a specific visit method if it exists (e.g., visit_FunctionDeclaration)
        method_name = f'visit_{node.type}'
        visitor = getattr(self, method_name, self.generic_visit)
        visitor(node)
        
        # Pop context after visiting node and its children
        self._context_stack.pop()

    def generic_visit(self, node: esprima.nodes.Node):
        """
        Called if no specific visitor function exists for a node type.
        This method is responsible for recursively visiting children.
        """
        for value in vars(node).values():
            if isinstance(value, list):
                for item in value:
                    self.visit(item)
            else:
                self.visit(value)

    def visit_FunctionDeclaration(self, node: esprima.nodes.Node):
        """Handles `function myFunction() {}` syntax."""
        self._extract_function_details(
            func_node=node,
            name=node.id.name if node.id else '(anonymous)',
            func_type=node.type
        )
        # Continue traversal to find nested functions
        self.generic_visit(node)

    def visit_VariableDeclarator(self, node: esprima.nodes.Node):
        """
        Handles function expressions and arrow functions assigned to variables,
        e.g., `const myFunc = function() {}` or `const myArrow = () => {}`.
        """
        if node.init and node.init.type in ['FunctionExpression', 'ArrowFunctionExpression']:
            self._extract_function_details(
                func_node=node.init,
                name=node.id.name,
                func_type=node.init.type
            )
        # Continue traversal for other declarations or nested structures
        self.generic_visit(node)

    def _extract_function_details(self, func_node: esprima.nodes.Node, name: str, func_type: str):
        """Helper to collect and store function information."""
        params = []
        for param in func_node.params:
            if param.type == 'Identifier':
                params.append(param.name)
            elif param.type == 'AssignmentPattern': # For params with default values
                params.append(param.left.name)
        
        start, end = func_node.range
        
        func_info = {
            'name': name,
            'type': func_type,
            'params': params,
            'fullText': self.code_string[start:end]
        }
        self.functions.append(func_info)


def extract_functions_from_content_js(code_string: str) -> list:
    """
    Parses a JavaScript code string and extracts information about all functions.
    This version uses a robust Visitor pattern.

    Args:
        code_string: A string containing the JavaScript source code.

    Returns:
        A list of dictionaries representing each found function.
    """
    ast = esprima.parseScript(code_string, options={'range': True})
    visitor = JavaScriptFunctionVisitor(code_string)
    visitor.visit(ast)
    return visitor.functions


def extract_functions_from_content_python(content: str) -> list[str]:
    """
    A helper that extracts top-level functions from a string of code
    based on indentation, correctly ignoring code between functions.
    """
    functions = []
    current_function_lines = []
    in_function = False

    lines = content.splitlines()

    for line in lines:
        # Check if a new, top-level function definition starts
        if line.strip().startswith('def '):
            # If we were already building a function, the previous one has just ended.
            if in_function and current_function_lines:
                functions.append("\n".join(current_function_lines))
            
            # Start a new function
            current_function_lines = [line]
            in_function = True
        
        # If we are inside a function, collect its lines
        elif in_function:
            # An unindented line that is not a comment or empty marks the end of the function
            if not line.startswith((' ', '\t')) and line.strip() != "" and not line.strip().startswith('#'):
                if current_function_lines:
                    functions.append("\n".join(current_function_lines))
                current_function_lines = []
                in_function = False
            else:
                current_function_lines.append(line)

    # After the loop, add the last function if it exists
    if in_function and current_function_lines:
        functions.append("\n".join(current_function_lines))
    # for func in functions:
    #     print("Extracted function:")
    #     print(func)
    #     print("-" * 40)
        
    return functions
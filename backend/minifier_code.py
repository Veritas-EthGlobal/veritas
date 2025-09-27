import ast
import string
from typing import Dict, Set, Any
import subprocess
import tempfile
import os
import json
import string

class VariableRenamer(ast.NodeTransformer):
    def __init__(self):
        self.name_mapping: Dict[str, str] = {}
        self.counter = 0
        self.builtin_names = {
            'len', 'sum', 'abs', 'range', 'enumerate', 'zip', 'map', 'filter',
            'print', 'input', 'int', 'float', 'str', 'bool', 'list', 'dict',
            'set', 'tuple', 'min', 'max', 'sorted', 'reversed', 'any', 'all',
            'True', 'False', 'None', 'break', 'continue', 'return', 'if', 'else',
            'elif', 'for', 'while', 'def', 'class', 'import', 'from', 'as',
            'try', 'except', 'finally', 'with', 'lambda', 'and', 'or', 'not',
            'in', 'is', 'copy'  # Add common method names you want to preserve
        }
    
    def _get_new_name(self, original_name: str) -> str:
        """Generate a new short name for the variable"""
        if original_name in self.name_mapping:
            return self.name_mapping[original_name]
        
        # Don't rename builtin functions/keywords
        if original_name in self.builtin_names:
            return original_name
            
        # Generate new name: a, b, c, ..., z, aa, ab, ac, ...
        new_name = self._counter_to_name(self.counter)
        self.name_mapping[original_name] = new_name
        self.counter += 1
        return new_name
    
    def _counter_to_name(self, counter: int) -> str:
        """Convert counter to variable name (a, b, c, ..., z, aa, ab, ...)"""
        result = ""
        while True:
            result = string.ascii_lowercase[counter % 26] + result
            counter //= 26
            if counter == 0:
                break
            counter -= 1
        return result
    
    def visit_Name(self, node: ast.Name) -> ast.Name:
        """Rename variable names"""
        if isinstance(node.ctx, (ast.Store, ast.Load)):
            node.id = self._get_new_name(node.id)
        return node
    
    def visit_arg(self, node: ast.arg) -> ast.arg:
        """Rename function parameter names"""
        node.arg = self._get_new_name(node.arg)
        return node
    
    def visit_FunctionDef(self, node: ast.FunctionDef) -> ast.FunctionDef:
        """Rename function names"""
        node.name = self._get_new_name(node.name)
        return self.generic_visit(node)
    
    def visit_ClassDef(self, node: ast.ClassDef) -> ast.ClassDef:
        """Rename class names"""
        node.name = self._get_new_name(node.name)
        return self.generic_visit(node)


class JavaScriptVariableRenamer:
    def __init__(self):
        self.name_mapping: Dict[str, str] = {}
        self.counter = 0
        self.reserved_words = {
            # JavaScript reserved words and common built-ins
            'var', 'let', 'const', 'function', 'return', 'if', 'else', 'for', 
            'while', 'do', 'break', 'continue', 'switch', 'case', 'default',
            'try', 'catch', 'finally', 'throw', 'new', 'this', 'typeof',
            'instanceof', 'in', 'delete', 'void', 'null', 'undefined', 'true', 'false',
            'console', 'log', 'length', 'push', 'pop', 'slice', 'splice',
            'Object', 'Array', 'String', 'Number', 'Boolean', 'Math', 'Date',
            'JSON', 'parseInt', 'parseFloat', 'isNaN', 'isFinite',
            'setTimeout', 'setInterval', 'clearTimeout', 'clearInterval'
        }
    
    def _get_new_name(self, original_name: str) -> str:
        """Generate a new short name for the variable (same logic as Python version)"""
        if original_name in self.name_mapping:
            return self.name_mapping[original_name]
        
        # Don't rename reserved words/built-ins
        if original_name in self.reserved_words:
            return original_name
            
        # Generate new name: a, b, c, ..., z, aa, ab, ac, ...
        new_name = self._counter_to_name(self.counter)
        self.name_mapping[original_name] = new_name
        self.counter += 1
        return new_name
    
    def _counter_to_name(self, counter: int) -> str:
        """Convert counter to variable name (same logic as Python version)"""
        result = ""
        while True:
            result = string.ascii_lowercase[counter % 26] + result
            counter //= 26
            if counter == 0:
                break
            counter -= 1
        return result

def minify_js_fallback_regex(js_code: str) -> str:
    """
    Fallback regex-based approach that mimics Python minifier behavior
    """
    import re
    
    renamer = JavaScriptVariableRenamer()
    
    # Extract all identifiers (variable names, function names)
    identifier_pattern = r'\b[a-zA-Z_$][a-zA-Z0-9_$]*\b'
    identifiers = set(re.findall(identifier_pattern, js_code))
    
    # Create mapping for non-reserved identifiers
    mapping = {}
    for identifier in sorted(identifiers):
        if identifier not in renamer.reserved_words:
            mapping[identifier] = renamer._get_new_name(identifier)
    
    # Replace identifiers with their shortened versions
    result = js_code
    for old_name, new_name in mapping.items():
        # Use word boundaries to avoid partial replacements
        result = re.sub(r'\b' + re.escape(old_name) + r'\b', new_name, result)
    
    # Basic minification (remove comments and extra whitespace)
    # Remove single-line comments
    result = re.sub(r'//.*?$', '', result, flags=re.MULTILINE)
    # Remove multi-line comments
    result = re.sub(r'/\*.*?\*/', '', result, flags=re.DOTALL)
    # Collapse whitespace
    result = re.sub(r'\s+', ' ', result)
    # Remove spaces around operators and punctuation
    result = re.sub(r'\s*([{}();,=+\-*/&|!<>?:])\s*', r'\1', result)
    
    return result.strip()



def obfuscate_code(code_string: str, language="python") -> str:
    if language == "python":
        print(code_string.count('\n'))
        tree = ast.parse(code_string)
        renamer = VariableRenamer()
        new_tree = renamer.visit(tree)
        normalized_code = ast.unparse(new_tree)
        
        print(normalized_code.count('\n'))
        return normalized_code
    else:

        result = subprocess.run([
            'node', 'js_minifier.js'
        ], input=code_string, capture_output=True, text=True, check=True)
        
        return result.stdout.strip()
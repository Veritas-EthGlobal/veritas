import re

def identify_function_boundaries_python(code_string: str) -> list[tuple[int, int]]:
    """
    Identifies the start and end line numbers of all top-level functions in Python code.
    
    Args:
        code_string (str): The Python code as a string
        
    Returns:
        list[tuple[int, int]]: A list of tuples where each tuple contains 
                               (start_line, end_line) for each function
    """
    lines = code_string.split('\n')
    function_boundaries = []
    current_function_start = None
    
    for i, line in enumerate(lines):
        stripped_line = line.strip()
        
        # Check if this line starts a function definition
        if stripped_line.startswith('def ') and ':' in stripped_line:
            # If we were tracking a previous function, close it
            if current_function_start is not None:
                function_boundaries.append((current_function_start, i - 1))
            
            # Start tracking this new function
            current_function_start = i + 1  # Line numbers are 1-indexed
        
        # Check if we're at a non-indented line that's not empty or a comment
        elif (current_function_start is not None and 
              line and 
              not line[0].isspace() and 
              not stripped_line.startswith('#')):
            # This marks the end of the current function
            function_boundaries.append((current_function_start, i))
            current_function_start = None
    
    # Handle the case where the last function goes to the end of the file
    if current_function_start is not None:
        function_boundaries.append((current_function_start, len(lines)))
    
    return function_boundaries

def identify_function_boundaries_js(code_string: str) -> list[tuple[int, int]]:
    """
    Identifies the start and end line numbers of all top-level functions in JavaScript code.
    
    Args:
        code_string (str): The JavaScript code as a string
        
    Returns:
        list[tuple[int, int]]: A list of tuples where each tuple contains 
                                (start_line, end_line) for each function
    """
    lines = code_string.split('\n')
    function_boundaries = []
    brace_count = 0
    current_function_start = None
    in_function = False
    seen_opening_brace = False
    
    function_patterns = [
        r'^\s*function\s+\w+\s*\(',  # function name()
        r'^\s*function\s*\(',         # function()
        r'^\s*const\s+\w+\s*=\s*function\s*\(',  # const name = function()
        r'^\s*let\s+\w+\s*=\s*function\s*\(',    # let name = function()
        r'^\s*var\s+\w+\s*=\s*function\s*\(',    # var name = function()
        r'^\s*\w+\s*:\s*function\s*\(',          # name: function() (object method)
        r'^\s*\w+\s*\([^)]*\)\s*=>\s*{',         # arrow function with braces
    ]
    
    for i, line in enumerate(lines):
        stripped_line = line.strip()
        
        # Skip empty lines and comments
        if not stripped_line or stripped_line.startswith('//') or stripped_line.startswith('/*'):
            continue
        
        # Check for function declarations when not already in a function
        if not in_function:
            is_function_start = any(re.match(pattern, line) for pattern in function_patterns)
            
            if is_function_start:
                current_function_start = i + 1  # Line numbers are 1-indexed
                brace_count = 0
                in_function = True
                seen_opening_brace = False
        
        # Count braces when we're in a function
        if in_function:
            open_braces = line.count('{')
            close_braces = line.count('}')
            
            # Track if we've seen the opening brace of the function body
            if open_braces > 0:
                seen_opening_brace = True
            
            brace_count += open_braces - close_braces
            
            # Function ends when brace count returns to 0 after we've seen the opening brace
            if seen_opening_brace and brace_count == 0:
                function_boundaries.append((current_function_start, i + 1))
                current_function_start = None
                in_function = False
                seen_opening_brace = False
    
    # Handle case where function goes to end of file
    if current_function_start is not None and in_function:
        function_boundaries.append((current_function_start, len(lines)))
    
    return function_boundaries

    
"""
Buffered I/O types
"""

BUF_READER_TYPE = {
    'kind': 'struct',
    'name': 'BufReader',
    'type_params': ['R'],
    'bounds': ['R: Read'],
    'fields': [],
}

BUF_WRITER_TYPE = {
    'kind': 'struct',
    'name': 'BufWriter',
    'type_params': ['W'],
    'bounds': ['W: Write'],
    'fields': [],
}

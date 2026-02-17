"""
Veritas Standard Library

Provides type definitions and runtime stubs for the Veritas standard library.
These definitions are used by the type checker and code generator.
"""

from .core import option, result, ordering, ops
from .collections import list_type, map_type, set_type, string_type
from .io import file, stream, buffer, path
from .json import value, encode, decode
from .text import fmt, parse
from .time import instant, duration, datetime
from .math import numeric, random

__all__ = [
    'option',
    'result',
    'ordering',
    'ops',
    'list_type',
    'map_type',
    'set_type',
    'string_type',
    'file',
    'stream',
    'buffer',
    'path',
    'value',
    'encode',
    'decode',
    'fmt',
    'parse',
    'instant',
    'duration',
    'datetime',
    'numeric',
    'random',
]

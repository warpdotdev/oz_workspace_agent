"""Source location and span tracking for error reporting."""

from dataclasses import dataclass
from typing import Optional


@dataclass(frozen=True)
class Position:
    """A position in source code."""
    
    line: int      # 1-indexed line number
    column: int    # 1-indexed column number
    offset: int    # 0-indexed byte offset
    
    def __str__(self) -> str:
        return f"{self.line}:{self.column}"


@dataclass(frozen=True)
class Span:
    """A span in source code, from start to end position."""
    
    start: Position
    end: Position
    source: Optional[str] = None  # Optional source file path
    
    def __str__(self) -> str:
        if self.source:
            return f"{self.source}:{self.start}"
        return str(self.start)
    
    def merge(self, other: "Span") -> "Span":
        """Merge two spans into one that covers both."""
        return Span(
            start=self.start if self.start.offset <= other.start.offset else other.start,
            end=self.end if self.end.offset >= other.end.offset else other.end,
            source=self.source or other.source,
        )
    
    @classmethod
    def empty(cls, pos: Position, source: Optional[str] = None) -> "Span":
        """Create an empty span at a position."""
        return cls(start=pos, end=pos, source=source)


def dummy_span() -> Span:
    """Create a dummy span for synthesized nodes."""
    pos = Position(line=0, column=0, offset=0)
    return Span(start=pos, end=pos)

"""Fix suggestion engine for Veritas compiler errors.

Generates actionable fix suggestions with confidence levels.
"""

from dataclasses import dataclass
from typing import List, Optional
from enum import Enum

from ..span import Span


class FixConfidence(Enum):
    """Confidence level for a fix suggestion."""
    HIGH = "high"
    MEDIUM = "medium"
    LOW = "low"


class FixType(Enum):
    """Type of fix being suggested."""
    REPLACE = "replace"
    INSERT = "insert"
    DELETE = "delete"
    REFACTOR = "refactor"


@dataclass
class CodeDiff:
    """Before and after code diff."""
    before: str
    after: str
    change_description: str


@dataclass
class AutomatedFix:
    """Information for automated fix application."""
    applicable: bool
    file: Optional[str] = None
    start_line: Optional[int] = None
    start_column: Optional[int] = None
    end_line: Optional[int] = None
    end_column: Optional[int] = None
    replacement_text: Optional[str] = None


@dataclass
class Suggestion:
    """A single fix suggestion."""
    suggestion_id: str
    description: str
    confidence: FixConfidence
    fix_type: FixType
    diff: CodeDiff
    automated_fix: AutomatedFix


class SuggestionEngine:
    """Generates fix suggestions for different error types."""
    
    def __init__(self):
        self.suggestion_counter = 0
    
    def generate_id(self) -> str:
        """Generate a unique suggestion ID."""
        self.suggestion_counter += 1
        return f"sugg_{self.suggestion_counter}"
    
    def suggest_for_type_mismatch(
        self,
        expected_type: str,
        actual_type: str,
        location: Span,
        context: str
    ) -> List[Suggestion]:
        """Generate suggestions for type mismatch errors."""
        suggestions = []
        
        # Suggestion 1: Add type conversion if applicable
        if expected_type == "Int" and actual_type == "String":
            suggestions.append(Suggestion(
                suggestion_id=self.generate_id(),
                description="Parse the string to an integer if it contains a numeric value",
                confidence=FixConfidence.HIGH,
                fix_type=FixType.REPLACE,
                diff=CodeDiff(
                    before=context,
                    after=context.replace(actual_type, f"parse_int({actual_type})?"),
                    change_description="Wrap the string argument with parse_int() to convert it to Int. Note: parse_int returns Result[Int, ParseError] so you'll need to handle the potential error with '?' or explicit error handling."
                ),
                automated_fix=AutomatedFix(applicable=False)
            ))
        
        # Suggestion 2: Change the value to match expected type
        suggestions.append(Suggestion(
            suggestion_id=self.generate_id(),
            description=f"Change the value to match expected type {expected_type}",
            confidence=FixConfidence.MEDIUM,
            fix_type=FixType.REPLACE,
            diff=CodeDiff(
                before=context,
                after=f"<value of type {expected_type}>",
                change_description=f"Replace the value with one of type {expected_type}."
            ),
            automated_fix=AutomatedFix(applicable=False)
        ))
        
        return suggestions
    
    def suggest_for_use_after_move(
        self,
        variable_name: str,
        move_location: Optional[Span],
        use_location: Span,
        context: str
    ) -> List[Suggestion]:
        """Generate suggestions for use-after-move errors."""
        suggestions = []
        
        # Suggestion 1: Clone before moving
        suggestions.append(Suggestion(
            suggestion_id=self.generate_id(),
            description="Clone the value before moving it, so you can use both the clone and original",
            confidence=FixConfidence.HIGH,
            fix_type=FixType.REPLACE,
            diff=CodeDiff(
                before=f"move {variable_name}",
                after=f"move {variable_name}.clone()",
                change_description=f"Call .clone() on the value before moving it. This creates a copy that can be moved, while the original remains accessible."
            ),
            automated_fix=AutomatedFix(applicable=True)
        ))
        
        # Suggestion 2: Use a reference instead
        suggestions.append(Suggestion(
            suggestion_id=self.generate_id(),
            description="Use a reference instead of moving the value",
            confidence=FixConfidence.HIGH,
            fix_type=FixType.REPLACE,
            diff=CodeDiff(
                before=f"move {variable_name}",
                after=f"&{variable_name}",
                change_description=f"Pass a reference (&{variable_name}) instead of moving the value. The function must accept a reference type for this to work."
            ),
            automated_fix=AutomatedFix(applicable=False)
        ))
        
        # Suggestion 3: Reorder operations
        suggestions.append(Suggestion(
            suggestion_id=self.generate_id(),
            description="Reorder operations to use the value before moving it",
            confidence=FixConfidence.MEDIUM,
            fix_type=FixType.REFACTOR,
            diff=CodeDiff(
                before="<current order>",
                after="<reordered code>",
                change_description=f"Move the uses of {variable_name} before the move operation."
            ),
            automated_fix=AutomatedFix(applicable=False)
        ))
        
        return suggestions
    
    def suggest_for_missing_semicolon(
        self,
        location: Span,
        line_content: str
    ) -> List[Suggestion]:
        """Generate suggestions for missing semicolon."""
        suggestions = []
        
        # High confidence: just add the semicolon
        suggestions.append(Suggestion(
            suggestion_id=self.generate_id(),
            description="Add missing semicolon at end of statement",
            confidence=FixConfidence.HIGH,
            fix_type=FixType.INSERT,
            diff=CodeDiff(
                before=line_content,
                after=line_content.rstrip() + ";",
                change_description="Add a semicolon (;) at the end of the statement."
            ),
            automated_fix=AutomatedFix(
                applicable=True,
                file=location.source,
                start_line=location.end.line,
                start_column=location.end.column,
                end_line=location.end.line,
                end_column=location.end.column,
                replacement_text=";"
            )
        ))
        
        return suggestions
    
    def suggest_for_effect_violation(
        self,
        effect_needed: str,
        function_name: str,
        context: str
    ) -> List[Suggestion]:
        """Generate suggestions for effect system violations."""
        suggestions = []
        
        # Suggestion 1: Add effect annotation
        suggestions.append(Suggestion(
            suggestion_id=self.generate_id(),
            description=f"Add {effect_needed} effect to the function signature",
            confidence=FixConfidence.HIGH,
            fix_type=FixType.REPLACE,
            diff=CodeDiff(
                before=context,
                after=context.replace("->", f"-> Effect[{effect_needed}]"),
                change_description=f"Add 'Effect[{effect_needed}]' to the return type signature to indicate that this function performs {effect_needed} operations. Note: All callers must now handle the {effect_needed} effect."
            ),
            automated_fix=AutomatedFix(applicable=True)
        ))
        
        # Suggestion 2: Remove the effectful operation
        suggestions.append(Suggestion(
            suggestion_id=self.generate_id(),
            description="Remove the operation to keep the function pure",
            confidence=FixConfidence.HIGH,
            fix_type=FixType.DELETE,
            diff=CodeDiff(
                before=context,
                after="<code without effectful operation>",
                change_description="Remove the effectful operation to maintain function purity. Consider performing the effect at a higher level in the call stack if needed."
            ),
            automated_fix=AutomatedFix(applicable=False)
        ))
        
        # Suggestion 3: Split into pure and effectful functions
        suggestions.append(Suggestion(
            suggestion_id=self.generate_id(),
            description="Split into pure and effectful functions",
            confidence=FixConfidence.MEDIUM,
            fix_type=FixType.REFACTOR,
            diff=CodeDiff(
                before="<current function>",
                after="<pure function + effectful wrapper>",
                change_description="Keep the pure function separate and create a wrapper function that adds the effect. This maintains a pure core with effectful shell."
            ),
            automated_fix=AutomatedFix(applicable=False)
        ))
        
        return suggestions
    
    def suggest_for_borrow_conflict(
        self,
        variable_name: str,
        existing_borrow_kind: str,
        attempted_borrow_kind: str,
        context: str
    ) -> List[Suggestion]:
        """Generate suggestions for borrow checking conflicts."""
        suggestions = []
        
        # Suggestion 1: End previous borrow first
        suggestions.append(Suggestion(
            suggestion_id=self.generate_id(),
            description=f"End the {existing_borrow_kind} borrow before creating a {attempted_borrow_kind} borrow",
            confidence=FixConfidence.HIGH,
            fix_type=FixType.REFACTOR,
            diff=CodeDiff(
                before="<code with overlapping borrows>",
                after="<code with non-overlapping borrows>",
                change_description=f"Restructure code so the {existing_borrow_kind} borrow ends (goes out of scope) before the {attempted_borrow_kind} borrow begins."
            ),
            automated_fix=AutomatedFix(applicable=False)
        ))
        
        # Suggestion 2: Use clone if appropriate
        if attempted_borrow_kind == "immutable":
            suggestions.append(Suggestion(
                suggestion_id=self.generate_id(),
                description="Clone the value to avoid borrowing conflicts",
                confidence=FixConfidence.MEDIUM,
                fix_type=FixType.REPLACE,
                diff=CodeDiff(
                    before=f"&{variable_name}",
                    after=f"{variable_name}.clone()",
                    change_description=f"Clone {variable_name} to create an owned copy, avoiding borrow conflicts."
                ),
                automated_fix=AutomatedFix(applicable=False)
            ))
        
        return suggestions

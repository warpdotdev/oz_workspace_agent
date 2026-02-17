"""Main type checker implementation.

Traverses the AST and performs type checking using Hind ley-Milner inference.
"""

from dataclasses import dataclass
from typing import List, Dict, Optional, Set
from enum import Enum

from ..ast.nodes import *
from ..ast.types import *
from ..span import Span

from .types import (
    InferredType, TypeVariable, ConcreteType, FunctionInferredType,
    GenericInferredType, BrandedInferredType, TypeScheme, generalize
)
from .env import TypeEnvironment
from .constraints import Constraint, ConstraintKind, ConstraintSolver, UnificationError


@dataclass
class TypeCheckError:
    """A type checking error."""
    message: str
    span: Span
    
    def __str__(self) -> str:
        return f"{self.span}: {self.message}"


class TypeChecker:
    """Main type checker for Veritas language.
    
    Implements Hindley-Milner type inference with:
    - Constraint generation
    - Unification-based solving
    - Let-polymorphism
    - Effect tracking
    - Branded type checking
    """
    
    def __init__(self):
        self.constraints: List[Constraint] = []
        self.errors: List[TypeCheckError] = []
        self.type_var_counter = 0
        self.expr_types: Dict[int, InferredType] = {}  # id(expr) -> type
        self.branded_types: Dict[str, Type] = {}  # brand_name -> base_type
        
    def fresh_type_var(self) -> TypeVariable:
        """Generate a fresh type variable."""
        var = TypeVariable(f"t{self.type_var_counter}")
        self.type_var_counter += 1
        return var
    
    def check_program(self, program: Program) -> bool:
        """Type check a complete program.
        
        Returns True if type checking succeeds, False otherwise.
        """
        # Build initial environment with built-in types
        env = self._build_initial_env()
        
        # First pass: collect type definitions
        for item in program.items:
            if isinstance(item, TypeAlias):
                self._register_type_alias(item, env)
            elif isinstance(item, StructDef):
                self._register_struct(item, env)
            elif isinstance(item, EnumDef):
                self._register_enum(item, env)
        
        # Second pass: check function definitions and other items
        for item in program.items:
            if isinstance(item, FunctionDef):
                self._check_function_def(item, env)
            elif isinstance(item, ConstDef):
                self._check_const_def(item, env)
            elif isinstance(item, ImplBlock):
                self._check_impl_block(item, env)
        
        # Solve constraints
        if self.errors:
            return False
        
        try:
            solver = ConstraintSolver()
            substitution = solver.solve(self.constraints)
            
            # Apply substitution to all expression types
            for expr_id, inferred_type in self.expr_types.items():
                self.expr_types[expr_id] = inferred_type.substitute(substitution)
            
            return True
        except UnificationError as e:
            self.errors.append(TypeCheckError(str(e), e.span))
            return False
    
    def _build_initial_env(self) -> TypeEnvironment:
        """Build initial environment with built-in types and functions."""
        env = TypeEnvironment()
        
        # Built-in types are available as constructors
        # For now, we'll add them as needed during checking
        
        return env
    
    def _register_type_alias(self, alias: TypeAlias, env: TypeEnvironment) -> None:
        """Register a type alias in the environment."""
        # Check if this is a branded type
        if isinstance(alias.aliased_type, BrandedType):
            self.branded_types[alias.name] = alias.aliased_type.base_type
    
    def _register_struct(self, struct: StructDef, env: TypeEnvironment) -> None:
        """Register a struct definition."""
        # Structs create a type constructor
        # For simplicity, we'll handle this during expression checking
        pass
    
    def _register_enum(self, enum: EnumDef, env: TypeEnvironment) -> None:
        """Register an enum definition."""
        # Enums create variant constructors
        # For simplicity, we'll handle this during expression checking
        pass
    
    def _check_function_def(self, func: FunctionDef, env: TypeEnvironment) -> None:
        """Type check a function definition."""
        # Convert parameter types to inferred types
        param_types = [self._ast_type_to_inferred(p.type) for p in func.params]
        
        # Convert return type
        return_type = (
            self._ast_type_to_inferred(func.return_type)
            if func.return_type
            else self.fresh_type_var()
        )
        
        # Create function type
        func_type = FunctionInferredType(
            param_types=param_types,
            return_type=return_type,
            effects=func.effects,
        )
        
        # Bind function name in environment
        scheme = TypeScheme(quantified_vars=[], body=func_type)
        env.bind(func.name, scheme)
        
        # Check function body if present
        if func.body:
            # Create new environment with parameters
            body_env = env
            for param, param_type in zip(func.params, param_types):
                param_scheme = TypeScheme(quantified_vars=[], body=param_type)
                body_env = body_env.extend(param.name, param_scheme)
            
            # Infer body type
            body_type = self._infer_expr(func.body, body_env)
            
            # Constrain body type to match return type
            self.constraints.append(Constraint(
                kind=ConstraintKind.EQUALITY,
                left=body_type,
                right=return_type,
                span=func.body.span,
            ))
            
            # Check contracts
            for contract in func.contracts:
                self._check_contract(contract, body_env)
    
    def _check_const_def(self, const: ConstDef, env: TypeEnvironment) -> None:
        """Type check a constant definition."""
        # Infer value type
        value_type = self._infer_expr(const.value, env)
        
        # Convert declared type
        declared_type = self._ast_type_to_inferred(const.type)
        
        # Constrain value type to match declared type
        self.constraints.append(Constraint(
            kind=ConstraintKind.EQUALITY,
            left=value_type,
            right=declared_type,
            span=const.value.span,
        ))
    
    def _check_impl_block(self, impl: ImplBlock, env: TypeEnvironment) -> None:
        """Type check an impl block."""
        for method in impl.methods:
            self._check_function_def(method, env)
    
    def _check_contract(self, contract: Contract, env: TypeEnvironment) -> None:
        """Verify a contract (requires/ensures/invariant)."""
        # Check that contract condition is a boolean expression
        cond_type = self._infer_expr(contract.condition, env)
        bool_type = self._make_bool_type()
        
        self.constraints.append(Constraint(
            kind=ConstraintKind.EQUALITY,
            left=cond_type,
            right=bool_type,
            span=contract.condition.span,
        ))
    
    def _infer_expr(self, expr: Expression, env: TypeEnvironment) -> InferredType:
        """Infer the type of an expression."""
        if isinstance(expr, Literal):
            result = self._infer_literal(expr)
        elif isinstance(expr, Identifier):
            result = self._infer_identifier(expr, env)
        elif isinstance(expr, BinaryOp):
            result = self._infer_binary_op(expr, env)
        elif isinstance(expr, UnaryOp):
            result = self._infer_unary_op(expr, env)
        elif isinstance(expr, FunctionCall):
            result = self._infer_function_call(expr, env)
        elif isinstance(expr, MethodCall):
            result = self._infer_method_call(expr, env)
        elif isinstance(expr, IfExpr):
            result = self._infer_if_expr(expr, env)
        elif isinstance(expr, MatchExpr):
            result = self._infer_match_expr(expr, env)
        elif isinstance(expr, BlockExpr):
            result = self._infer_block_expr(expr, env)
        elif isinstance(expr, LambdaExpr):
            result = self._infer_lambda_expr(expr, env)
        elif isinstance(expr, FieldAccess):
            result = self._infer_field_access(expr, env)
        elif isinstance(expr, TupleExpr):
            result = self._infer_tuple_expr(expr, env)
        elif isinstance(expr, ArrayExpr):
            result = self._infer_array_expr(expr, env)
        elif isinstance(expr, StructExpr):
            result = self._infer_struct_expr(expr, env)
        elif isinstance(expr, CastExpr):
            result = self._infer_cast_expr(expr, env)
        elif isinstance(expr, TryExpr):
            result = self._infer_try_expr(expr, env)
        else:
            # Unknown expression type
            result = self.fresh_type_var()
        
        # Store inferred type for this expression
        self.expr_types[id(expr)] = result
        return result
    
    def _infer_literal(self, lit: Literal) -> InferredType:
        """Infer type of a literal."""
        # Determine type based on literal value
        if lit.kind == "integer":
            # Default to i32
            return self._make_int_type("i32")
        elif lit.kind == "float":
            # Default to f64
            return self._make_float_type("f64")
        elif lit.kind == "string":
            return self._make_string_type()
        elif lit.kind == "bool":
            return self._make_bool_type()
        elif lit.kind == "char":
            return self._make_char_type()
        else:
            return self.fresh_type_var()
    
    def _infer_identifier(self, ident: Identifier, env: TypeEnvironment) -> InferredType:
        """Infer type of an identifier."""
        scheme = env.lookup(ident.name)
        if scheme is None:
            self.errors.append(TypeCheckError(
                f"Undefined variable: {ident.name}",
                ident.span
            ))
            return self.fresh_type_var()
        
        # Instantiate type scheme with fresh variables
        return scheme.instantiate(lambda: f"t{self.type_var_counter := self.type_var_counter + 1}")
    
    def _infer_binary_op(self, binop: BinaryOp, env: TypeEnvironment) -> InferredType:
        """Infer type of a binary operation."""
        left_type = self._infer_expr(binop.left, env)
        right_type = self._infer_expr(binop.right, env)
        
        # Arithmetic operators
        if binop.op in [BinaryOpKind.ADD, BinaryOpKind.SUB, BinaryOpKind.MUL, 
                        BinaryOpKind.DIV, BinaryOpKind.MOD]:
            # Both operands must be numeric, result is same type
            self.constraints.append(Constraint(
                kind=ConstraintKind.EQUALITY,
                left=left_type,
                right=right_type,
                span=binop.span,
            ))
            return left_type
        
        # Comparison operators
        elif binop.op in [BinaryOpKind.EQ, BinaryOpKind.NE, BinaryOpKind.LT, 
                          BinaryOpKind.GT, BinaryOpKind.LE, BinaryOpKind.GE]:
            # Operands must have same type, result is bool
            self.constraints.append(Constraint(
                kind=ConstraintKind.EQUALITY,
                left=left_type,
                right=right_type,
                span=binop.span,
            ))
            return self._make_bool_type()
        
        # Logical operators
        elif binop.op in [BinaryOpKind.AND, BinaryOpKind.OR]:
            # Both operands must be bool, result is bool
            bool_type = self._make_bool_type()
            self.constraints.append(Constraint(
                kind=ConstraintKind.EQUALITY,
                left=left_type,
                right=bool_type,
                span=binop.left.span,
            ))
            self.constraints.append(Constraint(
                kind=ConstraintKind.EQUALITY,
                left=right_type,
                right=bool_type,
                span=binop.right.span,
            ))
            return bool_type
        
        else:
            # Default: fresh type variable
            return self.fresh_type_var()
    
    def _infer_unary_op(self, unop: UnaryOp, env: TypeEnvironment) -> InferredType:
        """Infer type of a unary operation."""
        operand_type = self._infer_expr(unop.operand, env)
        
        if unop.op == UnaryOpKind.NOT:
            # Operand must be bool, result is bool
            bool_type = self._make_bool_type()
            self.constraints.append(Constraint(
                kind=ConstraintKind.EQUALITY,
                left=operand_type,
                right=bool_type,
                span=unop.operand.span,
            ))
            return bool_type
        elif unop.op == UnaryOpKind.NEG:
            # Operand must be numeric, result is same type
            return operand_type
        elif unop.op in [UnaryOpKind.REF, UnaryOpKind.REF_MUT]:
            # Return reference type
            # This will be handled by borrow checker
            return operand_type
        else:
            return self.fresh_type_var()
    
    def _infer_function_call(self, call: FunctionCall, env: TypeEnvironment) -> InferredType:
        """Infer type of a function call."""
        # Infer function type
        func_type = self._infer_expr(call.function, env)
        
        # Infer argument types
        arg_types = [self._infer_expr(arg, env) for arg in call.args]
        
        # Create fresh return type variable
        return_type = self.fresh_type_var()
        
        # Constrain function to be a function type
        expected_func_type = FunctionInferredType(
            param_types=arg_types,
            return_type=return_type,
            effects=[],  # Effects will be unified
        )
        
        self.constraints.append(Constraint(
            kind=ConstraintKind.EQUALITY,
            left=func_type,
            right=expected_func_type,
            span=call.span,
        ))
        
        return return_type
    
    def _infer_method_call(self, call: MethodCall, env: TypeEnvironment) -> InferredType:
        """Infer type of a method call."""
        # Infer receiver type
        receiver_type = self._infer_expr(call.object, env)
        
        # For now, treat as function call with receiver as first argument
        # Full implementation would look up methods in type's impl blocks
        return self.fresh_type_var()
    
    def _infer_if_expr(self, if_expr: IfExpr, env: TypeEnvironment) -> InferredType:
        """Infer type of an if expression."""
        # Condition must be bool
        cond_type = self._infer_expr(if_expr.condition, env)
        bool_type = self._make_bool_type()
        self.constraints.append(Constraint(
            kind=ConstraintKind.EQUALITY,
            left=cond_type,
            right=bool_type,
            span=if_expr.condition.span,
        ))
        
        # Infer then and else branch types
        then_type = self._infer_expr(if_expr.then_branch, env)
        
        if if_expr.else_branch:
            else_type = self._infer_expr(if_expr.else_branch, env)
            # Both branches must have same type
            self.constraints.append(Constraint(
                kind=ConstraintKind.EQUALITY,
                left=then_type,
                right=else_type,
                span=if_expr.span,
            ))
            return then_type
        else:
            # No else branch - expression has unit type
            return self._make_unit_type()
    
    def _infer_match_expr(self, match: MatchExpr, env: TypeEnvironment) -> InferredType:
        """Infer type of a match expression."""
        # Infer scrutinee type
        scrutinee_type = self._infer_expr(match.scrutinee, env)
        
        # Check all arms
        arm_types = []
        for arm in match.arms:
            # Check pattern against scrutinee type
            pattern_env = self._check_pattern(arm.pattern, scrutinee_type, env)
            
            # Infer arm body type
            arm_type = self._infer_expr(arm.body, pattern_env)
            arm_types.append(arm_type)
        
        if not arm_types:
            return self.fresh_type_var()
        
        # All arms must have same type
        result_type = arm_types[0]
        for arm_type in arm_types[1:]:
            self.constraints.append(Constraint(
                kind=ConstraintKind.EQUALITY,
                left=result_type,
                right=arm_type,
                span=match.span,
            ))
        
        # TODO: Check exhaustiveness
        
        return result_type
    
    def _infer_block_expr(self, block: BlockExpr, env: TypeEnvironment) -> InferredType:
        """Infer type of a block expression."""
        block_env = TypeEnvironment(parent=env)
        
        # Process statements
        for stmt in block.statements:
            self._check_statement(stmt, block_env)
        
        # Block type is type of last expression (or unit)
        if block.expr:
            return self._infer_expr(block.expr, block_env)
        else:
            return self._make_unit_type()
    
    def _infer_lambda_expr(self, lambda_expr: LambdaExpr, env: TypeEnvironment) -> InferredType:
        """Infer type of a lambda expression."""
        # Create parameter types
        param_types = []
        lambda_env = env
        for param in lambda_expr.params:
            if param.type:
                param_type = self._ast_type_to_inferred(param.type)
            else:
                param_type = self.fresh_type_var()
            param_types.append(param_type)
            
            param_scheme = TypeScheme(quantified_vars=[], body=param_type)
            lambda_env = lambda_env.extend(param.name, param_scheme)
        
        # Infer body type
        body_type = self._infer_expr(lambda_expr.body, lambda_env)
        
        return FunctionInferredType(
            param_types=param_types,
            return_type=body_type,
            effects=[],
        )
    
    def _infer_field_access(self, access: FieldAccess, env: TypeEnvironment) -> InferredType:
        """Infer type of field access."""
        # Infer base expression type
        base_type = self._infer_expr(access.object, env)
        
        # For now, return fresh type variable
        # Full implementation would look up field type in struct definition
        return self.fresh_type_var()
    
    def _infer_tuple_expr(self, tuple_expr: TupleExpr, env: TypeEnvironment) -> InferredType:
        """Infer type of a tuple expression."""
        element_types = [self._infer_expr(elem, env) for elem in tuple_expr.elements]
        # Would return TupleInferredType in full implementation
        return self.fresh_type_var()
    
    def _infer_array_expr(self, array: ArrayExpr, env: TypeEnvironment) -> InferredType:
        """Infer type of an array expression."""
        if not array.elements:
            # Empty array - need type annotation
            return self.fresh_type_var()
        
        # All elements must have same type
        element_types = [self._infer_expr(elem, env) for elem in array.elements]
        array_elem_type = element_types[0]
        for elem_type in element_types[1:]:
            self.constraints.append(Constraint(
                kind=ConstraintKind.EQUALITY,
                left=array_elem_type,
                right=elem_type,
                span=array.span,
            ))
        
        # Return array type
        return GenericInferredType(name="Array", args=[array_elem_type])
    
    def _infer_struct_expr(self, struct: StructExpr, env: TypeEnvironment) -> InferredType:
        """Infer type of a struct expression."""
        # Would look up struct definition and check fields
        # For now, return fresh type variable
        return self.fresh_type_var()
    
    def _infer_cast_expr(self, cast: CastExpr, env: TypeEnvironment) -> InferredType:
        """Infer type of a cast expression."""
        # Infer expression type
        expr_type = self._infer_expr(cast.expr, env)
        
        # Convert target type
        target_type = self._ast_type_to_inferred(cast.target_type)
        
        # Cast doesn't create constraints - it's an explicit conversion
        return target_type
    
    def _infer_try_expr(self, try_expr: TryExpr, env: TypeEnvironment) -> InferredType:
        """Infer type of a try expression (? operator)."""
        # Infer inner expression type - must be Result<T, E>
        inner_type = self._infer_expr(try_expr.expr, env)
        
        # Extract T from Result<T, E>
        result_value_type = self.fresh_type_var()
        result_error_type = self.fresh_type_var()
        
        expected_result_type = GenericInferredType(
            name="Result",
            args=[result_value_type, result_error_type]
        )
        
        self.constraints.append(Constraint(
            kind=ConstraintKind.EQUALITY,
            left=inner_type,
            right=expected_result_type,
            span=try_expr.expr.span,
        ))
        
        # ? operator unwraps to T
        return result_value_type
    
    def _check_statement(self, stmt: Statement, env: TypeEnvironment) -> None:
        """Type check a statement."""
        if isinstance(stmt, LetStmt):
            self._check_let_stmt(stmt, env)
        elif isinstance(stmt, AssignStmt):
            self._check_assign_stmt(stmt, env)
        elif isinstance(stmt, ExprStmt):
            # Just infer the expression type
            self._infer_expr(stmt.expr, env)
        elif isinstance(stmt, ReturnStmt):
            if stmt.value:
                self._infer_expr(stmt.value, env)
    
    def _check_let_stmt(self, let: LetStmt, env: TypeEnvironment) -> None:
        """Type check a let statement."""
        # Infer initializer type
        init_type = self._infer_expr(let.value, env)
        
        # If type annotation present, constrain to match
        if let.type:
            declared_type = self._ast_type_to_inferred(let.type)
            self.constraints.append(Constraint(
                kind=ConstraintKind.EQUALITY,
                left=init_type,
                right=declared_type,
                span=let.value.span,
            ))
            final_type = declared_type
        else:
            final_type = init_type
        
        # Generalize and bind in environment
        scheme = generalize(env.free_vars(), final_type)
        
        # Handle pattern binding
        if isinstance(let.pattern, IdentifierPattern):
            env.bind(let.pattern.name, scheme)
        # TODO: Handle other pattern types
    
    def _check_assign_stmt(self, assign: AssignStmt, env: TypeEnvironment) -> None:
        """Type check an assignment statement."""
        # Infer left and right side types
        left_type = self._infer_expr(assign.target, env)
        right_type = self._infer_expr(assign.value, env)
        
        # Types must match
        self.constraints.append(Constraint(
            kind=ConstraintKind.EQUALITY,
            left=left_type,
            right=right_type,
            span=assign.span,
        ))
    
    def _check_pattern(self, pattern: Pattern, scrutinee_type: InferredType, 
                       env: TypeEnvironment) -> TypeEnvironment:
        """Check a pattern and return extended environment with bindings."""
        if isinstance(pattern, IdentifierPattern):
            # Bind identifier to scrutinee type
            scheme = TypeScheme(quantified_vars=[], body=scrutinee_type)
            return env.extend(pattern.name, scheme)
        elif isinstance(pattern, WildcardPattern):
            # Wildcard doesn't bind anything
            return env
        elif isinstance(pattern, LiteralPattern):
            # Check literal type matches scrutinee
            lit_type = self._infer_literal(pattern.literal)
            self.constraints.append(Constraint(
                kind=ConstraintKind.EQUALITY,
                left=scrutinee_type,
                right=lit_type,
                span=pattern.span,
            ))
            return env
        # TODO: Handle other pattern types
        return env
    
    def _ast_type_to_inferred(self, ast_type: Type) -> InferredType:
        """Convert an AST type to an inferred type."""
        if isinstance(ast_type, PrimitiveType):
            return ConcreteType(ast_type)
        elif isinstance(ast_type, PathType):
            if ast_type.generic_args:
                args = [self._ast_type_to_inferred(arg) for arg in ast_type.generic_args]
                return GenericInferredType(
                    name="::".join(ast_type.segments),
                    args=args
                )
            else:
                return ConcreteType(ast_type)
        elif isinstance(ast_type, BrandedType):
            base = self._ast_type_to_inferred(ast_type.base_type)
            return BrandedInferredType(
                brand_name=ast_type.brand_name,
                base_type=base
            )
        elif isinstance(ast_type, FunctionType):
            params = [self._ast_type_to_inferred(p) for p in ast_type.params]
            ret = self._ast_type_to_inferred(ast_type.return_type) if ast_type.return_type else self._make_unit_type()
            return FunctionInferredType(
                param_types=params,
                return_type=ret,
                effects=ast_type.effects
            )
        elif isinstance(ast_type, ReferenceType):
            # References handled by borrow checker
            inner = self._ast_type_to_inferred(ast_type.inner)
            return inner
        elif isinstance(ast_type, TupleType):
            # Would create TupleInferredType
            return self.fresh_type_var()
        elif isinstance(ast_type, ArrayType):
            elem = self._ast_type_to_inferred(ast_type.element)
            return GenericInferredType(name="Array", args=[elem])
        else:
            return self.fresh_type_var()
    
    # Helper methods to create common types
    
    def _make_int_type(self, size: str) -> InferredType:
        """Create an integer type."""
        from ..ast.types import PrimitiveType, PrimitiveKind
        from ..span import dummy_span
        kind = PrimitiveKind.from_string(size)
        return ConcreteType(PrimitiveType(kind=kind, span=dummy_span()))
    
    def _make_float_type(self, size: str) -> InferredType:
        """Create a float type."""
        from ..ast.types import PrimitiveType, PrimitiveKind
        from ..span import dummy_span
        kind = PrimitiveKind.from_string(size)
        return ConcreteType(PrimitiveType(kind=kind, span=dummy_span()))
    
    def _make_bool_type(self) -> InferredType:
        """Create a bool type."""
        from ..ast.types import PrimitiveType, PrimitiveKind
        from ..span import dummy_span
        return ConcreteType(PrimitiveType(kind=PrimitiveKind.BOOL, span=dummy_span()))
    
    def _make_char_type(self) -> InferredType:
        """Create a char type."""
        from ..ast.types import PrimitiveType, PrimitiveKind
        from ..span import dummy_span
        return ConcreteType(PrimitiveType(kind=PrimitiveKind.CHAR, span=dummy_span()))
    
    def _make_string_type(self) -> InferredType:
        """Create a string type."""
        from ..ast.types import PrimitiveType, PrimitiveKind
        from ..span import dummy_span
        return ConcreteType(PrimitiveType(kind=PrimitiveKind.STR, span=dummy_span()))
    
    def _make_unit_type(self) -> InferredType:
        """Create a unit type ()."""
        from ..ast.types import TupleType
        from ..span import dummy_span
        return ConcreteType(TupleType(elements=[], span=dummy_span()))

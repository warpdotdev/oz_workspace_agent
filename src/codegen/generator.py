"""Code generator: AST -> IR.

Converts Veritas AST to Intermediate Representation, preparing for backend code generation.
"""

from typing import Dict, List, Optional, Set
from dataclasses import dataclass

from ..ast import nodes
from ..ast.types import Type, Effect, PrimitiveKind, PrimitiveType, PathType, ReferenceType, TupleType, ArrayType
from ..ir.ir import *
from ..type_checker.types import InferredType, TypeVariable, ConcreteType, FunctionInferredType
from ..type_checker.checker import TypeChecker


class CodeGenerator:
    """Generates IR from type-checked AST."""
    
    def __init__(self, type_checker: Optional[TypeChecker] = None):
        self.type_checker = type_checker
        self.current_module: Optional[IRModule] = None
        self.current_function: Optional[IRFunction] = None
        self.current_block: Optional[IRBasicBlock] = None
        self.temp_counter = 0
        self.block_counter = 0
        self.value_map: Dict[str, IRValue] = {}  # Maps AST names to IR values
        
    def generate_module(self, program: nodes.Program) -> IRModule:
        """Generate IR module from AST program."""
        module_name = "main"
        self.current_module = IRModule(name=module_name)
        
        # First pass: collect type definitions
        for item in program.items:
            if isinstance(item, nodes.StructDef):
                self._register_struct(item)
            elif isinstance(item, nodes.EnumDef):
                self._register_enum(item)
            elif isinstance(item, nodes.TypeAlias):
                self._register_type_alias(item)
        
        # Second pass: generate code for functions and implementations
        for item in program.items:
            if isinstance(item, nodes.FunctionDef):
                self._generate_function(item)
            elif isinstance(item, nodes.ConstDef):
                self._generate_const(item)
            elif isinstance(item, nodes.ImplBlock):
                self._generate_impl_block(item)
        
        return self.current_module
    
    def _register_struct(self, struct_def: nodes.StructDef):
        """Register struct type in module."""
        fields = []
        for field in struct_def.fields:
            field_type = self._convert_ast_type(field.type)
            fields.append((field.name, field_type))
        
        ir_type = IRType(
            kind=IRTypeKind.STRUCT,
            name=struct_def.name,
            fields=fields
        )
        self.current_module.add_type(struct_def.name, ir_type)
    
    def _register_enum(self, enum_def: nodes.EnumDef):
        """Register enum type in module."""
        ir_type = IRType(
            kind=IRTypeKind.ENUM,
            name=enum_def.name
        )
        self.current_module.add_type(enum_def.name, ir_type)
    
    def _register_type_alias(self, type_alias: nodes.TypeAlias):
        """Register type alias (including branded types)."""
        from ..ast.types import BrandedType
        
        if isinstance(type_alias.aliased_type, BrandedType):
            # For branded types, convert the base type correctly
            base_type = self._convert_ast_type(type_alias.aliased_type.base_type)
            ir_type = IRType(
                kind=IRTypeKind.BRANDED,
                name=type_alias.aliased_type.brand_name,  # Use brand_name from BrandedType
                inner=base_type
            )
        else:
            ir_type = self._convert_ast_type(type_alias.aliased_type)
        
        self.current_module.add_type(type_alias.name, ir_type)
    
    def _generate_function(self, func_def: nodes.FunctionDef):
        """Generate IR for function definition."""
        # Create IR function
        params = []
        for param in func_def.params:
            param_type = self._convert_ast_type(param.type)
            ir_param = IRValue(
                kind=IRValueKind.PARAMETER,
                name=param.name,
                type=param_type
            )
            params.append(ir_param)
            self.value_map[param.name] = ir_param
        
        return_type = self._convert_ast_type(func_def.return_type) if func_def.return_type else IRType(kind=IRTypeKind.VOID)
        
        ir_func = IRFunction(
            name=func_def.name,
            params=params,
            return_type=return_type,
            effects=func_def.effects
        )
        
        self.current_function = ir_func
        self.current_module.add_function(ir_func)
        
        # Create entry block
        entry_block = self._new_block("entry")
        self.current_block = entry_block
        ir_func.add_block(entry_block)
        
        # Generate function body
        if func_def.body:
            result = self._generate_expr(func_def.body)
            
            # Add return if not already terminated
            if not self.current_block.is_terminated():
                if result and return_type.kind != IRTypeKind.VOID:
                    self._emit(IRInstruction(
                        opcode=IROpcode.RETURN,
                        operands=[result]
                    ))
                else:
                    self._emit(IRInstruction(opcode=IROpcode.RETURN))
        
        # Clear context
        self.current_function = None
        self.current_block = None
        self.value_map.clear()
        self.temp_counter = 0
        self.block_counter = 0
    
    def _generate_const(self, const_def: nodes.ConstDef):
        """Generate IR for constant definition."""
        const_type = self._convert_ast_type(const_def.type)
        const_value = self._generate_expr(const_def.value)
        
        ir_const = IRValue(
            kind=IRValueKind.GLOBAL,
            name=const_def.name,
            type=const_type,
            constant_value=const_value
        )
        self.current_module.add_global(ir_const)
    
    def _generate_impl_block(self, impl_block: nodes.ImplBlock):
        """Generate IR for impl block methods."""
        for method in impl_block.methods:
            self._generate_function(method)
    
    def _generate_stmt(self, stmt: nodes.Statement):
        """Generate IR for statement."""
        if isinstance(stmt, nodes.LetStmt):
            self._generate_let_stmt(stmt)
        elif isinstance(stmt, nodes.AssignStmt):
            self._generate_assign_stmt(stmt)
        elif isinstance(stmt, nodes.ExprStmt):
            self._generate_expr(stmt.expr)
        elif isinstance(stmt, nodes.ReturnStmt):
            if stmt.value:
                value = self._generate_expr(stmt.value)
                self._emit(IRInstruction(
                    opcode=IROpcode.RETURN,
                    operands=[value]
                ))
            else:
                self._emit(IRInstruction(opcode=IROpcode.RETURN))
        elif isinstance(stmt, nodes.BreakStmt):
            # TODO: Handle break with loop context
            pass
        elif isinstance(stmt, nodes.ContinueStmt):
            # TODO: Handle continue with loop context
            pass
    
    def _generate_let_stmt(self, let_stmt: nodes.LetStmt):
        """Generate IR for let statement."""
        var_type = self._convert_ast_type(let_stmt.type) if let_stmt.type else None
        
        # Allocate local variable
        local = IRValue(
            kind=IRValueKind.LOCAL,
            name=let_stmt.name,
            type=var_type or IRType(kind=IRTypeKind.I32)  # Default type if not specified
        )
        
        self.current_function.add_local(local)
        self.value_map[let_stmt.name] = local
        
        # Allocate storage
        self._emit(IRInstruction(
            opcode=IROpcode.ALLOC,
            result=local,
            type=local.type
        ))
        
        # Initialize if value provided
        if let_stmt.value:
            value = self._generate_expr(let_stmt.value)
            self._emit(IRInstruction(
                opcode=IROpcode.STORE,
                operands=[local, value]
            ))
    
    def _generate_assign_stmt(self, assign_stmt: nodes.AssignStmt):
        """Generate IR for assignment statement."""
        target = self._generate_lvalue(assign_stmt.target)
        value = self._generate_expr(assign_stmt.value)
        
        self._emit(IRInstruction(
            opcode=IROpcode.STORE,
            operands=[target, value]
        ))
    
    def _generate_lvalue(self, expr: nodes.Expression) -> IRValue:
        """Generate IR for lvalue (assignable expression)."""
        if isinstance(expr, nodes.Identifier):
            return self.value_map[expr.name]
        elif isinstance(expr, nodes.FieldAccess):
            # TODO: Handle field lvalues
            obj = self._generate_expr(expr.object)
            temp = self._new_temp(IRType(kind=IRTypeKind.I32))
            self._emit(IRInstruction(
                opcode=IROpcode.STRUCT_GET,
                result=temp,
                operands=[obj],
                field_name=expr.field
            ))
            return temp
        elif isinstance(expr, nodes.IndexAccess):
            # TODO: Handle index lvalues
            obj = self._generate_expr(expr.object)
            index = self._generate_expr(expr.index)
            temp = self._new_temp(IRType(kind=IRTypeKind.I32))
            self._emit(IRInstruction(
                opcode=IROpcode.ARRAY_GET,
                result=temp,
                operands=[obj, index]
            ))
            return temp
        else:
            raise ValueError(f"Invalid lvalue: {type(expr)}")
    
    def _generate_expr(self, expr: nodes.Expression) -> IRValue:
        """Generate IR for expression."""
        if isinstance(expr, nodes.Literal):
            return self._generate_literal(expr)
        elif isinstance(expr, nodes.Identifier):
            return self._generate_identifier(expr)
        elif isinstance(expr, nodes.BinaryOp):
            return self._generate_binary_op(expr)
        elif isinstance(expr, nodes.UnaryOp):
            return self._generate_unary_op(expr)
        elif isinstance(expr, nodes.FunctionCall):
            return self._generate_call(expr)
        elif isinstance(expr, nodes.MethodCall):
            return self._generate_method_call(expr)
        elif isinstance(expr, nodes.FieldAccess):
            return self._generate_field_access(expr)
        elif isinstance(expr, nodes.IndexAccess):
            return self._generate_index_access(expr)
        elif isinstance(expr, nodes.IfExpr):
            return self._generate_if_expr(expr)
        elif isinstance(expr, nodes.MatchExpr):
            return self._generate_match_expr(expr)
        elif isinstance(expr, nodes.BlockExpr):
            return self._generate_block_expr(expr)
        elif isinstance(expr, nodes.StructExpr):
            return self._generate_struct_expr(expr)
        elif isinstance(expr, nodes.TupleExpr):
            return self._generate_tuple_expr(expr)
        elif isinstance(expr, nodes.ArrayExpr):
            return self._generate_array_expr(expr)
        elif isinstance(expr, nodes.CastExpr):
            return self._generate_cast_expr(expr)
        elif isinstance(expr, nodes.TryExpr):
            return self._generate_try_expr(expr)
        elif isinstance(expr, nodes.ForExpr):
            return self._generate_for_expr(expr)
        elif isinstance(expr, nodes.WhileExpr):
            return self._generate_while_expr(expr)
        elif isinstance(expr, nodes.LoopExpr):
            return self._generate_loop_expr(expr)
        else:
            # TODO: Handle other expression types
            return self._new_temp(IRType(kind=IRTypeKind.I32))
    
    def _generate_literal(self, lit: nodes.Literal) -> IRValue:
        """Generate IR for literal."""
        self.temp_counter += 1
        lit_type = self._literal_type(lit.kind)
        return IRValue(
            kind=IRValueKind.CONSTANT,
            name=f"const_{self.temp_counter}",
            type=lit_type,
            constant_value=lit.value
        )
    
    def _generate_identifier(self, ident: nodes.Identifier) -> IRValue:
        """Generate IR for identifier."""
        if ident.name in self.value_map:
            var = self.value_map[ident.name]
            # Load value from local/parameter
            temp = self._new_temp(var.type)
            self._emit(IRInstruction(
                opcode=IROpcode.LOAD,
                result=temp,
                operands=[var]
            ))
            return temp
        else:
            # Unknown identifier - create placeholder
            return self._new_temp(IRType(kind=IRTypeKind.I32))
    
    def _generate_binary_op(self, binop: nodes.BinaryOp) -> IRValue:
        """Generate IR for binary operation."""
        left = self._generate_expr(binop.left)
        right = self._generate_expr(binop.right)
        
        opcode_map = {
            nodes.BinaryOpKind.ADD: IROpcode.ADD,
            nodes.BinaryOpKind.SUB: IROpcode.SUB,
            nodes.BinaryOpKind.MUL: IROpcode.MUL,
            nodes.BinaryOpKind.DIV: IROpcode.DIV,
            nodes.BinaryOpKind.MOD: IROpcode.MOD,
            nodes.BinaryOpKind.EQ: IROpcode.EQ,
            nodes.BinaryOpKind.NE: IROpcode.NE,
            nodes.BinaryOpKind.LT: IROpcode.LT,
            nodes.BinaryOpKind.GT: IROpcode.GT,
            nodes.BinaryOpKind.LE: IROpcode.LE,
            nodes.BinaryOpKind.GE: IROpcode.GE,
            nodes.BinaryOpKind.AND: IROpcode.AND,
            nodes.BinaryOpKind.OR: IROpcode.OR,
            nodes.BinaryOpKind.BIT_AND: IROpcode.AND,
            nodes.BinaryOpKind.BIT_OR: IROpcode.OR,
            nodes.BinaryOpKind.BIT_XOR: IROpcode.XOR,
            nodes.BinaryOpKind.SHL: IROpcode.SHL,
            nodes.BinaryOpKind.SHR: IROpcode.SHR,
        }
        
        opcode = opcode_map.get(binop.op, IROpcode.ADD)
        result = self._new_temp(left.type)
        
        self._emit(IRInstruction(
            opcode=opcode,
            result=result,
            operands=[left, right]
        ))
        
        return result
    
    def _generate_unary_op(self, unop: nodes.UnaryOp) -> IRValue:
        """Generate IR for unary operation."""
        operand = self._generate_expr(unop.operand)
        
        if unop.op == nodes.UnaryOpKind.NEG:
            result = self._new_temp(operand.type)
            self._emit(IRInstruction(
                opcode=IROpcode.NEG,
                result=result,
                operands=[operand]
            ))
            return result
        elif unop.op == nodes.UnaryOpKind.NOT:
            result = self._new_temp(IRType(kind=IRTypeKind.BOOL))
            self._emit(IRInstruction(
                opcode=IROpcode.NOT,
                result=result,
                operands=[operand]
            ))
            return result
        elif unop.op == nodes.UnaryOpKind.REF:
            result = self._new_temp(IRType(
                kind=IRTypeKind.POINTER,
                inner=operand.type,
                mutable=False
            ))
            self._emit(IRInstruction(
                opcode=IROpcode.BORROW,
                result=result,
                operands=[operand]
            ))
            return result
        elif unop.op == nodes.UnaryOpKind.REF_MUT:
            result = self._new_temp(IRType(
                kind=IRTypeKind.POINTER,
                inner=operand.type,
                mutable=True
            ))
            self._emit(IRInstruction(
                opcode=IROpcode.BORROW_MUT,
                result=result,
                operands=[operand]
            ))
            return result
        elif unop.op == nodes.UnaryOpKind.DEREF:
            result = self._new_temp(operand.type.inner if operand.type.inner else operand.type)
            self._emit(IRInstruction(
                opcode=IROpcode.LOAD,
                result=result,
                operands=[operand]
            ))
            return result
        else:
            return operand
    
    def _generate_call(self, call: nodes.FunctionCall) -> IRValue:
        """Generate IR for function call."""
        args = [self._generate_expr(arg) for arg in call.args]
        
        # Get function name
        func_name = ""
        if isinstance(call.function, nodes.Identifier):
            func_name = call.function.name
        elif isinstance(call.function, nodes.PathExpr):
            func_name = "::".join(call.function.segments)
        
        # Create result temporary
        result = self._new_temp(IRType(kind=IRTypeKind.I32))  # TODO: Get actual return type
        
        self._emit(IRInstruction(
            opcode=IROpcode.CALL,
            result=result,
            operands=args,
            function_name=func_name
        ))
        
        return result
    
    def _generate_method_call(self, call: nodes.MethodCall) -> IRValue:
        """Generate IR for method call."""
        obj = self._generate_expr(call.object)
        args = [obj] + [self._generate_expr(arg) for arg in call.args]
        
        result = self._new_temp(IRType(kind=IRTypeKind.I32))
        
        self._emit(IRInstruction(
            opcode=IROpcode.CALL,
            result=result,
            operands=args,
            function_name=call.method
        ))
        
        return result
    
    def _generate_field_access(self, field_access: nodes.FieldAccess) -> IRValue:
        """Generate IR for field access."""
        obj = self._generate_expr(field_access.object)
        result = self._new_temp(IRType(kind=IRTypeKind.I32))  # TODO: Get field type
        
        self._emit(IRInstruction(
            opcode=IROpcode.STRUCT_GET,
            result=result,
            operands=[obj],
            field_name=field_access.field
        ))
        
        return result
    
    def _generate_index_access(self, index_access: nodes.IndexAccess) -> IRValue:
        """Generate IR for index access."""
        obj = self._generate_expr(index_access.object)
        index = self._generate_expr(index_access.index)
        result = self._new_temp(IRType(kind=IRTypeKind.I32))
        
        self._emit(IRInstruction(
            opcode=IROpcode.ARRAY_GET,
            result=result,
            operands=[obj, index]
        ))
        
        return result
    
    def _generate_if_expr(self, if_expr: nodes.IfExpr) -> IRValue:
        """Generate IR for if expression."""
        cond = self._generate_expr(if_expr.condition)
        
        then_block = self._new_block("if.then")
        else_block = self._new_block("if.else")
        merge_block = self._new_block("if.merge")
        
        # Conditional branch
        self._emit(IRInstruction(
            opcode=IROpcode.BR_COND,
            operands=[cond],
            label=then_block.label
        ))
        
        # Then branch
        self.current_block = then_block
        self.current_function.add_block(then_block)
        then_val = self._generate_expr(if_expr.then_branch)
        if not self.current_block.is_terminated():
            self._emit(IRInstruction(opcode=IROpcode.BR, label=merge_block.label))
        
        # Else branch
        self.current_block = else_block
        self.current_function.add_block(else_block)
        else_val = None
        if if_expr.else_branch:
            else_val = self._generate_expr(if_expr.else_branch)
        if not self.current_block.is_terminated():
            self._emit(IRInstruction(opcode=IROpcode.BR, label=merge_block.label))
        
        # Merge block
        self.current_block = merge_block
        self.current_function.add_block(merge_block)
        
        # TODO: Handle phi node for result
        return then_val if then_val else self._new_temp(IRType(kind=IRTypeKind.VOID))
    
    def _generate_match_expr(self, match_expr: nodes.MatchExpr) -> IRValue:
        """Generate IR for match expression."""
        scrutinee = self._generate_expr(match_expr.scrutinee)
        
        # TODO: Implement match lowering with exhaustiveness checking
        # For now, just generate arms sequentially
        
        result = self._new_temp(IRType(kind=IRTypeKind.I32))
        return result
    
    def _generate_block_expr(self, block: nodes.BlockExpr) -> Optional[IRValue]:
        """Generate IR for block expression."""
        result = None
        
        for stmt in block.statements:
            self._generate_stmt(stmt)
        
        if block.expr:
            result = self._generate_expr(block.expr)
        
        return result
    
    def _generate_struct_expr(self, struct_expr: nodes.StructExpr) -> IRValue:
        """Generate IR for struct instantiation."""
        field_values = []
        for field_name, field_expr in struct_expr.fields:
            value = self._generate_expr(field_expr)
            field_values.append(value)
        
        result = self._new_temp(IRType(kind=IRTypeKind.STRUCT, name=struct_expr.name))
        self._emit(IRInstruction(
            opcode=IROpcode.STRUCT_NEW,
            result=result,
            operands=field_values
        ))
        
        return result
    
    def _generate_tuple_expr(self, tuple_expr: nodes.TupleExpr) -> IRValue:
        """Generate IR for tuple expression."""
        elements = [self._generate_expr(elem) for elem in tuple_expr.elements]
        
        result = self._new_temp(IRType(kind=IRTypeKind.TUPLE))
        self._emit(IRInstruction(
            opcode=IROpcode.TUPLE_NEW,
            result=result,
            operands=elements
        ))
        
        return result
    
    def _generate_array_expr(self, array_expr: nodes.ArrayExpr) -> IRValue:
        """Generate IR for array expression."""
        elements = [self._generate_expr(elem) for elem in array_expr.elements]
        
        result = self._new_temp(IRType(kind=IRTypeKind.ARRAY))
        self._emit(IRInstruction(
            opcode=IROpcode.ARRAY_NEW,
            result=result,
            operands=elements
        ))
        
        return result
    
    def _generate_cast_expr(self, cast_expr: nodes.CastExpr) -> IRValue:
        """Generate IR for cast expression."""
        value = self._generate_expr(cast_expr.expr)
        target_type = self._convert_ast_type(cast_expr.target_type)
        
        result = self._new_temp(target_type)
        self._emit(IRInstruction(
            opcode=IROpcode.CAST,
            result=result,
            operands=[value],
            type=target_type
        ))
        
        return result
    
    def _generate_try_expr(self, try_expr: nodes.TryExpr) -> IRValue:
        """Generate IR for try expression (? operator)."""
        # TODO: Implement proper try/catch lowering
        value = self._generate_expr(try_expr.expr)
        return value
    
    def _generate_for_expr(self, for_expr: nodes.ForExpr) -> IRValue:
        """Generate IR for for loop."""
        # TODO: Implement for loop lowering
        return self._new_temp(IRType(kind=IRTypeKind.VOID))
    
    def _generate_while_expr(self, while_expr: nodes.WhileExpr) -> IRValue:
        """Generate IR for while loop."""
        loop_header = self._new_block("while.header")
        loop_body = self._new_block("while.body")
        loop_exit = self._new_block("while.exit")
        
        # Branch to header
        self._emit(IRInstruction(opcode=IROpcode.BR, label=loop_header.label))
        
        # Header: check condition
        self.current_block = loop_header
        self.current_function.add_block(loop_header)
        cond = self._generate_expr(while_expr.condition)
        self._emit(IRInstruction(
            opcode=IROpcode.BR_COND,
            operands=[cond],
            label=loop_body.label
        ))
        self._emit(IRInstruction(opcode=IROpcode.BR, label=loop_exit.label))
        
        # Body
        self.current_block = loop_body
        self.current_function.add_block(loop_body)
        self._generate_expr(while_expr.body)
        if not self.current_block.is_terminated():
            self._emit(IRInstruction(opcode=IROpcode.BR, label=loop_header.label))
        
        # Exit
        self.current_block = loop_exit
        self.current_function.add_block(loop_exit)
        
        return self._new_temp(IRType(kind=IRTypeKind.VOID))
    
    def _generate_loop_expr(self, loop_expr: nodes.LoopExpr) -> IRValue:
        """Generate IR for infinite loop."""
        loop_body = self._new_block("loop.body")
        
        # Branch to body
        self._emit(IRInstruction(opcode=IROpcode.BR, label=loop_body.label))
        
        # Body
        self.current_block = loop_body
        self.current_function.add_block(loop_body)
        self._generate_expr(loop_expr.body)
        if not self.current_block.is_terminated():
            self._emit(IRInstruction(opcode=IROpcode.BR, label=loop_body.label))
        
        return self._new_temp(IRType(kind=IRTypeKind.VOID))
    
    # Helper methods
    
    def _convert_ast_type(self, ast_type: Optional[Type]) -> IRType:
        """Convert AST type to IR type."""
        from ..ast.types import BrandedType
        
        if ast_type is None:
            return IRType(kind=IRTypeKind.VOID)
        
        if isinstance(ast_type, PrimitiveType):
            kind_map = {
                PrimitiveKind.I8: IRTypeKind.I8,
                PrimitiveKind.I16: IRTypeKind.I16,
                PrimitiveKind.I32: IRTypeKind.I32,
                PrimitiveKind.I64: IRTypeKind.I64,
                PrimitiveKind.I128: IRTypeKind.I128,
                PrimitiveKind.U8: IRTypeKind.U8,
                PrimitiveKind.U16: IRTypeKind.U16,
                PrimitiveKind.U32: IRTypeKind.U32,
                PrimitiveKind.U64: IRTypeKind.U64,
                PrimitiveKind.U128: IRTypeKind.U128,
                PrimitiveKind.F32: IRTypeKind.F32,
                PrimitiveKind.F64: IRTypeKind.F64,
                PrimitiveKind.BOOL: IRTypeKind.BOOL,
                PrimitiveKind.CHAR: IRTypeKind.CHAR,
                PrimitiveKind.STR: IRTypeKind.STRING,
            }
            return IRType(kind=kind_map.get(ast_type.kind, IRTypeKind.I32))
        
        elif isinstance(ast_type, BrandedType):
            base_type = self._convert_ast_type(ast_type.base_type)
            return IRType(
                kind=IRTypeKind.BRANDED,
                name=ast_type.brand_name,
                inner=base_type
            )
        
        elif isinstance(ast_type, PathType):
            # For now, treat as struct
            return IRType(kind=IRTypeKind.STRUCT, name="::".join(ast_type.segments))
        
        elif isinstance(ast_type, ReferenceType):
            inner = self._convert_ast_type(ast_type.inner)
            return IRType(
                kind=IRTypeKind.POINTER,
                inner=inner,
                mutable=ast_type.mutable
            )
        
        elif isinstance(ast_type, TupleType):
            fields = [(f"_{i}", self._convert_ast_type(elem)) for i, elem in enumerate(ast_type.elements)]
            return IRType(kind=IRTypeKind.TUPLE, fields=fields)
        
        elif isinstance(ast_type, ArrayType):
            elem_type = self._convert_ast_type(ast_type.element)
            return IRType(kind=IRTypeKind.ARRAY, inner=elem_type)
        
        else:
            return IRType(kind=IRTypeKind.I32)
    
    def _literal_type(self, kind: nodes.LiteralKind) -> IRType:
        """Get IR type for literal kind."""
        kind_map = {
            nodes.LiteralKind.INT: IRType(kind=IRTypeKind.I32),
            nodes.LiteralKind.FLOAT: IRType(kind=IRTypeKind.F64),
            nodes.LiteralKind.STRING: IRType(kind=IRTypeKind.STRING),
            nodes.LiteralKind.CHAR: IRType(kind=IRTypeKind.CHAR),
            nodes.LiteralKind.BOOL: IRType(kind=IRTypeKind.BOOL),
        }
        return kind_map.get(kind, IRType(kind=IRTypeKind.I32))
    
    def _new_temp(self, ty: IRType) -> IRValue:
        """Create new temporary value."""
        self.temp_counter += 1
        return IRValue(
            kind=IRValueKind.TEMP,
            name=f"t{self.temp_counter}",
            type=ty
        )
    
    def _new_block(self, name: str) -> IRBasicBlock:
        """Create new basic block."""
        self.block_counter += 1
        return IRBasicBlock(label=f"{name}_{self.block_counter}")
    
    def _emit(self, instr: IRInstruction):
        """Emit instruction to current block."""
        if self.current_block:
            self.current_block.add_instruction(instr)

"""Parser tests for the Veritas language.

Tests all grammar productions and example programs from the syntax specification.
"""

import sys
import os
sys.path.insert(0, os.path.dirname(os.path.dirname(os.path.abspath(__file__))))

import unittest
from src.parser import Parser
from src.ast.nodes import *
from src.ast.types import *


class TestLexer(unittest.TestCase):
    """Test the lexer component."""
    
    def test_keywords(self):
        """Test keyword tokenization."""
        from src.lexer import Lexer, TokenKind
        
        code = "fn struct enum if else match for while loop let mut const return"
        lexer = Lexer(code)
        tokens = lexer.tokenize()
        
        expected = [
            TokenKind.FN, TokenKind.STRUCT, TokenKind.ENUM,
            TokenKind.IF, TokenKind.ELSE, TokenKind.MATCH,
            TokenKind.FOR, TokenKind.WHILE, TokenKind.LOOP,
            TokenKind.LET, TokenKind.MUT, TokenKind.CONST,
            TokenKind.RETURN, TokenKind.EOF,
        ]
        
        for i, exp in enumerate(expected):
            self.assertEqual(tokens[i].kind, exp, f"Token {i} should be {exp}")
    
    def test_operators(self):
        """Test operator tokenization."""
        from src.lexer import Lexer, TokenKind
        
        code = "+ - * / % == != < > <= >= && || ! & | ^ << >>"
        lexer = Lexer(code)
        tokens = lexer.tokenize()
        
        expected = [
            TokenKind.PLUS, TokenKind.MINUS, TokenKind.STAR, TokenKind.SLASH,
            TokenKind.PERCENT, TokenKind.EQ, TokenKind.NE, TokenKind.LT,
            TokenKind.GT, TokenKind.LE, TokenKind.GE, TokenKind.AND,
            TokenKind.OR, TokenKind.NOT, TokenKind.AMPERSAND, TokenKind.PIPE,
            TokenKind.CARET, TokenKind.SHL, TokenKind.SHR, TokenKind.EOF,
        ]
        
        for i, exp in enumerate(expected):
            self.assertEqual(tokens[i].kind, exp, f"Token {i} should be {exp}")
    
    def test_literals(self):
        """Test literal tokenization."""
        from src.lexer import Lexer, TokenKind
        
        code = '42 3.14 "hello" \'a\' true false 0xFF 0b1010'
        lexer = Lexer(code)
        tokens = lexer.tokenize()
        
        self.assertEqual(tokens[0].kind, TokenKind.INT_LITERAL)
        self.assertEqual(tokens[0].value, 42)
        
        self.assertEqual(tokens[1].kind, TokenKind.FLOAT_LITERAL)
        self.assertAlmostEqual(tokens[1].value, 3.14)
        
        self.assertEqual(tokens[2].kind, TokenKind.STRING_LITERAL)
        self.assertEqual(tokens[2].value, "hello")
        
        self.assertEqual(tokens[3].kind, TokenKind.CHAR_LITERAL)
        self.assertEqual(tokens[3].value, 'a')
        
        self.assertEqual(tokens[4].kind, TokenKind.BOOL_LITERAL)
        self.assertEqual(tokens[4].value, True)
        
        self.assertEqual(tokens[5].kind, TokenKind.BOOL_LITERAL)
        self.assertEqual(tokens[5].value, False)
        
        self.assertEqual(tokens[6].kind, TokenKind.INT_LITERAL)
        self.assertEqual(tokens[6].value, 0xFF)
        
        self.assertEqual(tokens[7].kind, TokenKind.INT_LITERAL)
        self.assertEqual(tokens[7].value, 0b1010)


class TestFunctionDef(unittest.TestCase):
    """Test function definition parsing."""
    
    def test_simple_function(self):
        """Test parsing a simple function."""
        code = """
        fn add(x: i32, y: i32) -> i32 {
            x + y
        }
        """
        parser = Parser(code)
        program = parser.parse()
        
        self.assertEqual(len(program.items), 1)
        func = program.items[0]
        self.assertIsInstance(func, FunctionDef)
        self.assertEqual(func.name, "add")
        self.assertEqual(len(func.params), 2)
        self.assertEqual(func.params[0].name, "x")
        self.assertEqual(func.params[1].name, "y")
    
    def test_function_with_effects(self):
        """Test parsing a function with effect annotations."""
        code = """
        fn read_file(path: str) -> Result<String, IOError> !IO + Error<IOError> {
            let file = open(path)?;
            file.read_to_string()
        }
        """
        parser = Parser(code)
        program = parser.parse()
        
        self.assertEqual(len(program.items), 1)
        func = program.items[0]
        self.assertIsInstance(func, FunctionDef)
        self.assertEqual(func.name, "read_file")
        self.assertEqual(len(func.effects), 2)
        self.assertEqual(func.effects[0].kind, EffectKind.IO)
        self.assertEqual(func.effects[1].kind, EffectKind.ERROR)
    
    def test_generic_function(self):
        """Test parsing a generic function."""
        code = """
        fn map<T, U>(list: List<T>, f: fn(T) -> U) -> List<U> {
            let mut result = List::new();
            for item in list {
                result.push(f(item));
            }
            result
        }
        """
        parser = Parser(code)
        program = parser.parse()
        
        self.assertEqual(len(program.items), 1)
        func = program.items[0]
        self.assertIsInstance(func, FunctionDef)
        self.assertEqual(len(func.generic_params), 2)
        self.assertEqual(func.generic_params[0].name, "T")
        self.assertEqual(func.generic_params[1].name, "U")


class TestStructDef(unittest.TestCase):
    """Test struct definition parsing."""
    
    def test_simple_struct(self):
        """Test parsing a simple struct."""
        code = """
        struct User {
            id: u64,
            name: String,
            email: String,
        }
        """
        parser = Parser(code)
        program = parser.parse()
        
        self.assertEqual(len(program.items), 1)
        struct = program.items[0]
        self.assertIsInstance(struct, StructDef)
        self.assertEqual(struct.name, "User")
        self.assertEqual(len(struct.fields), 3)
    
    def test_generic_struct(self):
        """Test parsing a generic struct."""
        code = """
        struct Container<T> {
            value: T,
        }
        """
        parser = Parser(code)
        program = parser.parse()
        
        struct = program.items[0]
        self.assertEqual(len(struct.generic_params), 1)
        self.assertEqual(struct.generic_params[0].name, "T")


class TestEnumDef(unittest.TestCase):
    """Test enum definition parsing."""
    
    def test_simple_enum(self):
        """Test parsing a simple enum."""
        code = """
        enum Option<T> {
            Some(T),
            None,
        }
        """
        parser = Parser(code)
        program = parser.parse()
        
        self.assertEqual(len(program.items), 1)
        enum = program.items[0]
        self.assertIsInstance(enum, EnumDef)
        self.assertEqual(enum.name, "Option")
        self.assertEqual(len(enum.variants), 2)
        self.assertEqual(enum.variants[0].name, "Some")
        self.assertEqual(enum.variants[1].name, "None")


class TestTypeAlias(unittest.TestCase):
    """Test type alias parsing."""
    
    def test_branded_type(self):
        """Test parsing a branded type alias."""
        code = """
        type UserId = u64 as UserId;
        """
        parser = Parser(code)
        program = parser.parse()
        
        self.assertEqual(len(program.items), 1)
        alias = program.items[0]
        self.assertIsInstance(alias, TypeAlias)
        self.assertEqual(alias.name, "UserId")
        self.assertIsInstance(alias.aliased_type, BrandedType)


class TestExpressions(unittest.TestCase):
    """Test expression parsing."""
    
    def test_binary_operations(self):
        """Test parsing binary operations with precedence."""
        code = """
        fn main() {
            let x = 1 + 2 * 3;
        }
        """
        parser = Parser(code)
        program = parser.parse()
        
        func = program.items[0]
        let_stmt = func.body.statements[0]
        expr = let_stmt.value
        
        # Should be 1 + (2 * 3)
        self.assertIsInstance(expr, BinaryOp)
        self.assertEqual(expr.op, BinaryOpKind.ADD)
        self.assertIsInstance(expr.right, BinaryOp)
        self.assertEqual(expr.right.op, BinaryOpKind.MUL)
    
    def test_if_expression(self):
        """Test parsing if expression."""
        code = """
        fn test() -> i32 {
            if x > 0 { 1 } else { 0 }
        }
        """
        parser = Parser(code)
        program = parser.parse()
        
        func = program.items[0]
        if_expr = func.body.expr
        self.assertIsInstance(if_expr, IfExpr)
        self.assertIsNotNone(if_expr.else_branch)
    
    def test_match_expression(self):
        """Test parsing match expression."""
        code = """
        fn test(opt: Option<i32>) -> i32 {
            match opt {
                Some(x) => x,
                None => 0,
            }
        }
        """
        parser = Parser(code)
        program = parser.parse()
        
        func = program.items[0]
        match_expr = func.body.expr
        self.assertIsInstance(match_expr, MatchExpr)
        self.assertEqual(len(match_expr.arms), 2)
    
    def test_method_call(self):
        """Test parsing method calls."""
        code = """
        fn test() {
            list.push(42);
        }
        """
        parser = Parser(code)
        program = parser.parse()
        
        func = program.items[0]
        expr_stmt = func.body.statements[0]
        call = expr_stmt.expr
        self.assertIsInstance(call, MethodCall)
        self.assertEqual(call.method, "push")
    
    def test_try_expression(self):
        """Test parsing try expression (?)."""
        code = """
        fn test() -> Result<i32, Error> {
            let x = some_fn()?;
            Ok(x)
        }
        """
        parser = Parser(code)
        program = parser.parse()
        
        func = program.items[0]
        let_stmt = func.body.statements[0]
        self.assertIsInstance(let_stmt.value, TryExpr)
    
    def test_lambda_expression(self):
        """Test parsing lambda expressions."""
        code = """
        fn test() {
            let f = |x, y| x + y;
        }
        """
        parser = Parser(code)
        program = parser.parse()
        
        func = program.items[0]
        let_stmt = func.body.statements[0]
        self.assertIsInstance(let_stmt.value, LambdaExpr)
        self.assertEqual(len(let_stmt.value.params), 2)


class TestPatterns(unittest.TestCase):
    """Test pattern parsing."""
    
    def test_identifier_pattern(self):
        """Test parsing identifier patterns."""
        code = """
        fn test() {
            let x = 42;
        }
        """
        parser = Parser(code)
        program = parser.parse()
        # Simple let with identifier pattern
        self.assertEqual(len(program.items), 1)
    
    def test_tuple_pattern(self):
        """Test parsing tuple patterns in for loops."""
        code = """
        fn test() {
            for (k, v) in map {
                println(k);
            }
        }
        """
        parser = Parser(code)
        program = parser.parse()
        
        func = program.items[0]
        for_expr = func.body.statements[0].expr
        self.assertIsInstance(for_expr, ForExpr)
        self.assertIsInstance(for_expr.pattern, TuplePattern)


class TestImports(unittest.TestCase):
    """Test import parsing."""
    
    def test_simple_import(self):
        """Test parsing simple imports."""
        code = """
        import std::collections::HashMap;
        """
        parser = Parser(code)
        program = parser.parse()
        
        self.assertEqual(len(program.items), 1)
        import_stmt = program.items[0]
        self.assertIsInstance(import_stmt, Import)
        self.assertEqual(import_stmt.path, ["std", "collections", "HashMap"])
    
    def test_multi_import(self):
        """Test parsing multi-item imports."""
        code = """
        import std::io::{File, read_to_string};
        """
        parser = Parser(code)
        program = parser.parse()
        
        import_stmt = program.items[0]
        self.assertEqual(import_stmt.items, ["File", "read_to_string"])


class TestExamplePrograms(unittest.TestCase):
    """Test parsing example programs from the syntax specification."""
    
    def test_hello_world(self):
        """Test parsing Hello World example."""
        code = """
        fn main() !IO {
            println("Hello, World!");
        }
        """
        parser = Parser(code)
        program = parser.parse()
        
        self.assertEqual(len(parser.errors), 0, f"Errors: {parser.errors}")
        self.assertEqual(len(program.items), 1)
        func = program.items[0]
        self.assertEqual(func.name, "main")
        self.assertEqual(len(func.effects), 1)
        self.assertEqual(func.effects[0].kind, EffectKind.IO)
    
    def test_authentication_system(self):
        """Test parsing authentication system example."""
        code = """
        type UserId = u64 as UserId;
        type SessionId = u64 as SessionId;
        
        struct User {
            id: UserId,
            username: String,
            password_hash: String,
        }
        
        struct Session {
            id: SessionId,
            user_id: UserId,
        }
        
        enum AuthError {
            UserNotFound,
            InvalidPassword,
            DatabaseError(String),
        }
        
        fn authenticate(username: String, password: String) 
            -> Result<Session, AuthError> !IO + Error<AuthError> {
            let user = Database::find_user(username)?;
            if verify_password(password, user.password_hash) {
                Ok(Session { id: SessionId::generate(), user_id: user.id })
            } else {
                Err(AuthError::InvalidPassword)
            }
        }
        """
        parser = Parser(code)
        program = parser.parse()
        
        # Should parse without errors
        self.assertEqual(len(parser.errors), 0, f"Errors: {parser.errors}")
        # Should have: 2 type aliases, 2 structs, 1 enum, 1 function = 6 items
        self.assertEqual(len(program.items), 6)
    
    def test_http_server(self):
        """Test parsing HTTP server example."""
        code = """
        import std::net::TcpListener;
        
        type Port = u16 as Port;
        
        struct Request {
            method: String,
            path: String,
            headers: Map<String, String>,
            body: String,
        }
        
        fn handle_request(stream: TcpStream) -> Result<(), IOError> !IO + Error<IOError> {
            let request = parse_request(stream)?;
            let response = route(request);
            write_response(stream, response)?;
            Ok(())
        }
        
        fn start_server(port: Port) -> Result<(), IOError> !IO + Error<IOError> {
            let listener = TcpListener::bind(port)?;
            for stream in listener.incoming() {
                match stream {
                    Ok(s) => {
                        handle_request(s);
                    },
                    Err(e) => {
                        log_error(e);
                    },
                }
            }
            Ok(())
        }
        """
        parser = Parser(code)
        program = parser.parse()
        
        self.assertEqual(len(parser.errors), 0, f"Errors: {parser.errors}")
    
    def test_fibonacci(self):
        """Test parsing Fibonacci example."""
        code = """
        fn fibonacci(n: u64) -> u64 {
            if n <= 1 { n } else { fibonacci(n - 1) + fibonacci(n - 2) }
        }
        """
        parser = Parser(code)
        program = parser.parse()
        
        self.assertEqual(len(parser.errors), 0, f"Errors: {parser.errors}")
        func = program.items[0]
        self.assertEqual(func.name, "fibonacci")
    
    def test_ownership_example(self):
        """Test parsing ownership and borrowing example."""
        code = """
        fn take_ownership(s: String) {
            println(s);
        }
        
        fn borrow_data(s: &String) -> i32 {
            s.len()
        }
        
        fn modify_data(s: &mut String) {
            s.push_str(" world");
        }
        """
        parser = Parser(code)
        program = parser.parse()
        
        self.assertEqual(len(parser.errors), 0, f"Errors: {parser.errors}")
        self.assertEqual(len(program.items), 3)
    
    def test_trait_and_impl(self):
        """Test parsing trait and impl blocks."""
        code = """
        trait Serialize {
            fn serialize(&self) -> String;
        }
        
        impl Serialize for User {
            fn serialize(&self) -> String {
                format("{{id: {}}}", self.id)
            }
        }
        """
        parser = Parser(code)
        program = parser.parse()
        
        self.assertEqual(len(parser.errors), 0, f"Errors: {parser.errors}")
        self.assertEqual(len(program.items), 2)
        self.assertIsInstance(program.items[0], TraitDef)
        self.assertIsInstance(program.items[1], ImplBlock)
    
    def test_generic_container(self):
        """Test parsing generic containers."""
        code = """
        struct Container<T> {
            value: T,
        }
        
        impl<T> Container<T> {
            fn new(value: T) -> Container<T> {
                Container { value: value }
            }
            
            fn get(&self) -> &T {
                &self.value
            }
        }
        """
        parser = Parser(code)
        program = parser.parse()
        
        self.assertEqual(len(parser.errors), 0, f"Errors: {parser.errors}")
    
    def test_async_example(self):
        """Test parsing async code."""
        code = """
        fn fetch_data(url: String) -> Future<String> !Async + IO {
            let response = http::get(url).await?;
            response.text().await
        }
        """
        parser = Parser(code)
        program = parser.parse()
        
        self.assertEqual(len(parser.errors), 0, f"Errors: {parser.errors}")
    
    def test_pattern_matching(self):
        """Test comprehensive pattern matching."""
        code = """
        fn describe(value: Value) -> String {
            match value {
                Value::Int(0) => "zero",
                Value::Int(n) if n > 0 => "positive",
                Value::Int(_) => "negative",
                Value::String(s) => s,
                Value::List([]) => "empty list",
                Value::List([first, ..]) => first,
                _ => "unknown",
            }
        }
        """
        parser = Parser(code)
        program = parser.parse()
        
        self.assertEqual(len(parser.errors), 0, f"Errors: {parser.errors}")
    
    def test_contracts(self):
        """Test parsing contracts."""
        code = """
        fn divide(a: i32, b: i32) -> i32 {
            requires b != 0;
            a / b
        }
        """
        parser = Parser(code)
        program = parser.parse()
        
        self.assertEqual(len(parser.errors), 0, f"Errors: {parser.errors}")
        func = program.items[0]
        self.assertEqual(len(func.contracts), 1)
        self.assertEqual(func.contracts[0].kind, ContractKind.REQUIRES)


class TestErrorRecovery(unittest.TestCase):
    """Test error recovery and error messages."""
    
    def test_missing_semicolon(self):
        """Test error recovery from missing semicolon."""
        code = """
        fn test() {
            let x = 42
            let y = 43;
        }
        """
        parser = Parser(code)
        program = parser.parse()
        
        # Should report error but continue parsing
        self.assertGreater(len(parser.errors), 0)
    
    def test_missing_brace(self):
        """Test error recovery from missing brace."""
        code = """
        fn test()
            let x = 42;
        }
        """
        parser = Parser(code)
        program = parser.parse()
        
        # Should report error
        self.assertGreater(len(parser.errors), 0)


if __name__ == "__main__":
    unittest.main()

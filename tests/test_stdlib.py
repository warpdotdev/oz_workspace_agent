"""
Tests for Veritas Standard Library type definitions
"""

import unittest
import sys
import os

# Add src to path
sys.path.insert(0, os.path.join(os.path.dirname(__file__), '..', 'src'))

from stdlib.core import option, result, ordering, ops
from stdlib.collections import list_type, map_type, set_type, string_type
from stdlib.json import value as json_value


class TestCoreTypes(unittest.TestCase):
    """Test core type definitions"""
    
    def test_option_type(self):
        """Test Option<T> type definition"""
        opt_def = option.OPTION_TYPE.get_type_definition()
        self.assertEqual(opt_def['kind'], 'enum')
        self.assertEqual(opt_def['name'], 'Option')
        self.assertEqual(opt_def['type_params'], ['T'])
        self.assertEqual(len(opt_def['variants']), 2)
        self.assertIn('Some', [v['name'] for v in opt_def['variants']])
        self.assertIn('None', [v['name'] for v in opt_def['variants']])
        
        # Check methods exist
        method_names = [m['name'] for m in opt_def['methods']]
        self.assertIn('is_some', method_names)
        self.assertIn('is_none', method_names)
        self.assertIn('unwrap', method_names)
        self.assertIn('map', method_names)
        self.assertIn('and_then', method_names)
        self.assertIn('filter', method_names)
        self.assertIn('ok_or', method_names)
    
    def test_result_type(self):
        """Test Result<T, E> type definition"""
        result_def = result.RESULT_TYPE.get_type_definition()
        self.assertEqual(result_def['kind'], 'enum')
        self.assertEqual(result_def['name'], 'Result')
        self.assertEqual(result_def['type_params'], ['T', 'E'])
        self.assertEqual(len(result_def['variants']), 2)
        
        variant_names = [v['name'] for v in result_def['variants']]
        self.assertIn('Ok', variant_names)
        self.assertIn('Err', variant_names)
        
        # Check methods
        method_names = [m['name'] for m in result_def['methods']]
        self.assertIn('is_ok', method_names)
        self.assertIn('is_err', method_names)
        self.assertIn('unwrap', method_names)
        self.assertIn('map', method_names)
        self.assertIn('map_err', method_names)
        self.assertIn('and_then', method_names)
    
    def test_ordering_type(self):
        """Test Ordering enum"""
        ordering_def = ordering.ORDERING_TYPE.get_type_definition()
        self.assertEqual(ordering_def['kind'], 'enum')
        self.assertEqual(ordering_def['name'], 'Ordering')
        variant_names = [v['name'] for v in ordering_def['variants']]
        self.assertEqual(variant_names, ['Less', 'Equal', 'Greater'])
    
    def test_core_traits(self):
        """Test core trait definitions"""
        self.assertEqual(ops.EQ_TRAIT.name, 'Eq')
        self.assertEqual(ops.ORD_TRAIT.name, 'Ord')
        self.assertEqual(ops.HASH_TRAIT.name, 'Hash')
        self.assertEqual(ops.CLONE_TRAIT.name, 'Clone')
        self.assertEqual(ops.DEFAULT_TRAIT.name, 'Default')
        
        # Check all traits are in the list
        self.assertEqual(len(ops.ALL_TRAITS), 8)


class TestCollections(unittest.TestCase):
    """Test collection type definitions"""
    
    def test_list_type(self):
        """Test List<T> type definition"""
        list_def = list_type.LIST_TYPE.get_type_definition()
        self.assertEqual(list_def['kind'], 'struct')
        self.assertEqual(list_def['name'], 'List')
        self.assertEqual(list_def['type_params'], ['T'])
        
        method_names = [m['name'] for m in list_def['methods']]
        # Construction
        self.assertIn('new', method_names)
        self.assertIn('with_capacity', method_names)
        # Access
        self.assertIn('get', method_names)
        self.assertIn('at', method_names)
        # Modification
        self.assertIn('push', method_names)
        self.assertIn('pop', method_names)
        self.assertIn('insert', method_names)
        self.assertIn('remove', method_names)
        # Transformations
        self.assertIn('map', method_names)
        self.assertIn('filter', method_names)
        self.assertIn('fold', method_names)
        # Sorting
        self.assertIn('sort', method_names)
    
    def test_map_type(self):
        """Test Map<K, V> type definition"""
        map_def = map_type.MAP_TYPE.get_type_definition()
        self.assertEqual(map_def['kind'], 'struct')
        self.assertEqual(map_def['name'], 'Map')
        self.assertEqual(map_def['type_params'], ['K', 'V'])
        self.assertEqual(map_def['bounds'], ['K: Hash + Eq'])
        
        method_names = [m['name'] for m in map_def['methods']]
        self.assertIn('new', method_names)
        self.assertIn('get', method_names)
        self.assertIn('insert', method_names)
        self.assertIn('remove', method_names)
        self.assertIn('contains_key', method_names)
    
    def test_set_type(self):
        """Test Set<T> type definition"""
        set_def = set_type.SET_TYPE.get_type_definition()
        self.assertEqual(set_def['kind'], 'struct')
        self.assertEqual(set_def['name'], 'Set')
        self.assertEqual(set_def['type_params'], ['T'])
        self.assertEqual(set_def['bounds'], ['T: Hash + Eq'])
        
        method_names = [m['name'] for m in set_def['methods']]
        self.assertIn('new', method_names)
        self.assertIn('insert', method_names)
        self.assertIn('remove', method_names)
        self.assertIn('contains', method_names)
        # Set operations
        self.assertIn('union', method_names)
        self.assertIn('intersection', method_names)
        self.assertIn('difference', method_names)
    
    def test_string_type(self):
        """Test String type definition"""
        string_def = string_type.STRING_TYPE.get_type_definition()
        self.assertEqual(string_def['kind'], 'struct')
        self.assertEqual(string_def['name'], 'String')
        
        method_names = [m['name'] for m in string_def['methods']]
        # Construction
        self.assertIn('new', method_names)
        self.assertIn('from_str', method_names)
        # Modification
        self.assertIn('push', method_names)
        self.assertIn('push_str', method_names)
        self.assertIn('pop', method_names)
        # Transformations
        self.assertIn('to_uppercase', method_names)
        self.assertIn('to_lowercase', method_names)
        self.assertIn('trim', method_names)
        # Search
        self.assertIn('contains', method_names)
        self.assertIn('starts_with', method_names)
        self.assertIn('ends_with', method_names)
        # Replace
        self.assertIn('replace', method_names)


class TestJSON(unittest.TestCase):
    """Test JSON type definitions"""
    
    def test_json_value_type(self):
        """Test JsonValue enum"""
        json_def = json_value.JSON_VALUE_TYPE.get_type_definition()
        self.assertEqual(json_def['kind'], 'enum')
        self.assertEqual(json_def['name'], 'JsonValue')
        
        variant_names = [v['name'] for v in json_def['variants']]
        self.assertEqual(variant_names, ['Null', 'Bool', 'Number', 'String', 'Array', 'Object'])
        
        method_names = [m['name'] for m in json_def['methods']]
        self.assertIn('is_null', method_names)
        self.assertIn('as_bool', method_names)
        self.assertIn('as_number', method_names)
        self.assertIn('as_string', method_names)
        self.assertIn('get', method_names)


class TestIOTypes(unittest.TestCase):
    """Test I/O type definitions"""
    
    def test_io_imports(self):
        """Test that I/O modules import correctly"""
        from stdlib.io import file, stream, buffer, path
        
        # Check file types exist
        self.assertIsNotNone(file.IO_ERROR_TYPE)
        self.assertIsNotNone(file.FILE_TYPE)
        self.assertEqual(file.FILE_TYPE['name'], 'File')
        
        # Check stream traits
        self.assertEqual(stream.READ_TRAIT['name'], 'Read')
        self.assertEqual(stream.WRITE_TRAIT['name'], 'Write')
        
        # Check buffer types
        self.assertEqual(buffer.BUF_READER_TYPE['name'], 'BufReader')
        self.assertEqual(buffer.BUF_WRITER_TYPE['name'], 'BufWriter')
        
        # Check path type
        self.assertEqual(path.PATH_TYPE['name'], 'Path')
    
    def test_io_effects(self):
        """Test that I/O operations have IO effect"""
        from stdlib.io import file
        
        # File open should have IO effect
        open_method = next(m for m in file.FILE_TYPE['methods'] if m['name'] == 'open')
        self.assertEqual(open_method['effects'], ['IO'])


class TestTimeTypes(unittest.TestCase):
    """Test time type definitions"""
    
    def test_time_imports(self):
        """Test that time modules import correctly"""
        from stdlib.time import instant, duration, datetime
        
        # Check types exist
        self.assertEqual(instant.INSTANT_TYPE['name'], 'Instant')
        self.assertEqual(duration.DURATION_TYPE['name'], 'Duration')
        self.assertEqual(datetime.DATETIME_TYPE['name'], 'DateTime')


class TestMathModule(unittest.TestCase):
    """Test math module"""
    
    def test_math_imports(self):
        """Test that math modules import correctly"""
        from stdlib.math import numeric, random
        
        # Check constants
        self.assertAlmostEqual(numeric.MATH_CONSTANTS['PI'], 3.14159, places=5)
        self.assertAlmostEqual(numeric.MATH_CONSTANTS['E'], 2.71828, places=5)
        
        # Check functions exist
        func_names = [f['name'] for f in numeric.MATH_FUNCTIONS]
        self.assertIn('abs', func_names)
        self.assertIn('sqrt', func_names)
        self.assertIn('sin', func_names)
        self.assertIn('cos', func_names)
        
        # Check RNG type
        self.assertEqual(random.RNG_TYPE['name'], 'Rng')


class TestStdlibIntegration(unittest.TestCase):
    """Test overall stdlib integration"""
    
    def test_stdlib_imports(self):
        """Test that stdlib package imports correctly"""
        import stdlib
        
        # Check all submodules are accessible
        self.assertIsNotNone(stdlib.option)
        self.assertIsNotNone(stdlib.result)
        self.assertIsNotNone(stdlib.list_type)
        self.assertIsNotNone(stdlib.map_type)
    
    def test_type_definition_consistency(self):
        """Test that all type definitions follow consistent structure"""
        from stdlib.core import option, result
        from stdlib.collections import list_type, string_type
        
        # All types should have 'kind' and 'name'
        for type_def_obj in [option.OPTION_TYPE, result.RESULT_TYPE, 
                             list_type.LIST_TYPE, string_type.STRING_TYPE]:
            type_def = type_def_obj.get_type_definition()
            self.assertIn('kind', type_def)
            self.assertIn('name', type_def)
            
            # Enums should have variants, structs should have fields
            if type_def['kind'] == 'enum':
                self.assertIn('variants', type_def)
            elif type_def['kind'] == 'struct':
                self.assertIn('fields', type_def)


if __name__ == '__main__':
    unittest.main()

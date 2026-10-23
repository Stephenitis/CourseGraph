"""Regression tests for the source grammar, run with python3 web/scripts/test_ingest_mit.py."""
import importlib.util
import json
import pathlib
import unittest
import sys
sys.dont_write_bytecode = True

spec = importlib.util.spec_from_file_location('ingest_mit', pathlib.Path(__file__).with_name('ingest-mit.py'))
ingest = importlib.util.module_from_spec(spec)
spec.loader.exec_module(ingest)

class SourceParserTests(unittest.TestCase):
    def test_nested_and_or(self):
        result = ingest.parse('6.1000/(6.100A, (6.100B/16.C20))')
        self.assertEqual(result['kind'], 'any')
        self.assertEqual(result['items'][1]['kind'], 'all')
        self.assertEqual(result['items'][1]['items'][1]['kind'], 'any')
        self.assertEqual(set(ingest.refs(result)), {'6.1000', '6.100A', '6.100B', '16.C20'})

    def test_literal_permission_and_free_text(self):
        self.assertEqual(ingest.parse("''permission of instructor''")['kind'], 'permission')
        self.assertEqual(ingest.parse("''Knowledge of differentiation and elementary integration''")['kind'], 'unknown')
        self.assertEqual(ingest.parse("''consult instructor/department, if needed''")['kind'], 'unknown')

    def test_known_gir_alternatives_and_unknown_gir(self):
        self.assertEqual(ingest.parse('GIR:CAL2')['kind'], 'any')
        self.assertIn('18.02', ingest.refs(ingest.parse('GIR:CAL2')))
        self.assertEqual(ingest.parse('GIR:SOMETHING')['kind'], 'unknown')

    def test_unbalanced_input_fails_instead_of_silently_changing_logic(self):
        with self.assertRaises(ValueError): ingest.parse('6.1000/(6.100A, 6.100B')

    def test_official_fall_2026_programming_update_overrides_older_term_flags(self):
        courses = {course['id']: course for course in ingest.normalize(json.loads(ingest.SNAPSHOT.read_text()))}
        self.assertEqual(courses['6.1903']['terms'], ['Fall', 'Spring'])
        self.assertEqual(courses['6.1904']['terms'], [])
        self.assertIn('6.1903', ingest.refs(courses['6.1910']['prerequisites']))
        self.assertNotIn('6.1903', ingest.refs(courses['6.1910']['corequisites']))
        self.assertIn('6.1904', ingest.refs(courses['6.1910']['prerequisites']), 'Historical earned credit must remain representable')
        for course_id in ['6.1903', '6.1904', '6.1910']:
            self.assertTrue(any(ingest.PROGRAMMING_UPDATE_URL in note for note in courses[course_id]['notes']))

if __name__ == '__main__': unittest.main()

import importlib.util
import json
from pathlib import Path
import unittest


PROJECT_ROOT = Path(__file__).resolve().parents[1]
APP_PATH = PROJECT_ROOT / "portal" / "modules" / "utentes" / "app.py"
SPEC = importlib.util.spec_from_file_location("utentes_app", APP_PATH)
UTENTES_APP = importlib.util.module_from_spec(SPEC)
SPEC.loader.exec_module(UTENTES_APP)


class UtentesReadonlyViewTests(unittest.TestCase):
    def test_readonly_initializers_run_without_edit_form(self):
        script = UTENTES_APP.APP_SCRIPT
        diagram_init = script.index(
            'document.querySelectorAll("[data-diagram-editor]").forEach(initDiagramEditor);'
        )
        text_resize = script.index("autoResizeReadonlyTextareas();")
        form_guard = script.index("if (!form) {", diagram_init)

        self.assertLess(diagram_init, form_guard)
        self.assertLess(text_resize, form_guard)

    def test_readonly_diagnostic_view_preserves_and_exposes_both_diagrams(self):
        genogram = json.dumps(
            {
                "nodes": [{"id": "g1", "type": "male", "label": "Pai Teste"}],
                "edges": [],
            }
        )
        ecomap = json.dumps(
            {
                "nodes": [{"id": "e1", "type": "person", "label": "Rede Teste"}],
                "edges": [],
            }
        )

        html = UTENTES_APP.render_diagnostica_form(
            {"diag_genograma": genogram, "diag_ecomapa": ecomap},
            readonly=True,
        )

        self.assertEqual(html.count("data-diagram-editor"), 2)
        self.assertEqual(html.count('data-readonly="1"'), 2)
        self.assertIn('name="diag_genograma"', html)
        self.assertIn('name="diag_ecomapa"', html)
        self.assertIn("Pai Teste", html)
        self.assertIn("Rede Teste", html)

    def test_readonly_diagnostic_view_keeps_every_saved_text_field(self):
        choice_fields = {
            "diag_estado_civil",
            "diag_relacao_juridica",
            "diag_antipsicotico_injetavel",
            "diag_sono_acorda_antes",
        }
        data = {
            field: f"readonly-value-{index}"
            for index, field in enumerate(UTENTES_APP.DIAGNOSTICA_TEXT_FIELDS)
            if field not in choice_fields
        }

        html = UTENTES_APP.render_diagnostica_form(data, readonly=True)

        missing = [value for value in data.values() if value not in html]
        self.assertEqual(missing, [])

    def test_readonly_diagnostic_view_keeps_saved_choices_selected(self):
        data = {
            "diag_estado_civil": "casado",
            "diag_relacao_juridica": "estagio",
            "diag_antipsicotico_injetavel": "sim",
            "diag_sono_acorda_antes": "nao",
        }

        html = UTENTES_APP.render_diagnostica_form(data, readonly=True)

        for field, value in data.items():
            marker = f'name="{field}" value="{value}" checked disabled'
            self.assertIn(marker, html)

    def test_gender_prefers_explicit_inscription_value(self):
        row = {"nome": "Pessoa Teste"}
        diagnostic = {
            "diag_genograma": json.dumps(
                {
                    "nodes": [
                        {
                            "id": "g1",
                            "type": "male",
                            "label": "Pessoa Teste",
                            "primary": True,
                        }
                    ],
                    "edges": [],
                }
            )
        }

        gender = UTENTES_APP.utente_gender_for_stats(
            row,
            {"ins_genero": "mulher"},
            diagnostic,
        )

        self.assertEqual(gender, "mulher")

    def test_gender_uses_primary_person_from_genogram_as_fallback(self):
        row = {"nome": "Pessoa Teste"}
        diagnostic = {
            "diag_genograma": json.dumps(
                {
                    "nodes": [
                        {"id": "g1", "type": "female", "label": "Familiar"},
                        {
                            "id": "g2",
                            "type": "male",
                            "label": "Pessoa Teste",
                            "primary": True,
                        },
                    ],
                    "edges": [],
                }
            )
        }

        gender = UTENTES_APP.utente_gender_for_stats(row, {}, diagnostic)

        self.assertEqual(gender, "homem")

    def test_gender_chart_shows_men_women_and_missing_data(self):
        html = UTENTES_APP.render_gender_chart_card(
            [
                {"name": "Homens", "count": 10, "percentage": 40},
                {"name": "Mulheres", "count": 12, "percentage": 48},
                {"name": "Outro / sem indicação", "count": 3, "percentage": 12},
            ],
            25,
        )

        self.assertIn("Distribuição por género", html)
        self.assertIn("Homens: 10", html)
        self.assertIn("Mulheres: 12", html)
        self.assertIn("Outro ou sem indicação: 3", html)
        self.assertIn("--gender-men-end: 40%", html)
        self.assertIn("--gender-women-end: 88%", html)


if __name__ == "__main__":
    unittest.main()

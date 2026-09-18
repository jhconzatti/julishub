import unittest

from fastapi.testclient import TestClient
from pydantic import ValidationError

from app import app
from routers.calculators import FinanciamentoInput


class SalaryCalculator2026Tests(unittest.TestCase):
    @classmethod
    def setUpClass(cls):
        cls.client = TestClient(app)

    def calculate(self, salary, dependents=0, other_discounts=0):
        return self.client.post("/api/salario-liquido", json={
            "salario_bruto": salary,
            "dependentes": dependents,
            "outros_descontos": other_discounts,
        })

    def test_salary_below_first_inss_bracket(self):
        response = self.calculate(1000)

        self.assertEqual(response.status_code, 200)
        self.assertEqual(response.json()["inss"], 75.00)
        self.assertEqual(response.json()["irrf"], 0.00)

    def test_salary_4000_uses_2026_inss_and_zero_irrf(self):
        response = self.calculate(4000)

        self.assertEqual(response.status_code, 200)
        self.assertEqual(response.json()["inss"], 368.60)
        self.assertEqual(response.json()["irrf"], 0.00)
        self.assertEqual(response.json()["salario_liquido"], 3631.40)

    def test_salary_5000_uses_full_irrf_reduction(self):
        response = self.calculate(5000)

        self.assertEqual(response.status_code, 200)
        self.assertEqual(response.json()["inss"], 501.51)
        self.assertEqual(response.json()["irrf"], 0.00)
        self.assertEqual(response.json()["salario_liquido"], 4498.49)

    def test_salary_6000_uses_partial_irrf_reduction(self):
        response = self.calculate(6000)

        self.assertEqual(response.status_code, 200)
        self.assertEqual(response.json()["inss"], 641.51)
        self.assertEqual(response.json()["irrf"], 385.10)
        self.assertEqual(response.json()["salario_liquido"], 4973.39)

    def test_inss_is_capped_above_maximum_contribution_salary(self):
        salary_10000 = self.calculate(10000)
        salary_20000 = self.calculate(20000)

        self.assertEqual(salary_10000.status_code, 200)
        self.assertEqual(salary_20000.status_code, 200)
        self.assertEqual(salary_10000.json()["inss"], 988.09)
        self.assertEqual(salary_20000.json()["inss"], 988.09)

    def test_dependents_reduce_irrf_through_legal_deductions(self):
        without_dependents = self.calculate(8000)
        with_dependents = self.calculate(8000, dependents=2)

        self.assertEqual(without_dependents.json()["irrf"], 1037.85)
        self.assertEqual(with_dependents.json()["irrf"], 933.58)

    def test_simplified_deduction_wins_when_more_advantageous(self):
        response = self.calculate(5200)

        self.assertEqual(response.status_code, 200)
        self.assertEqual(response.json()["inss"], 529.51)
        self.assertEqual(response.json()["irrf"], 71.62)

    def test_legal_deductions_win_when_more_advantageous(self):
        response = self.calculate(6000)

        self.assertEqual(response.status_code, 200)
        self.assertEqual(response.json()["inss"], 641.51)
        self.assertEqual(response.json()["irrf"], 385.10)

    def test_partial_reduction_between_5000_and_7350(self):
        response = self.calculate(7000)

        self.assertEqual(response.status_code, 200)
        self.assertEqual(response.json()["inss"], 781.51)
        self.assertEqual(response.json()["irrf"], 754.75)

    def test_no_reduction_above_7350(self):
        response = self.calculate(8000)

        self.assertEqual(response.status_code, 200)
        self.assertEqual(response.json()["inss"], 921.51)
        self.assertEqual(response.json()["irrf"], 1037.85)

    def test_other_discounts_do_not_change_inss_or_irrf(self):
        without_other_discounts = self.calculate(6000)
        with_other_discounts = self.calculate(6000, other_discounts=500)

        self.assertEqual(with_other_discounts.json()["inss"], without_other_discounts.json()["inss"])
        self.assertEqual(with_other_discounts.json()["irrf"], without_other_discounts.json()["irrf"])
        self.assertEqual(
            with_other_discounts.json()["salario_liquido"],
            without_other_discounts.json()["salario_liquido"] - 500,
        )

    def test_negative_inputs_are_rejected(self):
        invalid_payloads = (
            {"salario_bruto": -1, "dependentes": 0, "outros_descontos": 0},
            {"salario_bruto": 1000, "dependentes": -1, "outros_descontos": 0},
            {"salario_bruto": 1000, "dependentes": 0, "outros_descontos": -1},
        )

        for payload in invalid_payloads:
            with self.subTest(payload=payload):
                response = self.client.post("/api/salario-liquido", json=payload)
                self.assertEqual(response.status_code, 422)


class FinancingCalculatorTests(unittest.TestCase):
    @classmethod
    def setUpClass(cls):
        cls.client = TestClient(app)

    def test_basic_price_financing_keeps_existing_contract(self):
        response = self.client.post("/api/financiamento", json={
            "valor_financiamento": 100000,
            "taxa_mensal": 1,
            "meses": 60,
        })

        self.assertEqual(response.status_code, 200)
        payload = response.json()
        self.assertAlmostEqual(payload["valor_prestacao"], 2224.44, places=2)
        self.assertAlmostEqual(payload["total_pago"], 133466.69, places=2)
        self.assertAlmostEqual(payload["total_juros"], 33466.69, places=2)

    def test_standard_prepayment_comparison(self):
        response = self.client.post("/api/financiamento-antecipacao", json={
            "valor_financiamento": 100000,
            "taxa_mensal": 1,
            "meses": 60,
            "mes_antecipacao": 12,
            "valor_antecipacao": 20000,
        })

        self.assertEqual(response.status_code, 200)
        payload = response.json()
        self.assertAlmostEqual(payload["original"]["prestacao"], 2224.44, places=2)
        self.assertAlmostEqual(payload["original"]["total_juros"], 33466.69, places=2)
        self.assertEqual(payload["antecipacao"]["mes"], 12)
        self.assertEqual(payload["antecipacao"]["valor_aplicado"], 20000)

        prazo = payload["reduzir_prazo"]
        self.assertEqual(prazo["prazo"], 47)
        self.assertEqual(prazo["meses_economizados"], 13)
        self.assertAlmostEqual(prazo["total_pago"], 123207.68, places=2)
        self.assertAlmostEqual(prazo["total_juros"], 23207.68, places=2)
        self.assertAlmostEqual(prazo["juros_economizados"], 10259.00, places=2)
        self.assertAlmostEqual(prazo["prestacao_final"], 883.22, places=2)

        parcela = payload["reduzir_parcela"]
        self.assertEqual(parcela["prazo"], 60)
        self.assertEqual(parcela["parcelas_restantes"], 48)
        self.assertAlmostEqual(parcela["prestacao_recalculada"], 1697.77, places=2)
        self.assertAlmostEqual(parcela["reducao_prestacao"], 526.68, places=2)
        self.assertAlmostEqual(parcela["total_pago"], 128186.20, places=2)
        self.assertAlmostEqual(parcela["total_juros"], 28186.20, places=2)
        self.assertAlmostEqual(parcela["juros_economizados"], 5280.48, places=2)

        self.assertEqual(payload["evolucao"][0]["mes"], 0)
        self.assertIn(12, [point["mes"] for point in payload["evolucao"]])
        self.assertLessEqual(len(payload["evolucao"]), 150)
        self.assertLessEqual(abs(
            prazo["juros_economizados"] - (payload["original"]["total_juros"] - prazo["total_juros"]),
        ), 0.011)
        self.assertLessEqual(abs(
            parcela["juros_economizados"] - (payload["original"]["total_juros"] - parcela["total_juros"]),
        ), 0.011)
        self.assertLessEqual(prazo["prazo"], payload["original"]["prazo"])
        self.assertEqual(parcela["prazo"], payload["original"]["prazo"])
        for point in payload["evolucao"]:
            self.assertGreaterEqual(point["original"], 0)
            self.assertGreaterEqual(point["reduzir_prazo"], 0)
            self.assertGreaterEqual(point["reduzir_parcela"], 0)
        prepayment_point = next(point for point in payload["evolucao"] if point["mes"] == 12)
        self.assertLessEqual(prepayment_point["reduzir_prazo"], prepayment_point["original"])

    def test_zero_interest_prepayment(self):
        response = self.client.post("/api/financiamento-antecipacao", json={
            "valor_financiamento": 12000,
            "taxa_mensal": 0,
            "meses": 12,
            "mes_antecipacao": 3,
            "valor_antecipacao": 3000,
        })

        self.assertEqual(response.status_code, 200)
        payload = response.json()
        self.assertEqual(payload["original"]["prestacao"], 1000)
        self.assertEqual(payload["original"]["total_juros"], 0)
        self.assertEqual(payload["reduzir_prazo"]["prazo"], 9)
        self.assertEqual(payload["reduzir_prazo"]["meses_economizados"], 3)
        self.assertEqual(payload["reduzir_prazo"]["total_juros"], 0)
        self.assertAlmostEqual(payload["reduzir_parcela"]["prestacao_recalculada"], 666.67, places=2)
        self.assertEqual(payload["reduzir_parcela"]["total_juros"], 0)

    def test_full_settlement_caps_extra_payment_and_ends_scenarios(self):
        response = self.client.post("/api/financiamento-antecipacao", json={
            "valor_financiamento": 12000,
            "taxa_mensal": 0,
            "meses": 12,
            "mes_antecipacao": 3,
            "valor_antecipacao": 100000,
        })

        self.assertEqual(response.status_code, 200)
        payload = response.json()
        self.assertEqual(payload["antecipacao"]["valor_aplicado"], 9000)
        self.assertTrue(payload["reduzir_prazo"]["quitado"])
        self.assertTrue(payload["reduzir_parcela"]["quitado"])
        self.assertEqual(payload["reduzir_prazo"]["prazo"], 3)
        self.assertEqual(payload["reduzir_parcela"]["parcelas_restantes"], 0)
        self.assertIsNone(payload["reduzir_parcela"]["prestacao_recalculada"])
        self.assertEqual(payload["evolucao"][-1]["original"], 0)
        self.assertEqual(payload["evolucao"][-1]["reduzir_prazo"], 0)
        self.assertEqual(payload["evolucao"][-1]["reduzir_parcela"], 0)
        self.assertTrue(all(
            point["reduzir_prazo"] == 0 and point["reduzir_parcela"] == 0
            for point in payload["evolucao"] if point["mes"] > 3
        ))

    def test_invalid_financing_and_prepayment_inputs_are_rejected(self):
        invalid_basic = (
            {"valor_financiamento": 0, "taxa_mensal": 1, "meses": 60},
            {"valor_financiamento": -1, "taxa_mensal": 1, "meses": 60},
            {"valor_financiamento": 1000, "taxa_mensal": -1, "meses": 60},
            {"valor_financiamento": 1000, "taxa_mensal": 1, "meses": 0},
            {"valor_financiamento": 1000, "taxa_mensal": 1, "meses": 601},
        )
        for payload in invalid_basic:
            with self.subTest(payload=payload):
                self.assertEqual(self.client.post("/api/financiamento", json=payload).status_code, 422)

        for invalid_amount in ("NaN", "Infinity"):
            with self.subTest(invalid_amount=invalid_amount):
                with self.assertRaises(ValidationError):
                    FinanciamentoInput.model_validate({
                        "valor_financiamento": float(invalid_amount.lower().replace("infinity", "inf")),
                        "taxa_mensal": 1,
                        "meses": 60,
                    })

        invalid_prepayment = (
            {"mes_antecipacao": 0, "valor_antecipacao": 100},
            {"mes_antecipacao": 60, "valor_antecipacao": 100},
            {"mes_antecipacao": 1, "valor_antecipacao": 0},
            {"mes_antecipacao": 1, "valor_antecipacao": -1},
        )
        base = {"valor_financiamento": 1000, "taxa_mensal": 1, "meses": 60}
        for extra in invalid_prepayment:
            with self.subTest(payload=extra):
                self.assertEqual(self.client.post("/api/financiamento-antecipacao", json={**base, **extra}).status_code, 422)


if __name__ == "__main__":
    unittest.main()

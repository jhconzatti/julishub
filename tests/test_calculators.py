import unittest

from fastapi.testclient import TestClient

from app import app


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


if __name__ == "__main__":
    unittest.main()

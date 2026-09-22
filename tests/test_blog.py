import unittest

from fastapi.testclient import TestClient

from app import app


class BlogLocaleTests(unittest.TestCase):
    @classmethod
    def setUpClass(cls):
        cls.client = TestClient(app)

    def test_default_and_explicit_pt_br_return_portuguese_articles(self):
        for url in ("/api/blog", "/api/blog?lang=pt-BR"):
            with self.subTest(url=url):
                response = self.client.get(url)
                self.assertEqual(response.status_code, 200)
                self.assertIn("reserva-de-emergencia", [article["slug"] for article in response.json()])
                self.assertIn("juros-compostos-magia", [article["slug"] for article in response.json()])

    def test_english_and_spanish_lists_only_expose_localized_guidance(self):
        for lang in ("en", "es"):
            with self.subTest(lang=lang):
                response = self.client.get(f"/api/blog?lang={lang}")
                self.assertEqual(response.status_code, 200)
                self.assertEqual(
                    {article["slug"] for article in response.json()},
                    {"reserva-de-emergencia", "antecipacao-financiamento"},
                )

    def test_guidance_details_exist_in_every_supported_locale(self):
        for slug in ("reserva-de-emergencia", "antecipacao-financiamento"):
            for lang in ("pt-BR", "en", "es"):
                with self.subTest(slug=slug, lang=lang):
                    response = self.client.get(f"/api/blog/{slug}?lang={lang}")
                    self.assertEqual(response.status_code, 200)
                    self.assertEqual(response.json()["slug"], slug)
                    self.assertTrue(response.json()["conteudo"])

    def test_pt_only_legacy_article_does_not_fall_back_for_other_locales(self):
        for lang in ("en", "es"):
            with self.subTest(lang=lang):
                self.assertEqual(self.client.get(f"/api/blog/juros-compostos-magia?lang={lang}").status_code, 404)
        self.assertEqual(self.client.get("/api/blog/juros-compostos-magia?lang=pt-BR").status_code, 200)

    def test_unknown_slug_and_unsupported_locale_are_rejected(self):
        self.assertEqual(self.client.get("/api/blog/inexistente?lang=pt-BR").status_code, 404)
        self.assertEqual(self.client.get("/api/blog?lang=fr").status_code, 422)


if __name__ == "__main__":
    unittest.main()

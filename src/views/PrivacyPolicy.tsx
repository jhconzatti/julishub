import { useTranslation } from "react-i18next";

const sectionKeys = [
  "intro",
  "automaticData",
  "thirdParty",
  "protection",
  "rights",
  "changesContact",
] as const;

const getTextArray = (value: unknown): string[] => (
  Array.isArray(value) ? value.map((item) => String(item)) : []
);

export default function PrivacyPolicy() {
  const { t } = useTranslation();

  return (
    <div className="mx-auto max-w-4xl animate-in fade-in duration-500 pb-12">
      <article className="prose prose-slate max-w-none dark:prose-invert prose-headings:scroll-mt-24 prose-headings:font-semibold prose-headings:tracking-tight prose-h1:mb-4 prose-h1:text-4xl prose-h2:mt-12 prose-h2:border-b prose-h2:border-border prose-h2:pb-3 prose-p:leading-7 prose-p:text-foreground/90 prose-li:leading-7 prose-li:text-foreground/90 prose-strong:text-foreground prose-a:text-primary hover:prose-a:text-primary/80">
        <h1>{t("privacy.title")}</h1>
        <p className="lead">{t("privacy.summary")}</p>
        <p className="text-sm text-muted-foreground">{t("privacy.lastUpdated")}</p>

        <p>
          <strong>{t("privacy.currentScope.title")}</strong>{" "}
          {t("privacy.currentScope.description")}
        </p>

        {sectionKeys.map((sectionKey) => {
          const paragraphs = getTextArray(
            t(`privacy.sections.${sectionKey}.paragraphs`, { returnObjects: true }),
          );
          const items = getTextArray(
            t(`privacy.sections.${sectionKey}.items`, { returnObjects: true }),
          );

          return (
            <section key={sectionKey} aria-labelledby={`privacy-${sectionKey}`}>
              <h2 id={`privacy-${sectionKey}`}>
                {t(`privacy.sections.${sectionKey}.heading`)}
              </h2>

              {paragraphs.map((paragraph) => (
                <p key={paragraph}>{paragraph}</p>
              ))}

              {items.length > 0 && (
                <ul>
                  {items.map((item) => (
                    <li key={item}>{item}</li>
                  ))}
                </ul>
              )}
            </section>
          );
        })}
      </article>
    </div>
  );
}
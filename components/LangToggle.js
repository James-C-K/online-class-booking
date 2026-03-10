'use client';

import { useLang } from '@/lib/LanguageContext';

export default function LangToggle() {
  const { lang, toggleLang } = useLang();

  return (
    <div className="lang-toggle">
      <button
        className={lang === 'en' ? 'active' : ''}
        onClick={() => lang !== 'en' && toggleLang()}
      >
        EN
      </button>
      <button
        className={lang === 'zh' ? 'active' : ''}
        onClick={() => lang !== 'zh' && toggleLang()}
      >
        中文
      </button>
    </div>
  );
}

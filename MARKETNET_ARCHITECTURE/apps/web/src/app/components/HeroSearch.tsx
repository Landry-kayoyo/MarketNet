'use client';

import { useRouter } from 'next/navigation';
import { useEffect, useRef, useState } from 'react';

type HeroSearchProps = {
  suggestions?: string[];
};

const FALLBACK_SUGGESTIONS = [
  'Écouteur Bluetooth Demo',
  'Sac à Main Sans Stock',
  'Lampe Ambiante Cachée',
  'Boutique Demo',
  'Électronique',
  'Maison',
  'Mode',
];

export default function HeroSearch({ suggestions = [] }: HeroSearchProps) {
  const sourceSuggestions = suggestions.length > 0 ? suggestions : FALLBACK_SUGGESTIONS;
  const [query, setQuery] = useState('');
  const [matchingSuggestions, setMatchingSuggestions] = useState<string[]>([]);
  const [focused, setFocused] = useState(false);
  const [placeholder, setPlaceholder] = useState('');
  const router = useRouter();
  const inputRef = useRef<HTMLInputElement>(null);
  const wrapRef = useRef<HTMLFormElement>(null);

  useEffect(() => {
    let suggestionIndex = 0;
    let charIndex = 0;
    let isDeleting = false;
    let timeout: NodeJS.Timeout;

    function type() {
      const current = sourceSuggestions[suggestionIndex % sourceSuggestions.length];
      if (!current) return;

      if (!isDeleting) {
        charIndex++;
        setPlaceholder(current.slice(0, charIndex));
        if (charIndex === current.length) {
          isDeleting = true;
          timeout = setTimeout(type, 1800);
          return;
        }
      } else {
        charIndex--;
        setPlaceholder(current.slice(0, charIndex));
        if (charIndex === 0) {
          isDeleting = false;
          suggestionIndex++;
        }
      }

      timeout = setTimeout(type, isDeleting ? 40 : 70);
    }

    timeout = setTimeout(type, 800);
    return () => clearTimeout(timeout);
  }, [sourceSuggestions]);

  function handleChange(e: React.ChangeEvent<HTMLInputElement>) {
    const val = e.target.value;
    setQuery(val);

    if (val.trim().length > 0) {
      setMatchingSuggestions(
        sourceSuggestions.filter((suggestion) =>
          suggestion.toLowerCase().includes(val.toLowerCase()),
        ),
      );
    } else {
      setMatchingSuggestions([]);
    }
  }

  function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    if (query.trim()) {
      router.push(`/products?q=${encodeURIComponent(query.trim())}`);
    }
  }

  function pickSuggestion(s: string) {
    setQuery(s);
    setMatchingSuggestions([]);
    router.push(`/products?q=${encodeURIComponent(s)}`);
  }

  useEffect(() => {
    function onClickOutside(e: MouseEvent) {
      if (wrapRef.current && !wrapRef.current.contains(e.target as Node)) {
        setMatchingSuggestions([]);
        setFocused(false);
      }
    }

    document.addEventListener('mousedown', onClickOutside);
    return () => document.removeEventListener('mousedown', onClickOutside);
  }, []);

  return (
    <form
      role="search"
      onSubmit={handleSubmit}
      className={`hero-search-dynamic${focused ? ' focused' : ''}`}
      ref={wrapRef}
    >
      <i className="bi bi-search hero-search-icon-inner" aria-hidden="true" />
      <input
        ref={inputRef}
        type="search"
        value={query}
        onChange={handleChange}
        onFocus={() => setFocused(true)}
        placeholder={`Rechercher : ${placeholder}…`}
        aria-label="Rechercher sur MarketNet"
        autoComplete="off"
      />
      {query && (
        <button
          type="button"
          className="hero-search-clear"
          onClick={() => {
            setQuery('');
            setMatchingSuggestions([]);
            inputRef.current?.focus();
          }}
          aria-label="Effacer la recherche"
        >
          <i className="bi bi-x" />
        </button>
      )}
      {matchingSuggestions.length > 0 && (
        <ul className="hero-search-dropdown" role="listbox">
          {matchingSuggestions.map((suggestion) => (
            <li key={suggestion}>
              <button type="button" role="option" onClick={() => pickSuggestion(suggestion)}>
                <i className="bi bi-search" aria-hidden="true" />
                {suggestion}
              </button>
            </li>
          ))}
        </ul>
      )}
    </form>
  );
}

import { GitBranch } from 'lucide-react';
import SearchBar from './SearchBar';
import { paths } from '../lib/router';

const NAV = [
  { label: 'Emergency Guide', href: paths.home(), match: (v) => v !== 'basics' },
  { label: 'Git Basics', href: paths.basics(), match: (v) => v === 'basics' }
];

export default function Header({ currentView }) {
  return (
    <header className="sticky top-0 z-40 w-full bg-surface/85 backdrop-blur-xl border-b border-white/6 shadow-[0_4px_24px_rgba(0,0,0,0.45)]">
      <div className="max-w-6xl mx-auto px-4 sm:px-8 h-16 flex items-center justify-between gap-4">
        <div className="flex items-center gap-6 min-w-0">
          <a href={paths.home()} className="flex items-center gap-2.5 group shrink-0">
            <div className="w-9 h-9 rounded-lg p-px bg-linear-to-br from-primary-container via-primary-deep to-tertiary shadow-[0_0_16px_rgba(128,131,255,0.3)] group-hover:shadow-[0_0_24px_rgba(76,215,246,0.45)] transition">
              <div className="w-full h-full rounded-[7px] bg-surface-lowest flex items-center justify-center">
                <GitBranch className="h-4.5 w-4.5 text-tertiary" />
              </div>
            </div>
            <span className="font-display text-lg font-semibold tracking-tight text-on-surface">GitGyan</span>
          </a>

          <nav className="flex items-center gap-1 p-1 rounded-xl bg-surface-low border border-white/5" aria-label="Main">
            {NAV.map((item) => {
              const active = item.match(currentView);
              return (
                <a
                  key={item.label}
                  href={item.href}
                  aria-current={active ? 'page' : undefined}
                  className={`px-3 sm:px-4 py-1.5 rounded-lg text-xs sm:text-[13px] whitespace-nowrap transition ${
                    active
                      ? 'bg-surface-high text-primary font-semibold shadow-inner'
                      : 'text-on-surface-variant hover:text-on-surface hover:bg-surface-container'
                  }`}
                >
                  {item.label}
                </a>
              );
            })}
          </nav>
        </div>

        <div className="hidden md:block w-72">
          <SearchBar hotkey />
        </div>
      </div>
      <div className="md:hidden px-4 pb-3">
        <SearchBar />
      </div>
    </header>
  );
}

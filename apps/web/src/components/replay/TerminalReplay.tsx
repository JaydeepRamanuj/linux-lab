import { useState, useEffect, useRef, useMemo } from 'react';
import { PlayCircle, Play, Pause, RotateCcw, SkipBack, SkipForward, Copy, Check } from 'lucide-react';
import { useCopy } from '../../lib/useCopy';
import type { ReplayExample } from '../../lib/types';

type Speed = 'slow' | 'normal' | 'fast';

const CHAR_DELAY: Record<Speed, number> = { slow: 45, normal: 22, fast: 8 };
const AFTER_INPUT: Record<Speed, number> = { slow: 700, normal: 450, fast: 180 };
const OUTPUT_DELAY: Record<Speed, number> = { slow: 400, normal: 220, fast: 80 };

// Data lines may carry a leading "$ " — the prompt is drawn separately.
const stripPrompt = (line: string) => line.replace(/^\$\s?/, '');

export default function TerminalReplay({ example }: { example: ReplayExample }) {
  const lines = useMemo(
    () => example.commands.map((c) => ({ ...c, text: c.type === 'input' ? stripPrompt(c.line) : c.line })),
    [example]
  );
  const total = lines.length;

  // pos = number of lines fully shown; typed = chars typed of lines[pos] when it is an input line.
  const [pos, setPos] = useState(0);
  const [typed, setTyped] = useState(0);
  const [playing, setPlaying] = useState(false);
  const [speed, setSpeed] = useState<Speed>('normal');
  const screenRef = useRef<HTMLDivElement>(null);
  const [copied, copy] = useCopy();

  const finished = pos >= total;

  // Playback engine: one timer per tick; state only changes inside timer callbacks.
  useEffect(() => {
    if (!playing || pos >= total) return;
    const line = lines[pos];
    if (!line) return;
    const advance = () => {
      setTyped(0);
      setPos((p) => p + 1);
      if (pos + 1 >= total) setPlaying(false);
    };
    let timer: ReturnType<typeof setTimeout>;
    if (line.type === 'input' && typed < line.text.length) {
      timer = setTimeout(() => setTyped((t) => t + 1), CHAR_DELAY[speed]);
    } else {
      timer = setTimeout(advance, line.type === 'input' ? AFTER_INPUT[speed] : OUTPUT_DELAY[speed]);
    }
    return () => clearTimeout(timer);
  }, [playing, pos, typed, speed, total, lines]);

  // Keep the newest line in view — scroll the terminal box only, never the page.
  useEffect(() => {
    const el = screenRef.current;
    if (el) el.scrollTop = el.scrollHeight;
  }, [pos, typed]);

  const togglePlay = () => {
    if (playing) {
      setPlaying(false);
      return;
    }
    if (finished) {
      setPos(0);
      setTyped(0);
    }
    setPlaying(true);
  };

  const reset = () => {
    setPlaying(false);
    setPos(0);
    setTyped(0);
  };

  const stepForward = () => {
    setPlaying(false);
    setTyped(0);
    setPos((p) => Math.min(total, p + 1));
  };

  const stepBack = () => {
    setPlaying(false);
    if (typed > 0) setTyped(0);
    else setPos((p) => Math.max(0, p - 1));
  };

  const current = lines[pos];
  const showPartial = current && current.type === 'input' && (typed > 0 || playing);
  const idle = pos === 0 && !showPartial;

  return (
    <section className="card p-5 sm:p-8 space-y-5">
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
        <div>
          <div className="flex items-center gap-2">
            <PlayCircle className="h-5 w-5 text-secondary" />
            <h2 className="text-[22px] font-semibold">Live Terminal Replay</h2>
          </div>
          <p className="text-xs text-on-surface-variant mt-1">{example.context}</p>
        </div>
        <button
          type="button"
          onClick={() =>
            copy(
              lines
                .filter((l) => l.type === 'input' && !l.text.startsWith('('))
                .map((l) => l.text)
                .join('\n')
            )
          }
          className="btn-ghost self-start sm:self-auto inline-flex items-center gap-1.5 px-3 py-1.5 rounded-lg font-mono text-[12px] shrink-0"
        >
          {copied ? <Check className="h-3.5 w-3.5 text-safe" /> : <Copy className="h-3.5 w-3.5" />}
          {copied ? 'Copied!' : 'Copy inputs'}
        </button>
      </div>

      <div className="rounded-xl bg-surface-lowest border border-white/5 overflow-hidden shadow-[inset_0_2px_12px_rgba(0,0,0,0.8)]">
        <div className="h-10 px-4 bg-surface-high/50 flex items-center justify-between select-none">
          <div className="flex items-center gap-2">
            <span className="w-3 h-3 rounded-full bg-danger/80" />
            <span className="w-3 h-3 rounded-full bg-caution/80" />
            <span className="w-3 h-3 rounded-full bg-safe/80" />
          </div>
          <span className="font-mono text-[11px] text-outline">bash — replay</span>
          <span className="font-mono text-[11px] text-outline w-12 text-right">
            {Math.min(pos, total)}/{total}
          </span>
        </div>

        <div
          ref={screenRef}
          className="p-4 sm:p-5 h-72 overflow-y-auto font-mono text-[12.5px] leading-relaxed"
          aria-live="polite"
        >
          {idle && <div className="text-outline">Ready. Press “Play” to run the sequence, or step through it line by line.</div>}
          {lines.slice(0, pos).map((line, i) =>
            line.type === 'input' ? (
              <div key={i} className="flex gap-2 text-on-surface">
                <span className="text-secondary select-none">$</span>
                <span className="whitespace-pre-wrap break-all">{line.text}</span>
              </div>
            ) : (
              <div key={i} className="text-on-surface-variant/80 whitespace-pre-wrap break-words animate-fade-in">
                {line.text}
              </div>
            )
          )}
          {showPartial && (
            <div className="flex gap-2 text-on-surface">
              <span className="text-secondary select-none">$</span>
              <span className="whitespace-pre-wrap break-all">
                {current.text.slice(0, typed)}
                <span className="inline-block w-2 h-4 -mb-0.5 bg-tertiary/80 animate-blink" />
              </span>
            </div>
          )}
          {finished && !playing && (
            <div className="flex gap-2 text-on-surface mt-1">
              <span className="text-secondary select-none">$</span>
              <span className="inline-block w-2 h-4 mt-0.5 bg-tertiary/80 animate-blink" />
            </div>
          )}
        </div>

        <div className="px-4 py-3 bg-surface-high/30 border-t border-white/5 flex flex-wrap items-center justify-between gap-3">
          <div className="flex items-center gap-2">
            <button
              type="button"
              onClick={togglePlay}
              className={`inline-flex items-center gap-1.5 px-3.5 py-1.5 rounded-lg text-xs font-semibold ${
                playing ? 'bg-caution-surface text-caution border border-caution/40' : 'btn-primary'
              }`}
            >
              {playing ? <Pause className="h-3.5 w-3.5" /> : <Play className="h-3.5 w-3.5" />}
              {playing ? 'Pause' : finished ? 'Replay' : pos > 0 ? 'Resume' : 'Play'}
            </button>
            <button type="button" onClick={reset} className="btn-ghost inline-flex items-center gap-1 px-3 py-1.5 rounded-lg text-xs">
              <RotateCcw className="h-3.5 w-3.5" />
              Reset
            </button>
            <div className="flex items-center gap-1 ml-1">
              <button
                type="button"
                onClick={stepBack}
                disabled={pos === 0 && typed === 0}
                aria-label="Step back"
                className="btn-ghost p-1.5 rounded-lg disabled:opacity-30 disabled:pointer-events-none"
              >
                <SkipBack className="h-3.5 w-3.5" />
              </button>
              <button
                type="button"
                onClick={stepForward}
                disabled={finished}
                aria-label="Step forward"
                className="btn-ghost p-1.5 rounded-lg disabled:opacity-30 disabled:pointer-events-none"
              >
                <SkipForward className="h-3.5 w-3.5" />
              </button>
            </div>
          </div>
          <div className="flex items-center gap-2">
            <span className="label-caps text-outline">Speed</span>
            <div className="flex items-center p-0.5 rounded-lg bg-surface-lowest border border-white/5">
              {(['slow', 'normal', 'fast'] as const).map((s) => (
                <button
                  key={s}
                  type="button"
                  onClick={() => setSpeed(s)}
                  aria-pressed={speed === s}
                  className={`px-2.5 py-1 rounded-md text-[11px] capitalize transition ${
                    speed === s ? 'bg-surface-high text-tertiary font-semibold' : 'text-outline hover:text-on-surface'
                  }`}
                >
                  {s}
                </button>
              ))}
            </div>
          </div>
        </div>
      </div>
    </section>
  );
}

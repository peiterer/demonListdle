import { useEffect, useMemo, useState } from 'react';
import './Home.css';

const lengthMap = {
    0: 'tiny',
    1: 'short',
    2: 'medium',
    3: 'long',
    4: 'XL',
};

const columns = [
    { label: 'Thumbnail', index: 5, hintKey: 'thumbnail' },
    { label: 'ID', index: 0, hintKey: 'id' },
    { label: 'Name', index: 1, hintKey: 'name' },
    { label: 'Position', index: 2, hintKey: 'position' },
    { label: 'Creator', index: 3, hintKey: 'creator' },
    { label: 'Verifier', index: 4, hintKey: 'verifyer' },
    { label: 'Downloads', index: 6, hintKey: 'downloads' },
    { label: 'Length', index: 7, hintKey: 'length' },
];

function hintClass(hint, hintKey) {
    if (hintKey === 'thumbnail') return 'cell cell-neutral';
    if (hint === 'correct') return 'cell cell-correct';
    if (hint === 'higher' || hint === 'lower') return 'cell cell-close';
    return 'cell cell-incorrect';
}

function hintArrow(hint, hintKey) {
    if (hintKey === 'position') {
        if (hint === 'higher') return ' ↓';
        if (hint === 'lower') return ' ↑';
        return '';
    }
    if (hint === 'higher') return ' ↑';
    if (hint === 'lower') return ' ↓';
    return '';
}

export default function Home() {
    const [guess, setGuess] = useState('');
    const [rows, setRows] = useState([]);
    const [suggestions, setSuggestions] = useState([]);
    const [error, setError] = useState('');
    const [isLoading, setIsLoading] = useState(false);
    const [isResetting, setIsResetting] = useState(false);
    const [isSolved, setIsSolved] = useState(false);

    const attempts = useMemo(() => rows.length, [rows]);

    useEffect(() => {
        const query = guess.trim();
        if (!query || isSolved) {
            setSuggestions([]);
            return;
        }

        const controller = new AbortController();
        const timeoutId = setTimeout(async () => {
            try {
                const response = await fetch(`/suggestions?q=${encodeURIComponent(query)}`, {
                    signal: controller.signal,
                });
                if (!response.ok) {
                    setSuggestions([]);
                    return;
                }
                const payload = await response.json();
                setSuggestions(Array.isArray(payload.suggestions) ? payload.suggestions : []);
            } catch {
                setSuggestions([]);
            }
        }, 150);

        return () => {
            clearTimeout(timeoutId);
            controller.abort();
        };
    }, [guess, isSolved]);

    async function onSubmit(event) {
        event.preventDefault();
        if (!guess.trim() || isLoading || isResetting || isSolved) return;

        setIsLoading(true);
        setError('');

        try {
            const formData = new URLSearchParams();
            formData.set('guess', guess.trim());

            const response = await fetch('/guess', {
                method: 'POST',
                headers: { 'Content-Type': 'application/x-www-form-urlencoded' },
                body: formData.toString(),
            });

            if (!response.ok) {
                throw new Error('Guess failed. Check backend logs for details.');
            }

            const payload = await response.json();
            if (!payload?.guess || !payload?.hints) {
                throw new Error('Invalid response from /guess endpoint.');
            }

            setRows((prev) => [
                {
                    guess: payload.guess,
                    hints: payload.hints,
                    correct: Boolean(payload.correct),
                },
                ...prev,
            ]);
            setIsSolved(Boolean(payload.correct));
            setGuess('');
            setSuggestions([]);
        } catch (submitError) {
            setError(submitError.message);
        } finally {
            setIsLoading(false);
        }
    }

    async function onNewGame() {
        if (isResetting || isLoading) return;

        setIsResetting(true);
        setError('');

        try {
            const response = await fetch('/new-game', {
                method: 'POST',
            });

            if (!response.ok) {
                throw new Error('Could not start a new game.');
            }

            setRows([]);
            setGuess('');
            setSuggestions([]);
            setIsSolved(false);
        } catch (resetError) {
            setError(resetError.message);
        } finally {
            setIsResetting(false);
        }
    }

    return (
        <main className="guess-page">
            <h1 className="title">Demon Guess</h1>
            <p className="subtitle">Guess the hidden demon and use the hints to narrow it down.</p>
            <div className="top-actions">
                <button className="new-game-button" type="button" onClick={onNewGame} disabled={isResetting || isLoading}>
                    {isResetting ? 'Starting...' : 'New Game'}
                </button>
            </div>

            <form className="guess-form" onSubmit={onSubmit}>
                <input
                    type="text"
                    className="guess-input"
                    placeholder="Enter demon name"
                    value={guess}
                    onChange={(event) => setGuess(event.target.value)}
                    disabled={isLoading || isResetting || isSolved}
                    autoComplete="off"
                />
                <button className="guess-button" type="submit" disabled={isLoading || isResetting || isSolved}>
                    {isLoading ? 'Guessing...' : 'Guess'}
                </button>

                {suggestions.length > 0 ? (
                    <div className="suggestions" role="listbox" aria-label="Demon suggestions">
                        {suggestions.map((item) => (
                            <button
                                key={item}
                                type="button"
                                className="suggestion-item"
                                onClick={() => {
                                    setGuess(item);
                                    setSuggestions([]);
                                }}
                            >
                                {item}
                            </button>
                        ))}
                    </div>
                ) : null}
            </form>

            {error ? <p className="status error">{error}</p> : null}
            {isSolved ? <p className="status success">Correct! Solved in {attempts} tries.</p> : null}

            <section className="board" aria-label="Guess board">
                <div className="header-row">
                    {columns.map((column) => (
                        <div className="header-cell" key={column.label}>
                            {column.label}
                        </div>
                    ))}
                </div>

                {rows.map((row, rowIndex) => (
                    <div className="data-row" key={`${row.guess?.[1] ?? 'guess'}-${rowIndex}`}>
                        {columns.map((column) => {
                            const hint = row.hints?.[column.hintKey];
                            const value = row.guess?.[column.index];

                            if (column.hintKey === 'thumbnail') {
                                return (
                                    <div className={hintClass(hint, column.hintKey)} key={column.label}>
                                        {typeof value === 'string' && value ? (
                                            <img src={value} alt={row.guess?.[1] ?? 'thumbnail'} className="thumb" />
                                        ) : (
                                            '-'
                                        )}
                                    </div>
                                );
                            }

                            return (
                                <div className={hintClass(hint, column.hintKey)} key={column.label}>
                                    {column.hintKey === 'length'
                                        ? (lengthMap[value] ?? String(value ?? '-'))
                                        : String(value ?? '-')}
                                    {hintArrow(hint, column.hintKey)}
                                </div>
                            );
                        })}
                    </div>
                ))}
            </section>
        </main>
    );
}
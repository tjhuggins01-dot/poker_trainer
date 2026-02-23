import { useEffect, useState } from 'react';
import { DrillPage } from './pages/DrillPage';
import { RangesPage } from './pages/RangesPage';
import { SettingsPage } from './pages/SettingsPage';
import { StatsPage } from './pages/StatsPage';
import { loadData, loadSession, resetAll, resetSession, resetStatsOnly, saveData, saveSession } from './lib/storage';
import type { AppData, SessionStats } from './lib/types';

type Tab = 'drill' | 'ranges' | 'stats' | 'settings';

function App() {
  const [tab, setTab] = useState<Tab>('drill');
  const [data, setData] = useState<AppData>(() => loadData());
  const [session, setSession] = useState<SessionStats>(() => loadSession());

  useEffect(() => {
    const root = document.documentElement;
    const media = window.matchMedia('(prefers-color-scheme: dark)');

    const applyTheme = () => {
      const resolvedTheme = data.settings.themeMode === 'system' ? (media.matches ? 'dark' : 'light') : data.settings.themeMode;
      root.dataset.theme = resolvedTheme;
      root.classList.toggle('theme-dark', resolvedTheme === 'dark');
      root.classList.toggle('theme-light', resolvedTheme === 'light');
    };

    applyTheme();
    media.addEventListener('change', applyTheme);
    return () => media.removeEventListener('change', applyTheme);
  }, [data.settings.themeMode]);

  const onDataChange = (updater: (prev: AppData) => AppData) => {
    setData((prev) => {
      const next = updater(prev);
      saveData(next);
      return next;
    });
  };

  const onSessionChange = (updater: (prev: SessionStats) => SessionStats) => {
    setSession((prev) => {
      const next = updater(prev);
      saveSession(next);
      return next;
    });
  };

  const onResetSession = () => {
    const freshSession = resetSession();
    setSession(freshSession);
  };

  return (
    <main className="app">
      <header>
        <h1>Preflop Range Drill</h1>
      </header>
      <div className="content">
        {tab === 'drill' && (
          <DrillPage
            data={data}
            session={session}
            onDataChange={onDataChange}
            onSessionChange={onSessionChange}
            onResetSession={onResetSession}
          />
        )}
        {tab === 'ranges' && <RangesPage data={data} onDataChange={onDataChange} />}
        {tab === 'stats' && <StatsPage data={data} session={session} />}
        {tab === 'settings' && (
          <SettingsPage
            data={data}
            onDataChange={onDataChange}
            onResetSession={onResetSession}
            onResetStats={() => onDataChange((prev) => resetStatsOnly(prev))}
            onResetAll={() => {
              const fresh = resetAll();
              saveData(fresh);
              setData(fresh);
              onResetSession();
            }}
          />
        )}
      </div>
      <nav className="tabs">
        <button className={tab === 'drill' ? 'active' : ''} onClick={() => setTab('drill')}>
          Drill
        </button>
        <button className={tab === 'ranges' ? 'active' : ''} onClick={() => setTab('ranges')}>
          Ranges
        </button>
        <button className={tab === 'stats' ? 'active' : ''} onClick={() => setTab('stats')}>
          Stats
        </button>
        <button className={tab === 'settings' ? 'active' : ''} onClick={() => setTab('settings')}>
          Settings
        </button>
      </nav>
    </main>
  );
}

export default App;

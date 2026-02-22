import { useState } from 'react';
import { DrillPage } from './pages/DrillPage';
import { RangesPage } from './pages/RangesPage';
import { SettingsPage } from './pages/SettingsPage';
import { loadData, resetAll, resetStatsOnly, saveData } from './lib/storage';
import type { AppData } from './lib/types';

type Tab = 'drill' | 'ranges' | 'settings';

function App() {
  const [tab, setTab] = useState<Tab>('drill');
  const [data, setData] = useState<AppData>(() => loadData());

  const onDataChange = (updater: (prev: AppData) => AppData) => {
    setData((prev) => {
      const next = updater(prev);
      saveData(next);
      return next;
    });
  };

  return (
    <main className="app">
      <header>
        <h1>Preflop Range Drill</h1>
      </header>
      <div className="content">
        {tab === 'drill' && <DrillPage data={data} onDataChange={onDataChange} />}
        {tab === 'ranges' && <RangesPage data={data} onDataChange={onDataChange} />}
        {tab === 'settings' && (
          <SettingsPage
            data={data}
            onDataChange={onDataChange}
            onResetStats={() => onDataChange((prev) => resetStatsOnly(prev))}
            onResetAll={() => {
              const fresh = resetAll();
              saveData(fresh);
              setData(fresh);
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
        <button className={tab === 'settings' ? 'active' : ''} onClick={() => setTab('settings')}>
          Settings
        </button>
      </nav>
    </main>
  );
}

export default App;

import { useCoordinator } from './store/coordinator';
import TitleScreen from './ui/TitleScreen';
import MapCanvas from './map/MapCanvas';
import TeamSelectScreen from './ui/TeamSelectScreen';
import BattleScreen from './ui/BattleScreen';
import DialogueBox from './ui/DialogueBox';
import PartyMenu from './ui/PartyMenu';
import HUD from './ui/HUD';

function App() {
  const mode = useCoordinator((s) => s.mode);

  return (
    <div className="w-screen h-screen overflow-hidden bg-gray-900 text-white relative">
      {mode === 'title' && <TitleScreen />}

      {mode === 'overworld' && (
        <>
          <MapCanvas />
          <HUD />
        </>
      )}

      {mode === 'teamSelect' && <TeamSelectScreen />}

      {mode === 'battle' && <BattleScreen />}

      {mode === 'dialogue' && (
        <>
          <MapCanvas />
          <DialogueBox />
        </>
      )}

      {mode === 'menu' && (
        <>
          <MapCanvas />
          <PartyMenu />
        </>
      )}
    </div>
  );
}

export default App;

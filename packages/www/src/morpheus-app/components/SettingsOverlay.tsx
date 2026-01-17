import { useCallback, useEffect, useMemo, useState } from 'react';
import type { CSSProperties } from 'react';
import { fetchInitial } from '@soapbubble/morpheus-client/service/gameState';
import { useAppDispatch, useAppSelector } from '@/morpheus-app/store/hooks';
import { restoreGamestate, selectCurrentEntryId } from '@/morpheus-app/store/slices/gamestateSlice';
import type { GamestateValues } from '@/morpheus-app/storage/gamestateStorage';
import { clearAll, getHistoryDepth } from '@/morpheus-app/storage/gamestateStorage';

const gearButtonSize = 36;

const overlayStyles: CSSProperties = {
  position: 'absolute',
  top: 16,
  left: 16,
  zIndex: 20,
  display: 'flex',
  flexDirection: 'column',
  alignItems: 'flex-start',
  gap: 12,
  color: '#f4e9c1',
  fontFamily: 'system-ui, -apple-system, BlinkMacSystemFont, "Segoe UI", sans-serif',
};

const panelStyles: CSSProperties = {
  minWidth: 260,
  background:
    'linear-gradient(135deg, rgba(30, 30, 40, 0.95) 0%, rgba(20, 20, 30, 0.98) 100%)',
  border: '2px solid rgba(212, 175, 55, 0.6)',
  borderRadius: 16,
  padding: '14px 16px',
  boxShadow:
    '0 8px 32px rgba(0, 0, 0, 0.45), inset 0 1px 0 rgba(255, 255, 255, 0.12)',
  backdropFilter: 'blur(6px)',
};

const buttonStyles: CSSProperties = {
  appearance: 'none',
  border: '1px solid rgba(212, 175, 55, 0.45)',
  borderRadius: 10,
  background: 'rgba(12, 12, 18, 0.8)',
  color: '#f9e7a1',
  padding: '6px 10px',
  fontSize: 12,
  cursor: 'pointer',
};

const valueStyles: CSSProperties = {
  fontSize: 12,
  color: 'rgba(249, 231, 161, 0.8)',
  wordBreak: 'break-all',
};

const buildGenesisValues = (): GamestateValues => {
  const initialGamestates = fetchInitial();
  return Object.fromEntries(initialGamestates.map((state) => [state.stateId, state.value]));
};

const SettingsOverlay = () => {
  const dispatch = useAppDispatch();
  const currentEntryId = useAppSelector(selectCurrentEntryId);
  const [isOpen, setIsOpen] = useState(false);
  const [historyDepth, setHistoryDepth] = useState(0);

  const genesisValues = useMemo(() => buildGenesisValues(), []);

  useEffect(() => {
    let isMounted = true;
    const loadDepth = async () => {
      const depth = await getHistoryDepth(currentEntryId);
      if (isMounted) {
        setHistoryDepth(depth);
      }
    };
    loadDepth();
    return () => {
      isMounted = false;
    };
  }, [currentEntryId]);

  const handleReset = useCallback(async () => {
    await clearAll();
    dispatch(restoreGamestate({ values: genesisValues, entryId: null }));
    setHistoryDepth(0);
    setIsOpen(false);
  }, [dispatch, genesisValues]);

  return (
    <div style={overlayStyles}>
      <button
        type="button"
        onClick={() => setIsOpen((open) => !open)}
        style={{
          width: gearButtonSize,
          height: gearButtonSize,
          borderRadius: 10,
          border: '1px solid rgba(212, 175, 55, 0.5)',
          background: 'rgba(12, 12, 18, 0.7)',
          display: 'grid',
          placeItems: 'center',
          cursor: 'pointer',
          padding: 0,
        }}
        aria-label="Settings"
      >
        <img
          src="/image/icon/gear.png"
          alt="Settings"
          style={{ width: 22, height: 22 }}
        />
      </button>

      {isOpen && (
        <div style={panelStyles}>
          <div style={{ fontSize: 13, fontWeight: 600, marginBottom: 8 }}>
            Debug Settings
          </div>
          <div style={{ display: 'flex', flexDirection: 'column', gap: 8 }}>
            <div>
              <div style={{ fontSize: 11, textTransform: 'uppercase', opacity: 0.7 }}>
                Current Entry
              </div>
              <div style={valueStyles}>{currentEntryId ?? 'Genesis'}</div>
            </div>
            <div>
              <div style={{ fontSize: 11, textTransform: 'uppercase', opacity: 0.7 }}>
                History Depth
              </div>
              <div style={valueStyles}>{historyDepth}</div>
            </div>
            <button type="button" style={buttonStyles} onClick={handleReset}>
              Reset To Genesis
            </button>
          </div>
        </div>
      )}
    </div>
  );
};

export default SettingsOverlay;

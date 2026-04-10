// src/components/maps/PinSyncBus.js
// Shared singleton event bus for card ↔ pin synchronisation.
// Both grid cards and list cards emit events here; MASTERMap listens.
// MASTERMap also emits; cards listen via useEffect.

const _listeners = {};

export const PinSyncBus = {
  emit(event, id) {
    (_listeners[event] || []).forEach((fn) => fn(id));
  },

  on(event, fn) {
    if (!_listeners[event]) _listeners[event] = [];
    _listeners[event].push(fn);
    // Returns cleanup function
    return () => {
      _listeners[event] = (_listeners[event] || []).filter((f) => f !== fn);
    };
  },

  off(event, fn) {
    if (!_listeners[event]) return;
    _listeners[event] = _listeners[event].filter((f) => f !== fn);
  },
};

// Events used across the platform:
// "card:hover"  (id)  — mouse entered a listing card
// "card:leave"  (id)  — mouse left a listing card
// "card:click"  (id)  — listing card clicked (scroll map to pin)
// "pin:hover"   (id)  — mouse entered a map pin
// "pin:leave"   (id)  — mouse left a map pin
// "pin:click"   (id)  — map pin clicked (scroll list to card)

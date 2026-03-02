// ─── src/chat/AuraChat.jsx ────────────────────────────────────────────────────
// Single mount point for the entire three-state chat system.
// Renders exactly one state at a time: closed | open | fullchat
import { useEffect }    from "react";
import { useChat }      from "./ChatContext";
import AuraLauncher     from "./AuraLauncher";
import AuraMiniBar      from "./AuraMiniBar";
import AuraWorkspace    from "./AuraWorkspace";

// ── Global keyframe animations (injected once here) ──────────────────────────
const KEYFRAMES = `
  @keyframes lwd-dot-pulse {
    0%, 80%, 100% { transform: scale(0.65); opacity: 0.45; }
    40%           { transform: scale(1.2);  opacity: 1;    }
  }
  @keyframes lwd-status-pulse {
    0%, 100% { opacity: 1;   transform: scale(1);    }
    50%      { opacity: 0.4; transform: scale(0.82); }
  }
  @keyframes shimmer {
    0%   { background-position: 200% 0; }
    100% { background-position: -200% 0; }
  }
`;

export default function AuraChat({ onNavigateHome }) {
  const { chatUiState, openMiniBar, sendMessage } = useChat();

  // Connect hero search "Ask Aura" button to the new system
  useEffect(() => {
    const handler = (e) => {
      openMiniBar();
      // If query was passed, send it after a brief delay so the UI opens first
      const q = e.detail?.query;
      if (q) setTimeout(() => sendMessage(q), 300);
    };
    window.addEventListener("lwd:openAura", handler);
    return () => window.removeEventListener("lwd:openAura", handler);
  }, [openMiniBar, sendMessage]);

  return (
    <>
      <style>{KEYFRAMES}</style>
      {chatUiState === "closed"   && <AuraLauncher />}
      {chatUiState === "open"     && <AuraMiniBar />}
      {chatUiState === "fullchat" && (
        <AuraWorkspace
          onBack={onNavigateHome}
          onHome={onNavigateHome}
          onVenues={onNavigateHome}
        />
      )}
    </>
  );
}

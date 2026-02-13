"use client"

import { HeaderBar } from "@/components/header-bar"
import { ChatPanel } from "@/components/chat-panel"
import { MessageInput } from "@/components/message-input"
import { usePlayground } from "@/hooks/use-playground"
import { cn } from "@/lib/utils"

export default function PlaygroundPage() {
  const {
    settings,
    panels,
    updateApiKey,
    updateModel,
    updatePanelCount,
    toggleThinking,
    updateSystemPrompt,
    clearAllChats,
    sendMessage,
  } = usePlayground()

  const isAnyPanelLoading = panels.some((p) => p.isLoading)

  return (
    <div className="flex flex-col h-dvh">
      {/* Header Control Bar */}
      <HeaderBar
        settings={settings}
        onUpdateApiKey={updateApiKey}
        onUpdateModel={updateModel}
        onUpdatePanelCount={updatePanelCount}
        onToggleThinking={toggleThinking}
        onClearAll={clearAllChats}
      />

      {/* Main Chat Grid */}
      <main className="flex-1 min-h-0 overflow-hidden">
        {/* Desktop: horizontal split */}
        <div className="hidden md:flex h-full w-full">
          {panels.map((panel, idx) => (
            <div
              key={panel.id}
              className="min-w-0"
              style={{ flexBasis: `${100 / settings.panelCount}%`, flexGrow: 1, flexShrink: 1 }}
            >
              <ChatPanel
                panel={panel}
                panelIndex={idx}
                totalPanels={panels.length}
                onUpdateSystemPrompt={(prompt) =>
                  updateSystemPrompt(panel.id, prompt)
                }
              />
            </div>
          ))}
        </div>

        {/* Mobile: vertical stack */}
        <div className={cn(
          "flex flex-col md:hidden h-full overflow-y-auto",
          panels.length > 1 && "divide-y"
        )}>
          {panels.map((panel, idx) => (
            <div key={panel.id} className="min-h-[300px] flex-shrink-0">
              <ChatPanel
                panel={panel}
                panelIndex={idx}
                totalPanels={1}
                onUpdateSystemPrompt={(prompt) =>
                  updateSystemPrompt(panel.id, prompt)
                }
              />
            </div>
          ))}
        </div>
      </main>

      {/* Global Input Area */}
      <MessageInput
        onSend={sendMessage}
        disabled={!settings.apiKey.trim()}
        isAnyPanelLoading={isAnyPanelLoading}
      />
    </div>
  )
}

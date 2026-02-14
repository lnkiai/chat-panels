"use client"

import { HeaderBar } from "@/components/header-bar"
import { ChatPanel } from "@/components/chat-panel"
import { MessageInput } from "@/components/message-input"
import { usePlayground } from "@/hooks/use-playground"

export default function PlaygroundPage() {
  const {
    settings,
    panels,
    updateApiKey,
    updateModel,
    updatePanelCount,
    toggleThinking,
    updatePanelTitle,
    updateSystemPrompt,
    clearAllChats,
    sendMessage,
  } = usePlayground()

  const isAnyPanelLoading = panels.some((p) => p.isLoading)
  const count = settings.panelCount

  return (
    <div className="flex flex-col h-dvh bg-background">
      {/* Floating Header */}
      <HeaderBar
        settings={settings}
        onUpdateApiKey={updateApiKey}
        onUpdatePanelCount={updatePanelCount}
        onToggleThinking={toggleThinking}
        onClearAll={clearAllChats}
      />

      {/* Main Chat Grid */}
      <main className="flex-1 min-h-0 overflow-hidden p-3 md:p-4 pt-2 md:pt-3">
        {/* Mobile: vertical stack with gap */}
        <div className="flex flex-col md:hidden h-full gap-3">
          {panels.map((panel, idx) => (
            <div
              key={panel.id}
              className="min-h-0"
              style={{
                flexBasis: `${100 / count}%`,
                flexGrow: 1,
                flexShrink: 1,
              }}
            >
              <ChatPanel
                panel={panel}
                panelIndex={idx}
                totalPanels={count}
                onUpdateSystemPrompt={(prompt) =>
                  updateSystemPrompt(panel.id, prompt)
                }
                onUpdateTitle={(title) => updatePanelTitle(panel.id, title)}
              />
            </div>
          ))}
        </div>

        {/* Desktop: smart grid with gap */}
        <div className="hidden md:block h-full">
          {count <= 3 ? (
            <div className="flex h-full gap-4">
              {panels.map((panel, idx) => (
                <div
                  key={panel.id}
                  className="min-w-0 h-full"
                  style={{
                    flexBasis: `${100 / count}%`,
                    flexGrow: 1,
                    flexShrink: 1,
                  }}
                >
                  <ChatPanel
                    panel={panel}
                    panelIndex={idx}
                    totalPanels={count}
                    onUpdateSystemPrompt={(prompt) =>
                      updateSystemPrompt(panel.id, prompt)
                    }
                    onUpdateTitle={(title) =>
                      updatePanelTitle(panel.id, title)
                    }
                  />
                </div>
              ))}
            </div>
          ) : count === 4 ? (
            <div className="grid grid-cols-2 grid-rows-2 h-full gap-4">
              {panels.map((panel, idx) => (
                <div key={panel.id} className="min-w-0 min-h-0 overflow-hidden">
                  <ChatPanel
                    panel={panel}
                    panelIndex={idx}
                    totalPanels={count}
                    onUpdateSystemPrompt={(prompt) =>
                      updateSystemPrompt(panel.id, prompt)
                    }
                    onUpdateTitle={(title) =>
                      updatePanelTitle(panel.id, title)
                    }
                  />
                </div>
              ))}
            </div>
          ) : (
            <div className="flex flex-col h-full gap-4">
              {/* Top row: 3 panels */}
              <div className="flex flex-1 min-h-0 gap-4">
                {panels.slice(0, 3).map((panel, idx) => (
                  <div
                    key={panel.id}
                    className="min-w-0 h-full"
                    style={{
                      flexBasis: "33.333%",
                      flexGrow: 1,
                      flexShrink: 1,
                    }}
                  >
                    <ChatPanel
                      panel={panel}
                      panelIndex={idx}
                      totalPanels={count}
                      onUpdateSystemPrompt={(prompt) =>
                        updateSystemPrompt(panel.id, prompt)
                      }
                      onUpdateTitle={(title) =>
                        updatePanelTitle(panel.id, title)
                      }
                    />
                  </div>
                ))}
              </div>
              {/* Bottom row: 2 panels */}
              <div className="flex flex-1 min-h-0 gap-4">
                {panels.slice(3, 5).map((panel, idx) => (
                  <div
                    key={panel.id}
                    className="min-w-0 h-full"
                    style={{
                      flexBasis: "50%",
                      flexGrow: 1,
                      flexShrink: 1,
                    }}
                  >
                    <ChatPanel
                      panel={panel}
                      panelIndex={idx + 3}
                      totalPanels={count}
                      onUpdateSystemPrompt={(prompt) =>
                        updateSystemPrompt(panel.id, prompt)
                      }
                      onUpdateTitle={(title) =>
                        updatePanelTitle(panel.id, title)
                      }
                    />
                  </div>
                ))}
              </div>
            </div>
          )}
        </div>
      </main>

      {/* Global Input - transparent background */}
      <MessageInput
        onSend={sendMessage}
        disabled={!settings.apiKey.trim()}
        isAnyPanelLoading={isAnyPanelLoading}
        model={settings.model}
        onUpdateModel={updateModel}
      />
    </div>
  )
}

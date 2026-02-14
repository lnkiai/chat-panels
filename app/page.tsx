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
    updatePanelTitle,
    updateSystemPrompt,
    clearAllChats,
    sendMessage,
  } = usePlayground()

  const isAnyPanelLoading = panels.some((p) => p.isLoading)
  const count = settings.panelCount

  return (
    <div className="flex flex-col h-dvh">
      {/* Header Control Bar */}
      <HeaderBar
        settings={settings}
        onUpdateApiKey={updateApiKey}
        onUpdatePanelCount={updatePanelCount}
        onToggleThinking={toggleThinking}
        onClearAll={clearAllChats}
      />

      {/* Main Chat Grid */}
      <main className="flex-1 min-h-0 overflow-hidden">
        {/* Mobile: always vertical stack */}
        <div className="flex flex-col md:hidden h-full">
          {panels.map((panel, idx) => (
            <div
              key={panel.id}
              className="min-h-0 border-b last:border-b-0"
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

        {/* Desktop: smart grid layout */}
        <div className="hidden md:block h-full">
          {count <= 3 ? (
            /* 1-3 panels: horizontal row */
            <div className="flex h-full">
              {panels.map((panel, idx) => (
                <div
                  key={panel.id}
                  className={cn(
                    "min-w-0 h-full",
                    idx < count - 1 && "border-r"
                  )}
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
            /* 4 panels: 2x2 grid */
            <div className="grid grid-cols-2 grid-rows-2 h-full">
              {panels.map((panel, idx) => (
                <div
                  key={panel.id}
                  className={cn(
                    "min-w-0 min-h-0 overflow-hidden",
                    idx % 2 === 0 && "border-r",
                    idx < 2 && "border-b"
                  )}
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
          ) : (
            /* 5 panels: 3 top + 2 bottom */
            <div className="flex flex-col h-full">
              {/* Top row: 3 panels */}
              <div className="flex flex-1 min-h-0 border-b">
                {panels.slice(0, 3).map((panel, idx) => (
                  <div
                    key={panel.id}
                    className={cn(
                      "min-w-0 h-full",
                      idx < 2 && "border-r"
                    )}
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
              <div className="flex flex-1 min-h-0">
                {panels.slice(3, 5).map((panel, idx) => (
                  <div
                    key={panel.id}
                    className={cn(
                      "min-w-0 h-full",
                      idx < 1 && "border-r"
                    )}
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

      {/* Global Input Area - with model selector */}
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

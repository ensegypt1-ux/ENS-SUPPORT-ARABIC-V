"use client";

import { useState } from "react";
import { Loader2, MessageSquare, RotateCcw } from "lucide-react";
import { Button } from "@/components/ui/button";
import {
  Card,
  CardContent,
  CardHeader,
} from "@/components/ui/card";
import { PanelSectionHeader } from "@/components/ui/panel-form";
import { ChatWindow } from "@/components/ai-chat/chat-window";
import { useAiChatConfig } from "@/components/ai-chat/use-ai-chat-config";
import { CHAT_SESSION_STORAGE_KEY } from "@/components/ai-chat/use-chat-session";

interface TestAIPanelProps {
  widgetWidth?: number;
  widgetHeight?: number;
}

export function TestAIPanel({
  widgetWidth,
  widgetHeight,
}: TestAIPanelProps) {
  const config = useAiChatConfig();
  const testConfig = config
    ? {
        ...config,
        widgetWidth: widgetWidth ?? config.widgetWidth,
        widgetHeight: widgetHeight ?? config.widgetHeight,
      }
    : null;
  // Bumping the key remounts ChatWindow with a fresh session.
  const [resetKey, setResetKey] = useState(0);

  const handleReset = () => {
    try {
      window.localStorage.removeItem(CHAT_SESSION_STORAGE_KEY);
    } catch {
      // storage unavailable — ignore
    }
    setResetKey((k) => k + 1);
  };

  return (
    <Card dir="rtl" className="text-right">
      <CardHeader className="space-y-0">
        <PanelSectionHeader
          title="محادثة اختبار مباشرة"
          icon={<MessageSquare className="h-4 w-4 text-primary" />}
          description="جرّب الأسئلة زي العميل. احفظ الإعدادات قبل الاختبار — بيستخدم الإعدادات الحية."
          actions={
            <Button
              type="button"
              variant="ghost"
              size="sm"
              onClick={handleReset}
              className="shrink-0 text-muted-foreground"
            >
              <RotateCcw className="h-3.5 w-3.5" />
              <span className="ms-1.5">إعادة تعيين</span>
            </Button>
          }
        />
      </CardHeader>
      <CardContent className="space-y-3">
        {config && !config.enabled && (
          <div className="rounded-lg border border-amber-500/40 bg-amber-500/10 p-3 text-xs text-amber-700 dark:text-amber-400">
            روبوت المحادثة متعطّل في الإعدادات. فعّل الوكيل عشان تجرّب الردود
            المباشرة.
          </div>
        )}
        <div className="flex justify-center overflow-auto rounded-xl bg-muted/30 px-4 py-8">
          {testConfig === null ? (
            <div className="flex h-136 items-center justify-center text-sm text-muted-foreground">
              <Loader2 className="me-2 h-4 w-4 animate-spin" />
              بيحمّل الإعدادات الحية…
            </div>
          ) : (
            <ChatWindow
              key={resetKey}
              config={testConfig}
              onClose={handleReset}
              sizeMode="configured"
            />
          )}
        </div>
      </CardContent>
    </Card>
  );
}

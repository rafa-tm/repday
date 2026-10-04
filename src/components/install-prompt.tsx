"use client";

import { useEffect } from "react";
import { EllipsisVertical, Share, SquarePlus, X } from "lucide-react";
import { toast } from "sonner";
import { LogoMark } from "@/components/logo";
import { Button } from "@/components/ui/button";

// Evento não padronizado do Chromium (Android/desktop) que permite abrir o diálogo de instalação.
type BeforeInstallPromptEvent = Event & {
  prompt: () => Promise<void>;
  userChoice: Promise<{ outcome: "accepted" | "dismissed" }>;
};

type Platform = "installable" | "ios" | "other";

const TOAST_ID = "install-pwa";
const DISMISSED_KEY = "repday:install-dismissed-at";
const INSTALLED_KEY = "repday:installed";
const SNOOZE_DAYS = 3;
const SHOW_DELAY_MS = 2500;

function isStandalone() {
  return (
    window.matchMedia("(display-mode: standalone)").matches ||
    // Safari iOS
    (navigator as Navigator & { standalone?: boolean }).standalone === true
  );
}

function isMobile() {
  return /Android|iPhone|iPad|iPod/i.test(navigator.userAgent) || window.matchMedia("(pointer: coarse)").matches;
}

function isIOS() {
  // iPadOS se apresenta como Mac, mas tem tela touch.
  return /iPhone|iPad|iPod/i.test(navigator.userAgent) || (/Macintosh/.test(navigator.userAgent) && navigator.maxTouchPoints > 1);
}

function readStorage(key: string) {
  try {
    return localStorage.getItem(key);
  } catch {
    return null;
  }
}

function writeStorage(key: string, value: string) {
  try {
    localStorage.setItem(key, value);
  } catch {
    // Sem storage (aba anônima etc.): o aviso só volta a aparecer na próxima visita.
  }
}

function recentlyDismissed() {
  const at = Number(readStorage(DISMISSED_KEY));
  return at > 0 && Date.now() - at < SNOOZE_DAYS * 86_400_000;
}

const rememberDismissal = () => writeStorage(DISMISSED_KEY, String(Date.now()));
const rememberInstalled = () => writeStorage(INSTALLED_KEY, "1");

function InstallToast({
  platform,
  onInstall,
  onClose,
}: {
  platform: Platform;
  onInstall: () => void;
  onClose: () => void;
}) {
  return (
    <div className="relative flex w-[calc(100vw-2rem)] max-w-sm gap-3 rounded-2xl border bg-popover p-4 font-sans text-popover-foreground shadow-lg sm:w-96">
      <button
        type="button"
        onClick={onClose}
        aria-label="Fechar"
        className="absolute top-2.5 right-2.5 rounded-md p-1 text-muted-foreground outline-none hover:bg-muted hover:text-foreground focus-visible:ring-2 focus-visible:ring-ring"
      >
        <X className="size-4" />
      </button>

      <div className="flex size-12 shrink-0 items-center justify-center rounded-xl border bg-background shadow-xs">
        <LogoMark className="size-9" />
      </div>

      <div className="flex min-w-0 flex-1 flex-col gap-3 pr-5">
        <div className="flex flex-col gap-0.5">
          <p className="text-sm font-semibold">Instale o RepDay</p>
          <p className="text-sm text-muted-foreground">
            {platform === "installable"
              ? "Abra direto da tela inicial, em tela cheia, como um app."
              : "Tenha o RepDay na tela inicial, em tela cheia, como um app:"}
          </p>
        </div>

        {platform === "ios" && (
          <ol className="flex flex-col gap-1.5 text-sm">
            <li className="flex items-center gap-2">
              <span className="flex size-6 shrink-0 items-center justify-center rounded-md bg-muted">
                <Share className="size-3.5 text-sky-500" />
              </span>
              <span>
                Toque em <strong className="font-medium">Compartilhar</strong>
              </span>
            </li>
            <li className="flex items-center gap-2">
              <span className="flex size-6 shrink-0 items-center justify-center rounded-md bg-muted">
                <SquarePlus className="size-3.5" />
              </span>
              <span>
                Escolha <strong className="font-medium">Adicionar à Tela de Início</strong>
              </span>
            </li>
          </ol>
        )}

        {platform === "other" && (
          <p className="flex items-center gap-2 text-sm">
            <span className="flex size-6 shrink-0 items-center justify-center rounded-md bg-muted">
              <EllipsisVertical className="size-3.5" />
            </span>
            <span>
              No menu do navegador, toque em <strong className="font-medium">Instalar app</strong>
            </span>
          </p>
        )}

        <div className="flex gap-2">
          {platform === "installable" ? (
            <>
              <Button size="sm" onClick={onInstall}>
                Instalar
              </Button>
              <Button size="sm" variant="ghost" onClick={onClose}>
                Agora não
              </Button>
            </>
          ) : (
            <Button size="sm" variant="secondary" onClick={onClose}>
              Entendi
            </Button>
          )}
        </div>
      </div>
    </div>
  );
}

/** No celular, sugere instalar o RepDay como app (instala direto quando o navegador permite). */
export function InstallPrompt() {
  useEffect(() => {
    if (isStandalone()) {
      // Aberto como app instalado: nunca mais sugerir (no Android o storage é o mesmo do navegador).
      rememberInstalled();
      return;
    }
    if (readStorage(INSTALLED_KEY) || !isMobile() || recentlyDismissed()) return;

    let installEvent: BeforeInstallPromptEvent | null = null;

    function close() {
      rememberDismissal();
      toast.dismiss(TOAST_ID);
    }

    async function install() {
      if (!installEvent) return;
      await installEvent.prompt();
      const { outcome } = await installEvent.userChoice;
      installEvent = null;
      if (outcome === "accepted") rememberInstalled();
      else rememberDismissal();
      toast.dismiss(TOAST_ID);
    }

    function show(platform: Platform) {
      toast.custom(() => <InstallToast platform={platform} onInstall={install} onClose={close} />, {
        id: TOAST_ID,
        duration: Infinity,
        // Arrastar para fechar também conta como "agora não".
        onDismiss: rememberDismissal,
      });
    }

    function onBeforeInstallPrompt(event: Event) {
      // Guarda o evento para abrir o diálogo quando a pessoa tocar em "Instalar".
      event.preventDefault();
      installEvent = event as BeforeInstallPromptEvent;
      show("installable");
    }

    function onInstalled() {
      rememberInstalled();
      toast.dismiss(TOAST_ID);
    }

    window.addEventListener("beforeinstallprompt", onBeforeInstallPrompt);
    window.addEventListener("appinstalled", onInstalled);
    // Se o navegador não oferecer a instalação automática (iOS, Firefox...), mostra as instruções.
    const timer = window.setTimeout(() => {
      if (!installEvent) show(isIOS() ? "ios" : "other");
    }, SHOW_DELAY_MS);

    return () => {
      window.clearTimeout(timer);
      window.removeEventListener("beforeinstallprompt", onBeforeInstallPrompt);
      window.removeEventListener("appinstalled", onInstalled);
    };
  }, []);

  return null;
}

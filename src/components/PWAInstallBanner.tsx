import React, { useState } from 'react';
import { Download, Smartphone, X, CheckCircle2 } from 'lucide-react';
import { usePWAInstall } from '../hooks/usePWAInstall';

export const PWAInstallBanner: React.FC = () => {
  const { isInstallable, isInstalled, isIOS, isAndroid, install } = usePWAInstall();
  const [dismissed, setDismissed] = useState(false);
  const [showGuideModal, setShowGuideModal] = useState(false);

  if (isInstalled || dismissed) {
    return null;
  }

  return (
    <>
      <aside aria-label="Install Android App" className="bg-gradient-to-r from-sky-700 via-sky-800 to-slate-900 text-white px-4 py-2.5 shadow-md flex items-center justify-between text-xs sm:text-sm">
        <div className="flex items-center gap-2.5 min-w-0">
          <div className="w-7 h-7 rounded-lg bg-sky-500/30 flex items-center justify-center shrink-0 border border-sky-400/30">
            <Smartphone className="w-4 h-4 text-sky-200" />
          </div>
          <div className="truncate">
            <span className="font-semibold text-white">Install PlumbQuote on Android:</span>{' '}
            <span className="text-sky-200 hidden sm:inline">
              100% Offline, no network needed on work sites
            </span>
          </div>
        </div>

        <div className="flex items-center gap-2 shrink-0 ml-2">
          {isInstallable ? (
            <button
              onClick={install}
              className="px-3 py-1.5 rounded-lg bg-amber-500 hover:bg-amber-400 text-slate-950 font-semibold text-xs flex items-center gap-1.5 shadow-sm active:scale-95 transition-all"
            >
              <Download className="w-3.5 h-3.5" />
              <span>Install App</span>
            </button>
          ) : (
            <button
              onClick={() => setShowGuideModal(true)}
              className="px-2.5 py-1 rounded bg-sky-600 hover:bg-sky-500 text-white font-medium text-xs flex items-center gap-1"
            >
              <Smartphone className="w-3 h-3" />
              <span>How to Install</span>
            </button>
          )}

          <button
            onClick={() => setDismissed(true)}
            aria-label="Dismiss banner"
            className="p-1 rounded text-sky-300 hover:text-white hover:bg-white/10"
          >
            <X className="w-4 h-4" />
          </button>
        </div>
      </aside>

      {/* Android / Mobile Install Instructions Modal */}
      {showGuideModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 backdrop-blur-xs p-4">
          <div className="w-full max-w-sm rounded-2xl bg-white p-6 shadow-2xl text-slate-900">
            <div className="flex items-center gap-3 mb-4">
              <div className="w-10 h-10 rounded-xl bg-sky-100 flex items-center justify-center text-sky-700">
                <Smartphone className="w-6 h-6" />
              </div>
              <div>
                <h3 className="font-bold text-base text-slate-900">Install as Android App</h3>
                <p className="text-xs text-slate-500">Run natively on your phone offline</p>
              </div>
            </div>

            <div className="space-y-3 text-xs text-slate-700 bg-slate-50 p-3.5 rounded-xl border border-slate-200">
              <div className="flex items-start gap-2.5">
                <span className="w-5 h-5 rounded-full bg-sky-600 text-white flex items-center justify-center font-bold text-[10px] shrink-0 mt-0.5">
                  1
                </span>
                <p>
                  Open this page in <strong>Chrome on your Android device</strong>.
                </p>
              </div>
              <div className="flex items-start gap-2.5">
                <span className="w-5 h-5 rounded-full bg-sky-600 text-white flex items-center justify-center font-bold text-[10px] shrink-0 mt-0.5">
                  2
                </span>
                <p>
                  Tap the <strong>three dots menu (⋮)</strong> in the top right corner of Chrome.
                </p>
              </div>
              <div className="flex items-start gap-2.5">
                <span className="w-5 h-5 rounded-full bg-sky-600 text-white flex items-center justify-center font-bold text-[10px] shrink-0 mt-0.5">
                  3
                </span>
                <p>
                  Select <strong>Install app</strong> or <strong>Add to Home screen</strong>.
                </p>
              </div>
              <div className="flex items-start gap-2.5">
                <CheckCircle2 className="w-4 h-4 text-emerald-600 shrink-0 mt-0.5" />
                <p className="text-emerald-700 font-medium">
                  The app icon will be installed on your phone. It launches full screen and functions with zero network.
                </p>
              </div>
            </div>

            <button
              onClick={() => setShowGuideModal(false)}
              className="mt-5 w-full py-2.5 rounded-xl bg-slate-900 text-white text-xs font-semibold hover:bg-slate-800 active:scale-98 transition-all"
            >
              Got it
            </button>
          </div>
        </div>
      )}
    </>
  );
};

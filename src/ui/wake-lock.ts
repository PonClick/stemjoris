// Scherm aan houden tijdens het luisteren (Screen Wake Lock API), als de browser die heeft.

export class ScreenWakeLock {
  private sentinel: WakeLockSentinel | null = null;
  private wanted = false;
  private pending = false;

  get supported(): boolean {
    return typeof navigator !== 'undefined' && 'wakeLock' in navigator;
  }

  /** Vraag het slot aan en onthoud dat we het willen (voor `refresh`). */
  async acquire(): Promise<void> {
    this.wanted = true;
    await this.request();
  }

  /** Opnieuw aanvragen na terugkeer naar het tabblad; de browser geeft het slot dan vrij. */
  async refresh(): Promise<void> {
    if (this.wanted) await this.request();
  }

  release(): void {
    this.wanted = false;
    const s = this.sentinel;
    this.sentinel = null;
    if (s && !s.released) s.release().catch(() => undefined);
  }

  private async request(): Promise<void> {
    if (!this.supported || this.pending || document.visibilityState !== 'visible') return;
    if (this.sentinel && !this.sentinel.released) return;
    this.pending = true;
    try {
      const s = await navigator.wakeLock.request('screen');
      if (!this.wanted) {
        s.release().catch(() => undefined);
        return;
      }
      this.sentinel = s;
      s.addEventListener('release', () => {
        if (this.sentinel === s) this.sentinel = null;
      });
    } catch {
      // Geweigerd (bijv. energiebesparing) of niet toegestaan: geen probleem.
      this.sentinel = null;
    } finally {
      this.pending = false;
    }
  }
}

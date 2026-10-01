import { Injectable, inject, signal } from '@angular/core';
import { MemberApi } from '../api/member.api';

/** Nombre de notifications non lues. Inconnu (null) tant que le serveur n'a pas répondu : aucune pastille n'est alors affichée. */
@Injectable({ providedIn: 'root' })
export class NotificationsStore {
  private readonly api = inject(MemberApi);
  private readonly count = signal<number | null>(null);

  readonly unread = this.count.asReadonly();

  refresh(): void {
    this.api.notificationsNonLues().subscribe({
      next: (value) => this.count.set(value),
      error: () => this.count.set(null),
    });
  }

  reset(): void {
    this.count.set(null);
  }
}

import { Injectable, inject } from '@angular/core'
import { Observable } from 'rxjs'
import { SettingsClient, ClinicSettingsDto, UpdateSettingsCommand } from '../api/mediqueue-api'

@Injectable({ providedIn: 'root' })
export class SettingsService {
  private settingsClient = inject(SettingsClient)

  getSettings(): Observable<ClinicSettingsDto> {
    return this.settingsClient.settingsGET()
  }

  updateSettings(request: UpdateSettingsCommand): Observable<ClinicSettingsDto> {
    return this.settingsClient.settingsPUT(request)
  }
}

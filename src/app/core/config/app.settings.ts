import { environment } from '../../../environments/environment';

export const APP_SETTINGS = {
  apiUrl: environment.serverBaseUrl,
  defaultTheme: 'light' as const,
  currency: 'PEN' as const
};

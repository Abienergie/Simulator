import { supabase } from '../../lib/supabase';

class EnedisAPI {
  private static instance: EnedisAPI;
  private accessToken: string | null = null;
  
  private readonly config = {
    clientId: import.meta.env.VITE_ENEDIS_CLIENT_ID,
    clientSecret: import.meta.env.VITE_ENEDIS_CLIENT_SECRET,
    redirectUri: import.meta.env.VITE_ENEDIS_REDIRECT_URI,
    authUrl: 'https://mon-compte-particulier.enedis.fr/dataconnect/v1/oauth2/authorize',
    tokenUrl: 'https://gw.hml.api.enedis.fr/oauth2/v3/token',
    apiUrl: 'https://gw.hml.api.enedis.fr/v5/metering_data',
    scope: 'fr_be_cons_detail_load_curve'
  };

  private constructor() {}

  public static getInstance(): EnedisAPI {
    if (!EnedisAPI.instance) {
      EnedisAPI.instance = new EnedisAPI();
    }
    return EnedisAPI.instance;
  }

  public async initiateAuth(): Promise<string> {
    const params = new URLSearchParams({
      response_type: 'code',
      client_id: this.config.clientId,
      redirect_uri: this.config.redirectUri,
      duration: 'P1Y',
      state: 'AbieLink1',
      scope: this.config.scope
    });

    const authUrl = `${this.config.authUrl}?${params.toString()}`;
    console.log('URL d\'authentification générée:', authUrl);
    return authUrl;
  }

  public async handleCallback(code: string): Promise<void> {
    try {
      console.log('Échange du code contre un token...');
      const response = await fetch(this.config.tokenUrl, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/x-www-form-urlencoded'
        },
        body: new URLSearchParams({
          grant_type: 'authorization_code',
          client_id: this.config.clientId,
          client_secret: this.config.clientSecret,
          code,
          redirect_uri: this.config.redirectUri
        })
      });

      if (!response.ok) {
        const error = await response.json();
        console.error('Erreur réponse token:', error);
        throw new Error(error.error_description || 'Échec de l\'échange du token');
      }

      const data = await response.json();
      console.log('Token reçu avec succès');
      
      localStorage.setItem('enedis_access_token', data.access_token);
      if (data.refresh_token) {
        localStorage.setItem('enedis_refresh_token', data.refresh_token);
      }
      
      // Stocker la date d'expiration
      const expiresAt = new Date();
      expiresAt.setSeconds(expiresAt.getSeconds() + data.expires_in);
      localStorage.setItem('enedis_token_expires', expiresAt.toISOString());
      
      console.log('Token Enedis stocké avec succès');
    } catch (error) {
      console.error('Erreur détaillée dans handleCallback:', error);
      throw error;
    }
  }

  public async getConsumptionData(prm: string, startDate: string, endDate: string) {
    try {
      const token = await this.getValidToken();
      if (!token) {
        throw new Error('Non authentifié');
      }

      console.log('Récupération des données de consommation...');
      const response = await fetch(
        `${this.config.apiUrl}/daily_consumption?usage_point_id=${prm}&start=${startDate}&end=${endDate}`,
        {
          headers: {
            'Authorization': `Bearer ${token}`,
            'Accept': 'application/json'
          }
        }
      );

      if (!response.ok) {
        console.error('Erreur API:', response.status, response.statusText);
        throw new Error('Échec de la récupération des données');
      }

      const data = await response.json();
      return this.formatConsumptionData(data);
    } catch (error) {
      console.error('Erreur lors de la récupération des données:', error);
      throw error;
    }
  }

  private async getValidToken(): Promise<string | null> {
    const token = localStorage.getItem('enedis_access_token');
    const expiresAt = localStorage.getItem('enedis_token_expires');
    
    if (!token || !expiresAt) {
      return null;
    }

    if (new Date(expiresAt) <= new Date()) {
      // Token expiré, essayer de le rafraîchir
      const refreshToken = localStorage.getItem('enedis_refresh_token');
      if (refreshToken) {
        try {
          await this.refreshToken(refreshToken);
          return localStorage.getItem('enedis_access_token');
        } catch (error) {
          console.error('Erreur refresh token:', error);
          return null;
        }
      }
      return null;
    }

    return token;
  }

  private async refreshToken(refreshToken: string): Promise<void> {
    const response = await fetch(this.config.tokenUrl, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/x-www-form-urlencoded'
      },
      body: new URLSearchParams({
        grant_type: 'refresh_token',
        client_id: this.config.clientId,
        client_secret: this.config.clientSecret,
        refresh_token: refreshToken
      })
    });

    if (!response.ok) {
      throw new Error('Échec du rafraîchissement du token');
    }

    const data = await response.json();
    localStorage.setItem('enedis_access_token', data.access_token);
    if (data.refresh_token) {
      localStorage.setItem('enedis_refresh_token', data.refresh_token);
    }
    
    const expiresAt = new Date();
    expiresAt.setSeconds(expiresAt.getSeconds() + data.expires_in);
    localStorage.setItem('enedis_token_expires', expiresAt.toISOString());
  }

  private formatConsumptionData(data: any) {
    if (!data?.meter_reading?.interval_reading) {
      throw new Error('Format de données invalide');
    }

    const readings = data.meter_reading.interval_reading;
    const consumption = readings.map((reading: any) => ({
      date: reading.date,
      peakHours: reading.value * (reading.measure_type === 'HP' ? 1 : 0),
      offPeakHours: reading.value * (reading.measure_type === 'HC' ? 1 : 0)
    }));

    return { consumption };
  }
}

export const enedisApi = EnedisAPI.getInstance();
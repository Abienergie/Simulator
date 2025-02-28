class EnedisAPI {
  private static instance: EnedisAPI;
  private accessToken: string | null = null;
  
  private readonly config = {
    clientId: import.meta.env.VITE_ENEDIS_CLIENT_ID || 'Y_LuB7HsQW3JWYudw7HRmN28FN8a',
    clientSecret: 'Pb9H1p8zJ4IfX0xca5c7lficGo4a',
    redirectUri: import.meta.env.VITE_ENEDIS_REDIRECT_URI || 'https://abienergie.github.io/Simulator/#/oauth/callback',
    authUrl: 'https://mon-compte-particulier.enedis.fr/dataconnect/v1/oauth2/authorize',
    tokenUrl: 'https://gw.hml.api.enedis.fr/oauth2/v3/token',
    apiUrl: 'https://gw.hml.api.enedis.fr/v5/metering_data',
    scope: 'fr_be_cons_detail_load_curve'
  };

  private constructor() {
    // Récupérer le token du localStorage s'il existe
    this.accessToken = localStorage.getItem('enedis_access_token');
  }

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
      
      // Créer un FormData pour l'échange du code
      const formData = new URLSearchParams();
      formData.append('grant_type', 'authorization_code');
      formData.append('client_id', this.config.clientId);
      formData.append('client_secret', this.config.clientSecret);
      formData.append('code', code);
      formData.append('redirect_uri', this.config.redirectUri);

      // Code pour l'appel réel à l'API Enedis
      const response = await fetch(this.config.tokenUrl, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/x-www-form-urlencoded'
        },
        body: formData.toString()
      });

      if (!response.ok) {
        const errorText = await response.text();
        console.error('Erreur réponse token:', errorText);
        try {
          const error = JSON.parse(errorText);
          throw new Error(error.error_description || 'Échec de l\'échange du token');
        } catch (e) {
          throw new Error(`Échec de l'échange du token: ${response.status} ${response.statusText}`);
        }
      }

      const data = await response.json();
      console.log('Token reçu avec succès');
      
      // Stocker le token dans le localStorage
      localStorage.setItem('enedis_access_token', data.access_token);
      if (data.refresh_token) {
        localStorage.setItem('enedis_refresh_token', data.refresh_token);
      }
      
      // Stocker la date d'expiration
      const expiresAt = new Date();
      expiresAt.setSeconds(expiresAt.getSeconds() + data.expires_in);
      localStorage.setItem('enedis_token_expires', expiresAt.toISOString());
      
      this.accessToken = data.access_token;
      console.log('Token Enedis stocké avec succès');
      
    } catch (error) {
      console.error('Erreur détaillée dans handleCallback:', error);
      throw error;
    }
  }

  public async testConnection(prm: string): Promise<boolean> {
    try {
      const token = await this.getValidToken();
      if (!token) {
        return false;
      }

      // Vérifier si le token est valide en faisant une requête simple
      const endDate = new Date().toISOString().split('T')[0];
      const startDate = new Date();
      startDate.setDate(startDate.getDate() - 7); // Juste une semaine pour tester
      
      const response = await fetch(
        `${this.config.apiUrl}/daily_consumption?usage_point_id=${prm}&start=${startDate.toISOString().split('T')[0]}&end=${endDate}`,
        {
          headers: {
            'Authorization': `Bearer ${token}`,
            'Accept': 'application/json'
          }
        }
      );

      return response.ok;
    } catch (error) {
      console.error('Erreur lors du test de connexion:', error);
      return false;
    }
  }

  public async getConsumptionData(prm: string, startDate: string, endDate: string) {
    try {
      const token = await this.getValidToken();
      if (!token) {
        throw new Error('Non authentifié');
      }

      console.log('Récupération des données de consommation...');
      
      // Créer une date de début et de fin si non fournies
      if (!startDate) {
        const oneYearAgo = new Date();
        oneYearAgo.setFullYear(oneYearAgo.getFullYear() - 1);
        startDate = oneYearAgo.toISOString().split('T')[0];
      }
      
      if (!endDate) {
        endDate = new Date().toISOString().split('T')[0];
      }

      // Code pour l'appel réel à l'API Enedis
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
        
        // Si le token est expiré, essayer de le rafraîchir et réessayer
        if (response.status === 401) {
          const refreshToken = localStorage.getItem('enedis_refresh_token');
          if (refreshToken) {
            await this.refreshToken(refreshToken);
            return this.getConsumptionData(prm, startDate, endDate);
          }
        }
        
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
    // Si on a déjà un token en mémoire, on l'utilise
    if (this.accessToken) {
      return this.accessToken;
    }
    
    // Sinon on vérifie dans le localStorage
    const token = localStorage.getItem('enedis_access_token');
    const expiresAt = localStorage.getItem('enedis_token_expires');
    
    if (!token || !expiresAt) {
      return null;
    }

    // Vérifier si le token est expiré
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

    this.accessToken = token;
    return token;
  }

  private async refreshToken(refreshToken: string): Promise<void> {
    // Code pour l'appel réel à l'API Enedis
    const formData = new URLSearchParams();
    formData.append('grant_type', 'refresh_token');
    formData.append('client_id', this.config.clientId);
    formData.append('client_secret', this.config.clientSecret);
    formData.append('refresh_token', refreshToken);

    const response = await fetch(this.config.tokenUrl, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/x-www-form-urlencoded'
      },
      body: formData.toString()
    });

    if (!response.ok) {
      throw new Error('Échec du rafraîchissement du token');
    }

    const data = await response.json();
    localStorage.setItem('enedis_access_token', data.access_token);
    this.accessToken = data.access_token;
    
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

    // Traiter les données pour les adapter au format attendu
    const readings = data.meter_reading.interval_reading;
    
    // Créer un dictionnaire pour regrouper les valeurs par date
    const readingsByDate: Record<string, { peakHours: number, offPeakHours: number }> = {};
    
    readings.forEach((reading: any) => {
      const date = reading.date;
      const value = parseFloat(reading.value);
      const measureType = reading.measure_type;
      
      if (!readingsByDate[date]) {
        readingsByDate[date] = { peakHours: 0, offPeakHours: 0 };
      }
      
      if (measureType === 'HP') {
        readingsByDate[date].peakHours += value;
      } else if (measureType === 'HC') {
        readingsByDate[date].offPeakHours += value;
      } else {
        // Si pas de distinction HP/HC, on considère que c'est en heures pleines
        readingsByDate[date].peakHours += value;
      }
    });
    
    // Convertir le dictionnaire en tableau
    const consumption = Object.entries(readingsByDate).map(([date, values]) => ({
      date,
      peakHours: values.peakHours,
      offPeakHours: values.offPeakHours
    }));

    return { consumption };
  }
}

export const enedisApi = EnedisAPI.getInstance();
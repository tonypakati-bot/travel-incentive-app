import api from '../api';

export interface AdminTrip {
  id: string;
  name: string;
  status: string;
  startDate: string;
  endDate: string;
  participants: number;
  registered: number;
}

export const getTrips = async (): Promise<AdminTrip[]> => {
  try {
    // Per ora, otteniamo il singolo viaggio esistente e lo mappiamo
    const res = await api.get('/trip');
    const tripData = res.data;

    // Conta gli utenti totali
    const usersRes = await api.get('/admin/users/count');
    const totalUsers = usersRes.data.count || 0;

    // Conta le registrazioni per questo viaggio
    const registrationsRes = await api.get('/admin/registrations/count');
    const registeredUsers = registrationsRes.data.count || 0;

    // Mappa il singolo viaggio in formato AdminTrip
    const adminTrip: AdminTrip = {
      id: tripData._id || '1',
      name: tripData.eventDetails?.title || 'Viaggio Incentive',
      status: 'Attivo', // Status fisso per ora
  startDate: tripData.eventDetails?.startDate || '2025-11-15',
  endDate: tripData.eventDetails?.endDate || '2025-11-17',
      participants: totalUsers,
      registered: registeredUsers,
    };

    return [adminTrip];
  } catch (error) {
    console.error('Error fetching trips:', error);
    // Fallback ai dati fittizi se errore
    return [
      {
        id: '1',
        name: 'Abu Dhabi Incentive 2025',
        status: 'Attivo',
        startDate: '2025-11-15',
        endDate: '2025-11-17',
        participants: 0,
        registered: 0,
      },
    ];
  }
};
import axios from 'axios';
import { config } from '../config/index.js';

const elevariApi = axios.create({
  baseURL: process.env.ELEVARI_API_URL || 'http://localhost:3000',
  timeout: 10000,
  headers: {
    'Content-Type': 'application/json',
    Authorization: `Bearer ${process.env.JWT_SECRET || ''}`,
  },
});

export const elevariTools = {
  async consultar_disponibilidad({ fecha_entrada, fecha_salida, huespedes }) {
    const { data } = await elevariApi.get('/api/v1/availability', {
      params: { fecha_entrada, fecha_salida, huespedes },
    });
    return data;
  },

  async crear_reserva({ datos_reserva }) {
    const { data } = await elevariApi.post('/api/v1/reservations', datos_reserva);
    return data;
  },

  async obtener_reserva({ reserva_id }) {
    const { data } = await elevariApi.get(`/api/v1/reservations/${reserva_id}`);
    return data;
  },

  async iniciar_pago({ reserva_id, metodo }) {
    const { data } = await elevariApi.post('/api/v1/payments', { reserva_id, metodo });
    return data;
  },

  async verificar_pago({ pago_id }) {
    const { data } = await elevariApi.get(`/api/v1/payments/${pago_id}`);
    return data;
  },

  async solicitar_factura({ reserva_id, datos_facturacion }) {
    const { data } = await elevariApi.post('/api/v1/invoices', { reserva_id, datos_facturacion });
    return data;
  },

  async cancelar_reserva({ reserva_id, motivo }) {
    const { data } = await elevariApi.post(`/api/v1/reservations/${reserva_id}/cancel`, { motivo });
    return data;
  },

  async solicitar_reembolso({ pago_id, motivo }) {
    const { data } = await elevariApi.post('/api/v1/refunds', { pago_id, motivo });
    return data;
  },

  async obtener_politicas({ tipo }) {
    const { data } = await elevariApi.get(`/api/v1/policies/${tipo}`);
    return data;
  },

  async crear_ticket_asistencia({ tipo, descripcion, urgencia }) {
    const { data } = await elevariApi.post('/api/v1/support-tickets', { tipo, descripcion, urgencia });
    return data;
  },

  async escalar_a_humano({ motivo }) {
    const { data } = await elevariApi.post('/api/v1/support-tickets/escalate', { motivo });
    return data;
  },
};
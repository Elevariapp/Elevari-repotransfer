// lib/alegra.ts
export const getAlegraClient = () => {
  const email = process.env.ALEGRA_EMAIL;
  const token = process.env.ALEGRA_API_TOKEN;

  if (!email || !token) {
    console.warn("⚠️ Alegra: Credenciales no configuradas. Facturación deshabilitada.");
    return null;
  }

  const auth = Buffer.from(`${email}:${token}`).toString('base64');

  return {
    headers: {
      'Authorization': `Basic ${auth}`,
      'Content-Type': 'application/json',
    },
    baseUrl: 'https://api.alegra.com/api/v1'
  };
};

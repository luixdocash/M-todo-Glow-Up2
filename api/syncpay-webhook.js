import crypto from 'crypto';

/**
 * Endpoint de Webhook da SyncPay para envio seguro do evento Purchase
 * Funciona como Vercel Serverless Function em: /api/syncpay-webhook
 * 
 * Nenhuma chave secreta é exposta ao navegador do usuário.
 */
export default async function handler(req, res) {
  // Apenas aceita método POST
  if (req.method !== 'POST') {
    return res.status(405).json({ error: 'Method not allowed. Use POST.' });
  }

  try {
    const payload = req.body || {};
    console.log('[SyncPay Webhook] Recebido:', JSON.stringify(payload).slice(0, 300));

    // Identifica status de pagamento aprovado
    const status = (payload.status || payload.event || payload.current_status || '').toLowerCase();
    const isApproved = 
      status.includes('paid') || 
      status.includes('approved') || 
      status.includes('completed') || 
      status.includes('concluido') || 
      status.includes('aprovado');

    if (!isApproved) {
      console.log('[SyncPay Webhook] Evento ignorado (não aprovado):', status);
      return res.status(200).json({ 
        received: true, 
        message: 'Evento registrado, aguardando status aprovado.' 
      });
    }

    // Dados da transação
    const transactionId = payload.id || payload.transaction_id || payload.order_id || `order_${Date.now()}`;
    const amount = parseFloat(payload.amount || payload.value || payload.total || '19.99');
    const customer = payload.customer || payload.buyer || {};
    const email = customer.email || payload.email || '';
    const phone = customer.phone || payload.phone || '';

    // Se o usuário configurar o META_ACCESS_TOKEN nas variáveis de ambiente da Vercel
    const metaPixelId = process.env.META_PIXEL_ID || '2694708427634855';
    const metaAccessToken = process.env.META_ACCESS_TOKEN;

    if (metaAccessToken) {
      const sha256 = (str) => crypto.createHash('sha256').update(str.trim().toLowerCase()).digest('hex');

      const userData = {};
      if (email) userData.em = [sha256(email)];
      if (phone) userData.ph = [sha256(phone.replace(/\D/g, ''))];
      if (req.headers['x-forwarded-for']) userData.client_ip_address = req.headers['x-forwarded-for'].split(',')[0].trim();
      if (req.headers['user-agent']) userData.client_user_agent = req.headers['user-agent'];

      const capiPayload = {
        data: [
          {
            event_name: 'Purchase',
            event_time: Math.floor(Date.now() / 1000),
            event_id: String(transactionId),
            action_source: 'website',
            user_data: userData,
            custom_data: {
              currency: 'BRL',
              value: amount,
              content_name: 'Método Glow UP - 21 Dias',
              content_ids: ['metodo-glowup-1999'],
              content_type: 'product'
            }
          }
        ]
      };

      const capiRes = await fetch(`https://graph.facebook.com/v18.0/${metaPixelId}/events?access_token=${metaAccessToken}`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(capiPayload)
      });

      const capiJson = await capiRes.json();
      console.log('[Meta CAPI] Resposta:', capiJson);
    } else {
      console.log('[Meta CAPI] META_ACCESS_TOKEN não configurado no servidor. Evento registrado internamente.');
    }

    return res.status(200).json({
      received: true,
      transaction_id: transactionId,
      status: 'approved',
      purchase_tracked: true
    });
  } catch (error) {
    console.error('[SyncPay Webhook] Erro no processamento:', error);
    // Retorna 200 para a SyncPay não ficar reenviando em loop em caso de erro menor
    return res.status(200).json({ received: true, error: error.message });
  }
}

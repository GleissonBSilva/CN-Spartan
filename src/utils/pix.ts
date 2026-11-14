// Utilitário Oficial para Geração de Pix BR Code (EMV Co / Banco Central do Brasil)

export interface PixConfig {
  keyType: 'email' | 'cpf' | 'cnpj' | 'telefone' | 'aleatoria';
  key: string;
  recipientName: string;
  city: string;
  customMessage?: string;
}

export const DEFAULT_PIX_CONFIG: PixConfig = {
  keyType: 'email',
  key: 'gleisson1984@gmail.com',
  recipientName: 'Gleisson B Silva',
  city: 'Manaus',
  customMessage: 'Olá! Segue sua cobrança Pix Cine Spartan para ativação ou renovação imediata:',
};

// Remove acentuação e caracteres especiais mantendo padrão EMV Co
function sanitizeText(str: string, maxLength: number): string {
  return (str || '')
    .normalize('NFD')
    .replace(/[\u0300-\u036f]/g, '')
    .replace(/[^a-zA-Z0-9 ]/g, '')
    .trim()
    .toUpperCase()
    .slice(0, maxLength);
}

// Formata Tag-Length-Value (TLV)
function formatTLV(id: string, value: string): string {
  const len = String(value.length).padStart(2, '0');
  return `${id}${len}${value}`;
}

// Cálculo do CRC16-CCITT (0xFFFF / 0x1021) conforme norma do BACEN
function calculateCRC16(payload: string): string {
  let crc = 0xffff;
  const polynomial = 0x1021;

  for (let i = 0; i < payload.length; i++) {
    crc ^= payload.charCodeAt(i) << 8;
    for (let j = 0; j < 8; j++) {
      if ((crc & 0x8000) !== 0) {
        crc = ((crc << 1) ^ polynomial) & 0xffff;
      } else {
        crc = (crc << 1) & 0xffff;
      }
    }
  }

  return crc.toString(16).toUpperCase().padStart(4, '0');
}

export interface GeneratePixOptions {
  key: string;
  recipientName?: string;
  city?: string;
  amount?: number;
  txId?: string;
}

/**
 * Gera o código Pix Copia e Cola (BR Code) válido para qualquer app de banco
 */
export function generatePixPayload(options: GeneratePixOptions): string {
  const key = (options.key || DEFAULT_PIX_CONFIG.key).trim();
  const name = sanitizeText(options.recipientName || DEFAULT_PIX_CONFIG.recipientName, 25) || 'GLEISSON B SILVA';
  const city = sanitizeText(options.city || DEFAULT_PIX_CONFIG.city, 15) || 'MANAUS';
  const txId = (options.txId || '***').slice(0, 25);

  // Payload Format Indicator (00)
  let payload = formatTLV('00', '01');

  // Merchant Account Information (26)
  const gui = formatTLV('00', 'br.gov.bcb.pix');
  const pixKey = formatTLV('01', key);
  payload += formatTLV('26', `${gui}${pixKey}`);

  // Merchant Category Code (52)
  payload += formatTLV('52', '0000');

  // Transaction Currency (53 - BRL = 986)
  payload += formatTLV('53', '986');

  // Transaction Amount (54)
  if (options.amount && options.amount > 0) {
    const formattedAmount = options.amount.toFixed(2);
    payload += formatTLV('54', formattedAmount);
  }

  // Country Code (58 - BR)
  payload += formatTLV('58', 'BR');

  // Merchant Name (59)
  payload += formatTLV('59', name);

  // Merchant City (60)
  payload += formatTLV('60', city);

  // Additional Data Field Template (62) - Reference Label / TxID
  const referenceLabel = formatTLV('05', txId);
  payload += formatTLV('62', referenceLabel);

  // CRC16 (63)
  const payloadToHash = `${payload}6304`;
  const checksum = calculateCRC16(payloadToHash);

  return `${payloadToHash}${checksum}`;
}

/**
 * Retorna a URL da imagem escaneável do QR Code
 */
export function getPixQrCodeUrl(payload: string, size: number = 250): string {
  return `https://api.qrserver.com/v1/create-qr-code/?size=${size}x${size}&margin=10&data=${encodeURIComponent(payload)}`;
}

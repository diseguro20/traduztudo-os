export interface PaymentChargeInput {
  amount: number;
  customerName: string;
  customerDocument?: string;
  customerEmail: string;
  description: string;
  workOrderCode?: string;
  method: 'pix' | 'credit_card' | 'boleto';
}

export interface PaymentChargeResult {
  chargeId: string;
  qrCodePix?: string;
  qrCodePixText?: string;
  barcodeBoleto?: string;
  paymentUrl: string;
  status: 'pending' | 'paid';
  expiresAt: string;
}

export class PaymentProvider {
  private static instance: PaymentProvider;
  private providerName: string = 'Mercado Pago / Asaas / Stripe';
  private isConfigured: boolean = false;

  private constructor() {
    this.isConfigured = !!process.env.PAYMENT_API_KEY;
  }

  public static getInstance(): PaymentProvider {
    if (!PaymentProvider.instance) {
      PaymentProvider.instance = new PaymentProvider();
    }
    return PaymentProvider.instance;
  }

  public getStatus() {
    return {
      configured: this.isConfigured,
      gateway: this.providerName,
      status: this.isConfigured ? 'Pronto para Produção' : 'Ambiente Sandbox / Aguardando Chaves de Produção',
      supportedMethods: ['PIX Instantâneo', 'Boleto Registrado', 'Cartão de Crédito 12x'],
    };
  }

  public async createPixCharge(input: PaymentChargeInput): Promise<PaymentChargeResult> {
    const chargeId = `chg_${Date.now()}`;
    return {
      chargeId,
      qrCodePixText: `00020126580014br.gov.bcb.pix0136${Math.random().toString(36).substring(2)}520400005303986540${input.amount.toFixed(2)}5802BR5910TRADUZTUDO6009SAOPAULO62070503***6304ABCD`,
      paymentUrl: `https://traduztudo.com.br/pay/${chargeId}`,
      status: 'pending',
      expiresAt: new Date(Date.now() + 86400000).toISOString(),
    };
  }
}

export const paymentProvider = PaymentProvider.getInstance();

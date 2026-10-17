/** Lo que se usa de `qrcode` (el paquete no trae tipos y @types/qrcode no está instalado). */
declare module 'qrcode' {
  interface QRCodeOptions {
    errorCorrectionLevel?: 'L' | 'M' | 'Q' | 'H'
    margin?: number
    width?: number
  }
  interface QRCodeMatrix {
    modules: { size: number; get: (row: number, col: number) => number | boolean }
  }
  const QRCode: {
    toDataURL: (text: string, options?: QRCodeOptions) => Promise<string>
    create: (text: string, options?: QRCodeOptions) => QRCodeMatrix
  }
  export default QRCode
}

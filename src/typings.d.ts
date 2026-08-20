declare module 'qr-creator' {
  export default class QrCreator {
    static render(
      options: {
        text: string;
        canvas: HTMLCanvasElement;
        background?: string;
        fill?: string;
        size?: number;
      },
      callback?: (error: any) => void
    ): void;
  }
}

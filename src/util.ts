export const sleep = (ms: number) => new Promise((r) => setTimeout(r, ms));

export class Mark {
  constructor(
    public subject: string,
    public title: string,
    public weight: string
  ) {}
}

export class SectionEntity {
  readonly id: string;
  readonly title: string;
   
  private _position: number;

  private _content: string;
  private _referenceIds: string[];
  private _embedding?: number[];

  constructor(params: {
    id: string;
    title: string;
    content: string;
    position: number;   
    referenceIds?: string[];
    embedding?: number[];
  }) {
    this.id = params.id;
    this.title = params.title;
    this._position = params.position;   
    this._content = params.content;
    this._referenceIds = params.referenceIds ?? [];
    this._embedding = params.embedding;
  } 
  get position(): number {
    return this._position;
  }

  get content(): string {
    return this._content;
  }

  get referenceIds(): string[] {
    return this._referenceIds;
  }

  get embedding(): number[] | undefined {
    return this._embedding;
  }

  updateEmbedding(embedding: number[]): void {
    this._embedding = embedding;  
  }
   updatePosition(position: number): void {
    this._position = position;
  }

  update(
    content: string,
    referenceIds: string[],
    embedding?: number[],
  ): void {
    this._content = content;
    this._referenceIds = referenceIds;
    this._embedding = embedding;
  }

  toJSON() {
    return {
      id: this.id,
      title: this.title,
      content: this._content,
      position: this._position,   
      referenceIds: this._referenceIds, 
    };
  }

  static fromJSON(data: any): SectionEntity {
    return new SectionEntity({
      id: data.id,
      title: data.title,
      content: data.content,
      position: data.position ?? 0,   
      referenceIds: data.referenceIds ?? [],
      embedding: data.embedding,
    });
  }
}
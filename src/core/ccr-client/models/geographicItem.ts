export interface GeographicItemAttributes {
    Codigo: string;
    Descripcion: string;
}

export class GeographicItem {
    code: string;
    description: string;

    constructor(options: GeographicItemAttributes) {
        this.code = options.Codigo;
        this.description = options.Descripcion;
    }
}

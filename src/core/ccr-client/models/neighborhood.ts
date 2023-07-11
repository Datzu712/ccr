export interface NeighborhoodAttributes {
    CodBarrio: string;
    CodSucursal: string;
    Nombre: string;
}

export class Neighborhood {
    neighborhoodCode: string;
    branchCode: string;
    name: string;

    constructor(options: NeighborhoodAttributes) {
        this.neighborhoodCode = options.CodBarrio;
        this.branchCode = options.CodSucursal;
        this.name = options.Nombre;
    }
}

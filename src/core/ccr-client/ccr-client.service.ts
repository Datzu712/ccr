import { type Client, createClientAsync } from 'soap';
import fetch from 'node-fetch';

import { Logger } from '../log/logger.service';
import type { AbstractResponse, CcrClientOptions } from './interfaces';

import { GeographicItem, type GeographicItemAttributes } from './models/geographicItem';
import { Neighborhood, type NeighborhoodAttributes } from './models';

export enum CcrMethod {
    CcrCodProvincia = 'ccrCodProvincia',
    CcrCodCanton = 'ccrCodCanton',
    CcrCodDistrito = 'ccrCodDistrito',
    CcrCodBarrio = 'ccrCodBarrio',
    CcrCodPostal = 'ccrCodPostal',
    CcrTarifa = 'ccrTarifa',
    CcrGenerarGuia = 'ccrGenerarGuia',
    CcrRegistroEnvio = 'ccrRegistroEnvio',
    CcrMovilTracking = 'ccrMovilTracking',
}

export class CCRClient {
    /**
     * SOAP client
     * @private
     */
    private soapClient!: Client;

    /**
     * Custom Dose logger
     */
    private logger = new Logger('CcrClient');

    /**
     * Bearer token for authorization header
     * @private
     */
    private authorizationHeader!: string;

    /**
     * Token expiration date (5m)
     */
    private tokenExpirationDate!: number;

    constructor(private readonly credentials: CcrClientOptions) {}

    /**
     * Start the client and authenticate it
     */
    public async start(): Promise<void> {
        this.soapClient = await createClientAsync(this.credentials.soap_url);

        await this.authenticate();
    }

    /**
     * Authenticate the client
     * @returns { string } Bearer token
     */
    private async authenticate(): Promise<string> {
        this.logger.debug('Authenticating...');
        const { username, password, system } = this.credentials;

        const res = await fetch(`https://servicios.correos.go.cr:442/Token/authenticate`, {
            method: 'POST',
            body: JSON.stringify({
                Username: username,
                Password: password,
                Sistema: system,
            }),
            headers: {
                'Content-Type': 'application/json',
            },
        });

        if (res.status !== 200) {
            this.logger.error(`Authentication failed with status code: ${res.status}. `);
            throw new Error('Authentication failed');
        }

        const token = await res.text();
        this.logger.debug(`Authenticated with token: ${token}`);
        this.soapClient.addHttpHeader('Authorization', token);
        this.tokenExpirationDate = Date.now() + 260000;
        this.authorizationHeader = token;

        return token;
    }

    /**
     * Get the current token if the current session is still valid (5m), if not, authenticate again.
     * @returns { string } Bearer token
     */
    private async getToken(): Promise<string> {
        if (this.tokenExpirationDate < Date.now()) {
            return this.authenticate();
        } else {
            return this.authorizationHeader;
        }
    }

    /**
     * Call the SOAP method
     * @param { CcrMethod } method - CCR soap method to call
     * @param { { [prop: string]: string } } args - Arguments to pass to the method
     * @returns { unknown } Response from the SOAP method
     */
    private async call<ReturnType extends object>(
        method: CcrMethod,
        args: { [prop: string]: string },
    ): Promise<ReturnType> {
        await this.getToken();

        const response = await this.soapClient[`${method}Async`](args);
        Logger.verbose(response);

        const data = response[0][`${method}Result`];
        if (data.CodRespuesta !== '00') {
            throw new Error(data.MensajeRespuesta);
        }

        return data;
    }

    /**
     * List all cantons of a province
     * @param { string } provinceCode - Code of province to search cantons
     * @returns { Promise<GeographicItem[]> } Array of cantons
     */
    public async getCantons(provinceCode: string): Promise<GeographicItem[]> {
        const data = await this.call<
            AbstractResponse<{
                Cantones: { ccrItemGeografico: GeographicItemAttributes[] };
            }>
        >(CcrMethod.CcrCodCanton, {
            CodProvincia: provinceCode,
        });

        return data.Cantones.ccrItemGeografico.map((canton) => new GeographicItem(canton));
    }

    /**
     * List provinces with the name and code if the province
     * @param { string } code - Code of the province
     * @param { string } description - Description of the province
     * @returns { Promise<GeographicItem[]> } Array of provinces
     */
    public async getProvinces(code: string, description: string): Promise<GeographicItem[]> {
        const data = await this.call<
            AbstractResponse<{
                Provincias: { ccrItemGeografico: GeographicItemAttributes[] };
            }>
        >(CcrMethod.CcrCodProvincia, {
            Codigo: code,
            Descripción: description,
        });

        return data.Provincias.ccrItemGeografico.map((province) => new GeographicItem(province));
    }

    /**
     * List all district of a canton
     * @param { string } provinceCode - Code of province to search districts
     * @param { string } cantonCode - Code of canton to search districts
     * @returns { Promise<GeographicItem[]> } Array of districts
     */
    public async getDistricts(provinceCode: string, cantonCode: string): Promise<GeographicItem[]> {
        const data = await this.call<
            AbstractResponse<{
                Distritos: { ccrItemGeografico: GeographicItemAttributes[] };
            }>
        >(CcrMethod.CcrCodDistrito, {
            CodProvincia: provinceCode,
            CodCanton: cantonCode,
        });

        return data.Distritos.ccrItemGeografico.map((district) => new GeographicItem(district));
    }

    /**
     * List all neighborhoods of a district
     * @param { string } provinceCode - Code of province to search neighborhoods
     * @param { string } cantonCode - Code of canton to search neighborhoods
     * @param { string } districtCode - Code of district to search neighborhoods
     * @returns { Promise<GeographicItem[]> } Array of neighborhoods
     */
    public async getNeighborhoods({
        provinceCode,
        cantonCode,
        districtCode,
    }: {
        provinceCode: string;
        cantonCode: string;
        districtCode: string;
    }): Promise<Neighborhood[]> {
        const data = await this.call<AbstractResponse<{ Barrios: { ccrBarrio: NeighborhoodAttributes[] } }>>(
            CcrMethod.CcrCodBarrio,
            {
                CodProvincia: provinceCode,
                CodCanton: cantonCode,
                CodDistrito: districtCode,
            },
        );

        return data.Barrios.ccrBarrio.map((neighborhood) => new Neighborhood(neighborhood));
    }

    /**
     * Get postal code of a district
     * @param { { provinceCode: string, cantonCode: string, districtCode: string } } data - Data to search postal code
     * @param { string } data.provinceCode - Code of province to search postal code
     * @param { string } data.cantonCode - Code of canton to search postal code
     * @param { string } data.districtCode - Code of district to search postal code
     * @returns { Promise<string> } Postal code
     */
    public async getPostalCode({
        provinceCode,
        cantonCode,
        districtCode,
    }: {
        provinceCode: string;
        cantonCode: string;
        districtCode: string;
    }): Promise<string> {
        const data = await this.call<AbstractResponse<{ CodPostal: string }>>(CcrMethod.CcrCodPostal, {
            CodProvincia: provinceCode,
            CodCanton: cantonCode,
            CodDistrito: districtCode,
        });

        return data.CodPostal;
    }

    /**
     * Generate Guide
     * @returns { number } Guide number
     */
    public async generateGuide(): Promise<number> {
        const data = await this.call<AbstractResponse<{ NumeroEnvio: number }>>(CcrMethod.CcrGenerarGuia, {});

        return data.NumeroEnvio;
    }
}

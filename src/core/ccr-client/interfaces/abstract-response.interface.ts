export interface BaseResponse {
    CodRespuesta: string;
    MensajeRespuesta: string;
}

export type AbstractResponse<T extends object> = BaseResponse & T;

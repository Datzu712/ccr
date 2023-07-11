import { BadRequestException, Controller, Get, Param } from '@nestjs/common';
import { CCRClient } from './core/ccr-client/ccr-client.service';

@Controller()
export class CCRController {
    constructor(private readonly ccrClient: CCRClient) {}

    @Get('test')
    async test() {
        return 'test';
    }

    @Get('/cantones/:provinceCode')
    async getCantonesByProvinceCode(@Param('provinceCode') provinceCode: string) {
        if (!provinceCode) throw new BadRequestException('provinceCode is required');

        return await this.ccrClient.getCantons(provinceCode);
    }

    @Get('/provinces/:code/:description')
    async getProvincesByCodeAndDescription(@Param('code') code: string, @Param('description') description: string) {
        if (!code) throw new BadRequestException('code is required');
        if (!description) throw new BadRequestException('description is required');

        return await this.ccrClient.getProvinces(code, description);
    }

    @Get('/districts/:provinceCode/:cantonCode')
    async getDistrictsByProvinceCodeAndCantonCode(
        @Param('provinceCode') provinceCode: string,
        @Param('cantonCode') cantonCode: string,
    ) {
        if (!provinceCode) throw new BadRequestException('provinceCode is required');
        if (!cantonCode) throw new BadRequestException('cantonCode is required');

        return await this.ccrClient.getDistricts(provinceCode, cantonCode);
    }

    @Get('/neighborhoods/:provinceCode/:cantonCode/:districtCode')
    async getNeighborhoods(
        @Param('provinceCode') provinceCode: string,
        @Param('cantonCode') cantonCode: string,
        @Param('districtCode') districtCode: string,
    ) {
        if (!provinceCode) throw new BadRequestException('provinceCode is required');
        if (!cantonCode) throw new BadRequestException('cantonCode is required');
        if (!districtCode) throw new BadRequestException('districtCode is required');

        return await this.ccrClient.getNeighborhoods({ provinceCode, cantonCode, districtCode });
    }

    @Get('/postalCode/:provinceCode/:cantonCode/:districtCode')
    async getPostalCode(
        @Param('provinceCode') provinceCode: string,
        @Param('cantonCode') cantonCode: string,
        @Param('districtCode') districtCode: string,
    ) {
        if (!provinceCode) throw new BadRequestException('provinceCode is required');
        if (!cantonCode) throw new BadRequestException('cantonCode is required');
        if (!districtCode) throw new BadRequestException('districtCode is required');

        return await this.ccrClient.getPostalCode({ provinceCode, cantonCode, districtCode });
    }
}

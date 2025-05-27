export enum sortType {
  A_Z = 'A-Z',
  Z_A = 'Z-A',
  NEXT_LOCATION = 'NEXT_LOCATION',
}

export interface InstitutionQuery {
  name?: string;
  cnpj?: string;
  zipCode?: string;
  city?: string;
  address?: string;
  state?: string;
  offeredEducationStagesAndModalities?: string[];
  juridicName?: string;
  type?: string;
  academicOrganization?: string;
  openingdateBegin?: string;
  openingdateEnd?: string;
  rating?: number;
  coordinates?: [number, number];
  educationLevelSource?: 'inep' | 'emec';
  minLat?: number;
  maxLat?: number;
  minLon?: number;
  maxLon?: number;
}
export interface Student {
  name: string;
  city: string;
  photo: string;
  message: string;
  backgroundColor: string;
  rotation: string;
}
